import os
import re
import logging
import pdfplumber
from docx import Document as DocxDocument

logger = logging.getLogger(__name__)

# Keywords for clause classification
CLAUSE_KEYWORDS = {
    "liability": ["liability", "liable", "damages", "indemnify", "indemnification"],
    "termination": ["termination", "terminate", "cancellation", "cancel", "expire"],
    "indemnification": ["indemnification", "indemnify", "hold harmless", "defend"],
    "payment": ["payment", "fee", "compensation", "invoice", "billing", "price"],
    "confidentiality": ["confidentiality", "confidential", "non-disclosure", "nda", "proprietary"],
    "intellectual_property": ["intellectual property", "ip rights", "copyright", "patent", "trademark"],
    "non_compete": ["non-compete", "non compete", "restrictive covenant", "competition"],
    "governing_law": ["governing law", "jurisdiction", "applicable law", "venue"]
}

# Risk detection patterns
RISK_PATTERNS = {
    "high": [
        (r"unlimited\s+liability", "Unlimited liability exposure detected."),
        (r"unilateral\s+terminat", "Contract allows unilateral termination — may favor one party unfairly."),
        (r"sole\s+discretion", "Actions at sole discretion of one party — potential for abuse."),
        (r"waive[sd]?\s+(all|any)\s+rights?", "Broad waiver of rights detected."),
        (r"perpetual\s+license", "Perpetual license grant — may be irreversible."),
        (r"no\s+refund", "No refund clause — financial risk for one party.")
    ],
    "medium": [
        (r"auto[\s-]?renew", "Auto-renewal clause — contract may silently extend."),
        (r"30\s+day\s+notice|90\s+day\s+notice", "Fixed notice period for termination — check if reasonable."),
        (r"liquidated\s+damages", "Liquidated damages clause — verify the amounts are fair."),
        (r"force\s+majeure", "Force majeure clause present — review scope of covered events."),
        (r"assigns?\s+all\s+rights", "Assignment of all rights — check if restrictions exist.")
    ],
    "low": [
        (r"mutual\s+agreement", "Clause requires mutual agreement — balanced."),
        (r"reasonable\s+efforts?", "Reasonable efforts standard — generally balanced."),
        (r"standard\s+terms", "Standard terms referenced — verify contents.")
    ]
}


def extract_text_from_file(file_path: str) -> str:
    """Extract text from PDF or DOCX."""
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return _extract_pdf(file_path)
    elif ext == ".docx":
        return _extract_docx(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")


def _extract_pdf(file_path: str) -> str:
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
    return text.strip()


def _extract_docx(file_path: str) -> str:
    try:
        doc = DocxDocument(file_path)
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        return ""


def split_into_clauses(text: str) -> list:
    """Split contract text into individual clauses."""
    # Split by numbered sections, lettered sections, or double newlines
    patterns = [
        r'\n\d+[\.\)]\s+',          # 1. or 1)
        r'\n[A-Z]\.\s+',            # A.
        r'\n(?:Section|Article|Clause)\s+\d+',  # Section 1
        r'\n{2,}'                    # Double newlines
    ]

    combined = "|".join(patterns)
    parts = re.split(combined, text)
    clauses = [p.strip() for p in parts if p and len(p.strip()) > 30]
    return clauses


def classify_clause(clause_text: str) -> str:
    """Classify a clause by its primary keyword category."""
    lower = clause_text.lower()
    for category, keywords in CLAUSE_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return category
    return "general"


def detect_risks(clause_text: str) -> list:
    """Detect risk patterns in a clause. Returns list of (risk_level, explanation)."""
    lower = clause_text.lower()
    risks = []
    for risk_level, patterns in RISK_PATTERNS.items():
        for pattern, explanation in patterns:
            if re.search(pattern, lower):
                risks.append({"risk": risk_level, "explanation": explanation})
    return risks


from ai.llm_fallback import generate_contract_analysis

def analyze_contract(file_path: str) -> dict:
    """Full contract analysis pipeline."""
    text = extract_text_from_file(file_path)
    if not text:
        return {
            "file_name": os.path.basename(file_path),
            "risk_score": "Unknown",
            "clause_warnings": [],
            "total_clauses": 0
        }

    clauses = split_into_clauses(text)
    warnings = []
    risk_counts = {"high": 0, "medium": 0, "low": 0}

    # 1. Traditional Keyword/Regex Analysis
    for clause in clauses:
        clause_type = classify_clause(clause)
        risks = detect_risks(clause)

        for risk in risks:
            risk_counts[risk["risk"]] += 1
            warnings.append({
                "clause_type": clause_type,
                "text": clause[:300] + ("..." if len(clause) > 300 else ""),
                "risk": risk["risk"],
                "explanation": risk["explanation"]
            })

    # 2. AI-Powered Deep Audit (using DeepSeek R1)
    ai_audit = generate_contract_analysis(text)
    if ai_audit:
        for detection in ai_audit.get("risk_detections", []):
            risk_level = detection.get("risk_level", "medium").lower()
            if risk_level not in risk_counts: risk_level = "medium"
            
            risk_counts[risk_level] += 1
            warnings.append({
                "clause_type": "AI Audit Detect",
                "text": detection.get("clause", "N/A")[:300],
                "risk": risk_level,
                "explanation": f"{detection.get('issue')} | Recommendation: {detection.get('recommendation')}"
            })

    # Determine overall risk score
    if risk_counts["high"] >= 2:
        overall = "High"
    elif risk_counts["high"] >= 1 or risk_counts["medium"] >= 3:
        overall = "Medium"
    else:
        overall = "Low"

    # Sort warnings: high first
    risk_order = {"high": 0, "medium": 1, "low": 2}
    warnings.sort(key=lambda w: risk_order.get(w["risk"], 3))

    return {
        "file_name": os.path.basename(file_path),
        "risk_score": overall,
        "clause_warnings": warnings,
        "total_clauses": len(clauses),
        "ai_summary": ai_audit.get("audit_summary") if ai_audit else None,
        "missing_clauses": ai_audit.get("missing_critical_clauses") if ai_audit else [],
        "fairness_score": ai_audit.get("fairness_score") if ai_audit else 50
    }
