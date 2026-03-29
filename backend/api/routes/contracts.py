import os
import logging
from fastapi import APIRouter, HTTPException, UploadFile, File
from services.legal_paper_service import analyze_legal_paper
from config import UPLOAD_DIR

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Legal Paper Analysis"])


@router.post("/analyze-contract")
async def analyze_paper(file: UploadFile = File(...)):
    """Analyze any legal paper — contracts, FIRs, petitions, affidavits, etc."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".pdf", ".docx", ".txt", ".jpg", ".jpeg", ".png"}:
        raise HTTPException(status_code=400, detail="Unsupported file format. Use PDF, DOCX, TXT, or Image (JPEG/PNG).")

    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, f"paper_{file.filename}")
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    # Analyze
    try:
        result = await analyze_legal_paper(file_path)
        if "error" in result:
            raise HTTPException(status_code=422, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        # Cleanup uploaded file
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass
