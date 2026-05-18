import logging
from fastapi import APIRouter, HTTPException, Header
from database.schemas import CreateLawyerRequest
from database.db import supabase
from services.auth_service import (
    create_lawyer_user, list_all_users, update_user, delete_user,
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
    firm_id = payload.get("firm_id", "")
    if not firm_id:
        return {"users": [], "total": 0}
    users = await get_firm_users(firm_id)
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
    """Get activity log for admin's firm or a specific user within that firm."""
    payload = _require_admin(authorization)
    firm_id = payload.get("firm_id", "")
    
    if user_id:
        # Verify target user belongs to the same firm
        target_res = supabase.table("users").select("firm_id").eq("id", user_id).limit(1).execute()
        if not target_res.data or target_res.data[0].get("firm_id") != firm_id:
            raise HTTPException(status_code=403, detail="Cannot access activity for users outside your workspace")
        activities = await get_user_activity(user_id=user_id)
    else:
        activities = await get_user_activity(firm_id=firm_id)
    return {"activities": activities, "total": len(activities)}


@router.get("/stats")
async def get_stats(authorization: str = Header(None)):
    payload = _require_admin(authorization)
    firm_id = payload.get("firm_id", "")
    # Always pass firm_id to ensure isolation. 
    # If firm_id is empty, it will return empty stats for that (non-existent) firm instead of system stats.
    stats = await get_platform_stats(firm_id=firm_id)
    return stats


@router.post("/lawyers")
async def create_lawyer(req: CreateLawyerRequest, authorization: str = Header(None)):
    payload = _require_admin(authorization)
    result = await create_lawyer_user(
        payload,
        req.name,
        req.email,
        req.password,
        title=req.title,
        practice_areas=req.practice_areas,
        bio=req.bio,
        profile_picture=req.profile_picture,
        plan=req.plan,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.put("/users/{user_id}")
async def update_user_endpoint(user_id: int, plan: str = None, role: str = None, authorization: str = Header(None)):
    _require_admin(authorization)
    result = await update_user(user_id, plan=plan, role=role)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.delete("/users/{user_id}")
async def delete_user_endpoint(user_id: int, authorization: str = Header(None)):
    payload = _require_admin(authorization)
    requester_firm_id = payload.get("firm_id", "")
    requester_id = str(payload.get("sub", ""))

    target_res = supabase.table("users").select("id, role, firm_id").eq("id", user_id).limit(1).execute()
    if not target_res.data:
        raise HTTPException(status_code=404, detail="User not found")

    target = target_res.data[0]
    if str(target.get("id")) == requester_id:
        raise HTTPException(status_code=400, detail="Admin cannot remove their own account")
    if target.get("firm_id", "") != requester_firm_id:
        raise HTTPException(status_code=403, detail="Cannot remove users outside your workspace")
    if target.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Only lawyer accounts can be removed from this endpoint")

    result = await delete_user(user_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
