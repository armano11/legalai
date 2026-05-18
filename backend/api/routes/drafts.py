import os
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from database.schemas import DraftRequest, DraftResponse, DraftFixRequest, RedraftRequest
from services.draft_service import create_draft, get_draft_file_path, get_draft_versions, redraft_existing
from api.routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Draft Generation"])


@router.post("/generate-draft", response_model=DraftResponse)
async def generate_draft(req: DraftRequest, user: dict = Depends(get_current_user)):
    valid_types = ["Legal Notice", "Consumer Complaint", "Rental Agreement", "Affidavit", "Power of Attorney", "Legal Opinion"]
    if req.doc_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid document type. Choose from: {', '.join(valid_types)}")

    try:
        user_id = user.get("id") if user else None
        result = await create_draft(
            user_id,
            req.doc_type,
            req.client_name,
            req.opposing_party,
            req.case_description,
            getattr(req, "firm_name", ""),
            getattr(req, "tone", "Neutral")
        )
        return result
    except Exception as e:
        logger.error(f"Draft generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Draft generation failed: {str(e)}")

@router.post("/fix-draft")
async def fix_draft(req: DraftFixRequest, user: dict = Depends(get_current_user)):
    try:
        from services.draft_service import fix_weak_points
        user_id = user.get("id") if user else None
        fixed_text = await fix_weak_points(req.draft_text, req.issues_to_fix)
        return {"fixed_text": fixed_text}
    except Exception as e:
        logger.error(f"Draft fixing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Draft fixing failed: {str(e)}")


@router.post("/redraft", response_model=DraftResponse)
async def redraft(req: RedraftRequest, user: dict = Depends(get_current_user)):
    try:
        return await redraft_existing(req.draft_id, req.instructions, req.tone)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Draft redraft failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Draft redraft failed: {str(exc)}") from exc


@router.get("/drafts/{draft_id}/versions")
async def draft_versions(draft_id: str, user: dict = Depends(get_current_user)):
    return {"draft_id": draft_id, "versions": get_draft_versions(draft_id)}


@router.get("/download-draft/{draft_id}")
async def download_draft(draft_id: str):
    file_path = get_draft_file_path(draft_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Draft not found.")

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"JurisAI_Draft_{draft_id}.pdf"
    )
