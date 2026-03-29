import os
import logging
import resend
from config import RESEND_API_KEY

logger = logging.getLogger(__name__)

# Initialize Resend
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
    EMAIL_ENABLED = True
else:
    EMAIL_ENABLED = False
    logger.warning("RESEND_API_KEY not found. Emails will be simulated.")


def _build_reminder_html(event: dict) -> str:
    """Build a professional HTML email for hearing reminders."""
    title = event.get("title", "Upcoming Hearing")
    date = event.get("date", "")
    time = event.get("time", "")
    court = event.get("court", "")
    case_no = event.get("case_no", "")
    description = event.get("description", "")
    client_name = event.get("client_name", "Client")

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background-color:#030303;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
            <!-- Header -->
            <div style="text-align:center;margin-bottom:32px;">
                <div style="display:inline-block;background:linear-gradient(135deg,#00F0FF,#8E2DE2);-webkit-text-fill-color:transparent;-webkit-background-clip:text;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                    JurisAI
                </div>
                <p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-top:8px;">
                    Legal Intelligence Platform
                </p>
            </div>

            <!-- Main Card -->
            <div style="background:#0A0E17;border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;">
                <!-- Alert Bar -->
                <div style="background:linear-gradient(90deg,#F59E0B20,#EF444420);padding:12px 24px;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span style="color:#F59E0B;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">
                        ⚡ Hearing Reminder
                    </span>
                </div>

                <!-- Content -->
                <div style="padding:32px 24px;">
                    <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">
                        Dear <strong style="color:white;">{client_name}</strong>,
                    </p>
                    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
                        This is a reminder that you have an upcoming court hearing. Please find the details below:
                    </p>

                    <!-- Details Box -->
                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
                        <table style="width:100%;border-collapse:collapse;">
                            <tr>
                                <td style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:8px 0;font-weight:700;">Case</td>
                                <td style="color:white;font-size:14px;padding:8px 0;font-weight:600;text-align:right;">{title}</td>
                            </tr>
                            <tr>
                                <td style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.05);font-weight:700;">Date</td>
                                <td style="color:#00F0FF;font-size:14px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.05);font-weight:700;text-align:right;">{date}</td>
                            </tr>
                            {"<tr><td style='color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.05);font-weight:700;'>Time</td><td style='color:white;font-size:14px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.05);font-weight:600;text-align:right;'>" + time + "</td></tr>" if time else ""}
                            {"<tr><td style='color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.05);font-weight:700;'>Court</td><td style='color:white;font-size:14px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.05);font-weight:600;text-align:right;'>" + court + "</td></tr>" if court else ""}
                            {"<tr><td style='color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.05);font-weight:700;'>Case No.</td><td style='color:white;font-size:14px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.05);font-weight:600;text-align:right;font-family:monospace;'>" + case_no + "</td></tr>" if case_no else ""}
                        </table>
                    </div>

                    {"<div style='background:rgba(0,240,255,0.05);border:1px solid rgba(0,240,255,0.1);border-radius:8px;padding:16px;margin-bottom:24px;'><p style='color:#94a3b8;font-size:13px;margin:0;line-height:1.6;'><strong style=\"color:#00F0FF;\">Notes:</strong> " + description + "</p></div>" if description else ""}

                    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 8px;">
                        Please ensure you carry all relevant documents and arrive at least 30 minutes before the scheduled time.
                    </p>
                    <p style="color:#64748b;font-size:13px;margin:24px 0 0;">
                        Best regards,<br/>
                        <strong style="color:white;">Your Legal Team</strong>
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="text-align:center;margin-top:24px;padding:16px;">
                <p style="color:#334155;font-size:11px;margin:0;">
                    Sent via JurisAI Legal Intelligence Platform<br/>
                    This is an automated reminder. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
    """


def send_hearing_reminder(event: dict, client_email: str) -> dict:
    """Send a hearing reminder email using Resend API (SaaS Level)."""
    if not EMAIL_ENABLED or not RESEND_API_KEY:
        logger.info(f"Resend not configured — simulating send to {client_email}")
        return {
            "success": True,
            "simulated": True,
            "message": f"Demo: Reminder would be sent to {client_email}"
        }

    html_content = _build_reminder_html(event)
    subject = f"📋 JurisAI Hearing Reminder: {event.get('title', 'Upcoming Hearing')} — {event.get('date', '')}"

    try:
        # Note: In production you need a verified domain. 
        # For testing, Resend allows sending to the verified email address or using 'onboarding@resend.dev'
        params: resend.Emails.SendParams = {
            "from": "JurisAI <onboarding@resend.dev>",
            "to": [client_email],
            "subject": subject,
            "html": html_content,
        }

        email_response = resend.Emails.send(params)
        logger.info(f"Resend email sent successfully to {client_email}. ID: {email_response.get('id')}")
        
        return {
            "success": True,
            "simulated": False,
            "message": f"Reminder sent successfully via Resend to {client_email}",
            "id": email_response.get("id")
        }
    except Exception as e:
        logger.error(f"Resend email failed: {e}")
        return {"success": False, "message": f"Failed to send email via Resend: {str(e)}"}

def send_case_reminder(case: dict, recipient_email: str) -> dict:
    """Send a case deadline reminder email using Resend API."""
    if not EMAIL_ENABLED or not RESEND_API_KEY:
        logger.info(f"Resend not configured — simulating case reminder to {recipient_email}")
        return {"success": True, "simulated": True}

    subject = f"⚠️ Action Required: Case Deadline Approaching ({case.get('case_no', 'N/A')})"
    title = case.get("title", "Unknown Case")
    deadline = case.get("deadline", "TBD")
    description = case.get("description", "")

    html_content = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #EF4444;">Case Deadline Reminder</h2>
        <p>This is an automated reminder regarding an approaching deadline.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p><strong>Case:</strong> {title}</p>
            <p><strong>Deadline:</strong> <span style="color: #EF4444; font-weight: bold;">{deadline}</span></p>
            <p><strong>Notes:</strong> {description}</p>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">Sent via JurisAI SaaS Platform</p>
    </div>
    """

    try:
        params: resend.Emails.SendParams = {
            "from": "JurisAI <onboarding@resend.dev>",
            "to": [recipient_email],
            "subject": subject,
            "html": html_content,
        }
        resend.Emails.send(params)
        return {"success": True, "simulated": False}
    except Exception as e:
        logger.error(f"Resend case reminder failed: {e}")
        return {"success": False, "message": str(e)}
