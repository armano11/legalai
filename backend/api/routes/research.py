from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Header
from database.schemas import LegalSearchRequest
from ai.rag_pipeline import search_legal, get_research_synthesis
from pydantic import BaseModel
from services.auth_service import verify_token
from database.db import supabase
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Legal Research"])


@router.post("/legal-search")
async def legal_search(req: LegalSearchRequest, authorization: str = Header(None)):
    if not req.query or len(req.query.strip()) < 3:
        raise HTTPException(status_code=400, detail="Search query must be at least 3 characters.")

    # Get user ID from token if available
    user_id = None
    if authorization and authorization.startswith("Bearer "):
        payload = verify_token(authorization.split(" ")[1])
        if payload:
            user_id = int(payload.get("sub", 0))

    try:
        import asyncio
        # Run synchronous search_legal (which calls Ollama) in a background thread
        # to prevent blocking the FastAPI event loop
        results = await asyncio.to_thread(search_legal, req.query)
        
        # Log search to analytics via Supabase
        try:
            now = datetime.now(timezone.utc).isoformat()
            supabase.table("search_history").insert({
                "user_id": user_id,
                "query": req.query,
                "source": results.get("source", "rag"),
                "results_count": results.get("total", 0),
                "timestamp": now
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to log search to Supabase: {e}")

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

class SynthesisRequest(BaseModel):
    query: str
    context: str

@router.post("/research/synthesize")
async def research_synthesize(req: SynthesisRequest, authorization: str = Header(None)):
    """Late-load AI synthesis for research report."""
    results = get_research_synthesis(req.query, req.context)
    return results
