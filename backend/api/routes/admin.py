import logging
from fastapi import APIRouter, HTTPException, Header
from services.auth_service import (
    list_all_users, update_user, delete_user, 
    get_platform_stats, verify_token, get_firm_users,
    get_user_activity
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _require_admin(authorization: str):
    """Verify token and check admin role."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload


@router.get("/users")
async def get_users(authorization: str = Header(None)):
    payload = _require_admin(authorization)
    users = await list_all_users()
    return {"users": users, "total": len(users)}


@router.get("/firm-users")
async def get_firm_users_endpoint(authorization: str = Header(None)):
    """Get users belonging to the admin's firm."""
    payload = _require_admin(authorization)
    firm_id = payload.get("firm_id", "")
    if not firm_id:
        return {"users": [], "total": 0, "firm_id": ""}
    users = await get_firm_users(firm_id)
    return {"users": users, "total": len(users), "firm_id": firm_id}


@router.get("/activity")
async def get_activity(user_id: int = None, authorization: str = Header(None)):
    """Get activity log for admin's firm or a specific user."""
    payload = _require_admin(authorization)
    firm_id = payload.get("firm_id", "")
    if user_id:
        activities = await get_user_activity(user_id=user_id)
    else:
        activities = await get_user_activity(firm_id=firm_id)
    return {"activities": activities, "total": len(activities)}


@router.get("/stats")
async def get_stats(authorization: str = Header(None)):
    payload = _require_admin(authorization)
    firm_id = payload.get("firm_id", "")
    stats = await get_platform_stats(firm_id=firm_id if firm_id else None)
    return stats


@router.put("/users/{user_id}")
async def update_user_endpoint(user_id: int, plan: str = None, role: str = None, authorization: str = Header(None)):
    _require_admin(authorization)
    result = await update_user(user_id, plan=plan, role=role)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.delete("/users/{user_id}")
async def delete_user_endpoint(user_id: int, authorization: str = Header(None)):
    _require_admin(authorization)
    result = await delete_user(user_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
