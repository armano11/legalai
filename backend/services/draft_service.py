import os
import uuid
import logging
from datetime import datetime, timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor, Color
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Image, Table, TableStyle, Frame, PageTemplate
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from config import TEMPLATE_DIR, GENERATED_DIR, LOGO_PATH
from database.db import supabase

logger = logging.getLogger(__name__)

# Store generated PDFs info in memory (replaces MongoDB)
_generated_drafts = {}

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


async def create_draft(db, doc_type: str, client_name: str, opposing_party: str, case_description: str, firm_name: str = "") -> dict:
    """Full draft generation pipeline — no MongoDB needed."""
    draft_id = uuid.uuid4().hex[:12]
    draft_text = fill_template(doc_type, client_name, opposing_party, case_description)
    pdf_path = generate_pdf(draft_text, doc_type, draft_id, firm_name)

    # Store in memory (replaces MongoDB)
    _generated_drafts[draft_id] = {
        "draft_id": draft_id,
        "document_type": doc_type,
        "file_path": pdf_path,
        "preview_text": draft_text[:500],
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    # Persist to Supabase for global analytics
    try:
        user_id = db if isinstance(db, (int, str)) and str(db).isdigit() else None
        supabase.table("draft_history").insert({
            "user_id": user_id,
            "doc_type": doc_type,
            "draft_id": draft_id,
            "client_name": client_name,
            "timestamp": _generated_drafts[draft_id]["created_at"]
        }).execute()
    except Exception as e:
        logger.warning(f"Failed to persist draft history to Supabase: {e}")

    return {
        "draft_id": draft_id,
        "preview_text": draft_text[:500] + "...",
        "download_url": f"/api/download-draft/{draft_id}",
        "document_type": doc_type,
        "created_at": _generated_drafts[draft_id]["created_at"]
    }


def get_draft_file_path(draft_id: str) -> str:
    """Get file path for a generated draft."""
    info = _generated_drafts.get(draft_id)
    if info:
        return info.get("file_path", "")
    # Fallback: look for file directly
    file_path = os.path.join(GENERATED_DIR, f"{draft_id}.pdf")
    return file_path if os.path.exists(file_path) else ""
