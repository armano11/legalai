import os
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from database.schemas import DraftRequest, DraftResponse
from services.draft_service import create_draft, get_draft_file_path
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
            getattr(req, "firm_name", "")
        )
        return result
    except Exception as e:
        logger.error(f"Draft generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Draft generation failed: {str(e)}")


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
