from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from api.routes.auth import get_current_user
from api.routes.lawyers import _enrich_case
from database.db import supabase

router = APIRouter(prefix="/api/cases", tags=["Cases"])


@router.get("/stats")
async def get_case_stats(user: dict = Depends(get_current_user)):
    """Return dashboard summary stats for current user scope."""
    try:
        is_admin = user.get("role") == "admin"
        firm_id = user.get("firm_id")
        user_email = user.get("email")

        if is_admin:
            query = supabase.table("lawyer_cases").select("*").eq("firm_id", firm_id)
        else:
            query = supabase.table("lawyer_cases").select("*").eq("lawyer_email", user_email)

        res = query.execute()
        cases = [_enrich_case(row) for row in (res.data or [])]
        now = datetime.now(timezone.utc).date()

        active = sum(1 for c in cases if c.get("stage") != "Closed")
        overdue = 0
        upcoming_hearings = 0

        for case in cases:
            deadline = case.get("deadline")
            if deadline and case.get("stage") != "Closed":
                try:
                    if datetime.fromisoformat(deadline).date() < now:
                        overdue += 1
                except Exception:
                    pass

            for hearing in case.get("hearings", []):
                date_str = hearing.get("date")
                if not date_str:
                    continue
                try:
                    hearing_date = datetime.fromisoformat(date_str).date()
                    days = (hearing_date - now).days
                    if 0 <= days <= 7:
                        upcoming_hearings += 1
                except Exception:
                    continue

        return {
            "active": active,
            "upcomingHearings": upcoming_hearings,
            "overdue": overdue,
            "total": len(cases),
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Unable to load case stats")
