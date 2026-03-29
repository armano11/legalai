import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Header
from services.auth_service import verify_token
from database.db import supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def _get_user_from_token(authorization: str):
    """Extract user info from token."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    return verify_token(token)


@router.get("/dashboard")
async def dashboard_analytics(authorization: str = Header(None)):
    """Get real analytics for the user dashboard via Supabase."""
    payload = _get_user_from_token(authorization)
    if not payload:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = int(payload.get("sub", 0))
    
    try:
        # User-specific stats
        search_count = 0
        try:
            res = supabase.table("search_history").select("id", count="exact").eq("user_id", user_id).execute()
            search_count = res.count if res.count is not None else 0
        except Exception: pass
        
        draft_count = 0
        try:
            res = supabase.table("draft_history").select("id", count="exact").eq("user_id", user_id).execute()
            draft_count = res.count if res.count is not None else 0
        except Exception: pass
        
        event_count = 0
        try:
            res = supabase.table("events").select("id", count="exact").eq("user_id", user_id).execute()
            event_count = res.count if res.count is not None else 0
        except Exception: pass

        # Daily search data (last 7 days)
        daily_data = []
        for i in range(6, -1, -1):
            day = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
            day_label = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%a")
            count = 0
            try:
                res = supabase.table("search_history").select("id", count="exact").eq("user_id", user_id).ilike("timestamp", f"{day}%").execute()
                count = res.count if res.count is not None else 0
            except Exception: pass
            daily_data.append({"day": day_label, "queries": count})
        
        # Recent searches
        recent_searches = []
        try:
            res = supabase.table("search_history").select("query, source, results_count, timestamp").eq("user_id", user_id).order("timestamp", desc=True).limit(5).execute()
            for r in res.data:
                recent_searches.append({
                    "query": r.get("query"),
                    "source": r.get("source"),
                    "results_count": r.get("results_count"),
                    "created_at": r.get("timestamp")
                })
        except Exception: pass

        # Upcoming events
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        upcoming_events = []
        try:
            res = supabase.table("events").select("title, date, time, court, severity, type").eq("user_id", user_id).gte("date", today).order("date", desc=False).limit(5).execute()
            upcoming_events = res.data
        except Exception: pass

        return {
            "total_searches": search_count,
            "total_drafts": draft_count,
            "total_events": event_count,
            "daily_data": daily_data,
            "recent_searches": recent_searches,
            "upcoming_events": upcoming_events
        }
    except Exception as e:
        logger.error(f"Analytics query error: {e}")
        return {
            "total_searches": 0, "total_drafts": 0, "total_events": 0,
            "daily_data": [], "recent_searches": [], "upcoming_events": []
        }
