import logging
from ai.rag_pipeline import search_legal

logger = logging.getLogger(__name__)


async def perform_legal_search(query: str) -> dict:
    """Execute a legal search using the RAG pipeline."""
    results = search_legal(query)
    return results
