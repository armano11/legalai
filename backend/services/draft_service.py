import os
import uuid
import logging
import re
import asyncio
import json
import zipfile
from io import BytesIO
from datetime import datetime, timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor, Color
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Image, Table, TableStyle, Frame, PageTemplate
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from config import TEMPLATE_DIR, GENERATED_DIR, LOGO_PATH
from database.db import supabase
from services.ai_gateway import AIGatewayError, generate_text

logger = logging.getLogger(__name__)

# Store generated PDFs info in memory (replaces MongoDB)
_generated_drafts = {}
_batch_archives = {}

# --- Template definitions ---
BUILTIN_TEMPLATES = {
    "Legal Notice": """LEGAL NOTICE

Date: {date}
Ref. No.: JA/{ref_no}

To,
{opposing_party}
[Address]

Subject: Legal Notice under the provisions of applicable law

Dear Sir/Madam,

Under the instructions from and on behalf of our client, {client_name}, residing at [Client Address], we serve you with the following legal notice:

1. That our client and the opposing party entered into an agreement/understanding regarding the matter described below.

2. Facts of the dispute:
{case_description}

3. That despite repeated reminders and communications, you have failed to comply with the terms and obligations arising from the aforementioned arrangement.

4. We hereby call upon you to respond to this notice within 15 (fifteen) days from the date of receipt of this notice, failing which our client shall be constrained to initiate appropriate legal proceedings against you in a court of competent jurisdiction, at your risk, cost, and consequence.

5. A copy of this notice is retained in our office for record and further reference.

This notice is issued without prejudice to any other legal remedies available to our client.

Yours faithfully,

______________________
[Advocate Name]
Advocate for {client_name}
[Bar Council Registration No.]
""",

    "Consumer Complaint": """CONSUMER COMPLAINT

Date: {date}
Ref. No.: JA/{ref_no}

Before the District Consumer Disputes Redressal Commission
[District], [State]

Complainant:
{client_name}
[Address]

Versus

Opposite Party:
{opposing_party}
[Address]

COMPLAINT UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019

The complainant respectfully submits as follows:

1. That the complainant is a consumer as defined under the Consumer Protection Act, 2019.

2. That the facts giving rise to this complaint are as follows:
{case_description}

3. That the opposite party has been deficient in providing services / has sold defective goods (as applicable) which has caused loss and hardship to the complainant.

4. That the complainant has made multiple attempts to resolve this matter amicably but the opposite party has failed to take corrective action.

PRAYER:

The complainant therefore prays that this Hon'ble Commission may be pleased to:

(a) Direct the opposite party to provide appropriate compensation for the loss suffered.
(b) Direct the opposite party to rectify the deficiency in service / replace the defective goods.
(c) Award costs of this complaint to the complainant.
(d) Pass any other order deemed fit and proper in the circumstances.

______________________
{client_name}
Complainant
""",

    "Rental Agreement": """RENTAL / LEASE AGREEMENT

Date: {date}
Ref. No.: JA/{ref_no}

This Rental Agreement is made and executed on this {date},

BETWEEN

{client_name} (hereinafter referred to as the "LANDLORD"),
[Address]

AND

{opposing_party} (hereinafter referred to as the "TENANT"),
[Address]

WHEREAS the Landlord is the lawful owner of the property situated at [Property Address] and the Tenant has expressed a desire to take the said property on rent, both parties agree to the following terms and conditions:

1. TERM OF LEASE:
The lease shall commence from {date} and shall remain valid for a period of 11 (eleven) months, renewable by mutual agreement.

2. RENT:
The Tenant shall pay a monthly rent of Rs. [Amount] payable on or before the 5th of each month.

3. SECURITY DEPOSIT:
The Tenant has paid a refundable security deposit of Rs. [Amount], which shall be returned upon vacating the premises, subject to deductions for damages if any.

4. PURPOSE:
{case_description}

5. MAINTENANCE:
The Tenant shall maintain the property in good condition and shall be responsible for minor repairs.

6. TERMINATION:
Either party may terminate this agreement by giving one month's prior written notice.

7. GOVERNING LAW:
This agreement shall be governed by the laws of the State of [State].

IN WITNESS WHEREOF, both parties have set their hands on the date first above written.

______________________          ______________________
{client_name}                   {opposing_party}
(Landlord)                      (Tenant)

Witness 1: _______________
Witness 2: _______________
""",

    "Affidavit": """AFFIDAVIT

Date: {date}
Ref. No.: JA/{ref_no}

I, {client_name}, son/daughter of [Father's Name], aged about [Age] years, resident of [Address], do hereby solemnly affirm and declare as under:

1. That I am the deponent in this case and am competent to swear this affidavit.

2. That the facts stated herein are true to my knowledge and belief.

3. Statement of facts:
{case_description}

4. That I am making this affidavit for the purpose of [Purpose - e.g., submitting before the Hon'ble Court / Government Authority].

5. That the contents of this affidavit are true and correct and nothing material has been concealed therefrom.

VERIFICATION:

Verified at [City] on this {date} that the contents of the above affidavit are true and correct to my knowledge and belief.

______________________
{client_name}
Deponent

BEFORE ME

______________________
[Notary Public / Oath Commissioner]
""",

    "Power of Attorney": """GENERAL POWER OF ATTORNEY

Date: {date}
Ref. No.: JA/{ref_no}

KNOW ALL MEN BY THESE PRESENTS:

I, {client_name}, son/daughter of [Father's Name], residing at [Address], do hereby appoint and authorize {opposing_party}, son/daughter of [Father's Name], residing at [Address], as my lawful Attorney (hereinafter referred to as "Attorney") to act on my behalf in the following matters:

1. SCOPE OF AUTHORITY:
{case_description}

2. The Attorney is authorized to:
   (a) Appear before any court, tribunal, or authority on my behalf.
   (b) Sign, execute, and deliver any documents, deeds, or agreements.
   (c) Make payments and receive funds on my behalf.
   (d) Take all necessary actions as may be required.

3. This Power of Attorney shall remain valid until [Date / Until Revoked].

4. I hereby ratify and confirm all acts done by the said Attorney within the scope of this authority.

IN WITNESS WHEREOF, I have executed this Power of Attorney on the date first above written.

______________________
{client_name}
(Principal/Executant)

Accepted by:

______________________
{opposing_party}
(Attorney)

Witness 1: _______________
Witness 2: _______________
""",

    "Legal Opinion": """LEGAL OPINION

Date: {date}
Ref. No.: JA/{ref_no}

PRIVATE AND CONFIDENTIAL

To: {client_name}
Re: Legal Opinion on the matter described below

Dear {client_name},

You have sought our legal opinion on the following matter:

FACTS AS PRESENTED:
{case_description}

APPLICABLE LAW AND ANALYSIS:

Based on the facts presented, the following legal framework and analysis applies:

1. [Analysis of applicable statutes and provisions]

2. [Discussion of relevant case law and precedents]

3. [Assessment of strengths and weaknesses]

OPINION AND RECOMMENDATION:

Based on our analysis of the applicable law and the facts presented:

1. [Primary opinion]

2. [Alternative course of action if applicable]

3. [Risk assessment and recommended next steps]

DISCLAIMER:
This opinion is based solely on the facts as presented to us. Any change in facts or circumstances may alter this opinion. This opinion is provided for the exclusive use of the addressee and should not be relied upon by any third party.

Yours faithfully,

______________________
[Advocate Name]
[Bar Council Registration No.]
JurisAI Legal Intelligence Platform
"""
}


def load_template(doc_type: str) -> str:
    safe_name = doc_type.lower().replace(" ", "_") + ".txt"
    file_path = os.path.join(TEMPLATE_DIR, safe_name)
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    return BUILTIN_TEMPLATES.get(doc_type, BUILTIN_TEMPLATES["Legal Notice"])


def fill_template(doc_type: str, client_name: str, opposing_party: str, case_description: str) -> str:
    template = load_template(doc_type)
    ref_no = uuid.uuid4().hex[:8].upper()
    filled = template.format(
        date=datetime.now().strftime("%B %d, %Y"),
        ref_no=ref_no,
        client_name=client_name or "[Client Name]",
        opposing_party=opposing_party or "[Opposing Party]",
        case_description=case_description or "[Case description not provided]"
    )
    return filled


def _add_page_border(canvas, doc):
    """Add professional border and footer to each page."""
    canvas.saveState()

    # Outer border (navy)
    canvas.setStrokeColor(HexColor("#0B1F3A"))
    canvas.setLineWidth(2)
    canvas.rect(30, 30, A4[0] - 60, A4[1] - 60)

    # Inner border (gold accent)
    canvas.setStrokeColor(HexColor("#C0963C"))
    canvas.setLineWidth(0.5)
    canvas.rect(35, 35, A4[0] - 70, A4[1] - 70)

    # Footer
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(HexColor("#999999"))
    canvas.drawCentredString(A4[0] / 2, 42,
        f"Page {canvas.getPageNumber()}  |  {datetime.now().strftime('%B %d, %Y')}")

    canvas.restoreState()


def generate_pdf(text: str, title: str, draft_id: str, firm_name: str = "") -> str:
    """Generate a professional PDF with logo, letterhead, and borders."""
    file_name = f"{draft_id}.pdf"
    file_path = os.path.join(GENERATED_DIR, file_name)

    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        leftMargin=1.2 * inch,
        rightMargin=1.2 * inch,
        topMargin=1.5 * inch,
        bottomMargin=1 * inch
    )

    styles = getSampleStyleSheet()

    header_style = ParagraphStyle("LegalHeader", parent=styles["Normal"], fontSize=8, textColor=HexColor("#666666"),
                                    alignment=TA_CENTER, spaceAfter=4, fontName="Helvetica")

    title_style = ParagraphStyle("LegalTitle", parent=styles["Title"], fontSize=16, spaceAfter=8,
                                    textColor=HexColor("#0B1F3A"), fontName="Helvetica-Bold", alignment=TA_CENTER)

    ref_style = ParagraphStyle("RefNo", parent=styles["Normal"], fontSize=9, textColor=HexColor("#C0963C"),
                                alignment=TA_CENTER, spaceAfter=16, fontName="Helvetica-Bold")

    body_style = ParagraphStyle("LegalBody", parent=styles["Normal"], fontSize=11, leading=16, spaceAfter=8,
                                fontName="Helvetica")

    date_style = ParagraphStyle("LegalDate", parent=styles["Normal"], fontSize=10, textColor=HexColor("#666666"),
                                spaceAfter=16, fontName="Helvetica-Oblique", alignment=TA_RIGHT)

    elements = []

    # Logo
    if os.path.exists(LOGO_PATH):
        try:
            logo = Image(LOGO_PATH, width=1.2 * inch, height=1.2 * inch)
            logo.hAlign = 'CENTER'
            elements.append(logo)
            elements.append(Spacer(1, 0.1 * inch))
        except Exception:
            pass

    # Header
    header_text = firm_name.upper() if firm_name else "LEGAL PRACTICE"
    elements.append(Paragraph(header_text, header_style))
    elements.append(Paragraph("Advocates & Legal Consultants", header_style))
    elements.append(Spacer(1, 0.1 * inch))

    # Gold line
    elements.append(HRFlowable(width="60%", thickness=1.5, color=HexColor("#C0963C"), hAlign='CENTER'))
    elements.append(Spacer(1, 0.2 * inch))

    # Title
    elements.append(Paragraph(title.upper(), title_style))

    # Reference number
    elements.append(Paragraph(f"Ref: JA/{draft_id[:8].upper()}", ref_style))

    # Navy line
    elements.append(HRFlowable(width="100%", thickness=1, color=HexColor("#0B1F3A")))
    elements.append(Spacer(1, 0.2 * inch))

    # Body
    for line in text.split("\n"):
        stripped = line.strip()
        if stripped:
            safe = stripped.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            elements.append(Paragraph(safe, body_style))
        else:
            elements.append(Spacer(1, 0.12 * inch))

    # Signature area
    elements.append(Spacer(1, 0.5 * inch))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=HexColor("#CCCCCC")))
    elements.append(Spacer(1, 0.1 * inch))

    seal_style = ParagraphStyle("Seal", parent=styles["Normal"], fontSize=8, textColor=HexColor("#999999"),
                                alignment=TA_CENTER, fontName="Helvetica-Oblique")
    elements.append(Paragraph("[OFFICIAL SEAL / STAMP]", seal_style))
    elements.append(Spacer(1, 0.1 * inch))

    doc.build(elements, onFirstPage=_add_page_border, onLaterPages=_add_page_border)
    logger.info(f"PDF generated: {file_path}")
    return file_path


def _extract_issue_points(case_description: str) -> list[str]:
    clauses = []
    sentences = [segment.strip() for segment in re.split(r"[.\n]+", case_description or "") if segment.strip()]
    for sentence in sentences[:4]:
        clauses.append(sentence)
    if not clauses:
        clauses.append("Core factual allegations and requested relief need to be particularized.")
    return clauses


def _build_clause_notes(doc_type: str, case_description: str) -> list[dict]:
    issue_points = _extract_issue_points(case_description)
    starter_map = {
        "Legal Notice": [
            ("Demand and breach", "State the contractual or statutory breach with dates, prior notices, and a specific cure period."),
            ("Relief and consequences", "Specify the remedy demanded and the litigation or regulatory step that follows non-compliance."),
        ],
        "Consumer Complaint": [
            ("Deficiency in service", "Tie the fact pattern to a consumer protection duty and quantify the prejudice caused."),
            ("Prayer", "Ask for compensation, refund, costs, and any corrective directions in clear, separate clauses."),
        ],
    }
    base = starter_map.get(doc_type, [
        ("Factual record", "Set out the chronology, documents relied upon, and the legal right being asserted."),
        ("Operative relief", "Make the requested relief enforceable, measurable, and procedurally aligned."),
    ])
    notes = []
    for index, (clause, guidance) in enumerate(base):
        notes.append({
            "clause": clause,
            "guidance": guidance,
            "rationale": issue_points[min(index, len(issue_points) - 1)],
        })
    return notes


def _build_open_questions(doc_type: str, client_name: str, opposing_party: str, case_description: str) -> list[str]:
    questions = []
    if "[Address]" in load_template(doc_type):
        questions.append(f"Confirm service addresses and identifiers for {client_name} and {opposing_party}.")
    if not re.search(r"\b(date|dated|on)\b", case_description.lower()):
        questions.append("Add the key event dates, notice dates, and limitation-sensitive deadlines.")
    if not re.search(r"\b(amount|rs|rupees|₹)\b", case_description.lower()):
        questions.append("State any monetary claim, damages figure, or valuation basis.")
    return questions[:4]


def _build_risk_flags(case_description: str) -> list[str]:
    lowered = (case_description or "").lower()
    flags = []
    if "agreement" in lowered and "written" not in lowered:
        flags.append("The matter references an agreement but does not confirm whether the executed copy is available.")
    if "payment" in lowered and not re.search(r"\b(invoice|receipt|bank|transfer)\b", lowered):
        flags.append("A payment dispute is described without documentary proof being identified.")
    if not re.search(r"\bemail|message|notice|letter|document|annexure\b", lowered):
        flags.append("Supporting correspondence and annexures are not yet referenced in the brief.")
    return flags[:4]


def _draft_prompt(doc_type: str, client_name: str, opposing_party: str, case_description: str, firm_name: str, tone: str, base_text: str) -> str:
    return f"""
Prepare a polished Indian legal draft for the following matter.

Document Type: {doc_type}
Client / Applicant: {client_name}
Opposing Party / Respondent: {opposing_party}
Law Firm / Chamber: {firm_name or "JurisAI Legal"}
Tone: {tone}

Factual Brief:
{case_description}

Base Structural Template:
{base_text}

Requirements:
1. Preserve the legal structure appropriate for the document type.
2. Use precise, premium legal drafting language rather than generic AI phrasing.
3. Expand the factual matrix, legal basis, relief, and procedural posture.
4. Add headings, numbered paragraphs, and crisp operative clauses.
5. Do not use placeholders except where the input truly lacks a fact.
6. Return only the final draft text.
""".strip()


def _build_draft_brief(doc_type: str, tone: str, clause_notes: list[dict], risk_flags: list[str]) -> str:
    emphasis = ", ".join(note["clause"] for note in clause_notes[:3])
    risk_text = "; ".join(risk_flags[:2]) if risk_flags else "No critical red flags detected from the supplied brief."
    return (
        f"{doc_type} generated in a {tone.lower()} voice with emphasis on {emphasis}. "
        f"Priority review items: {risk_text}"
    )


def _persist_optional_draft_run(payload: dict) -> None:
    try:
        supabase.table("draft_runs").insert(payload).execute()
    except Exception as exc:
        logger.info("Optional draft_runs persistence skipped: %s", exc)


def _persist_optional_draft_version(payload: dict) -> None:
    try:
        supabase.table("draft_versions").insert(payload).execute()
    except Exception as exc:
        logger.info("Optional draft_versions persistence skipped: %s", exc)


async def create_draft(db, doc_type: str, client_name: str, opposing_party: str, case_description: str, firm_name: str = "", tone: str = "Neutral", research_context: str = "") -> dict:
    """Generate a structured, matter-aware draft and capture version metadata."""
    draft_id = uuid.uuid4().hex[:12]
    now_iso = datetime.now(timezone.utc).isoformat()
    base_text = fill_template(doc_type, client_name, opposing_party, case_description)

    clause_notes = _build_clause_notes(doc_type, case_description)
    open_questions = _build_open_questions(doc_type, client_name, opposing_party, case_description)
    risk_flags = _build_risk_flags(case_description)
    prompt = _draft_prompt(doc_type, client_name, opposing_party, case_description, firm_name, tone, base_text)

    trace = {"provider": "template", "model": "builtin", "fallback_used": True, "status": "ok"}
    try:
        ai_result = await asyncio.wait_for(
            asyncio.to_thread(
                generate_text,
                prompt,
                "document",
                0.15,
                2200,
            ),
            timeout=18,
        )
        trace = ai_result.get("trace", trace)
        neural_text = ai_result.get("text", "")
    except (AIGatewayError, TimeoutError) as exc:
        logger.warning("Draft generation used deterministic fallback: %s", exc)
        neural_text = ""

    final_text = neural_text if (neural_text and len(neural_text) > 240) else base_text
    pdf_path = await asyncio.to_thread(generate_pdf, final_text, doc_type, draft_id, firm_name)
    version_id = f"{draft_id}-v1"
    draft_brief = _build_draft_brief(doc_type, tone, clause_notes, risk_flags)

    _generated_drafts[draft_id] = {
        "draft_id": draft_id,
        "document_type": doc_type,
        "file_path": pdf_path,
        "preview_text": final_text,
        "generated_draft": final_text,
        "draft_brief": draft_brief,
        "clause_notes": clause_notes,
        "open_questions": open_questions,
        "risk_flags": risk_flags,
        "version_history": [
            {
                "version_id": version_id,
                "created_at": now_iso,
                "summary": "Initial matter-aware draft generated from the case brief.",
                "instructions": "Initial generation",
            }
        ],
        "trace": trace,
        "created_at": now_iso,
    }

    try:
        user_id = db if isinstance(db, (int, str)) and str(db).isdigit() else None
        supabase.table("draft_history").insert({
            "user_id": user_id,
            "doc_type": doc_type,
            "draft_id": draft_id,
            "client_name": client_name,
            "timestamp": now_iso
        }).execute()
    except Exception as e:
        logger.warning(f"Failed to persist draft history to Supabase: {e}")

    _persist_optional_draft_run({
        "draft_id": draft_id,
        "user_id": db if isinstance(db, (int, str)) and str(db).isdigit() else None,
        "document_type": doc_type,
        "client_name": client_name,
        "opposing_party": opposing_party,
        "matter_summary": case_description,
        "draft_brief": draft_brief,
        "risk_flags": risk_flags,
        "created_at": now_iso,
    })
    _persist_optional_draft_version({
        "draft_id": draft_id,
        "version_id": version_id,
        "content": final_text,
        "summary": "Initial matter-aware draft generated from the case brief.",
        "instructions": "Initial generation",
        "created_at": now_iso,
    })

    return {
        "draft_id": draft_id,
        "preview_text": final_text,
        "generated_draft": final_text,
        "draft_brief": draft_brief,
        "clause_notes": clause_notes,
        "open_questions": open_questions,
        "risk_flags": risk_flags,
        "version_history": _generated_drafts[draft_id]["version_history"],
        "download_url": f"/api/download-draft/{draft_id}",
        "document_type": doc_type,
        "created_at": now_iso,
        "trace": trace,
    }


def get_draft_file_path(draft_id: str) -> str:
    """Get file path for a generated draft."""
    info = _generated_drafts.get(draft_id)
    if info:
        return info.get("file_path", "")
    # Fallback: look for file directly
    file_path = os.path.join(GENERATED_DIR, f"{draft_id}.pdf")
    return file_path if os.path.exists(file_path) else ""


def get_draft_versions(draft_id: str) -> list[dict]:
    info = _generated_drafts.get(draft_id, {})
    return info.get("version_history", [])


async def redraft_existing(draft_id: str, instructions: str, tone: str = "Neutral") -> dict:
    info = _generated_drafts.get(draft_id)
    if not info:
        raise ValueError("Draft not found")

    prompt = (
        f"Redraft the following legal document in a {tone.lower()} voice.\n"
        f"Revision instructions: {instructions}\n\n"
        f"CURRENT DRAFT:\n{info.get('generated_draft') or info.get('preview_text', '')}\n\n"
        "Return only the revised legal draft."
    )
    try:
        ai_result = generate_text(prompt, kind="document", temperature=0.12, max_tokens=2200)
        revised_text = ai_result.get("text", "")
        trace = ai_result.get("trace", {})
    except Exception as exc:
        logger.warning("Redraft fell back to deterministic copy: %s", exc)
        revised_text = f"{info.get('generated_draft') or info.get('preview_text', '')}\n\nRevision note: {instructions}"
        trace = {"provider": "template", "model": "builtin", "fallback_used": True, "status": "ok"}

    version_number = len(info.get("version_history", [])) + 1
    version_id = f"{draft_id}-v{version_number}"
    summary = f"Revision generated with instructions: {instructions[:80]}"
    info["generated_draft"] = revised_text
    info["preview_text"] = revised_text
    info.setdefault("version_history", []).append({
        "version_id": version_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
        "instructions": instructions,
    })
    info["trace"] = trace
    pdf_path = generate_pdf(revised_text, info.get("document_type", "Legal Draft"), draft_id, "")
    info["file_path"] = pdf_path

    _persist_optional_draft_version({
        "draft_id": draft_id,
        "version_id": version_id,
        "content": revised_text,
        "summary": summary,
        "instructions": instructions,
        "created_at": info["version_history"][-1]["created_at"],
    })

    return {
        "draft_id": draft_id,
        "preview_text": revised_text,
        "generated_draft": revised_text,
        "draft_brief": info.get("draft_brief", ""),
        "clause_notes": info.get("clause_notes", []),
        "open_questions": info.get("open_questions", []),
        "risk_flags": info.get("risk_flags", []),
        "version_history": info.get("version_history", []),
        "download_url": f"/api/download-draft/{draft_id}",
        "document_type": info.get("document_type", "Legal Draft"),
        "created_at": info.get("created_at", datetime.now(timezone.utc).isoformat()),
        "trace": trace,
    }

async def fix_weak_points(draft_text: str, issues: str) -> str:
    """AI or rule-based enhancement to fix weak points in the draft."""
    try:
        prompt = (
            "Revise the following legal draft so it reads like a polished chamber-ready document.\n"
            f"Priority issues to address: {issues}\n\n"
            f"DRAFT:\n{draft_text}\n\n"
            "Requirements:\n"
            "1. Remove ambiguity.\n"
            "2. Tighten obligations, relief, and procedural language.\n"
            "3. Preserve facts while improving enforceability.\n"
            "4. Return only the revised draft text."
        )
        fixed_text = generate_text(prompt, kind="document", temperature=0.1, max_tokens=2200).get("text", "")
        if fixed_text and len(fixed_text) > 50:
            return fixed_text
    except Exception as e:
        logger.error(f"Failed to use LLM to fix draft: {e}")
    
    fixed = draft_text.replace("may", "shall").replace("might", "will")
    fixed += "\n\n[Clause Added for Robustness: This agreement is fully integrated and supersedes all prior representations.]"
    return fixed


async def ai_modify_template(doc_type: str, case_description: str, template_modifications: list[str], tone: str) -> str:
    """Ask AI to modify the base template based on user intent and specific modifications."""
    base_template = load_template(doc_type)
    mods_text = "\n".join(f"- {m}" for m in template_modifications) if template_modifications else "No specific modifications requested."

    prompt = f"""Modify this legal template based on the case context and requested modifications.

Document Type: {doc_type}
Tone: {tone}

Case Description:
{case_description}

Requested Template Modifications:
{mods_text}

Current Template:
{base_template}

Requirements:
1. Apply all requested modifications to the template structure
2. Adjust clauses, add new sections, or remove irrelevant ones based on the case context
3. Keep all {{variable}} placeholders intact (date, ref_no, client_name, opposing_party, case_description)
4. Add new {{variable}} placeholders if needed for the modifications
5. Return ONLY the modified template text

Modified Template:"""

    try:
        result = generate_text(prompt, kind="document", temperature=0.15, max_tokens=2500)
        modified = result.get("text", "")
        if modified and len(modified) > 100:
            # Verify placeholders still exist
            required = ["{date}", "{ref_no}", "{client_name}", "{opposing_party}", "{case_description}"]
            missing = [r for r in required if r not in modified]
            if missing:
                logger.warning(f"Template modification removed placeholders: {missing}, using original")
                return base_template
            return modified
    except Exception as e:
        logger.warning(f"AI template modification failed: {e}")

    return base_template


async def generate_bulk_drafts(
    doc_type: str,
    entries: list[dict],
    case_description: str,
    firm_name: str = "",
    tone: str = "Neutral",
    template_modifications: list[str] = None,
) -> dict:
    """Generate multiple drafts in batch from a list of entry data."""
    batch_id = uuid.uuid4().hex[:12]
    now_iso = datetime.now(timezone.utc).isoformat()
    drafts = []
    total = len(entries)
    successful = 0

    base_template = load_template(doc_type)

    if template_modifications:
        modified_template = await ai_modify_template(doc_type, case_description, template_modifications, tone)
    else:
        modified_template = base_template

    for idx, entry in enumerate(entries):
        try:
            client_name = entry.get("client_name", "")
            opposing_party = entry.get("opposing_party", "")
            extra_vars = entry.get("variables", {})

            draft_id = uuid.uuid4().hex[:12]
            ref_no = uuid.uuid4().hex[:8].upper()

            filled_text = modified_template.format(
                date=datetime.now().strftime("%B %d, %Y"),
                ref_no=ref_no,
                client_name=client_name or "[Client Name]",
                opposing_party=opposing_party or "[Opposing Party]",
                case_description=case_description or "[Case description not provided]",
                **extra_vars,
            )

            prompt = _draft_prompt(doc_type, client_name, opposing_party, case_description, firm_name, tone, filled_text)
            try:
                ai_result = await asyncio.wait_for(
                    asyncio.to_thread(generate_text, prompt, "document", 0.15, 2200),
                    timeout=18,
                )
                neural_text = ai_result.get("text", "")
            except (AIGatewayError, TimeoutError) as exc:
                logger.warning(f"Bulk draft {idx} used fallback: {exc}")
                neural_text = ""

            final_text = neural_text if (neural_text and len(neural_text) > 240) else filled_text
            pdf_path = await asyncio.to_thread(generate_pdf, final_text, doc_type, draft_id, firm_name)

            _generated_drafts[draft_id] = {
                "draft_id": draft_id,
                "document_type": doc_type,
                "file_path": pdf_path,
                "preview_text": final_text,
                "generated_draft": final_text,
                "client_name": client_name,
                "batch_id": batch_id,
                "created_at": now_iso,
            }

            drafts.append({
                "index": idx,
                "client_name": client_name,
                "draft_id": draft_id,
                "preview_text": final_text[:500],
                "download_url": f"/api/download-draft/{draft_id}",
            })
            successful += 1

            try:
                db_id = firm_name if isinstance(firm_name, (int, str)) else None
                supabase.table("draft_history").insert({
                    "user_id": db_id,
                    "doc_type": doc_type,
                    "draft_id": draft_id,
                    "client_name": client_name,
                    "timestamp": now_iso,
                    "batch_id": batch_id,
                }).execute()
            except Exception as e:
                logger.warning(f"Bulk draft history persist failed: {e}")

        except Exception as e:
            logger.error(f"Bulk draft entry {idx} failed: {e}")

    zip_url = await _create_batch_zip(batch_id, drafts)

    return {
        "batch_id": batch_id,
        "total": total,
        "successful": successful,
        "drafts": drafts,
        "zip_download_url": zip_url,
    }


async def _create_batch_zip(batch_id: str, drafts: list[dict]) -> str:
    """Create a ZIP archive of all PDFs in a batch."""
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for d in drafts:
            info = _generated_drafts.get(d["draft_id"])
            if info and os.path.exists(info.get("file_path", "")):
                safe_name = re.sub(r"[^\w\s-]", "", d["client_name"]).strip() or "draft"
                arcname = f"{safe_name}_{d['draft_id'][:8]}.pdf"
                zf.write(info["file_path"], arcname)

    zip_path = os.path.join(GENERATED_DIR, f"batch_{batch_id}.zip")
    with open(zip_path, "wb") as f:
        f.write(buffer.getvalue())

    _batch_archives[batch_id] = zip_path
    return f"/api/download-batch/{batch_id}"


def get_batch_zip_path(batch_id: str) -> str:
    return _batch_archives.get(batch_id, "")
