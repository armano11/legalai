import os
import logging
import re
from uuid import uuid4
from fastapi import APIRouter, HTTPException, UploadFile, File
from services.legal_paper_service import analyze_legal_paper
from config import UPLOAD_DIR

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Legal Paper Analysis"])


@router.post("/analyze-contract")
async def analyze_paper(file: UploadFile = File(...)):
    """Analyze any legal paper — contracts, FIRs, petitions, affidavits, etc."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".pdf", ".docx", ".txt", ".md", ".rtf", ".jpg", ".jpeg", ".png"}:
        raise HTTPException(status_code=400, detail="Unsupported file format. Use PDF, DOCX, TXT, MD, RTF, or Image (JPEG/PNG).")

    # Save uploaded file
    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", os.path.basename(file.filename or "upload"))
    file_path = os.path.join(UPLOAD_DIR, f"paper_{uuid4().hex}_{safe_name}")
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        logger.error("File upload failed: %s", e)
        raise HTTPException(status_code=500, detail="File upload failed.")

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
        raise HTTPException(status_code=500, detail="Analysis failed.")
    finally:
        # Cleanup uploaded file
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass
