from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import random
import string
from database.db import supabase
from api.routes.auth import get_current_user
from api.routes.notifications import create_notification
from config import TWILIO_SMS_NUMBER
import json
import logging
import hashlib
from datetime import date

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/lawyers", tags=["Lawyers & Cases"])
GENERIC_CASE_ERROR = "Request could not be processed."

# ──────────────────────────────────────────
# MODELS
# ──────────────────────────────────────────

VALID_STAGES = ["Filed", "Investigation", "Hearing", "Arguments", "Judgment", "Closed"]
PROFILE_LOCATIONS = [
    "Mumbai, India",
    "New Delhi, India",
    "Bengaluru, India",
    "Hyderabad, India",
    "Chennai, India",
    "Pune, India",
]
EDUCATION_TRACKS = [
    "National Law School of India University",
    "Faculty of Law, University of Delhi",
    "Government Law College, Mumbai",
    "NALSAR University of Law",
    "Jindal Global Law School",
    "Symbiosis Law School",
]
LANGUAGE_POOL = ["English", "Hindi", "Marathi", "Tamil", "Telugu", "Kannada"]
PRACTICE_AREAS = [
    "Corporate Governance",
    "Commercial Litigation",
    "Regulatory Advisory",
    "Data Privacy",
    "Intellectual Property",
    "Employment Advisory",
    "Dispute Resolution",
    "Infrastructure Projects",
]

class CaseCreation(BaseModel):
    """Full case creation — lawyer assignment is MANDATORY."""
    title: str
    description: Optional[str] = ""
    lawyer_email: str  # mandatory
    lawyer_name: Optional[str] = ""
    client_name: Optional[str] = ""
    client_email: Optional[str] = ""
    case_type: Optional[str] = "Civil"  # Civil, Criminal, Corporate, IP, Family, Tax
    court: Optional[str] = ""
    case_no: Optional[str] = ""
    deadline: Optional[str] = ""
    priority: Optional[str] = "medium"
    client_number: Optional[str] = ""

class HearingAdd(BaseModel):
    date: str    # YYYY-MM-DD
    time: Optional[str] = "10:00"
    court: Optional[str] = ""
    notes: Optional[str] = ""
    hearing_type: Optional[str] = "Regular Hearing"

class NoteAdd(BaseModel):
    content: str
    note_type: Optional[str] = "internal"  # client_call, document, internal, meeting

class StageUpdate(BaseModel):
    new_stage: str  # Must be in VALID_STAGES

class ReassignCase(BaseModel):
    new_lawyer_email: str
    reason: Optional[str] = ""

class DailyUpdateSubmission(BaseModel):
    summary: str
    research_notes: Optional[str] = ""
    hours_logged: Optional[float] = 0
    status: Optional[str] = None

class CaseProgressUpdate(BaseModel):
    status: str
    progress_notes: str

# ──────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────

def _parse_json(raw, default=None):
    if default is None:
        default = []
    if not raw:
        return default
    if isinstance(raw, list):
        return raw
    try:
        return json.loads(raw)
    except:
        return default


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _generate_case_no(prefix: str = "CASE") -> str:
    chars = string.ascii_uppercase + string.digits
    return f"{prefix}-{''.join(random.choices(chars, k=8))}"


def _generate_unique_case_no(prefix: str = "CASE") -> str:
    for _ in range(10):
        candidate = _generate_case_no(prefix=prefix)
        exists = supabase.table("lawyer_cases").select("id").eq("case_no", candidate).limit(1).execute()
        if not exists.data:
            return candidate
    return f"{prefix}-{int(datetime.now().timestamp())}"


def _parse_iso_datetime(value: str):
    if not value:
        return None
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _extract_case_meta(row):
    raw_notes = row.get("notes")
    if not raw_notes:
        return {}
    if isinstance(raw_notes, dict):
        return raw_notes
    try:
        parsed = json.loads(raw_notes)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _store_case_meta(case_row, meta_updates: dict) -> str:
    meta = _extract_case_meta(case_row)
    meta.update(meta_updates)
    return json.dumps(meta)


def _append_activity_entry(existing_activity, action: str, actor: str, details: str):
    log = list(existing_activity or [])
    log.append({
        "id": len(log) + 1,
        "action": action,
        "actor": actor,
        "details": details,
        "timestamp": _utcnow_iso()
    })
    return log

def _add_activity(case_row, action: str, actor: str, details: str = ""):
    """Append to the activity_log JSON array in the case."""
    log = _append_activity_entry(_parse_json(case_row.get("activity_log")), action, actor, details)
    return json.dumps(log)


def _has_activity_for_hearing(activity_log, hearing_id, action):
    marker = f"hearing #{hearing_id}"
    for entry in activity_log or []:
        if entry.get("action") == action and marker in entry.get("details", ""):
            return True
    return False


def _has_auto_call_for_hearing(activity_log, hearing_id):
    return _has_activity_for_hearing(activity_log, hearing_id, "auto_voice_reminder_sent")


def _has_auto_sms_for_hearing(activity_log, hearing_id):
    return _has_activity_for_hearing(activity_log, hearing_id, "auto_sms_reminder_sent")

def _compute_urgency(case_row):
    """Smart prioritization: auto-flag urgent/inactive."""
    flags = []
    now = datetime.now(timezone.utc)
    meta = _extract_case_meta(case_row)
    
    # Check hearings within 2 days
    hearings = _parse_json(case_row.get("hearings"), meta.get("hearings", []))
    for h in hearings:
        try:
            h_date = _parse_iso_datetime(h.get("date", ""))
            if h_date is None:
                continue
            days_until = (h_date - now).days
            if 0 <= days_until <= 2:
                flags.append("hearing_imminent")
            if days_until == 0:
                flags.append("hearing_today")
        except:
            pass
    
    # Check deadline
    deadline = case_row.get("deadline") or meta.get("deadline")
    if deadline:
        try:
            d_date = _parse_iso_datetime(deadline)
            if d_date is not None:
                days_until = (d_date - now).days
                if days_until < 0 and case_row.get("stage") != "Closed":
                    flags.append("overdue")
                elif 0 <= days_until <= 2:
                    flags.append("deadline_imminent")
        except:
            pass
    
    # Check staleness (no updates in 7 days)
    updated = case_row.get("updated_at")
    if updated:
        try:
            last_update = _parse_iso_datetime(updated)
            if last_update is not None and (now - last_update).days >= 7 and case_row.get("stage") != "Closed":
                flags.append("inactive_warning")
        except:
            pass
    
    return flags

def _enrich_case(row):
    """Efficiently parse JSON and compute flags for a case row."""
    meta = _extract_case_meta(row)
    # Pre-parse common fields
    updates = _parse_json(row.get("daily_updates"), meta.get("daily_updates", []))
    hearings = _parse_json(row.get("hearings"), meta.get("hearings", []))
    notes = _parse_json(row.get("notes_log"), meta.get("notes_log", []))
    activity = _parse_json(row.get("activity_log"), meta.get("activity_log", []))
    
    # Compute flags once
    flags = _compute_urgency(row)
    
    return {
        **row,
        "case_no": row.get("case_no") or meta.get("case_no", ""),
        "deadline": row.get("deadline") or meta.get("deadline", ""),
        "priority": row.get("priority") or meta.get("priority", "medium"),
        "client_name": row.get("client_name") or meta.get("client_name", ""),
        "client_email": row.get("client_email") or meta.get("client_email", ""),
        "client_number": row.get("client_number") or meta.get("client_number", ""),
        "case_type": row.get("case_type") or meta.get("case_type", ""),
        "court": row.get("court") or meta.get("court", ""),
        "daily_updates": updates,
        "hearings": hearings,
        "notes_log": notes,
        "activity_log": activity,
        "urgency_flags": flags,
        "lawyer_name": row.get("lawyer_name") or row.get("lawyer_email", "Unassigned"),
        "stage": row.get("stage") or meta.get("stage") or row.get("status", "Filed")
    }


def _stage_progress(stage: str) -> int:
    return {
        "Filed": 15,
        "Investigation": 35,
        "Hearing": 55,
        "Arguments": 75,
        "Judgment": 90,
        "Closed": 100,
    }.get(stage or "Filed", 15)


def _seed_value(seed: str, modulo: int) -> int:
    if modulo <= 0:
        return 0
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % modulo


def _seeded_pick(seed: str, options: list, count: int = 1):
    if not options:
        return [] if count != 1 else None
    picks = []
    start = _seed_value(seed, len(options))
    for offset in range(count):
        picks.append(options[(start + offset) % len(options)])
    return picks if count != 1 else picks[0]


def _build_phone(seed: str) -> str:
    digits = str(_seed_value(seed, 9000000000) + 1000000000)
    return f"+91 {digits[:5]} {digits[5:]}"


def run_auto_hearing_call_reminders():
    """Background worker: auto-call clients for hearings due within two days."""
    try:
        res = supabase.table("lawyer_cases").select("*").execute()
    except Exception as e:
        logger.error(f"Auto-call scan failed to fetch cases: {e}")
        return

    today = date.today()

    for case in (res.data or []):
        enriched = _enrich_case(case)
        client_phone = enriched.get("client_number") or ""
        hearings = enriched.get("hearings", [])
        activity_log = enriched.get("activity_log", [])

        if not client_phone or not hearings:
            continue

        for hearing in hearings:
            hearing_id = hearing.get("id")
            hearing_date = hearing.get("date")
            if not hearing_id or not hearing_date:
                continue

            try:
                scheduled_for = datetime.fromisoformat(hearing_date).date()
            except Exception:
                continue

            days_until = (scheduled_for - today).days
            if days_until != 2:
                continue

            if _has_auto_call_for_hearing(activity_log, hearing_id):
                continue

            event_payload = {
                "title": enriched.get("title") or hearing.get("hearing_type") or "upcoming hearing",
                "court": hearing.get("court") or enriched.get("court") or "",
                "date": hearing.get("date") or "",
                "time": hearing.get("time") or "",
                "client_name": enriched.get("client_name") or "Client",
            }

            try:
                from services.twilio_service import send_twilio_reminder

                if TWILIO_SMS_NUMBER and not _has_auto_sms_for_hearing(activity_log, hearing_id):
                    sms_result = send_twilio_reminder(event_payload, client_phone, mode="sms")
                    if sms_result.get("success"):
                        activity_log = _append_activity_entry(
                            activity_log,
                            "auto_sms_reminder_sent",
                            "JurisAI Scheduler",
                            f"Automatic Twilio SMS reminder sent for hearing #{hearing_id} to {client_phone}",
                        )
                    else:
                        logger.warning(
                            f"Auto SMS reminder failed for case {case.get('id')} hearing {hearing_id}: {sms_result.get('message')}"
                        )

                result = send_twilio_reminder(event_payload, client_phone, mode="call")
                if not result.get("success"):
                    logger.warning(
                        f"Auto voice reminder failed for case {case.get('id')} hearing {hearing_id}: {result.get('message')}"
                    )
                    continue

                activity_log = _append_activity_entry(
                    activity_log,
                    "auto_voice_reminder_sent",
                    "JurisAI Scheduler",
                    f"Automatic Twilio voice reminder sent for hearing #{hearing_id} to {client_phone}",
                )
                supabase.table("lawyer_cases").update({
                    "notes": _store_case_meta(case, {"activity_log": activity_log}),
                    "updated_at": _utcnow_iso()
                }).eq("id", case.get("id")).execute()
            except Exception as e:
                logger.error(f"Auto voice reminder exception for case {case.get('id')} hearing {hearing_id}: {e}")


def _summarize_lawyer(row, lawyer_cases):
    today = datetime.now().date()
    email = row.get("email", "")
    case_summaries = []
    upcoming_hearings = 0
    overdue_cases = 0
    total_progress = 0

    for case in lawyer_cases:
        enriched = _enrich_case(case)
        stage = enriched.get("stage", "Filed")
        progress = _stage_progress(stage)
        total_progress += progress

        next_hearing = None
        for hearing in enriched.get("hearings", []):
            hearing_date = hearing.get("date")
            if not hearing_date:
                continue
            try:
                parsed = datetime.fromisoformat(hearing_date).date()
                if parsed >= today:
                    upcoming_hearings += 1
                    if next_hearing is None or hearing_date < next_hearing:
                        next_hearing = hearing_date
            except Exception:
                continue

        deadline = enriched.get("deadline")
        if deadline:
            try:
                if datetime.fromisoformat(deadline).date() < today and stage != "Closed":
                    overdue_cases += 1
            except Exception:
                pass

        updates = enriched.get("daily_updates", [])
        last_update = updates[-1] if updates else None
        case_summaries.append({
            "id": enriched.get("id"),
            "title": enriched.get("title"),
            "case_no": enriched.get("case_no"),
            "stage": stage,
            "progress": progress,
            "priority": enriched.get("priority", "medium"),
            "deadline": deadline,
            "court": enriched.get("court", ""),
            "client_name": enriched.get("client_name", ""),
            "case_type": enriched.get("case_type", ""),
            "next_hearing": next_hearing,
            "last_update": last_update.get("summary") if last_update else "",
            "updated_at": enriched.get("updated_at"),
        })

    case_summaries.sort(key=lambda item: (item.get("deadline") or "9999-12-31", -item.get("progress", 0)))
    average_progress = round(total_progress / len(lawyer_cases)) if lawyer_cases else 0
    seed = f"{row.get('id', '')}:{email}"
    practice_areas = list(dict.fromkeys([c.get("case_type") for c in case_summaries if c.get("case_type")]))[:3]
    if len(practice_areas) < 3:
        for area in _seeded_pick(seed + ":practice", PRACTICE_AREAS, 3):
            if area not in practice_areas:
                practice_areas.append(area)
            if len(practice_areas) == 3:
                break

    role = row.get("role", "Attorney")
    designation = "Attorney" if role == "user" else role
    return {
        "id": row.get("id"),
        "name": row.get("name"),
        "designation": designation,
        "src": row.get("profile_picture") or f"https://ui-avatars.com/api/?name={(row.get('name') or 'Attorney').replace(' ', '+')}",
        "quote": row.get("bio") or "Dedicated legal professional.",
        "bio": row.get("bio") or "Dedicated legal professional.",
        "email": email,
        "phone": _build_phone(seed),
        "location": _seeded_pick(seed + ":location", PROFILE_LOCATIONS),
        "education": _seeded_pick(seed + ":education", EDUCATION_TRACKS),
        "languages": _seeded_pick(seed + ":languages", LANGUAGE_POOL, 3),
        "practice_areas": practice_areas,
        "experience_years": 4 + _seed_value(seed + ":experience", 15),
        "bar_registration": f"BAR-{100000 + _seed_value(seed + ':bar', 899999)}",
        "registered_at": row.get("registered_at"),
        "active_cases": len([c for c in case_summaries if c.get("stage") != "Closed"]),
        "upcoming_hearings": upcoming_hearings,
        "overdue_cases": overdue_cases,
        "average_progress": average_progress,
        "availability": "At capacity" if len(case_summaries) >= 6 else "Available",
        "overloaded": len(case_summaries) >= 6,
        "current_cases": case_summaries[:8],
        "progress_summary": {
            "active": len([c for c in case_summaries if c.get("stage") != "Closed"]),
            "closed": len([c for c in case_summaries if c.get("stage") == "Closed"]),
            "hearings": upcoming_hearings,
            "average_progress": average_progress,
        },
    }

# ──────────────────────────────────────────
# CASE CREATION (Mandatory lawyer assignment)
# ──────────────────────────────────────────

@router.post("/cases")
async def create_case(data: CaseCreation, user: dict = Depends(get_current_user)):
    """Create a new case. Lawyer assignment is MANDATORY."""
    logger.info(f"CREATE CASE ATTEMPT: User email={user.get('email')} role={user.get('role')}")
    if not data.lawyer_email:
        raise HTTPException(status_code=400, detail="Lawyer assignment is mandatory. Cannot create unassigned cases.")
    
    try:
        now = _utcnow_iso()
        case_no = (data.case_no or "").strip().upper() or _generate_unique_case_no("CASE")
        
        initial_activity = json.dumps([{
            "id": 1,
            "action": "case_created",
            "actor": user.get("name", "Admin"),
            "details": f"Case '{data.title}' created and assigned to {data.lawyer_name or data.lawyer_email}",
            "timestamp": now
        }])
        
        case_meta = {
            "case_no": case_no,
            "deadline": data.deadline or "",
            "priority": data.priority or "medium",
            "stage": "Filed",
            "daily_updates": [],
            "hearings": [],
            "notes_log": [],
            "activity_log": json.loads(initial_activity),
            "client_name": data.client_name or "",
            "client_email": data.client_email or "",
            "client_number": data.client_number or "",
            "case_type": data.case_type or "Civil",
            "court": data.court or "",
        }

        insert_data = {
            "assigned_by_id": str(user.get("id", "0")),
            "lawyer_email": data.lawyer_email,
            "title": data.title,
            "description": data.description,
            "case_no": case_no,
            "status": "Filed",
            "stage": "Filed",
            "priority": data.priority or "medium",
            "deadline": data.deadline or "",
            "client_name": data.client_name or "",
            "client_email": data.client_email or "",
            "client_number": data.client_number or "",
            "case_type": data.case_type or "Civil",
            "court": data.court or "",
            "daily_updates": json.dumps([]),
            "hearings": json.dumps([]),
            "notes_log": json.dumps([]),
            "activity_log": initial_activity,
            "notes": json.dumps(case_meta),
            "assigned_at": now,
            "updated_at": now,
            "firm_id": user.get("firm_id", "")
        }

        res = supabase.table("lawyer_cases").insert(insert_data).execute()
        if not (res.data or []):
            logger.warning(
                "Primary case insert returned no row. status=%s error=%s; retrying with legacy payload.",
                getattr(res, "status_code", None),
                getattr(res, "error", None),
            )
            legacy_insert_data = {
                "assigned_by_id": str(user.get("id", "0")),
                "lawyer_email": data.lawyer_email,
                "title": data.title,
                "description": data.description,
                "status": "Filed",
                "notes": json.dumps(case_meta),
                "assigned_at": now,
                "updated_at": now,
                "firm_id": user.get("firm_id", ""),
            }
            res = supabase.table("lawyer_cases").insert(legacy_insert_data).execute()

        created_row = (res.data or [None])[0]
        if not created_row:
            # Some Supabase setups return minimal payloads for inserts.
            # Fallback to a lookup using the generated case number.
            lookup = (
                supabase.table("lawyer_cases")
                .select("id, case_no, lawyer_email")
                .eq("title", data.title)
                .eq("lawyer_email", data.lawyer_email)
                .order("assigned_at", desc=True)
                .limit(1)
                .execute()
            )
            created_row = (lookup.data or [None])[0]
            if not created_row:
                secondary_lookup = (
                    supabase.table("lawyer_cases")
                    .select("id, case_no, lawyer_email")
                    .eq("title", data.title)
                    .eq("firm_id", user.get("firm_id", ""))
                    .order("assigned_at", desc=True)
                    .limit(1)
                    .execute()
                )
                created_row = (secondary_lookup.data or [None])[0]
                if not created_row:
                    logger.error("Case inserted but could not resolve created row for case_no=%s", case_no)
                    raise HTTPException(status_code=500, detail="Failed to create case")
        
        # 🔔 Notify the assigned lawyer
        create_notification(
            user_email=data.lawyer_email,
            title="New Case Assigned",
            message=f"You've been assigned '{data.title}' (Case #{case_no}) by {user.get('name', 'Admin')}. Priority: {data.priority}.",
            notification_type="case_assigned",
            reference_id=str(created_row["id"])
        )
        
        return {
            "message": "Case created and assigned successfully",
            "case_id": created_row["id"],
            "case_no": case_no,
            "stage": "Filed",
            "assigned_to": data.lawyer_email
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Case creation error: {e}")
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

# ──────────────────────────────────────────
# HEARINGS (The heart of the system)
# ──────────────────────────────────────────

@router.post("/cases/{case_id}/hearings")
async def add_hearing(case_id: int, data: HearingAdd, user: dict = Depends(get_current_user)):
    """Add a hearing to a case. Auto-creates activity log + timeline entry."""
    try:
        res = supabase.table("lawyer_cases").select("*").eq("id", case_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Case not found")
        
        case = res.data[0]
        meta = _extract_case_meta(case)
        hearings = _parse_json(case.get("hearings"), meta.get("hearings", []))
        
        new_hearing = {
            "id": len(hearings) + 1,
            "date": data.date,
            "time": data.time or "10:00",
            "court": data.court or case.get("court", ""),
            "notes": data.notes or "",
            "hearing_type": data.hearing_type or "Regular Hearing",
            "status": "upcoming",
            "created_by": user.get("name", "Unknown"),
            "created_at": _utcnow_iso()
        }
        hearings.append(new_hearing)
        
        activity = _parse_json(case.get("activity_log"), meta.get("activity_log", []))
        activity.append({
            "id": len(activity) + 1,
            "action": "hearing_added",
            "actor": user.get("name", "Unknown"),
            "details": f"Hearing scheduled for {data.date} at {data.court or 'TBD'}",
            "timestamp": _utcnow_iso()
        })

        supabase.table("lawyer_cases").update({
            "notes": _store_case_meta(case, {
                "hearings": hearings,
                "activity_log": activity,
                "court": data.court or meta.get("court") or case.get("court", ""),
            }),
            "updated_at": _utcnow_iso()
        }).eq("id", case_id).execute()
        
        # 🔔 Notify the assigned lawyer of the new hearing
        create_notification(
            user_email=case.get("lawyer_email"),
            title="New Hearing Scheduled",
            message=f"A {data.hearing_type} has been scheduled for '{case.get('title')}' on {data.date} at {data.court or 'TBD'}.",
            notification_type="hearing_reminder",
            reference_id=str(case_id)
        )
        
        return {"message": "Hearing added successfully", "hearing": new_hearing}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add hearing error: {e}")
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

@router.get("/cases/{case_id}/hearings")
async def get_hearings(case_id: int, user: dict = Depends(get_current_user)):
    """Get all hearings for a case."""
    try:
        res = supabase.table("lawyer_cases").select("*").eq("id", case_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Case not found")
        case = res.data[0]
        meta = _extract_case_meta(case)
        hearings = _parse_json(case.get("hearings"), meta.get("hearings", []))
        return {"case_id": case_id, "hearings": hearings, "total": len(hearings)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)


@router.post("/cases/{case_id}/hearings/{hearing_id}/remind-client-twilio")
async def remind_client_twilio_for_hearing(case_id: int, hearing_id: int, user: dict = Depends(get_current_user)):
    """Place a Twilio voice reminder call for a case hearing using the stored client number."""
    try:
        query = supabase.table("lawyer_cases").select("*").eq("id", case_id)
        if user.get("role") == "admin":
            firm_id = user.get("firm_id")
            if firm_id:
                query = query.eq("firm_id", firm_id)
        else:
            query = query.eq("lawyer_email", user.get("email"))

        res = query.execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Case not found")

        case = res.data[0]
        meta = _extract_case_meta(case)
        hearings = _parse_json(case.get("hearings"), meta.get("hearings", []))
        hearing = next((item for item in hearings if str(item.get("id")) == str(hearing_id)), None)
        if not hearing:
            raise HTTPException(status_code=404, detail="Hearing not found")

        client_phone = case.get("client_number") or meta.get("client_number") or case.get("client_phone") or ""
        if not client_phone:
            raise HTTPException(status_code=400, detail="Client phone number is missing for this case.")

        event_payload = {
            "title": case.get("title") or hearing.get("hearing_type") or "upcoming hearing",
            "court": hearing.get("court") or case.get("court") or meta.get("court") or "",
            "date": hearing.get("date") or "",
            "time": hearing.get("time") or "",
            "client_name": case.get("client_name") or meta.get("client_name") or "Client",
        }

        from services.twilio_service import send_twilio_reminder

        result = send_twilio_reminder(event_payload, client_phone, mode="call")
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message", "Failed to place Twilio call"))

        activity_log = _parse_json(case.get("activity_log"), meta.get("activity_log", []))
        activity_log.append({
            "id": len(activity_log) + 1,
            "action": "reminder_sent",
            "actor": user.get("name", "Unknown"),
            "details": f"Voice reminder call placed to {client_phone} for hearing #{hearing_id}",
            "timestamp": _utcnow_iso()
        })
        supabase.table("lawyer_cases").update({
            "activity_log": json.dumps(activity_log),
            "notes": _store_case_meta(case, {"activity_log": activity_log}),
            "updated_at": _utcnow_iso()
        }).eq("id", case_id).execute()

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Twilio hearing reminder error: {e}")
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

# ──────────────────────────────────────────
# NOTES (Client calls, documents, internal)
# ──────────────────────────────────────────

@router.post("/cases/{case_id}/notes")
async def add_note(case_id: int, data: NoteAdd, user: dict = Depends(get_current_user)):
    """Add a note to a case. Types: client_call, document, internal, meeting."""
    try:
        res = supabase.table("lawyer_cases").select("*").eq("id", case_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Case not found")
        
        case = res.data[0]
        meta = _extract_case_meta(case)
        notes = _parse_json(case.get("notes_log"), meta.get("notes_log", []))
        
        new_note = {
            "id": len(notes) + 1,
            "content": data.content,
            "note_type": data.note_type,
            "author": user.get("name", "Unknown"),
            "author_email": user.get("email", ""),
            "created_at": _utcnow_iso()
        }
        notes.append(new_note)
        
        type_labels = {"client_call": "Client call logged", "document": "Document attached", 
                       "internal": "Internal note added", "meeting": "Meeting note added"}
        activity_log = _add_activity(case, "note_added", user.get("name", "Unknown"),
            type_labels.get(data.note_type, "Note added"))
        
        supabase.table("lawyer_cases").update({
            "notes": _store_case_meta(case, {"notes_log": notes, "activity_log": _parse_json(activity_log)}),
            "updated_at": _utcnow_iso()
        }).eq("id", case_id).execute()
        
        return {"message": "Note added successfully", "note": new_note}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add note error: {e}")
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

# ──────────────────────────────────────────
# STAGE CHANGES (Filed → Investigation → … → Closed)
# ──────────────────────────────────────────

@router.put("/cases/{case_id}/stage")
async def update_stage(case_id: int, data: StageUpdate, user: dict = Depends(get_current_user)):
    """Change case stage. Every transition is logged with who/when."""
    if data.new_stage not in VALID_STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Must be one of: {VALID_STAGES}")
    
    try:
        res = supabase.table("lawyer_cases").select("*").eq("id", case_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Case not found")
        
        case = res.data[0]
        old_stage = case.get("stage") or case.get("status", "Filed")
        
        activity_log = _add_activity(case, "stage_changed", user.get("name", "Unknown"),
            f"Stage changed from '{old_stage}' to '{data.new_stage}'")
        
        supabase.table("lawyer_cases").update({
            "status": data.new_stage,
            "notes": _store_case_meta(case, {"activity_log": _parse_json(activity_log), "stage": data.new_stage}),
            "updated_at": _utcnow_iso()
        }).eq("id", case_id).execute()
        
        # 🔔 Notify relevant parties of the stage change
        # If a lawyer changes it, maybe notify admin (or just keep it in activity)
        # For now, notify the assigned lawyer if someone else (admin) changed it
        if user.get("email") != case.get("lawyer_email"):
            create_notification(
                user_email=case.get("lawyer_email"),
                title="Case Stage Updated",
                message=f"The stage for '{case.get('title')}' has been updated to {data.new_stage} by {user.get('name', 'Admin')}.",
                notification_type="status_update",
                reference_id=str(case_id)
            )
        
        return {"message": f"Stage updated to {data.new_stage}", "old_stage": old_stage, "new_stage": data.new_stage}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stage update error: {e}")
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

# ──────────────────────────────────────────
# REASSIGNMENT
# ──────────────────────────────────────────

@router.put("/cases/{case_id}/reassign")
async def reassign_case(case_id: int, data: ReassignCase, user: dict = Depends(get_current_user)):
    """Reassign a case to a different lawyer. Both lawyers are notified via activity log."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can reassign cases")
    
    try:
        res = supabase.table("lawyer_cases").select("*").eq("id", case_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Case not found")
        
        case = res.data[0]
        old_lawyer = case.get("lawyer_email", "unknown")
        
        # Get new lawyer name
        new_lawyer_name = data.new_lawyer_email
        try:
            user_res = supabase.table("users").select("name").eq("email", data.new_lawyer_email).execute()
            if user_res.data:
                new_lawyer_name = user_res.data[0]["name"]
        except:
            pass
        
        reason_text = f" Reason: {data.reason}" if data.reason else ""
        activity_log = _add_activity(case, "case_reassigned", user.get("name", "Admin"),
            f"Reassigned from {old_lawyer} to {new_lawyer_name}.{reason_text}")
        
        supabase.table("lawyer_cases").update({
            "lawyer_email": data.new_lawyer_email,
            "notes": _store_case_meta(case, {"activity_log": _parse_json(activity_log)}),
            "updated_at": _utcnow_iso()
        }).eq("id", case_id).execute()
        
        # 🔔 Notify the NEW lawyer of the reassignment
        create_notification(
            user_email=data.new_lawyer_email,
            title="Case Reassigned to You",
            message=f"Case '{case.get('title')}' has been reassigned to you from {old_lawyer}.{reason_text}",
            notification_type="case_assigned",
            reference_id=str(case_id)
        )
        
        # 🔔 Notify the OLD lawyer they've been removed (optional but good)
        if old_lawyer and old_lawyer != "unknown":
            create_notification(
                user_email=old_lawyer,
                title="Case Reassigned",
                message=f"Case '{case.get('title')}' has been reassigned to {new_lawyer_name}. You are no longer managing this case.",
                notification_type="status_update",
                reference_id=str(case_id)
            )

        return {
            "message": f"Case reassigned to {new_lawyer_name}",
            "old_lawyer": old_lawyer,
            "new_lawyer": data.new_lawyer_email
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reassignment error: {e}")
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

# ──────────────────────────────────────────
# ACTIVITY LOG
# ──────────────────────────────────────────

@router.get("/cases/{case_id}/activity")
async def get_activity_log(case_id: int, user: dict = Depends(get_current_user)):
    """Get full activity log for a case."""
    try:
        res = supabase.table("lawyer_cases").select("*").eq("id", case_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Case not found")

        case = res.data[0]
        meta = _extract_case_meta(case)
        activity = _parse_json(meta.get("activity_log", []))
        return {
            "case_id": case_id,
            "title": case.get("title"),
            "stage": meta.get("stage") or case.get("status"),
            "activity": activity,
            "total": len(activity)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

# ──────────────────────────────────────────
# TODAY DASHBOARD (What the lawyer needs NOW)
# ──────────────────────────────────────────

@router.get("/dashboard/today")
async def get_today_dashboard(user: dict = Depends(get_current_user)):
    """Returns lawyer's actionable today view: hearings today, urgent, recent."""
    is_admin = user.get("role") == "admin"
    user_email = user.get("email")
    firm_id = user.get("firm_id")
    
    try:
        if is_admin:
            res = supabase.table("lawyer_cases").select("*").eq("firm_id", firm_id).neq("stage", "Closed").order("updated_at", desc=True).execute()
        else:
            res = supabase.table("lawyer_cases").select("*").eq("lawyer_email", user_email).neq("stage", "Closed").order("updated_at", desc=True).execute()
        
        all_cases = [_enrich_case(row) for row in res.data]
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Hearings today
        hearings_today = []
        upcoming_hearings = []
        for c in all_cases:
            for h in c.get("hearings", []):
                h_date = h.get("date", "")
                if h_date == today:
                    hearings_today.append({**h, "case_title": c["title"], "case_id": c["id"], "case_no": c.get("case_no")})
                elif h_date > today:
                    upcoming_hearings.append({**h, "case_title": c["title"], "case_id": c["id"], "case_no": c.get("case_no")})
        
        # Sort upcoming by date
        upcoming_hearings.sort(key=lambda x: x.get("date", "9999"))
        
        # Urgent cases (hearing within 2 days or deadline imminent)
        urgent = [c for c in all_cases if any(f in c.get("urgency_flags", []) for f in ["hearing_imminent", "hearing_today", "deadline_imminent", "overdue"])]
        
        # Stale cases (no updates in 7 days)
        stale = [c for c in all_cases if "inactive_warning" in c.get("urgency_flags", [])]
        
        # My cases sorted by urgency score
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        sorted_cases = sorted(all_cases, key=lambda c: (
            priority_order.get(c.get("priority", "medium"), 2),
            0 if c.get("urgency_flags") else 1,
            c.get("updated_at", "")
        ))
        
        return {
            "hearings_today": hearings_today,
            "upcoming_hearings": upcoming_hearings[:5],
            "urgent_cases": [{"id": c["id"], "title": c["title"], "case_no": c.get("case_no"), "priority": c.get("priority"), "stage": c.get("stage"), "flags": c.get("urgency_flags"), "lawyer_name": c.get("lawyer_name")} for c in urgent],
            "stale_cases": [{"id": c["id"], "title": c["title"], "case_no": c.get("case_no"), "days_since_update": c.get("urgency_flags")} for c in stale],
            "my_cases": sorted_cases,
            "stats": {
                "total_active": len(all_cases),
                "hearings_today": len(hearings_today),
                "urgent": len(urgent),
                "stale": len(stale)
            }
        }
    except Exception as e:
        logger.error(f"Today dashboard error: {e}")
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

# ──────────────────────────────────────────
# EXISTING ENDPOINTS (kept for compatibility)
# ──────────────────────────────────────────

@router.get("/directory")
async def get_lawyer_directory(user: dict = Depends(get_current_user)):
    """Retrieve all firm lawyers with enriched profile and workload data."""
    firm_id = user.get("firm_id")
    if not firm_id:
        return {"lawyers": [], "admin": None}
    
    try:
        users_res = supabase.table("users").select(
            "id, name, role, email, profile_picture, bio, registered_at, firm_id, firm_name"
        ).eq("firm_id", firm_id).execute()
        if not users_res.data:
            return {"lawyers": [], "admin": None}

        cases_res = supabase.table("lawyer_cases").select("*").eq("firm_id", firm_id).execute()

        cases_by_lawyer = {}
        for c in (cases_res.data or []):
            email = c.get("lawyer_email")
            if email not in cases_by_lawyer:
                cases_by_lawyer[email] = []
            cases_by_lawyer[email].append(c)

        lawyers = []
        admin_profile = None

        for row in users_res.data:
            if row.get("role") == "admin":
                admin_profile = {
                    "id": row.get("id"),
                    "name": row.get("name"),
                    "email": row.get("email"),
                    "firm_id": row.get("firm_id"),
                    "firm_name": row.get("firm_name"),
                    "bio": row.get("bio") or "Firm administrator",
                    "src": row.get("profile_picture") or f"https://ui-avatars.com/api/?name={(row.get('name') or 'Admin').replace(' ', '+')}",
                }

            lawyers.append(_summarize_lawyer(row, cases_by_lawyer.get(row.get("email"), [])))

        lawyers.sort(key=lambda l: (l["active_cases"], l["upcoming_hearings"], l["name"]))
        return {
            "admin": admin_profile,
            "lawyers": lawyers,
            "team_size": len(lawyers),
        }
    except Exception as e:
        logger.error(f"Directory Error: {str(e)}")
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

@router.get("/cases")
async def get_lawyer_cases(user: dict = Depends(get_current_user)):
    """Retrieve all cases (enriched with computed fields)."""
    is_admin = user.get("role") == "admin"
    user_email = user.get("email")
    firm_id = user.get("firm_id")

    try:
        if is_admin:
            res = supabase.table("lawyer_cases").select("*").eq("firm_id", firm_id).order("assigned_at", desc=True).execute()
        else:
            res = supabase.table("lawyer_cases").select("*").eq("lawyer_email", user_email).order("assigned_at", desc=True).execute()
        
        cases = [_enrich_case(row) for row in (res.data or [])]
        return {"cases": cases}
    except Exception as e:
        logger.error(f"Error fetching cases: {e}")
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

@router.put("/cases/{case_id}")
async def update_case_progress(case_id: int, data: CaseProgressUpdate, user: dict = Depends(get_current_user)):
    """Update case status/progress + activity log."""
    try:
        now = _utcnow_iso()
        res = supabase.table("lawyer_cases").select("*").eq("id", case_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Case not found")
        
        case = res.data[0]
        activity_log = _add_activity(case, "status_updated", user.get("name", "Unknown"),
            f"Status: {data.status}. Notes: {data.progress_notes}")
        meta = _extract_case_meta(case)
        
        supabase.table("lawyer_cases").update({
            "status": data.status,
            "notes": _store_case_meta(case, {
                **meta,
                "last_progress_note": data.progress_notes,
                "activity_log": _parse_json(activity_log),
                "stage": data.status,
            }),
            "updated_at": now
        }).eq("id", case_id).execute()
        
        return {"message": "Case progress updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

@router.put("/cases/{case_id}/daily-update")
async def submit_daily_update(case_id: int, data: DailyUpdateSubmission, user: dict = Depends(get_current_user)):
    """Lawyer submits a daily work log + activity log entry."""
    try:
        res = supabase.table("lawyer_cases").select("*").eq("id", case_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Case not found")
        
        case = res.data[0]
        meta = _extract_case_meta(case)
        existing_updates = _parse_json(case.get("daily_updates"), meta.get("daily_updates", []))
        
        now = _utcnow_iso()
        new_update = {
            "id": len(existing_updates) + 1,
            "date": now,
            "author": user.get("name", "Unknown"),
            "author_email": user.get("email", ""),
            "summary": data.summary,
            "research_notes": data.research_notes or "",
            "hours_logged": data.hours_logged or 0
        }
        existing_updates.append(new_update)
        
        activity_log = _add_activity(case, "daily_update", user.get("name", "Unknown"),
            f"Daily update: {data.summary[:80]}...")
        
        update_data = {
            "notes": _store_case_meta(case, {
                "daily_updates": existing_updates,
                "activity_log": _parse_json(activity_log),
                **({"stage": data.status} if data.status else {}),
            }),
            "updated_at": now
        }
        if data.status:
            update_data["status"] = data.status
        
        supabase.table("lawyer_cases").update(update_data).eq("id", case_id).execute()
        return {"message": "Daily update submitted", "update": new_update}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Daily update error: {e}")
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

@router.get("/cases/{case_id}/updates")
async def get_case_updates(case_id: int, user: dict = Depends(get_current_user)):
    try:
        res = supabase.table("lawyer_cases").select("*").eq("id", case_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Case not found")
        case = res.data[0]
        meta = _extract_case_meta(case)
        updates = _parse_json(meta.get("daily_updates", []))
        return {"case_id": case_id, "title": case.get("title"), "stage": meta.get("stage") or case.get("status"), "updates": updates, "total": len(updates)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

@router.post("/cases/{case_id}/remind")
async def remind_lawyer_case(case_id: int, user: dict = Depends(get_current_user)):
    """Trigger a reminder to the assigned lawyer."""
    try:
        res = supabase.table("lawyer_cases").select("*").eq("id", case_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Case not found")
        case = res.data[0]
        lawyer_email = case.get("lawyer_email")
        if not lawyer_email:
            raise HTTPException(status_code=400, detail="No lawyer assigned")
        
        # Log the reminder in activity
        activity_log = _add_activity(case, "reminder_sent", user.get("name", "Admin"),
            f"Deadline reminder sent to {lawyer_email}")
        supabase.table("lawyer_cases").update({
            "notes": _store_case_meta(case, {"activity_log": _parse_json(activity_log)}),
            "updated_at": _utcnow_iso()
        }).eq("id", case_id).execute()
        
        try:
            from services.email_service import send_case_reminder
            result = send_case_reminder(case, lawyer_email)
            return {"message": f"Reminder sent to {lawyer_email}", "result": result}
        except:
            return {"message": f"Reminder logged for {lawyer_email} (email service unavailable)", "simulated": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=GENERIC_CASE_ERROR)

