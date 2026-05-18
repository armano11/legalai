from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone
from database.db import supabase
from api.routes.auth import get_current_user
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("")
async def get_notifications(user: dict = Depends(get_current_user)):
    """Get notifications for the current user."""
    email = user.get("email")
    try:
        res = supabase.table("notifications").select("*").eq("user_email", email).order("created_at", desc=True).limit(20).execute()
        notifications = res.data or []
        unread = sum(1 for n in notifications if not n.get("read"))
        return {"notifications": notifications, "unread_count": unread}
    except Exception as e:
        # Table might not exist yet — return empty
        logger.warning(f"Notifications fetch failed (table may not exist): {e}")
        return {"notifications": [], "unread_count": 0}

@router.put("/{notification_id}/read")
async def mark_read(notification_id: int, user: dict = Depends(get_current_user)):
    """Mark a single notification as read."""
    try:
        supabase.table("notifications").update({"read": True}).eq("id", notification_id).execute()
        return {"message": "Marked as read"}
    except Exception as e:
        logger.error("Notification mark_read failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to mark notification as read")

@router.put("/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read for the user."""
    try:
        supabase.table("notifications").update({"read": True}).eq("user_email", user.get("email")).execute()
        return {"message": "All notifications marked as read"}
    except Exception as e:
        logger.error("Notification mark_all_read failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to mark notifications as read")

def create_notification(user_email: str, title: str, message: str, notification_type: str = "case_assigned", reference_id: str = ""):
    """Helper: create a notification for a user. Call from other routes."""
    try:
        supabase.table("notifications").insert({
            "user_email": user_email,
            "title": title,
            "message": message,
            "type": notification_type,
            "reference_id": reference_id,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception as e:
        logger.warning(f"Failed to create notification: {e}")
