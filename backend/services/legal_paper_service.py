import re
import os
import logging
import contextlib
import pdfplumber
from docx import Document as DocxDocument
from PIL import Image
from config import LEGAL_PAPER_ENABLE_NEURAL_AUDIT, LEGAL_PAPER_NEURAL_TIMEOUT_SECONDS
try:
    import easyocr
    import numpy as np
except ImportError:
    easyocr = None
# AI imports removed — hardcore engine is fully deterministic

logger = logging.getLogger(__name__)

# Global OCR Reader (Lazy Loaded)
_ocr_reader = None

MONTH_PATTERN = (
    r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|"
    r"aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
)

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
    "Contract": [r"agreement", r"contract", r"parties hereto", r"witnesseth", r"terms and conditions", r"obligations", r"this agreement is made", r"whereas"],
    "Petition": [r"petition", r"petitioner", r"respondent", r"honourable court", r"humbly prays", r"writ petition", r"slp", r"special leave", r"most respectfully showeth"],
    "Affidavit": [r"affidavit", r"solemnly affirm", r"deponent", r"sworn before", r"notary public", r"oath"],
    "Legal Notice": [r"legal notice", r"notice is hereby", r"advocate", r"under instructions", r"failing which", r"call upon you", r"take notice"],
    "Power of Attorney": [r"power of attorney", r"attorney", r"authorize", r"irrevocable", r"principal"],
    "Will/Testament": [r"last will", r"testament", r"bequeath", r"estate", r"executor", r"probate"],
    "Court Order": [r"order", r"court", r"directed", r"judgment", r"decreed", r"disposed", r"it is ordered", r"the following order"],
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
        elif ext in [".txt", ".md"]:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        elif ext == ".rtf":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = strip_rtf_basic(f.read())
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


def normalize_extracted_text(text: str) -> str:
    """Clean OCR noise and normalize whitespace for downstream analysis."""
    if not text:
        return ""

    text = text.replace("\u2014", "-").replace("\u2013", "-").replace("\u2019", "'")
    text = text.replace("â€”", "-").replace("â€“", "-").replace("â€˜", "'").replace("â€™", "'")
    text = text.replace("â‚¹", "Rs. ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"([A-Za-z])-\n([A-Za-z])", r"\1\2", text)
    text = re.sub(r"(?<=\w)\n(?=\w)", " ", text)
    return text.strip()


def strip_rtf_basic(rtf_text: str) -> str:
    """Basic RTF to text fallback without external dependencies."""
    text = re.sub(r"\\'[0-9a-fA-F]{2}", " ", rtf_text)
    text = re.sub(r"\\[a-zA-Z]+\d* ?", " ", text)
    text = text.replace("{", " ").replace("}", " ")
    return normalize_extracted_text(text)


def split_sentences(text: str) -> list:
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+|\n+', text) if s.strip()]


def extract_document_profile(text: str) -> dict:
    """Create lightweight document profile metrics used across the engine."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sentences = split_sentences(text)
    heading_lines = [
        line for line in lines
        if 4 <= len(line) <= 120 and (
            line.isupper()
            or re.match(r"^(clause|section|article|schedule|annexure|facts|prayer|order|notice)\b", line, re.IGNORECASE)
            or line.endswith(":")
        )
    ]
    digit_density = round(sum(ch.isdigit() for ch in text) / max(len(text), 1), 4)

    return {
        "line_count": len(lines),
        "paragraph_count": len([p for p in re.split(r"\n\s*\n", text) if p.strip()]),
        "sentence_count": len(sentences),
        "heading_count": len(heading_lines[:50]),
        "digit_density": digit_density,
        "uppercase_heading_ratio": round(len(heading_lines) / max(len(lines), 1), 3),
    }


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


def infer_document_purpose(doc_type_name: str, text: str) -> str:
    """Infer the practical purpose of the legal paper."""
    purpose_map = {
        "FIR": "To formally report an alleged cognizable offence and trigger criminal investigation.",
        "Contract": "To define binding commercial rights, duties, payment terms, liability, and remedies between parties.",
        "Petition": "To place facts, legal grounds, and prayers before a court or authority for adjudication.",
        "Affidavit": "To place sworn facts on record for evidentiary or procedural use.",
        "Legal Notice": "To formally assert rights, state breach or grievance, and demand corrective action before escalation.",
        "Power of Attorney": "To delegate legal or commercial authority from a principal to an attorney.",
        "Will/Testament": "To record testamentary intent and distribution of estate after death.",
        "Court Order": "To record directions, findings, or operative relief issued by a judicial authority.",
        "Lease/Rental": "To govern possession, rent, obligations, and termination concerning premises.",
        "Sale Deed": "To document transfer of title and consideration for immovable property.",
        "Mortgage Deed": "To secure repayment obligations against identified property or assets.",
        "Gift Deed": "To record voluntary transfer without consideration.",
        "Indemnity Bond": "To allocate reimbursement responsibility for defined loss scenarios.",
        "Board Resolution": "To formally evidence board approval and authority for corporate action.",
    }
    if doc_type_name in purpose_map:
        return purpose_map[doc_type_name]

    first_chunk = " ".join(text.split()[:45])
    if first_chunk:
        return f"To create a formal legal record concerning: {first_chunk[:260]}."
    return "To create a formal legal record with legal or procedural effect."


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


def extract_entities_v2(text: str) -> dict:
    """Improved entity extraction with better date, amount, party, and address coverage."""
    entities = {
        "parties": [],
        "dates": [],
        "amounts": [],
        "addresses": [],
        "sections_cited": []
    }

    date_patterns = [
        r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}",
        rf"\d{{1,2}}\s+{MONTH_PATTERN},?\s+\d{{4}}",
        rf"{MONTH_PATTERN}\s+\d{{1,2}},?\s+\d{{4}}",
        rf"\d{{1,2}}(?:st|nd|rd|th)?\s+day of\s+{MONTH_PATTERN},?\s+\d{{4}}",
    ]
    for pattern in date_patterns:
        entities["dates"].extend(re.findall(pattern, text, re.IGNORECASE))

    amount_patterns = [
        r"(?:Rs\.?|₹|INR)\s*[\d,]+(?:\.\d{1,2})?(?:\s*(?:lakh|crore|lakhs|crores|million|billion))?",
        r"[\d,]+(?:\.\d{1,2})?\s*(?:rupees|lakh|lakhs|crore|crores|million|billion)",
        r"(?:USD|EUR|GBP|\$)\s*[\d,]+(?:\.\d{1,2})?",
    ]
    for pattern in amount_patterns:
        entities["amounts"].extend(re.findall(pattern, text, re.IGNORECASE))

    sections = SECTION_PATTERN.findall(text)
    entities["sections_cited"] = [f"Section {s}" for s in set(sections)]

    party_patterns = [
        r"(?:between|among)\s+([A-Z][a-zA-Z&.,\s]+?)(?:\s+and\s+|\s+hereinafter)",
        r"(?:Mr\.|Mrs\.|Ms\.|Shri|Smt\.)\s+[A-Z][a-zA-Z\s]+",
        r"(?:complainant|petitioner|plaintiff|respondent|defendant|accused|claimant|appellant)[:\-–—]\s*([A-Z][a-zA-Z&.,\s]+)",
        r"(?:this\s+agreement\s+is\s+made\s+between)\s+([A-Z][a-zA-Z&.,\s]+?)(?:\s+and\s+)",
    ]
    for pattern in party_patterns:
        found = re.findall(pattern, text, re.IGNORECASE)
        entities["parties"].extend([p.strip(" ,.-") for p in found if len(p.strip()) > 3])

    address_patterns = [
        r"(?:address|residing at|located at|office at)[:\-]?\s*([A-Za-z0-9,.\-\/\s]{15,120})",
        r"\b(?:flat|plot|survey|door|house)\s+no\.?\s*[A-Za-z0-9\-\/, ]{6,100}",
    ]
    for pattern in address_patterns:
        found = re.findall(pattern, text, re.IGNORECASE)
        entities["addresses"].extend([addr.strip(" ,.-") for addr in found if isinstance(addr, str)])

    for key in entities:
        entities[key] = list(dict.fromkeys(entities[key]))[:12]

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


def check_completeness_v2(text: str, doc_type: str, entities: dict) -> dict:
    """Improved completeness scoring using concept-level synonyms."""
    checklist = COMPLETENESS_CHECKLIST.get(doc_type, COMPLETENESS_CHECKLIST.get("Contract", []))
    text_lower = text.lower()

    concept_map = {
        "Parties Identified": [bool(entities.get("parties")), "between" in text_lower, "party" in text_lower],
        "Effective Date": [bool(entities.get("dates")), "effective date" in text_lower, "dated" in text_lower],
        "Obligations/Terms": ["shall" in text_lower, "obligation" in text_lower, "agree" in text_lower],
        "Payment Terms": [bool(entities.get("amounts")), "payment" in text_lower, "consideration" in text_lower, "fee" in text_lower],
        "Duration/Term": ["term" in text_lower, "period" in text_lower, "commence" in text_lower, "expire" in text_lower],
        "Termination Clause": ["termination" in text_lower, "terminate" in text_lower, "cancel" in text_lower],
        "Governing Law": ["governing law" in text_lower, "jurisdiction" in text_lower, "arbitration" in text_lower],
        "Signatures": ["signature" in text_lower, "signed" in text_lower, "seal" in text_lower, "witness whereof" in text_lower],
        "Date and Time of Incident": ["date" in text_lower and ("time" in text_lower or "at about" in text_lower)],
        "Place of Occurrence": ["place of occurrence" in text_lower, "occurred at" in text_lower, bool(entities.get("addresses"))],
        "Complainant Details": ["complainant" in text_lower, "informant" in text_lower],
        "Accused Details": ["accused" in text_lower, "suspect" in text_lower],
        "Facts/Narrative": ["facts" in text_lower, "brief facts" in text_lower, len(split_sentences(text)) >= 5],
        "Section References": [bool(entities.get("sections_cited"))],
        "Witnesses": ["witness" in text_lower],
        "Petitioner Details": ["petitioner" in text_lower, "applicant" in text_lower],
        "Respondent Details": ["respondent" in text_lower, "opposite party" in text_lower],
        "Court Named": ["court" in text_lower, "tribunal" in text_lower, "hon'ble" in text_lower],
        "Prayer/Relief Sought": ["prayer" in text_lower, "relief" in text_lower, "it is prayed" in text_lower],
        "Verification/Affidavit": ["verification" in text_lower, "affidavit" in text_lower],
        "Deponent Name": ["deponent" in text_lower, "ponent" in text_lower],
        "Sworn Statement": ["solemnly affirm" in text_lower, "sworn" in text_lower, "affirm" in text_lower],
        "Notary/Magistrate": ["notary" in text_lower, "magistrate" in text_lower, "oath commissioner" in text_lower],
        "Facts Stated": ["facts stated" in text_lower, len(split_sentences(text)) >= 4],
        "Sender Details": ["from:" in text_lower, "sender" in text_lower, "through advocate" in text_lower],
        "Recipient Details": ["to," in text_lower, "recipient" in text_lower, "addressee" in text_lower],
        "Subject": ["subject:" in text_lower],
        "Demand/Relief": ["demand" in text_lower, "relief" in text_lower, "call upon you" in text_lower],
        "Time Limit": ["within" in text_lower and "days" in text_lower, "failing which" in text_lower],
        "Advocate Details": ["advocate" in text_lower, "counsel" in text_lower],
        "Landlord Details": ["landlord" in text_lower, "lessor" in text_lower],
        "Tenant Details": ["tenant" in text_lower, "lessee" in text_lower],
        "Property Address": [bool(entities.get("addresses")), "premises" in text_lower, "property" in text_lower],
        "Rent Amount": [bool(entities.get("amounts")), "rent" in text_lower],
        "Security Deposit": ["security deposit" in text_lower, "deposit" in text_lower],
        "Vendor Details": ["vendor" in text_lower, "seller" in text_lower],
        "Vendee Details": ["vendee" in text_lower, "purchaser" in text_lower, "buyer" in text_lower],
        "Property Description": ["schedule of property" in text_lower, "property description" in text_lower, bool(entities.get("addresses"))],
        "Sale Consideration": ["sale consideration" in text_lower, bool(entities.get("amounts"))],
        "Payment Mode": ["payment mode" in text_lower, "paid by" in text_lower, "bank transfer" in text_lower, "cheque" in text_lower],
        "Possession Clause": ["possession" in text_lower],
        "Encumbrance Certificate": ["encumbrance" in text_lower],
        "Mortgagor Details": ["mortgagor" in text_lower, "borrower" in text_lower],
        "Mortgagee Details": ["mortgagee" in text_lower, "lender" in text_lower, "bank" in text_lower],
        "Loan Amount": [bool(entities.get("amounts")), "loan amount" in text_lower],
        "Interest Rate": ["interest rate" in text_lower, "interest" in text_lower],
        "Property Security": ["security" in text_lower, "collateral" in text_lower, "mortgaged property" in text_lower],
        "Default Terms": ["default" in text_lower, "event of default" in text_lower],
        "Repayment Schedule": ["repayment" in text_lower, "installment" in text_lower, "emi" in text_lower],
        "Donor Details": ["donor" in text_lower],
        "Donee Details": ["donee" in text_lower],
        "Acceptance Clause": ["accepted" in text_lower, "acceptance" in text_lower],
        "No Consideration Clause": ["without consideration" in text_lower, "love and affection" in text_lower],
        "Meeting Date": [bool(entities.get("dates")), "meeting held on" in text_lower],
        "Resolution Number": ["resolution no" in text_lower, "resolution number" in text_lower],
        "Authorized Signatory": ["authorized signatory" in text_lower, "authorised signatory" in text_lower],
        "Directors Attending": ["directors present" in text_lower, "board of directors" in text_lower],
        "Clear Action/Authority": ["resolved that" in text_lower, "authorized to" in text_lower],
    }

    results = []
    found = 0
    for item in checklist:
        signals = concept_map.get(item, [item.lower() in text_lower])
        present = any(bool(signal) for signal in signals)
        results.append({"item": item, "present": present})
        if present:
            found += 1

    score = round((found / len(checklist)) * 100) if checklist else 0
    return {"score": score, "checklist": results, "total": len(checklist), "found": found}


def extract_core_obligations(text: str, doc_type_name: str, max_items: int = 6) -> list:
    """Extract likely obligation-style sentences from legal text."""
    candidates = []
    obligation_markers = [
        "shall", "must", "agrees to", "is required to", "undertakes to",
        "will be liable", "shall pay", "shall deliver", "shall provide",
        "is entitled to", "shall maintain", "shall not", "may terminate"
    ]
    for sentence in split_sentences(text):
        lowered = sentence.lower()
        if len(sentence.split()) < 6 or len(sentence.split()) > 45:
            continue
        if any(marker in lowered for marker in obligation_markers):
            candidates.append(sentence.strip())

    deduped = []
    seen = set()
    for sentence in candidates:
        key = sentence.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(sentence)

    if not deduped and doc_type_name in {"Petition", "Affidavit", "Legal Notice", "Court Order"}:
        deduped = split_sentences(text)[:max_items]

    return deduped[:max_items]


def build_issue_profile(text: str, doc_type_name: str, entities: dict, risk_clauses: list, completeness: dict, language: dict) -> dict:
    """Summarize the engine's view of the document in issue clusters."""
    profile = {
        "document_focus": infer_document_purpose(doc_type_name, text),
        "risk_posture": "balanced",
        "principal_concerns": [],
    }

    if any(r.get("severity") == "critical" for r in risk_clauses):
        profile["risk_posture"] = "critical"
    elif any(r.get("severity") == "high" for r in risk_clauses):
        profile["risk_posture"] = "elevated"
    elif completeness.get("score", 0) < 70:
        profile["risk_posture"] = "incomplete"

    if not entities.get("parties"):
        profile["principal_concerns"].append("Party identification is weak or not clearly extractable.")
    if not entities.get("dates"):
        profile["principal_concerns"].append("Timeline signals are weak, which may create procedural or performance ambiguity.")
    if completeness.get("score", 0) < 75:
        profile["principal_concerns"].append("Several expected structural elements appear missing.")
    if language.get("issues"):
        profile["principal_concerns"].append("Drafting quality issues may reduce clarity or enforceability.")
    if risk_clauses:
        profile["principal_concerns"].append(f"{len(risk_clauses)} clause pattern(s) were flagged for legal review.")

    if not profile["principal_concerns"]:
        profile["principal_concerns"].append("No major engine-level concern dominates the document; remaining review is mostly clause calibration.")

    return profile


def calculate_analysis_confidence(doc_type: dict, profile: dict, entities: dict, completeness: dict) -> int:
    """Estimate engine confidence based on extraction richness and structure quality."""
    score = 35
    score += min(25, doc_type.get("confidence", 0) // 2)
    score += min(15, len(entities.get("parties", [])) * 3)
    score += min(10, len(entities.get("dates", [])) * 2)
    score += min(10, len(entities.get("sections_cited", [])) * 2)
    score += min(15, completeness.get("score", 0) // 8)
    if profile.get("risk_posture") == "critical":
        score -= 5
    return max(20, min(100, score))


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


def build_section_breakdown(text: str, doc_type_name: str) -> list:
    """Build a readable section-by-section breakdown from headings or strong paragraphs."""
    candidates = []
    seen = set()

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if len(line) < 8:
            continue
        if len(line) > 110:
            continue
        alpha_count = sum(1 for ch in line if ch.isalpha())
        if alpha_count < 5:
            continue
        if line.lower() in seen:
            continue

        is_heading = (
            line.isupper()
            or re.match(r"^(section|clause|article|schedule|part|chapter|annexure|prayer|facts|background)\b", line, re.IGNORECASE)
            or raw_line.endswith(":")
        )
        if is_heading:
            seen.add(line.lower())
            candidates.append(line)

    if not candidates:
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if len(p.strip()) > 80]
        for idx, paragraph in enumerate(paragraphs[:6], start=1):
            snippet = " ".join(paragraph.split()[:28]).strip()
            candidates.append(f"Section {idx}: {snippet}")

    breakdown = []
    for idx, heading in enumerate(candidates[:6], start=1):
        pattern = re.escape(heading)
        match = re.search(pattern, text, re.IGNORECASE)
        excerpt = ""
        if match:
            start = match.end()
            excerpt = " ".join(text[start:start + 320].split())
        if not excerpt:
            excerpt = " ".join(heading.split()[:20])

        breakdown.append({
            "title": heading[:100],
            "summary": excerpt[:240] if excerpt else f"Relevant {doc_type_name.lower()} section identified for review."
        })

    return breakdown[:6]


def build_strengths(
    doc_type_name: str,
    completeness: dict,
    language: dict,
    entities: dict,
    risk_clauses: list
) -> list:
    strengths = []

    if completeness.get("score", 0) >= 85:
        strengths.append("The document covers most of the core structural elements typically expected for this document type.")
    if entities.get("parties"):
        strengths.append("The parties are identifiable from the text, which supports traceability and enforceability.")
    if entities.get("dates"):
        strengths.append("Key dates or timelines are present, reducing ambiguity around chronology and obligations.")
    if language.get("score", 0) >= 80:
        strengths.append("Drafting quality is relatively clear and disciplined, which improves interpretability.")
    if not any(r.get("severity") in {"critical", "high"} for r in risk_clauses):
        strengths.append("No immediately severe clause pattern was detected, suggesting a more balanced risk profile.")
    if entities.get("sections_cited"):
        strengths.append("Statutory references are present, which may strengthen the document's legal framing.")

    if not strengths:
        strengths.append(f"The {doc_type_name.lower()} contains enough extracted content to support a structured legal review.")

    return strengths[:5]


def build_weak_points(
    doc_type_name: str,
    completeness: dict,
    language: dict,
    entities: dict,
    risk_clauses: list
) -> list:
    weak_points = []

    for risk in risk_clauses[:5]:
        weak_points.append({
            "title": risk["clause"],
            "severity": risk["severity"],
            "issue": risk["detail"],
            "impact": f"This clause can materially affect bargaining power, liability allocation, or enforceability in the {doc_type_name.lower()}."
        })

    missing_items = [item["item"] for item in completeness.get("checklist", []) if not item.get("present")]
    for item in missing_items[:3]:
        weak_points.append({
            "title": f"Missing {item}",
            "severity": "medium",
            "issue": f"The document appears to lack a clear {item.lower()}.",
            "impact": "Missing core drafting elements can create interpretation disputes, procedural weakness, or proof gaps."
        })

    for issue in language.get("issues", [])[:2]:
        weak_points.append({
            "title": issue["issue"],
            "severity": "medium",
            "issue": issue["detail"],
            "impact": "Poor drafting quality can create uncertainty, make obligations harder to prove, and weaken negotiations."
        })

    if not entities.get("parties"):
        weak_points.append({
            "title": "Unclear party identification",
            "severity": "high",
            "issue": "The document does not clearly expose identifiable parties from extraction.",
            "impact": "That can create a fundamental enforceability problem and uncertainty over who is bound."
        })

    if not entities.get("dates"):
        weak_points.append({
            "title": "Missing clear timeline",
            "severity": "medium",
            "issue": "No clear date or timing signal was extracted.",
            "impact": "Timeline ambiguity weakens performance tracking, limitation analysis, and notice requirements."
        })

    return weak_points[:8]


def build_fixing_solutions(weak_points: list) -> list:
    solutions = []

    for point in weak_points:
        title = point.get("title", "Document issue")
        severity = point.get("severity", "medium")
        title_lower = title.lower()

        if "indemn" in title_lower:
            fix = "Cap indemnity exposure, define claim procedure, exclude indirect losses, and tie liability to fault or breach."
        elif "termination" in title_lower:
            fix = "Add notice periods, cure rights, objective termination triggers, and post-termination obligations."
        elif "liability" in title_lower or "damages" in title_lower:
            fix = "Introduce a liability cap, carve-outs, mitigation language, and a clear damages methodology."
        elif "part" in title_lower:
            fix = "Insert full legal names, addresses, roles, and signature identifiers for every party."
        elif "date" in title_lower or "timeline" in title_lower:
            fix = "Add effective date, execution date, milestone dates, and notice timelines in a dedicated chronology section."
        elif "language" in title_lower or "ambiguous" in title_lower or "sentence" in title_lower:
            fix = "Rewrite long or vague clauses into short obligation-focused statements with defined terms."
        elif "governing law" in title_lower or "dispute" in title_lower or "arbitration" in title_lower:
            fix = "Clarify forum, seat, governing law, notice mechanics, and escalation before dispute filing."
        else:
            fix = "Redraft this section with precise definitions, objective triggers, balanced obligations, and a review by counsel before execution."

        solutions.append({
            "issue": title,
            "priority": "Immediate" if severity in {"critical", "high"} else "Recommended",
            "solution": fix
        })

    deduped = []
    seen = set()
    for item in solutions:
        key = item["issue"].lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    return deduped[:6]


def build_recommended_actions(
    doc_type_name: str,
    risk_clauses: list,
    completeness: dict,
    entities: dict
) -> list:
    actions = []

    if any(r.get("severity") in {"critical", "high"} for r in risk_clauses):
        actions.append("Escalate the flagged high-risk clauses for advocate review before signature, filing, or service.")
    if completeness.get("score", 0) < 75:
        actions.append("Complete missing structural components before relying on this document in negotiation or proceedings.")
    if not entities.get("parties") or not entities.get("dates"):
        actions.append("Normalize party and timeline details into a dedicated front section to remove ambiguity.")
    if doc_type_name in {"Contract", "Lease/Rental", "Sale Deed", "Mortgage Deed", "Gift Deed"}:
        actions.append("Run a commercial terms review to confirm payment triggers, liability allocation, and dispute mechanics.")
    if doc_type_name in {"Petition", "Affidavit", "Legal Notice", "Court Order", "FIR"}:
        actions.append("Cross-check factual chronology, annexures, and statutory references against the latest case file or instructions.")

    actions.append("Generate a final clean redraft with consistent definitions, clause numbering, and signature-ready formatting.")
    return actions[:5]


def build_report_overview(
    doc_type_name: str,
    risk_score: int,
    completeness: dict,
    language: dict
) -> dict:
    if risk_score >= 80 and completeness.get("score", 0) >= 80:
        readiness = "Relatively strong draft with targeted review needed before use."
    elif risk_score >= 60:
        readiness = "Usable foundation, but it needs legal cleanup before being relied on."
    else:
        readiness = "Material legal and drafting issues were detected. Redrafting is strongly advised."

    if doc_type_name in {"Contract", "Lease/Rental", "Sale Deed", "Mortgage Deed", "Gift Deed"}:
        purpose = "This appears to be a transactional instrument intended to define rights, obligations, value exchange, and remedies."
    elif doc_type_name in {"Petition", "Affidavit", "Legal Notice", "Court Order", "FIR"}:
        purpose = "This appears to be a procedural legal document intended to assert facts, invoke legal remedies, or support a formal proceeding."
    else:
        purpose = "This appears to be a formal legal instrument that should be reviewed for structure, factual sufficiency, and enforceability."

    return {
        "purpose": purpose,
        "readiness": readiness,
        "completeness_status": f"{completeness.get('score', 0)}% structural completeness",
        "language_status": f"{language.get('score', 0)}/100 drafting clarity"
    }


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
    text = await asyncio.to_thread(normalize_extracted_text, text)
    if not text:
        return {"error": "Could not extract text from document. Ensure the file is not encrypted or corrupted."}
    if len(text.strip()) < 20:
        return {"error": f"Extracted text is too short ({len(text)} chars). The document may be scanned without OCR support or empty."}

    # 1. Document type detection
    doc_type = await asyncio.to_thread(detect_document_type, text)
    doc_type_name = doc_type["type"]

    # 2. Run ALL regex-based analysis modules in parallel threads
    profile_task = asyncio.to_thread(extract_document_profile, text)
    entities_task = asyncio.to_thread(extract_entities_v2, text)
    risks_task = asyncio.to_thread(analyze_risk_clauses, text)
    language_task = asyncio.to_thread(assess_language_quality, text)
    summary_task = asyncio.to_thread(generate_summary, text)
    obligations_task = asyncio.to_thread(extract_core_obligations, text, doc_type_name)

    profile, entities, risk_clauses, language, summary, core_obligations = await asyncio.gather(
        profile_task, entities_task, risks_task, language_task, summary_task, obligations_task
    )
    completeness = await asyncio.to_thread(check_completeness_v2, text, doc_type_name, entities)

    # 3. Hardcore deterministic analysis — synthesize ALL results
    neural_base = perform_hardcore_analysis(
        text=text,
        doc_type_name=doc_type_name,
        risk_clauses=risk_clauses,
        completeness=completeness,
        language=language,
        entities=entities,
        summary_text=summary
    )

    final_neural = neural_base.copy()
    neural_audit_mode = "deterministic"

    # 4. Optional neural audit expansion
    if LEGAL_PAPER_ENABLE_NEURAL_AUDIT:
        from ai.llm_fallback import generate_neural_document_audit

        deterministic_context = {
            "doc_type": doc_type_name,
            "risk_count": len(risk_clauses),
            "comp_score": completeness.get("score", 0),
            "entities": entities
        }

        neural_advanced = None
        with contextlib.suppress(asyncio.TimeoutError):
            neural_advanced = await asyncio.wait_for(
                generate_neural_document_audit(text, doc_type_name, deterministic_context),
                timeout=LEGAL_PAPER_NEURAL_TIMEOUT_SECONDS,
            )

        if neural_advanced:
            final_neural.update({
                "neural_audit": neural_advanced.get("neural_audit", neural_base["neural_audit"]),
                "strategic_insights": neural_advanced.get("strategic_insights", neural_base["strategic_insights"]),
                "structural_map": neural_advanced.get("structural_map", neural_base["structural_map"]),
                "missing_elements": neural_advanced.get("missing_elements", neural_base["missing_elements"]),
                "structural_integrity_score": neural_advanced.get("structural_integrity_score", neural_base["structural_integrity_score"])
            })
            neural_audit_mode = "hybrid"

    # 5. Compute risk score
    high_risk = sum(1 for r in risk_clauses if r["severity"] == "high")
    med_risk = sum(1 for r in risk_clauses if r["severity"] == "medium")
    critical_risk = sum(1 for r in risk_clauses if r.get("severity") == "critical")
    risk_score = max(0, 100 - (critical_risk * 25) - (high_risk * 15) - (med_risk * 8))

    issue_profile = await asyncio.to_thread(build_issue_profile, text, doc_type_name, entities, risk_clauses, completeness, language)
    section_breakdown = await asyncio.to_thread(build_section_breakdown, text, doc_type_name)
    strengths = await asyncio.to_thread(build_strengths, doc_type_name, completeness, language, entities, risk_clauses)
    weak_points = await asyncio.to_thread(build_weak_points, doc_type_name, completeness, language, entities, risk_clauses)
    fixing_solutions = await asyncio.to_thread(build_fixing_solutions, weak_points)
    recommended_actions = await asyncio.to_thread(build_recommended_actions, doc_type_name, risk_clauses, completeness, entities)
    report_overview = await asyncio.to_thread(build_report_overview, doc_type_name, risk_score, completeness, language)
    analysis_confidence = await asyncio.to_thread(calculate_analysis_confidence, doc_type, issue_profile, entities, completeness)

    return {
        "document_type": doc_type,
        "summary": summary,
        "document_profile": profile,
        "analysis_confidence": analysis_confidence,
        "report_overview": report_overview,
        "issue_profile": issue_profile,
        "entities": entities,
        "core_obligations": core_obligations,
        "section_breakdown": section_breakdown,
        "strengths": strengths,
        "weak_points": weak_points,
        "fixing_solutions": fixing_solutions,
        "recommended_actions": recommended_actions,
        "risk_clauses": risk_clauses,
        "risk_score": risk_score,
        "completeness": completeness,
        "language_quality": language,
        "neural_analysis": final_neural,
        "analysis_runtime_mode": neural_audit_mode,
        "total_words": language.get("total_words", 0),
        "high_risk_count": high_risk,
        "medium_risk_count": med_risk,
        "low_risk_count": sum(1 for r in risk_clauses if r["severity"] == "low"),
        "critical_risk_count": critical_risk,
        "supported_document_scope": list(DOC_TYPE_PATTERNS.keys())
    }
