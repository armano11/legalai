from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse
from database.schemas import LegalSearchRequest
from ai.rag_pipeline import search_legal, get_research_synthesis
from pydantic import BaseModel
from services.auth_service import verify_token
from database.db import supabase
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Legal Research"])
_optional_analytics_disabled = set()
GENERIC_RESEARCH_ERROR = "Research request failed."


def _optional_insert(table_name: str, payload: dict) -> None:
    result = supabase.table(table_name).insert(payload).execute()
    if result.ok:
        return

    if result.status_code in (400, 404):
        if table_name not in _optional_analytics_disabled:
            logger.info(
                "Optional analytics table '%s' is unavailable; skipping future writes. %s",
                table_name,
                result.error,
            )
            _optional_analytics_disabled.add(table_name)
        return

    logger.warning("Optional analytics write failed for '%s': %s", table_name, result.error)


def _safe_user_id_from_auth(authorization: str | None) -> int | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    payload = verify_token(authorization.split(" ")[1])
    if not payload:
        return None
    raw_sub = payload.get("sub")
    try:
        return int(raw_sub)
    except (TypeError, ValueError):
        logger.warning("Invalid token sub for analytics logging: %s", raw_sub)
        return None


@router.post("/legal-search")
async def legal_search(req: LegalSearchRequest, authorization: str = Header(None)):
    if not req.query or len(req.query.strip()) < 3:
        raise HTTPException(status_code=400, detail="Search query must be at least 3 characters.")

    # Get user ID from token if available
    user_id = _safe_user_id_from_auth(authorization)

    try:
        import asyncio
        # Run synchronous search_legal (which calls Ollama) in a background thread
        # to prevent blocking the FastAPI event loop
        results = await asyncio.to_thread(search_legal, req.query)
        
        # Log search to analytics via Supabase
        try:
            now = datetime.now(timezone.utc).isoformat()
            if "search_history" not in _optional_analytics_disabled:
                _optional_insert("search_history", {
                    "user_id": user_id,
                    "query": req.query,
                    "source": results.get("source", "rag"),
                    "results_count": results.get("total", 0),
                    "timestamp": now
                })
            if "research_runs" not in _optional_analytics_disabled:
                _optional_insert("research_runs", {
                    "user_id": user_id,
                    "query": req.query,
                    "mode": results.get("mode", "corpus_grounded"),
                    "confidence": results.get("confidence", 0),
                    "report_markdown": results.get("report_markdown", ""),
                    "answer": results.get("answer", ""),
                    "citations": results.get("citations", []),
                    "trace": results.get("trace", {}),
                    "created_at": now,
                })
        except Exception as e:
            logger.warning(f"Failed to log search to Supabase: {e}")

        return results
    except Exception as e:
        logger.error("Legal search failed: %s", e)
        raise HTTPException(status_code=500, detail=GENERIC_RESEARCH_ERROR)

class SynthesisRequest(BaseModel):
    query: str
    context: str

@router.post("/research/synthesize")
async def research_synthesize(req: SynthesisRequest, authorization: str = Header(None)):
    """Late-load AI synthesis for research report."""
    try:
        if not req.query or len(req.query.strip()) < 3:
            raise HTTPException(status_code=400, detail="Query must be at least 3 characters.")
        if not req.context or not req.context.strip():
            raise HTTPException(status_code=400, detail="Context is required for synthesis.")

        import asyncio
        results = await asyncio.wait_for(
            asyncio.to_thread(get_research_synthesis, req.query, req.context),
            timeout=60,
        )
        return results
    except TimeoutError:
        logger.error("Research synthesize timed out for query: %s", req.query)
        return {
            "synthesis": (
                "AI synthesis is temporarily delayed. "
                "Showing context-grounded fallback summary.\n\n"
                f"Query: {req.query}\n\n"
                f"Context snapshot:\n{req.context[:1200]}"
            ),
            "fallback_used": True,
            "status": "degraded_timeout",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Research synthesize failed: %s", e)
        raise HTTPException(status_code=500, detail=GENERIC_RESEARCH_ERROR)

@router.post("/research/stream")
async def research_stream(req: SynthesisRequest, authorization: str = Header(None)):
    """Real-time SSE streaming endpoint for AI Markdown."""
    from ai.llm_fallback import stream_deep_processing
    return StreamingResponse(stream_deep_processing(req.query, req.context), media_type="text/event-stream")
