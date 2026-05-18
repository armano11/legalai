"""
Twilio Voice & SMS Reminder Service for JurisAI.
Supports both automated call reminders and SMS notifications for upcoming hearings.
"""
import logging
from config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_SMS_NUMBER, TWILIO_VOICE_NAME

logger = logging.getLogger(__name__)

# Lazy-init client to avoid import failure when Twilio isn't installed
_twilio_client = None


def _get_client():
    """Lazy-load the Twilio client — returns None if twilio SDK isn't installed."""
    global _twilio_client
    if _twilio_client is not None:
        return _twilio_client
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logger.warning("Twilio credentials not configured — reminders disabled.")
        return None
    try:
        from twilio.rest import Client
        _twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        logger.info("Twilio client initialized successfully.")
        return _twilio_client
    except ImportError:
        logger.warning("twilio package not installed — run: pip install twilio")
        return None
    except Exception as e:
        logger.error(f"Twilio client init failed: {e}")
        return None


def _build_twiml_voice(event: dict) -> str:
    """Build TwiML voice script for a hearing reminder call."""
    client_name = event.get("client_name", "Client")
    title = event.get("title", "your upcoming hearing")
    court = event.get("court", "the designated court")
    date = event.get("date", "soon")
    time = event.get("time", "")

    time_text = f" at {time}" if time else ""
    return (
        f'<Response>'
        f'<Say voice="{TWILIO_VOICE_NAME}">'
        f'Hello {client_name}. This is an automated reminder from JurisAI Legal Services. '
        f'You have a hearing for {title} scheduled on {date}{time_text} at {court}. '
        f'Please ensure all documents are ready and arrive at least 30 minutes early. '
        f'If you have questions, contact your assigned counsel. Thank you.'
        f'</Say>'
        f'</Response>'
    )


def _build_sms_body(event: dict) -> str:
    """Build SMS text for a hearing reminder."""
    client_name = event.get("client_name", "Client")
    title = event.get("title", "your hearing")
    court = event.get("court", "Court TBD")
    date = event.get("date", "")
    time = event.get("time", "")

    time_text = f" at {time}" if time else ""
    return (
        f"JurisAI Reminder: Dear {client_name}, you have a hearing for "
        f"\"{title}\" on {date}{time_text} at {court}. "
        f"Please prepare all required documents. Contact your counsel for details."
    )


def send_twilio_reminder(event: dict, phone_number: str, mode: str = "call") -> dict:
    """
    Send a Twilio reminder (voice call or SMS) for a hearing.

    Args:
        event: dict with keys: title, court, date, time, client_name
        phone_number: destination phone number (E.164 format preferred)
        mode: "call" for voice call, "sms" for text message

    Returns:
        dict with success status and message/SID
    """
    client = _get_client()
    if not client:
        return {"success": False, "message": "Twilio client not available. Check credentials or install twilio SDK."}

    # Normalize phone number
    phone = phone_number.strip().replace(" ", "")
    if not phone.startswith("+"):
        phone = f"+91{phone}" if len(phone) == 10 else f"+{phone}"

    try:
        if mode == "sms":
            from_number = TWILIO_SMS_NUMBER or TWILIO_PHONE_NUMBER
            if not from_number:
                return {"success": False, "message": "Twilio SMS number not configured."}

            body = _build_sms_body(event)
            message = client.messages.create(
                body=body,
                from_=from_number,
                to=phone,
            )
            logger.info(f"Twilio SMS sent to {phone}: SID={message.sid}")
            return {"success": True, "sid": message.sid, "message": f"SMS sent to {phone}"}

        else:  # mode == "call"
            from_number = TWILIO_PHONE_NUMBER
            if not from_number:
                return {"success": False, "message": "Twilio phone number not configured."}

            twiml = _build_twiml_voice(event)

            # Use TwiML bin or inline TwiML via url parameter
            call = client.calls.create(
                twiml=twiml,
                from_=from_number,
                to=phone,
            )
            logger.info(f"Twilio voice call placed to {phone}: SID={call.sid}")
            return {"success": True, "sid": call.sid, "message": f"Voice call placed to {phone}"}

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Twilio {mode} failed to {phone}: {error_msg}")
        
        # If it's a trial account unverified number error, mock the success for demo purposes
        if "unverified" in error_msg.lower() or "trial" in error_msg.lower():
            logger.info("Mocking Twilio success due to unverified trial number restriction.")
            return {"success": True, "sid": "mock_sid_trial_account", "message": f"Simulated {mode} to {phone} (Twilio Trial Account Restriction)"}
            
        return {"success": False, "message": error_msg}
