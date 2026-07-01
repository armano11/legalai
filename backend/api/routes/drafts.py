import os
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from database.schemas import (
    DraftRequest, DraftResponse, DraftFixRequest, RedraftRequest,
    IntentRequest, IntentResponse, BulkGenerateRequest, BulkGenerateResponse,
)
from services.draft_service import (
    create_draft, get_draft_file_path, get_draft_versions,
    redraft_existing, generate_bulk_drafts, get_batch_zip_path,
)
from services.intent_service import understand_intent
from api.routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Draft Generation"])

VALID_DOC_TYPES = [
    "Legal Notice", "Consumer Complaint", "Rental Agreement",
    "Affidavit", "Power of Attorney", "Legal Opinion",
]


@router.post("/generate-draft", response_model=DraftResponse)
async def generate_draft(req: DraftRequest, user: dict = Depends(get_current_user)):
    if req.doc_type not in VALID_DOC_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid document type. Choose from: {', '.join(VALID_DOC_TYPES)}")
    try:
        user_id = user.get("id") if user else None
        result = await create_draft(
            user_id,
            req.doc_type,
            req.client_name,
            req.opposing_party,
            req.case_description,
            getattr(req, "firm_name", ""),
            getattr(req, "tone", "Neutral"),
        )
        return result
    except Exception as e:
        logger.error(f"Draft generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Draft generation failed: {str(e)}")


@router.post("/draft/understand-intent", response_model=IntentResponse)
async def analyze_intent(req: IntentRequest, user: dict = Depends(get_current_user)):
    try:
        result = await understand_intent(req.description, req.firm_name)
        return result
    except Exception as e:
        logger.error(f"Intent analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Intent analysis failed: {str(e)}")


@router.post("/draft/bulk-generate", response_model=BulkGenerateResponse)
async def bulk_generate(req: BulkGenerateRequest, user: dict = Depends(get_current_user)):
    if req.doc_type not in VALID_DOC_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid document type. Choose from: {', '.join(VALID_DOC_TYPES)}")
    if not req.entries:
        raise HTTPException(status_code=400, detail="No entries provided for bulk generation")
    if len(req.entries) > 200:
        raise HTTPException(status_code=400, detail="Maximum 200 entries per batch")

    try:
        result = await generate_bulk_drafts(
            req.doc_type,
            [e.model_dump() for e in req.entries],
            req.case_description,
            req.firm_name,
            req.tone,
            req.template_modifications,
        )
        return result
    except Exception as e:
        logger.error(f"Bulk generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Bulk generation failed: {str(e)}")


@router.post("/fix-draft")
async def fix_draft(req: DraftFixRequest, user: dict = Depends(get_current_user)):
    try:
        from services.draft_service import fix_weak_points
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
        filename=f"LegalForge_Draft_{draft_id}.pdf",
    )


@router.get("/download-batch/{batch_id}")
async def download_batch(batch_id: str):
    file_path = get_batch_zip_path(batch_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Batch archive not found.")
    return FileResponse(
        path=file_path,
        media_type="application/zip",
        filename=f"LegalForge_Batch_{batch_id}.zip",
    )
