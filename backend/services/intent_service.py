import json
import logging
import re
from services.ai_gateway import generate_text

logger = logging.getLogger(__name__)

DOC_TYPES = [
    "Legal Notice", "Consumer Complaint", "Rental Agreement",
    "Affidavit", "Power of Attorney", "Legal Opinion",
]

BULK_KEYWORDS = [
    "all", "each", "every", "multiple", "several", "list of",
    "tenants", "employees", "vendors", "clients", "members",
    "batch", "bulk", "50", "100", "all tenants", "all employees",
]


def _detect_bulk(description: str) -> tuple[bool, str]:
    lowered = description.lower()
    for kw in BULK_KEYWORDS:
        if kw in lowered:
            return True, "multiple recipients"
    plural_patterns = [
        r"(\d+)\s*(tenant|employee|vendor|client|member|party|person)s",
        r"(tenant|employee|vendor|client|member|party|person)s\s+\d+",
        r"(all|multiple|several|various)\s+(tenant|employee|vendor|client|member|party|person)s",
    ]
    for pat in plural_patterns:
        m = re.search(pat, lowered, re.IGNORECASE)
        if m:
            entity = m.group(2) if m.lastindex and m.lastindex >= 2 else m.group(1)
            entity = entity.rstrip("s")
            return True, entity
    return False, ""


def _extract_parties(description: str) -> list[str]:
    patterns = [
        r"(?:between\s+)([A-Z][A-Za-z\s]+?(?=\s+and\s+))",
        r"(?:on behalf of\s+)([A-Z][A-Za-z\s]+?(?=\.|,))",
        r"(?:client(?:s)?\s+)([A-Z][A-Za-z\s]+?(?=\.|,))",
        r"(?:tenant(?:s)?\s+)([A-Z][A-Za-z\s]+?(?=\.|,))",
        r"(?:employee(?:s)?\s+)([A-Z][A-Za-z\s]+?(?=\.|,))",
        r"(?:vendor(?:s)?\s+)([A-Z][A-Za-z\s]+?(?=\.|,))",
    ]
    parties = []
    for pat in patterns:
        m = re.search(pat, description)
        if m:
            parties.append(m.group(1).strip())
    if not parties:
        names = re.findall(r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)", description)
        parties = [n for n in names if len(n) > 5][:3]
    return parties


def _extract_variables(description: str) -> dict[str, str]:
    vars_dict = {}
    amount = re.search(r"(?:Rs\.?|₹|INR)\s*([\d,]+(?:\.\d{2})?)", description)
    if amount:
        vars_dict["amount"] = amount.group(1)
    date = re.search(r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})", description)
    if date:
        vars_dict["date"] = date.group(1)
    prop = re.search(r"(?:property|premises|address)\s+(?:at|located at|situated at)\s+([A-Za-z0-9\s,.-]+?)(?:\.|,|$)", description, re.IGNORECASE)
    if prop:
        vars_dict["property"] = prop.group(1).strip()
    return vars_dict


def _suggest_clauses(doc_type: str, description: str) -> list[str]:
    lowered = description.lower()
    clauses = []
    if doc_type == "Rental Agreement":
        if "maintenance" not in lowered:
            clauses.append("Maintenance and repair responsibilities")
        if "security deposit" not in lowered:
            clauses.append("Security deposit terms and refund conditions")
        if "termination" not in lowered:
            clauses.append("Early termination and notice period")
    elif doc_type == "Legal Notice":
        if "deadline" not in lowered and "days" not in lowered:
            clauses.append("Specific cure period / deadline for compliance")
        if "consequence" not in lowered:
            clauses.append("Legal consequences of non-compliance")
    elif doc_type == "Consumer Complaint":
        if "compensation" not in lowered:
            clauses.append("Compensation and damages claim")
        if "cost" not in lowered:
            clauses.append("Cost of proceedings")
    elif doc_type == "Power of Attorney":
        if "revocation" not in lowered:
            clauses.append("Revocation terms")
        if "indemnification" not in lowered:
            clauses.append("Indemnification of the Attorney")
    return clauses


def _suggest_modifications(description: str) -> list[str]:
    mods = []
    lowered = description.lower()
    if any(word in lowered for word in ["urgent", "immediate", "emergency", "critical"]):
        mods.append("Mark document as URGENT with expedited response period")
    if "court" in lowered or "litigation" in lowered:
        mods.append("Include 'without prejudice' and reservation of rights clauses")
    if "confidential" in lowered or "nda" in lowered:
        mods.append("Add confidentiality and non-disclosure provisions")
    if "arbitration" in lowered or "mediation" in lowered:
        mods.append("Include dispute resolution clause with arbitration/mediation reference")
    return mods


def _missing_info_questions(description: str, doc_type: str) -> list[str]:
    questions = []
    lowered = description.lower()
    if not re.search(r"\b(date|dated|on|year|month)\b", lowered):
        questions.append("What are the key dates involved (incident date, agreement date, deadlines)?")
    if not re.search(r"\b(amount|rs|rupees|₹|value)\b", lowered):
        if doc_type in ["Legal Notice", "Consumer Complaint"]:
            questions.append("Is there a monetary claim or damages amount involved?")
    if doc_type == "Rental Agreement":
        if "rent" not in lowered:
            questions.append("What is the monthly rent amount and security deposit?")
        if "period" not in lowered and "duration" not in lowered:
            questions.append("What is the lease duration / term?")
    if doc_type == "Legal Notice" or doc_type == "Consumer Complaint":
        if "relief" not in lowered and "prayer" not in lowered:
            questions.append("What specific relief or remedy is being sought?")
    return questions[:4]


async def understand_intent(description: str, firm_name: str = "") -> dict:
    is_bulk, bulk_entity = _detect_bulk(description)
    parties = _extract_parties(description)
    variables = _extract_variables(description)
    tone = "Assertive" if any(w in description.lower() for w in ["urgent", "immediate", "breach", "violation"]) else "Formal" if any(w in description.lower() for w in ["legal", "notice", "complaint"]) else "Neutral"

    prompt = f"""Analyze this legal drafting request and respond with a JSON object.

User Description: {description}

Available document types: {', '.join(DOC_TYPES)}

Respond in JSON format:
{{
    "suggested_doc_type": "most appropriate document type from the list",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation of why this type fits",
    "suggested_tone": "Neutral | Formal | Assertive | Aggressive | Conciliatory"
}}

Return ONLY valid JSON, no markdown, no backticks."""

    try:
        result = generate_text(prompt, kind="document", temperature=0.1, max_tokens=500)
        text = result.get("text", "")
        text = text.strip().removeprefix("```json").removesuffix("```").removeprefix("```").strip()
        parsed = json.loads(text)
    except Exception as e:
        logger.warning(f"Intent AI parsing failed, using rule-based: {e}")
        parsed = {}

    doc_type = parsed.get("suggested_doc_type", "") if isinstance(parsed, dict) else ""
    if doc_type not in DOC_TYPES:
        doc_type = DOC_TYPES[0]

    ai_tone = parsed.get("suggested_tone", "") if isinstance(parsed, dict) else ""
    if ai_tone in ["Neutral", "Formal", "Assertive", "Aggressive", "Conciliatory"]:
        tone = ai_tone

    confidence = parsed.get("confidence", 0.6) if isinstance(parsed, dict) else 0.6
    reasoning = parsed.get("reasoning", "Based on the description context") if isinstance(parsed, dict) else "Based on the description context"

    suggested_clauses = _suggest_clauses(doc_type, description)
    template_mods = _suggest_modifications(description)
    missing_questions = _missing_info_questions(description, doc_type)

    return {
        "suggested_doc_type": doc_type,
        "confidence": confidence,
        "reasoning": reasoning,
        "is_bulk": is_bulk,
        "bulk_entity_label": bulk_entity,
        "extracted_variables": variables,
        "extracted_parties": parties,
        "suggested_tone": tone,
        "missing_info_questions": missing_questions,
        "suggested_clauses": suggested_clauses,
        "template_modifications": template_mods,
    }
