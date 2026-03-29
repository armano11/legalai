import logging
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import OAuth2PasswordBearer
from database.schemas import RegisterRequest, LoginRequest, TokenResponse
from services.auth_service import register_user, login_user, get_user_info, verify_token

router = APIRouter(prefix="/api", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")
logger = logging.getLogger(__name__)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency to get the currently authenticated user from Supabase."""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing user ID")
        
    user = await get_user_info(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User session not found in Cloud")
        
    # Inject ID back into dict for routes that need it
    user["id"] = user_id
    return user


@router.post("/register")
async def register(req: RegisterRequest):
    plan = getattr(req, "plan", "trial") or "trial"
    firm_name = getattr(req, "firm_name", "") or ""
    firm_id = getattr(req, "firm_id", "") or ""
    role = getattr(req, "role", "user") or "user"
    result = await register_user(None, req.name, req.email, req.password, plan, firm_name, firm_id, role)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/login")
async def login(req: LoginRequest):
    result = await login_user(None, req.email, req.password)
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    return result


@router.get("/me")
async def me(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await get_user_info(payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


from pydantic import BaseModel
class ProfileUpdate(BaseModel):
    name: str = None
    profile_picture: str = None
    bio: str = None

@router.put("/users/profile")
async def update_profile(data: ProfileUpdate, authorization: str = Header(None)):
    """Update profile picture or bio for the authenticated user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        user_id = payload["sub"]
        updates = {}
        if data.name is not None and data.name.strip():
            updates["name"] = data.name.strip()
        if data.profile_picture is not None:
            updates["profile_picture"] = data.profile_picture
        if data.bio is not None:
            updates["bio"] = data.bio
            
        if updates:
            from database.db import supabase
            res = supabase.table("users").update(updates).eq("id", user_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        logger.error(f"Profile update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
