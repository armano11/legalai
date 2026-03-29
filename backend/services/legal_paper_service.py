import re
import os
import logging
import pdfplumber
from docx import Document as DocxDocument
from PIL import Image
try:
    import easyocr
    import numpy as np
except ImportError:
    easyocr = None
# AI imports removed — hardcore engine is fully deterministic

logger = logging.getLogger(__name__)

# Global OCR Reader (Lazy Loaded)
_ocr_reader = None

def get_ocr_reader():
    global _ocr_reader
    if _ocr_reader is None and easyocr is not None:
        try:
            logger.info("Initializing EasyOCR Engine...")
            _ocr_reader = easyocr.Reader(['en'])
        except Exception as e:
            logger.error(f"Failed to init EasyOCR: {e}")
    return _ocr_reader

# ------- Document type detection patterns -------
DOC_TYPE_PATTERNS = {
    "FIR": [r"first information report", r"\bfir\b", r"police station", r"station house officer", r"cognizable offence"],
    "Contract": [r"agreement", r"contract", r"parties hereto", r"witnesseth", r"terms and conditions", r"obligations"],
    "Petition": [r"petition", r"petitioner", r"respondent", r"honourable court", r"humbly prays", r"writ petition", r"slp", r"special leave"],
    "Affidavit": [r"affidavit", r"solemnly affirm", r"deponent", r"sworn before", r"notary public", r"oath"],
    "Legal Notice": [r"legal notice", r"notice is hereby", r"advocate", r"under instructions", r"failing which"],
    "Power of Attorney": [r"power of attorney", r"attorney", r"authorize", r"irrevocable", r"principal"],
    "Will/Testament": [r"last will", r"testament", r"bequeath", r"estate", r"executor", r"probate"],
    "Court Order": [r"order", r"court", r"directed", r"judgment", r"decreed", r"disposed"],
    "Lease/Rental": [r"lease", r"rental", r"landlord", r"tenant", r"rent", r"premises"],
    "Sale Deed": [r"sale deed", r"conveyance", r"vendor", r"vendee", r"consideration", r"schedule of property", r"absolute owner"],
    "Mortgage Deed": [r"mortgage", r"mortgagor", r"mortgagee", r"loan", r"security", r"hypothecation"],
    "Gift Deed": [r"gift deed", r"donor", r"donee", r"love and affection", r"voluntary", r"without consideration"],
    "Indemnity Bond": [r"indemnity bond", r"indemnifier", r"indemnified", r"harmless", r"reimburse"],
    "Board Resolution": [r"board resolution", r"resolved that", r"certified true copy", r"board of directors", r"meeting held on"],
}

# ------- IPC / Act section patterns -------
SECTION_PATTERN = re.compile(
    r"(?:section|sec\.?|s\.)\s*(\d+[A-Z]?)\s*(?:of\s+(?:the\s+)?(?:Indian Penal Code|IPC|CrPC|CPC|IT Act|"
    r"Consumer Protection Act|Companies Act|Hindu Marriage Act|Contract Act|Evidence Act|"
    r"Motor Vehicles Act|Negotiable Instruments Act|POCSO|NDPS Act|SC/ST Act|"
    r"Prevention of Corruption Act|Dowry Prohibition Act|Domestic Violence Act))?",
    re.IGNORECASE
)

# ------- Risky clause patterns -------
RISK_PATTERNS = [
    {"pattern": r"indemnif(?:y|ication|ied)", "label": "Indemnification Clause", "severity": "high",
     "detail": "Party may be liable for unlimited damages or losses of the other party."},
    {"pattern": r"(?:non[- ]?compet(?:e|ition|itive))", "label": "Non-Compete Clause", "severity": "high",
     "detail": "Restricts the ability to work in the same industry or geography after termination."},
    {"pattern": r"(?:terminat(?:e|ion)|cancel(?:lation)?)\s+(?:without|for any|at any|immediately)",
     "label": "Unilateral Termination", "severity": "high",
     "detail": "One party can terminate the agreement without cause or with immediate effect."},
    {"pattern": r"(?:auto[- ]?renew|automatic(?:ally)?\s+renew)", "label": "Auto-Renewal", "severity": "medium",
     "detail": "Agreement automatically extends unless explicit cancellation is made."},
    {"pattern": r"(?:liquidated\s+damages|penalty\s+clause)", "label": "Penalty/Liquidated Damages", "severity": "high",
     "detail": "Pre-determined damages payable on breach, which may be disproportionate."},
    {"pattern": r"(?:waiv(?:e|er)\s+(?:right|claim|all))", "label": "Waiver of Rights", "severity": "high",
     "detail": "Party is asked to waive legal rights or claims."},
    {"pattern": r"(?:exclusive\s+jurisdiction|arbitration\s+(?:shall|will|must))", "label": "Dispute Resolution Clause",
     "severity": "medium", "detail": "Specifies exclusive jurisdiction or mandatory arbitration."},
    {"pattern": r"(?:confidential(?:ity)?|non[- ]?disclosure|nda)", "label": "Confidentiality/NDA", "severity": "low",
     "detail": "Requires parties to keep certain information confidential."},
    {"pattern": r"(?:force\s+majeure|act\s+of\s+god)", "label": "Force Majeure", "severity": "low",
     "detail": "Excuses performance during extraordinary events beyond control."},
    {"pattern": r"(?:intellectual\s+property|ip\s+rights|copyright\s+assign)", "label": "IP Assignment", "severity": "high",
     "detail": "Transfers intellectual property ownership, which may not be desirable."},
    {"pattern": r"(?:governing\s+law|applicable\s+law|governed\s+by)", "label": "Governing Law", "severity": "low",
     "detail": "Specifies which jurisdiction's laws apply to the agreement."},
    {"pattern": r"(?:unlimited\s+liability|no\s+(?:cap|limit)\s+on\s+(?:liability|damages))",
     "label": "Unlimited Liability", "severity": "high",
     "detail": "No cap on the liability amount, exposing party to significant financial risk."},
    # --- New Hardcore patterns ---
    {"pattern": r"(?:specific\s+performance|equity\s+relief)", "label": "Specific Performance", "severity": "high",
     "detail": "Allows a court to order exactly what was promised, rather than just damages."},
    {"pattern": r"(?:arbitration\s+seat|seat\s+of\s+arbitration|place\s+of\s+arbitration)", "label": "Arbitration Seat", "severity": "medium",
     "detail": "The legal 'seat' determines the supervising court and procedural law."},
    {"pattern": r"(?:non[- ]?solicit(?:ation)?)", "label": "Non-Solicitation", "severity": "medium",
     "detail": "Prevents poaching of employees or clients/customers."},
    {"pattern": r"(?:material\s+adverse\s+change|mac\s+clause|mae\s+clause)", "label": "MAC/MAE Clause", "severity": "high",
     "detail": "Standard fallback allowing termination if business value significantly drops."},
    {"pattern": r"(?:severability)", "label": "Severability Clause", "severity": "low",
     "detail": "Ensures the rest of the contract remains valid if one part is found illegal."},
    {"pattern": r"(?:entire\s+agreement|integration\s+clause)", "label": "Entire Agreement", "severity": "low",
     "detail": "Merges all prior discussions into this document; old promises become invalid."},
    {"pattern": r"(?:sarfaesi|enforcement\s+of\s+security\s+interest)", "label": "SARFAESI Trigger", "severity": "critical",
     "detail": "Allows banks to seize property without court intervention under Indian law."},
    {"pattern": r"(?:limitation\s+of\s+actions|statute\s+of\s+limitations)", "label": "Limitation Period", "severity": "medium",
     "detail": "Modifies the standard time allowed to bring a legal claim."},
    {"pattern": r"(?:escrow\s+(?:arrangement|account|agent))", "label": "Escrow Management", "severity": "medium",
     "detail": "Involves a third-party intermediary for managing payments or assets."},
]

# ------- Completeness checks per document type -------
COMPLETENESS_CHECKLIST = {
    "FIR": ["Date and Time of Incident", "Place of Occurrence", "Complainant Details", "Accused Details", "Facts/Narrative", "Section References", "Witnesses"],
    "Contract": ["Parties Identified", "Effective Date", "Obligations/Terms", "Payment Terms", "Duration/Term", "Termination Clause", "Governing Law", "Signatures"],
    "Petition": ["Petitioner Details", "Respondent Details", "Court Named", "Facts/Grounds", "Prayer/Relief Sought", "Verification/Affidavit"],
    "Affidavit": ["Deponent Name", "Sworn Statement", "Date", "Notary/Magistrate", "Signature", "Facts Stated"],
    "Legal Notice": ["Sender Details", "Recipient Details", "Date", "Subject", "Facts", "Demand/Relief", "Time Limit", "Advocate Details"],
    "Lease/Rental": ["Landlord Details", "Tenant Details", "Property Address", "Rent Amount", "Security Deposit", "Duration", "Termination", "Signatures"],
    "Sale Deed": ["Vendor Details", "Vendee Details", "Property Description", "Sale Consideration", "Payment Mode", "Possession Clause", "Encumbrance Certificate", "Signatures"],
    "Mortgage Deed": ["Mortgagor Details", "Mortgagee Details", "Loan Amount", "Interest Rate", "Property Security", "Default Terms", "Repayment Schedule"],
    "Gift Deed": ["Donor Details", "Donee Details", "Property Description", "Acceptance Clause", "No Consideration Clause", "Signatures"],
    "Board Resolution": ["Meeting Date", "Resolution Number", "Authorized Signatory", "Directors Attending", "Clear Action/Authority"],
}


def extract_text(file_path: str) -> str:
    """Extract text from PDF, DOCX or TXT files."""
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    try:
        if ext == ".pdf":
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        elif ext == ".docx":
            doc = DocxDocument(file_path)
            text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        elif ext in [".jpg", ".jpeg", ".png"]:
            reader = get_ocr_reader()
            if reader:
                # Process image
                img = Image.open(file_path)
                # Convert to numpy array for EasyOCR
                img_array = np.array(img)
                results = reader.readtext(img_array)
                text = " ".join([res[1] for res in results])
            else:
                logger.error("EasyOCR not available for image processing.")
                text = "Error: OCR engine not initialized. Please install easyocr."
    except Exception as e:
        logger.error(f"Text extraction error: {e}")
    return text.strip()


def detect_document_type(text: str) -> dict:
    """Detect the type of legal document."""
    text_lower = text.lower()
    scores = {}
    for doc_type, patterns in DOC_TYPE_PATTERNS.items():
        score = sum(1 for p in patterns if re.search(p, text_lower))
        if score > 0:
            scores[doc_type] = score

    if not scores:
        return {"type": "Unknown Legal Document", "confidence": 0}

    best = max(scores, key=scores.get)
    confidence = min(100, scores[best] * 25)
    return {"type": best, "confidence": confidence}


def extract_entities(text: str) -> dict:
    """Extract legal entities from text."""
    entities = {
        "parties": [],
        "dates": [],
        "amounts": [],
        "addresses": [],
        "sections_cited": []
    }

    # Dates (various formats)
    date_patterns = [
        r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}",
        r"\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4}",
        r"(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}",
    ]
    for pattern in date_patterns:
        entities["dates"].extend(re.findall(pattern, text, re.IGNORECASE))

    # Monetary amounts
    amount_patterns = [
        r"(?:Rs\.?|₹|INR)\s*[\d,]+(?:\.\d{1,2})?(?:\s*(?:lakh|crore|lakhs|crores))?",
        r"[\d,]+(?:\.\d{1,2})?\s*(?:rupees|lakh|lakhs|crore|crores)",
    ]
    for pattern in amount_patterns:
        entities["amounts"].extend(re.findall(pattern, text, re.IGNORECASE))

    # Legal sections
    sections = SECTION_PATTERN.findall(text)
    entities["sections_cited"] = [f"Section {s}" for s in set(sections)]

    # Parties (common patterns)
    party_patterns = [
        r"(?:between|among)\s+([A-Z][a-zA-Z\s]+?)(?:\s+and\s+|\s+hereinafter)",
        r"(?:Mr\.|Mrs\.|Ms\.|Shri|Smt\.)\s+[A-Z][a-zA-Z\s]+",
        r"(?:complainant|petitioner|plaintiff|respondent|defendant|accused)[:—]\s*([A-Z][a-zA-Z\s]+)",
    ]
    for pattern in party_patterns:
        found = re.findall(pattern, text, re.IGNORECASE)
        entities["parties"].extend([p.strip() for p in found if len(p.strip()) > 3])

    # Deduplicate
    for key in entities:
        entities[key] = list(set(entities[key]))[:10]

    return entities


def analyze_risk_clauses(text: str) -> list:
    """Detect risky clauses in the document."""
    findings = []
    text_lower = text.lower()
    sentences = re.split(r'[.!?]+', text)

    for risk in RISK_PATTERNS:
        matches = list(re.finditer(risk["pattern"], text_lower))
        if matches:
            # Find the sentence containing the match
            context = ""
            for m in matches[:1]:
                pos = m.start()
                for sent in sentences:
                    if text.lower().find(sent.lower().strip()) != -1:
                        sent_start = text.lower().find(sent.lower().strip())
                        if sent_start <= pos <= sent_start + len(sent):
                            context = sent.strip()[:200]
                            break

            findings.append({
                "clause": risk["label"],
                "severity": risk["severity"],
                "detail": risk["detail"],
                "context": context or "Clause detected in document",
                "count": len(matches)
            })

    return findings


def check_completeness(text: str, doc_type: str) -> dict:
    """Check document completeness based on type with strict matching."""
    checklist = COMPLETENESS_CHECKLIST.get(doc_type, COMPLETENESS_CHECKLIST.get("Contract", []))
    text_lower = text.lower()

    results = []
    found = 0
    for item in checklist:
        # Require a much stronger signal: all major keywords must be present
        # Alternatively, map the item directly to a concept check
        words = item.lower().replace("/", " ").split()
        major_words = [w for w in words if len(w) > 3]
        
        if not major_words:
            present = item.lower() in text_lower
        else:
            # All major words must appear within a reasonable proximity, 
            # or at least all must exist in the document.
            present = all(kw in text_lower for kw in major_words)
            
        # Special overrides for common exact phrases
        if item == "Signatures":
            present = any(w in text_lower for w in ["signature", "signed", "seal", "authori"])
        elif item == "Date and Time of Incident":
            present = "date" in text_lower and ("time" in text_lower or "at about" in text_lower)
            
        results.append({"item": item, "present": present})
        if present:
            found += 1

    score = round((found / len(checklist)) * 100) if checklist else 0
    return {"score": score, "checklist": results, "total": len(checklist), "found": found}


def assess_language_quality(text: str) -> dict:
    """Assess legal language quality."""
    issues = []
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

    # Check for very long sentences (>50 words)
    long_sentences = [s for s in sentences if len(s.split()) > 50]
    if long_sentences:
        issues.append({"issue": "Long sentences detected", "count": len(long_sentences),
                        "detail": "Sentences with 50+ words reduce clarity"})

    # Check for ambiguous language
    ambiguous_words = ["may", "might", "could", "possibly", "approximately", "generally", "usually", "normally"]
    ambiguous_count = sum(1 for word in text.lower().split() if word in ambiguous_words)
    if ambiguous_count > 5:
        issues.append({"issue": "Ambiguous language", "count": ambiguous_count,
                        "detail": "Words like 'may', 'might', 'approximately' create legal ambiguity"})

    # Check for passive voice (simple heuristic)
    passive_patterns = [r"\b(?:was|were|been|being|is|are)\s+\w+ed\b"]
    passive_count = sum(len(re.findall(p, text, re.IGNORECASE)) for p in passive_patterns)
    if passive_count > 10:
        issues.append({"issue": "Excessive passive voice", "count": passive_count,
                        "detail": "Passive constructions may obscure responsibility"})

    total_words = len(text.split())
    total_sentences = len(sentences)
    avg_sentence_length = round(total_words / max(total_sentences, 1), 1)

    # Quality score: start at 100, deduct for issues
    score = 100
    score -= min(30, len(long_sentences) * 5)
    score -= min(20, ambiguous_count * 2)
    score -= min(15, passive_count)
    score = max(10, score)

    return {
        "score": score,
        "total_words": total_words,
        "total_sentences": total_sentences,
        "avg_sentence_length": avg_sentence_length,
        "issues": issues
    }


def generate_summary(text: str, max_sentences: int = 5) -> str:
    """Extract key sentences as summary."""
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 20]

    # Score sentences by important legal terms
    important_terms = ["held", "court", "section", "order", "judgment", "agreement", "party", "complainant",
                       "respondent", "petitioner", "violated", "breached", "liable", "punished", "compensation",
                       "rights", "shall", "directed", "provisions", "statute"]

    scored = []
    for sent in sentences:
        score = sum(1 for term in important_terms if term in sent.lower())
        # Boost first few sentences (usually important)
        idx = sentences.index(sent)
        if idx < 3:
            score += 2
        scored.append((score, sent))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:max_sentences]
    # Re-order by original position
    top_sents = [s[1] for s in top]
    ordered = [s for s in sentences if s in top_sents][:max_sentences]

    return ". ".join(ordered) + "." if ordered else "Unable to generate summary."


def perform_hardcore_analysis(
    text: str,
    doc_type_name: str,
    risk_clauses: list,
    completeness: dict,
    language: dict,
    entities: dict,
    summary_text: str
) -> dict:
    """
    Fully deterministic, self-contained 'Hardcore' document analysis engine.
    Synthesizes ALL regex-based results into a comprehensive structured report.
    Zero AI dependency. Instant results. Always works.
    """

    # ── Counts & Metrics ──
    high_risks = [r for r in risk_clauses if r["severity"] == "high"]
    med_risks = [r for r in risk_clauses if r["severity"] == "medium"]
    low_risks = [r for r in risk_clauses if r["severity"] == "low"]
    critical_risks = [r for r in risk_clauses if r.get("severity") == "critical"]
    total_risks = len(risk_clauses)

    comp_score = completeness.get("score", 0)
    comp_found = completeness.get("found", 0)
    comp_total = completeness.get("total", 1)
    missing_items = [c["item"] for c in completeness.get("checklist", []) if not c.get("present")]

    lang_score = language.get("score", 50)
    total_words = language.get("total_words", 0)
    total_sentences = language.get("total_sentences", 0)
    avg_sent_len = language.get("avg_sentence_length", 0)
    lang_issues = language.get("issues", [])

    parties = entities.get("parties", [])
    dates = entities.get("dates", [])
    amounts = entities.get("amounts", [])
    sections = entities.get("sections_cited", [])

    # ── 1. NEURAL AUDIT (synthesized summary) ──
    risk_descriptor = "critical" if critical_risks else "high" if len(high_risks) >= 3 else "elevated" if high_risks else "moderate" if med_risks else "low"

    audit_parts = []
    audit_parts.append(
        f"This {doc_type_name} document ({total_words:,} words, {total_sentences} sentences) "
        f"has been subjected to a comprehensive structural and legal audit."
    )

    if parties:
        audit_parts.append(f" The instrument involves {len(parties)} identified {'parties' if len(parties) > 1 else 'party'}: {', '.join(parties[:4])}.")
    if sections:
        audit_parts.append(f" {len(sections)} statutory {'provisions are' if len(sections) > 1 else 'provision is'} cited: {', '.join(sections[:5])}.")

    audit_parts.append(
        f" The document exhibits a {risk_descriptor} risk profile with {total_risks} flagged {'clauses' if total_risks != 1 else 'clause'} "
        f"({len(high_risks)} high, {len(med_risks)} medium, {len(low_risks)} low severity)."
    )
    audit_parts.append(
        f" Structural completeness stands at {comp_score}% ({comp_found}/{comp_total} standard components present), "
        f"and linguistic quality scores {lang_score}/100."
    )

    if amounts:
        audit_parts.append(f" Financial exposure detected: {', '.join(amounts[:3])}.")

    neural_audit = "".join(audit_parts)

    # ── 2. STRATEGIC INSIGHTS ──
    insights = []

    # Risk-based insights
    if critical_risks:
        insights.append(f"CRITICAL ALERT: {len(critical_risks)} critical-severity clause(s) detected — {', '.join(r['clause'] for r in critical_risks[:2])}. These require immediate legal review as they pose existential risk to the party's interests.")
    if high_risks:
        labels = ', '.join(r['clause'] for r in high_risks[:3])
        insights.append(f"High-severity risk clusters identified in: {labels}. These clauses create significant exposure and should be renegotiated or capped with liability limits before execution.")
    if med_risks:
        labels = ', '.join(r['clause'] for r in med_risks[:3])
        insights.append(f"Moderate-risk provisions detected: {labels}. While not immediately dangerous, these introduce operational friction and should be clarified with explicit definitions.")

    # Completeness-based insights
    if missing_items:
        missing_str = ', '.join(missing_items[:4])
        insights.append(f"Structural gaps identified — missing standard components: {missing_str}. A {doc_type_name} without these elements may face enforceability challenges in Indian courts.")
    elif comp_score == 100:
        insights.append(f"The document contains all {comp_total} standard components expected for a {doc_type_name}. This demonstrates strong structural compliance.")

    # Language-based insights
    if lang_issues:
        issue_labels = ', '.join(i['issue'].lower() for i in lang_issues[:2])
        insights.append(f"Linguistic quality concerns: {issue_labels}. Ambiguous or overly complex language weakens legal enforceability and increases interpretation risk in litigation.")
    elif lang_score >= 85:
        insights.append("The document demonstrates strong linguistic discipline with clear, unambiguous drafting that supports enforceability.")

    # Entity-based insights
    if not parties:
        insights.append("WARNING: No clearly identifiable parties were extracted. This is a fundamental deficiency — all legal instruments must unambiguously identify contracting parties.")
    if not dates:
        insights.append("No dates or timelines were detected in the document. Temporal ambiguity undermines enforceability under the Limitation Act, 1963.")
    if sections:
        insights.append(f"The document references {len(sections)} statutory {'provisions' if len(sections) > 1 else 'provision'}: {', '.join(sections[:4])}. Cross-reference with the latest amendments is recommended.")

    # Ensure at least 4 insights
    while len(insights) < 4:
        if total_words < 500:
            insights.append(f"The document is unusually brief ({total_words} words). Most enforceable {doc_type_name} instruments contain significantly more detail to cover all contingencies.")
        elif total_words > 5000:
            insights.append(f"The document is extensive ({total_words:,} words). While thorough, lengthy instruments increase the risk of internal contradictions. A clause-by-clause consistency check is advised.")
        elif avg_sent_len > 40:
            insights.append(f"Average sentence length of {avg_sent_len} words exceeds legal drafting best practices (25-35 words). This increases the risk of misinterpretation.")
        else:
            insights.append(f"Overall, this {doc_type_name} requires review by qualified legal counsel before execution to ensure all obligations and liabilities are clearly defined and balanced.")
        if len(insights) >= 4:
            break

    # ── 3. STRUCTURAL MAP ──
    # Liability Profile
    if critical_risks:
        liability = f"CRITICAL — {len(critical_risks)} critical clause(s) detected ({', '.join(r['clause'] for r in critical_risks[:2])}). Party faces potentially unlimited or asset-seizing exposure."
    elif len(high_risks) >= 3:
        liability = f"HIGH — {len(high_risks)} high-severity clauses including {high_risks[0]['clause']} and {high_risks[1]['clause']}. Significant financial and legal exposure present."
    elif high_risks:
        liability = f"ELEVATED — {len(high_risks)} high-severity clause(s): {', '.join(r['clause'] for r in high_risks[:2])}. Targeted renegotiation recommended."
    elif med_risks:
        liability = f"MODERATE — {len(med_risks)} medium-severity provisions detected. Standard commercial risk within acceptable bounds."
    else:
        liability = "LOW — No significant liability-creating clauses detected. Standard legal protections appear adequate."

    # Financial Exposure
    if amounts:
        financial = f"QUANTIFIED — Financial references detected: {', '.join(amounts[:3])}. All monetary obligations should be cross-verified against payment schedules and caps."
    elif any(r['clause'] in ['Unlimited Liability', 'Penalty/Liquidated Damages', 'Indemnification Clause'] for r in risk_clauses):
        risky_financial = [r['clause'] for r in risk_clauses if r['clause'] in ['Unlimited Liability', 'Penalty/Liquidated Damages', 'Indemnification Clause']]
        financial = f"UNQUANTIFIED BUT PRESENT — Financial risk clauses ({', '.join(risky_financial)}) exist without explicit monetary caps. This creates open-ended exposure."
    else:
        financial = "MINIMAL — No explicit monetary amounts or financially risky clauses detected. Financial exposure appears contained."

    # Governance / Operational Control
    governance_clauses = [r for r in risk_clauses if r['clause'] in ['Non-Compete Clause', 'Non-Solicitation', 'IP Assignment', 'Entire Agreement', 'Confidentiality/NDA']]
    if governance_clauses:
        gov_labels = ', '.join(r['clause'] for r in governance_clauses[:3])
        governance = f"RESTRICTIVE — Operational control clauses detected: {gov_labels}. These limit the party's freedom of action and should be carefully scoped."
    elif comp_score >= 80:
        governance = f"STRUCTURED — Document completeness at {comp_score}% suggests well-defined operational framework. Standard governance provisions present."
    else:
        governance = f"UNDERSPECIFIED — Document completeness at {comp_score}% with missing components. Governance structure may have gaps that could lead to disputes."

    # Dispute Resolution
    dispute_clauses = [r for r in risk_clauses if r['clause'] in ['Dispute Resolution Clause', 'Arbitration Seat', 'Governing Law', 'Specific Performance']]
    if dispute_clauses:
        disp_labels = ', '.join(r['clause'] for r in dispute_clauses)
        dispute = f"DEFINED — Dispute mechanisms present: {disp_labels}. Verify that the specified jurisdiction and forum are favorable to your client's position."
    else:
        dispute = "ABSENT — No formal dispute resolution mechanism detected. This is a significant gap — disputes will default to civil court jurisdiction, which is slow and expensive. Mandatory arbitration clause recommended."

    structural_map = {
        "Liability Profile": liability,
        "Financial Exposure": financial,
        "Governance & Control": governance,
        "Dispute Resolution": dispute
    }

    # ── 4. MISSING ELEMENTS ──
    missing_elements = missing_items if missing_items else ["All standard components present for this document type"]

    # ── 5. STRUCTURAL INTEGRITY SCORE ──
    # Weighted: completeness (40%) + language (30%) + risk-adjusted (30%)
    risk_deduction = min(100, (len(high_risks) * 20) + (len(med_risks) * 10) + (len(critical_risks) * 30))
    risk_health = max(0, 100 - risk_deduction)
    integrity_score = round(
        (comp_score * 0.40) + (lang_score * 0.30) + (risk_health * 0.30)
    )
    integrity_score = max(5, min(100, integrity_score))

    return {
        "neural_audit": neural_audit,
        "strategic_insights": insights[:6],
        "structural_map": structural_map,
        "missing_elements": missing_elements[:8],
        "structural_integrity_score": integrity_score
    }


async def analyze_legal_paper(file_path: str) -> dict:
    """Full legal paper analysis pipeline — deterministic, non-blocking, zero AI dependency."""
    import asyncio

    # 0. Extract text (CPU-bound — run in thread)
    text = await asyncio.to_thread(extract_text, file_path)
    if not text:
        return {"error": "Could not extract text from document. Ensure the file is not encrypted or corrupted."}
    if len(text.strip()) < 20:
        return {"error": f"Extracted text is too short ({len(text)} chars). The document may be scanned without OCR support or empty."}

    # 1. Document type detection
    doc_type = await asyncio.to_thread(detect_document_type, text)
    doc_type_name = doc_type["type"]

    # 2. Run ALL regex-based analysis modules in parallel threads
    entities_task = asyncio.to_thread(extract_entities, text)
    risks_task = asyncio.to_thread(analyze_risk_clauses, text)
    completeness_task = asyncio.to_thread(check_completeness, text, doc_type_name)
    language_task = asyncio.to_thread(assess_language_quality, text)
    summary_task = asyncio.to_thread(generate_summary, text)

    entities, risk_clauses, completeness, language, summary = await asyncio.gather(
        entities_task, risks_task, completeness_task, language_task, summary_task
    )

    # 3. Hardcore deterministic analysis — synthesize ALL results
    neural = perform_hardcore_analysis(
        text=text,
        doc_type_name=doc_type_name,
        risk_clauses=risk_clauses,
        completeness=completeness,
        language=language,
        entities=entities,
        summary_text=summary
    )

    # 4. Compute risk score
    high_risk = sum(1 for r in risk_clauses if r["severity"] == "high")
    med_risk = sum(1 for r in risk_clauses if r["severity"] == "medium")
    critical_risk = sum(1 for r in risk_clauses if r.get("severity") == "critical")
    risk_score = max(0, 100 - (critical_risk * 25) - (high_risk * 15) - (med_risk * 8))

    return {
        "document_type": doc_type,
        "summary": summary,
        "entities": entities,
        "risk_clauses": risk_clauses,
        "risk_score": risk_score,
        "completeness": completeness,
        "language_quality": language,
        "neural_analysis": neural,
        "total_words": language.get("total_words", 0),
        "high_risk_count": high_risk,
        "medium_risk_count": med_risk,
        "low_risk_count": sum(1 for r in risk_clauses if r["severity"] == "low"),
        "critical_risk_count": critical_risk
    }
