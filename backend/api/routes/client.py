from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.db import supabase
from api.routes.notifications import create_notification
from services.auth_service import DEFAULT_ADMIN_EMAIL
import json
import logging
import os
import random
import string
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/client", tags=["Client Portal"])


class IntakeRequest(BaseModel):
    client_name: str
    description: str
    client_email: str = ""
    client_phone: str = ""
    firm_id: str = ""


def _generate_intake_id():
    chars = string.ascii_uppercase + string.digits
    code = "".join(random.choices(chars, k=5))
    return f"JA-{code}"


def _generate_unique_intake_id():
    for _ in range(10):
        candidate = _generate_intake_id()
        exists = supabase.table("lawyer_cases").select("id").eq("case_no", candidate).limit(1).execute()
        if not exists.data:
            return candidate
    return f"JA-{int(datetime.now(timezone.utc).timestamp())}"


def _parse_iso_datetime(value: str):
    if not value:
        return None
    normalized = str(value).strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _resolve_intake_admin(firm_id: str = ""):
    requested_firm = (firm_id or "").strip().upper()
    configured_email = (
        os.environ.get("PUBLIC_INTAKE_ADMIN_EMAIL", "").strip().lower()
        or DEFAULT_ADMIN_EMAIL
    )

    lookups = []
    if requested_firm:
        lookups.append(
            supabase.table("users")
            .select("id, name, email, firm_id, firm_name")
            .eq("firm_id", requested_firm)
            .eq("role", "admin")
            .limit(1)
            .execute()
        )
    if configured_email:
        lookups.append(
            supabase.table("users")
            .select("id, name, email, firm_id, firm_name")
            .eq("email", configured_email)
            .eq("role", "admin")
            .limit(1)
            .execute()
        )
    lookups.append(
        supabase.table("users")
        .select("id, name, email, firm_id, firm_name")
        .eq("role", "admin")
        .order("id")
        .limit(1)
        .execute()
    )

    for result in lookups:
        if result.data:
            return result.data[0]
    return None


@router.post("/intake")
async def case_intake(req: IntakeRequest):
    """Public endpoint for new case intake. Persists to DB so the case is trackable."""
    try:
        case_id = _generate_unique_intake_id()
        now = datetime.now(timezone.utc).isoformat()
        intake_admin = _resolve_intake_admin(req.firm_id)
        if not intake_admin:
            raise HTTPException(status_code=503, detail="No firm administrator is available for intake.")

        triage_email = intake_admin.get("email", "")
        firm_id = intake_admin.get("firm_id", "") or ""
        admin_id = str(intake_admin.get("id") or "0")

        activity_log = [{
            "id": 1,
            "action": "case_intake_submitted",
            "actor": req.client_name,
            "details": f"New case submitted through the public intake form. Case ID: {case_id}",
            "timestamp": now,
        }]

        case_meta = {
            "case_no": case_id,
            "priority": "medium",
            "stage": "Filed",
            "case_type": "General",
            "client_name": req.client_name,
            "client_email": req.client_email or "",
            "client_number": req.client_phone or "",
            "court": "",
            "daily_updates": [],
            "hearings": [],
            "notes_log": [],
            "activity_log": activity_log,
        }

        insert_data = {
            "assigned_by_id": admin_id,
            "lawyer_email": triage_email,
            "title": f"Client Intake: {req.client_name}",
            "description": req.description,
            "case_no": case_id,
            "status": "Filed",
            "stage": "Filed",
            "priority": "medium",
            "case_type": "General",
            "client_name": req.client_name,
            "client_email": req.client_email or "",
            "client_number": req.client_phone or "",
            "notes": json.dumps(case_meta),
            "activity_log": json.dumps(activity_log),
            "daily_updates": json.dumps([]),
            "hearings": json.dumps([]),
            "notes_log": json.dumps([]),
            "assigned_at": now,
            "updated_at": now,
            "firm_id": firm_id,
        }

        res = supabase.table("lawyer_cases").insert(insert_data).execute()
        if not res.data:
            logger.error("DB insert failed for intake %s: %s", case_id, res.error)
            raise HTTPException(status_code=500, detail="Case intake could not be saved.")

        logger.info("Case intake %s persisted to DB (row id: %s)", case_id, res.data[0].get("id"))

        try:
            supabase.table("events").insert({
                "user_id": intake_admin.get("id"),
                "event_type": "case_intake",
                "metadata": f"Public intake {case_id} submitted by {req.client_name}",
                "timestamp": now,
            }).execute()
        except Exception as event_error:
            logger.warning("Failed to log intake event %s: %s", case_id, event_error)
            # Intake persistence already succeeded; event logging is best-effort only.
            logger.info("Continuing intake flow without event row for %s", case_id)

        # Trigger internal notification for the firm admin
        create_notification(
            user_email=triage_email,
            title="New Case Intake",
            message=f"A new case has been submitted by {req.client_name}. Assigned ID: {case_id}",
            notification_type="case_assigned",
            reference_id=str(res.data[0]["id"])
        )

        return {
            "success": True,
            "message": "Intake submitted successfully",
            "case_id": case_id,
            "id": res.data[0]["id"],
            "firm_id": firm_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Intake submission error: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


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


def _parse_json(raw, default=None):
    if default is None:
        default = []
    if not raw:
        return default
    if isinstance(raw, list):
        return raw
    try:
        return json.loads(raw)
    except Exception:
        return default


@router.get("/track/{case_no}")
async def track_case(case_no: str):
    """Public endpoint to track case status using case_no. Returns limited, safe data."""
    try:
        normalized_case_no = (case_no or "").strip().upper()
        
        # The database might not have a dedicated case_no column, so we fetch and filter
        # by the case_no stored inside the 'notes' JSON field.
        res = supabase.table("lawyer_cases").select("*").execute()
        
        if not res.ok:
            logger.error(f"Tracking lookup failed: {res.error}")
            raise HTTPException(status_code=500, detail="Unable to query case records.")

        matched_case = None
        for row in (res.data or []):
            # Extract case_no from either a column or the notes JSON
            meta = _extract_case_meta(row)
            db_case_no = str(row.get("case_no") or meta.get("case_no") or "").strip().upper()
            
            if db_case_no == normalized_case_no:
                matched_case = row
                break

        if not matched_case:
            raise HTTPException(status_code=404, detail="Case not found.")

        target_case = matched_case
        meta = _extract_case_meta(target_case)
        activity_log = _parse_json(target_case.get("activity_log"), meta.get("activity_log", []))
        hearings = _parse_json(target_case.get("hearings"), meta.get("hearings", []))
        public_activity = [a for a in activity_log if "Internal" not in str(a.get("details", ""))]
        public_activity.sort(
            key=lambda x: _parse_iso_datetime(x.get("timestamp", "")) or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )

        lawyer_email = (target_case.get("lawyer_email") or "").strip().lower()
        lawyer_contact = {
            "name": target_case.get("lawyer_name") or lawyer_email or "Assigned Counsel",
            "email": lawyer_email or "",
        }
        if lawyer_email:
            try:
                lawyer_res = (
                    supabase.table("users")
                    .select("name, email")
                    .eq("email", lawyer_email)
                    .limit(1)
                    .execute()
                )
                if lawyer_res.data:
                    lawyer_contact["name"] = lawyer_res.data[0].get("name") or lawyer_contact["name"]
                    lawyer_contact["email"] = lawyer_res.data[0].get("email") or lawyer_contact["email"]
            except Exception as e:
                logger.warning("Failed to resolve lawyer contact for %s: %s", normalized_case_no, e)

        return {
            "case_no": normalized_case_no,
            "title": target_case.get("title", ""),
            "court": target_case.get("court") or meta.get("court", "TBD"),
            "case_type": target_case.get("case_type") or meta.get("case_type", "General"),
            "stage": target_case.get("stage") or meta.get("stage") or target_case.get("status", "Filed"),
            "lawyer_name": target_case.get("lawyer_name") or target_case.get("lawyer_email", "Assigned Counsel"),
            "lawyer_contact": lawyer_contact,
            "hearings": sorted(hearings, key=lambda x: x.get("date", "")),
            "activity_log": public_activity,
            "updated_at": target_case.get("updated_at"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Client case track error: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")
