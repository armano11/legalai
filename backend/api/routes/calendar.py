import json
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from services.auth_service import verify_token
from database.db import supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Calendar"])


class EventCreate(BaseModel):
    title: str
    date: str  # YYYY-MM-DD
    time: Optional[str] = ""
    type: str = "hearing"  # hearing, filing, deadline, meeting
    court: Optional[str] = ""
    case_no: Optional[str] = ""
    severity: str = "medium"  # critical, high, medium, low
    description: Optional[str] = ""
    lawyers: Optional[list] = []
    client_name: Optional[str] = ""
    client_email: Optional[str] = ""


class EventUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    type: Optional[str] = None
    court: Optional[str] = None
    case_no: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    lawyers: Optional[list] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None


def _get_user_id(authorization: str) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return int(payload["sub"])


def _row_to_event(row) -> dict:
    """Convert a DB row to an event dict."""
    lawyers_str = row["lawyers"] if row["lawyers"] else "[]"
    try:
        lawyers_list = json.loads(lawyers_str)
    except (json.JSONDecodeError, TypeError):
        lawyers_list = []
    
    return {
        "id": row["id"],
        "title": row["title"],
        "date": row["date"],
        "time": row["time"] or "",
        "type": row["type"] or "hearing",
        "court": row["court"] or "",
        "case_no": row["case_no"] or "",
        "severity": row["severity"] or "medium",
        "description": row["description"] or "",
        "lawyers": lawyers_list,
        "client_name": row["client_name"] if "client_name" in row.keys() else "",
        "client_email": row["client_email"] if "client_email" in row.keys() else "",
        "created_at": row["created_at"]
    }


@router.get("/events")
async def list_events(authorization: str = Header(None)):
    user_id = _get_user_id(authorization)
    try:
        res = supabase.table("events").select("*").eq("user_id", user_id).order("date", desc=False).order("time", desc=False).execute()
        events = [_row_to_event(row) for row in res.data]
        return {"events": events, "total": len(events)}
    except Exception as e:
        logger.error(f"List events error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/events")
async def create_event(event: EventCreate, authorization: str = Header(None)):
    user_id = _get_user_id(authorization)
    try:
        now = datetime.now(timezone.utc).isoformat()
        lawyers_json = json.dumps(event.lawyers or [])
        res = supabase.table("events").insert({
            "user_id": user_id, 
            "title": event.title, 
            "date": event.date, 
            "time": event.time, 
            "type": event.type, 
            "court": event.court, 
            "case_no": event.case_no, 
            "severity": event.severity, 
            "description": event.description, 
            "lawyers": lawyers_json, 
            "client_name": event.client_name or "", 
            "client_email": event.client_email or "", 
            "created_at": now
        }).execute()
        created_id = res.data[0]["id"] if res.data else None
        return {"id": created_id, "message": "Event created successfully"}
    except Exception as e:
        logger.error(f"Create event error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/events/{event_id}")
async def update_event(event_id: int, event: EventUpdate, authorization: str = Header(None)):
    user_id = _get_user_id(authorization)
    try:
        existing = supabase.table("events").select("id").eq("id", event_id).eq("user_id", user_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Event not found")
        
        updates = {}
        if event.title is not None: updates["title"] = event.title
        if event.date is not None: updates["date"] = event.date
        if event.time is not None: updates["time"] = event.time
        if event.type is not None: updates["type"] = event.type
        if event.court is not None: updates["court"] = event.court
        if event.case_no is not None: updates["case_no"] = event.case_no
        if event.severity is not None: updates["severity"] = event.severity
        if event.description is not None: updates["description"] = event.description
        if event.lawyers is not None: updates["lawyers"] = json.dumps(event.lawyers)
        if event.client_name is not None: updates["client_name"] = event.client_name
        if event.client_email is not None: updates["client_email"] = event.client_email
        
        if updates:
            supabase.table("events").update(updates).eq("id", event_id).eq("user_id", user_id).execute()
        
        return {"message": "Event updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update event error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/events/{event_id}")
async def delete_event(event_id: int, authorization: str = Header(None)):
    user_id = _get_user_id(authorization)
    try:
        existing = supabase.table("events").select("id").eq("id", event_id).eq("user_id", user_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Event not found")
        supabase.table("events").delete().eq("id", event_id).eq("user_id", user_id).execute()
        return {"message": "Event deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete event error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/events/{event_id}/remind-client")
async def remind_client(event_id: int, authorization: str = Header(None)):
    """Send a reminder email to the client for this event."""
    user_id = _get_user_id(authorization)
    try:
        res = supabase.table("events").select("*").eq("id", event_id).eq("user_id", user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Event not found")
        
        event = _row_to_event(res.data[0])
        client_email = event.get("client_email", "")
        client_name = event.get("client_name", "Client")
        
        if not client_email:
            # Demo mode — simulate sending
            return {
                "success": True,
                "simulated": True,
                "message": f"Demo: Reminder sent to {client_name} (no email configured)"
            }
        
        from services.email_service import send_hearing_reminder
        result = send_hearing_reminder(event, client_email)
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message", "Failed to send email"))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Remind client error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/events/seed-demo")
async def seed_demo_events(authorization: str = Header(None)):
    """Seed demo events for the current user."""
    user_id = _get_user_id(authorization)
    try:
        # Check if user already has events
        count_res = supabase.table("events").select("id", count="exact").eq("user_id", user_id).execute()
        count = count_res.count if count_res.count is not None else 0
        if count > 0:
            return {"message": f"User already has {count} events", "seeded": 0}
        
        now = datetime.now(timezone.utc)
        today = now.strftime("%Y-%m-%d")
        
        demo_events = [
            {
                "title": "Sharma v. State of Maharashtra — Final Arguments",
                "date": (now + timedelta(days=1)).strftime("%Y-%m-%d"),
                "time": "10:30",
                "type": "hearing",
                "court": "Bombay High Court",
                "case_no": "CRL.A/1847/2025",
                "severity": "critical",
                "description": "Final arguments stage. Client to be present. Key evidence: CCTV footage from Exhibit P-12. Opposing counsel likely to cite Navtej Singh Johar precedent.",
                "client_name": "Rajesh Sharma",
                "client_email": "demo@example.com"
            },
            {
                "title": "Patel Industries v. Income Tax Authority",
                "date": (now + timedelta(days=3)).strftime("%Y-%m-%d"),
                "time": "14:00",
                "type": "hearing",
                "court": "Income Tax Appellate Tribunal, Mumbai",
                "case_no": "ITA/2341/2025",
                "severity": "high",
                "description": "Appeal against reassessment order u/s 147. Documents: Notice u/s 148, original return, revised computation.",
                "client_name": "Vikram Patel",
                "client_email": "demo@example.com"
            },
            {
                "title": "Limitation Filing — Mehra Property Dispute",
                "date": (now + timedelta(days=5)).strftime("%Y-%m-%d"),
                "time": "",
                "type": "deadline",
                "court": "District Court, South Delhi",
                "case_no": "CS(OS)/892/2025",
                "severity": "critical",
                "description": "Final date for filing suit for specific performance. Limitation under Article 54 expires. Court fee stamps already purchased.",
                "client_name": "Sunita Mehra",
                "client_email": "demo@example.com"
            },
            {
                "title": "Client Meeting — Reddy Divorce Case",
                "date": (now + timedelta(days=7)).strftime("%Y-%m-%d"),
                "time": "11:00",
                "type": "meeting",
                "court": "Family Court, Hyderabad",
                "case_no": "HMA/456/2025",
                "severity": "medium",
                "description": "Discuss custody arrangement proposal. Client wants joint custody. Review maintenance computation sheet.",
                "client_name": "Priya Reddy",
                "client_email": "demo@example.com"
            },
            {
                "title": "Bail Application — Gupta Money Laundering Case",
                "date": (now + timedelta(days=2)).strftime("%Y-%m-%d"),
                "time": "15:30",
                "type": "hearing",
                "court": "Special PMLA Court, Delhi",
                "case_no": "BA/789/2025",
                "severity": "critical",
                "description": "Regular bail application. ED has filed supplementary chargesheet. Argue no flight risk, valid passport surrendered.",
                "client_name": "Ankit Gupta",
                "client_email": "demo@example.com"
            },
            {
                "title": "Consumer Complaint Filing — Kapoor v. BuildRight",
                "date": (now + timedelta(days=10)).strftime("%Y-%m-%d"),
                "time": "10:00",
                "type": "filing",
                "court": "State Consumer Commission, Delhi",
                "case_no": "CC/NEW/2025",
                "severity": "medium",
                "description": "Filing complaint for deficient service in flat possession delay of 3 years. Claim: ₹45 lakhs + compensation.",
                "client_name": "Rohit Kapoor",
                "client_email": "demo@example.com"
            }
        ]
        
        insert_data = []
        for evt in demo_events:
            insert_data.append({
                "user_id": user_id, 
                "title": evt["title"], 
                "date": evt["date"], 
                "time": evt["time"], 
                "type": evt["type"], 
                "court": evt["court"], 
                "case_no": evt["case_no"], 
                "severity": evt["severity"], 
                "description": evt["description"], 
                "lawyers": "[]", 
                "client_name": evt.get("client_name", ""), 
                "client_email": evt.get("client_email", ""), 
                "created_at": now.isoformat()
            })
            
        supabase.table("events").insert(insert_data).execute()
        seeded = len(insert_data)
        
        return {"message": f"Seeded {seeded} demo events", "seeded": seeded}
    except Exception as e:
        logger.error(f"Seed demo error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
