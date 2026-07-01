import logging
import asyncio
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)-25s | %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("legalforge")

# --- Create FastAPI App ---
app = FastAPI(
    title="LegalForge API",
    description="AI-Powered Legal Intelligence Platform — Backend API",
    version="2.0.0"
)

PROJECT_ROOT = os.path.dirname(BASE_DIR := os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")

# --- CORS (allow React frontend) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Register Routes ---
from api.routes.auth import router as auth_router
from api.routes.research import router as research_router
from api.routes.contracts import router as contracts_router
from api.routes.drafts import router as drafts_router
from api.routes.insights import router as insights_router
from api.routes.admin import router as admin_router
from api.routes.analytics import router as analytics_router
from api.routes.lawyers import router as lawyers_router
from api.routes.notifications import router as notifications_router
from api.routes.client import router as client_router
from api.routes.cases import router as cases_router

app.include_router(auth_router)
app.include_router(research_router)
app.include_router(contracts_router)
app.include_router(drafts_router)
app.include_router(insights_router)
app.include_router(admin_router)
app.include_router(analytics_router)
app.include_router(lawyers_router)
app.include_router(notifications_router)
app.include_router(client_router)
app.include_router(cases_router)

if os.path.isdir(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    sequence_dir = os.path.join(DIST_DIR, "sequence")
    favicon_path = os.path.join(DIST_DIR, "favicon.svg")
    icons_path = os.path.join(DIST_DIR, "icons.svg")

    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")
    if os.path.isdir(sequence_dir):
        app.mount("/sequence", StaticFiles(directory=sequence_dir), name="frontend-sequence")

    @app.get("/app")
    async def frontend_app():
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

    @app.get("/app/{full_path:path}")
    async def frontend_spa(full_path: str):
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

    @app.get("/favicon.svg")
    async def frontend_favicon():
        return FileResponse(favicon_path)

    @app.get("/icons.svg")
    async def frontend_icons():
        return FileResponse(icons_path)


# --- Health Check ---
@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "LegalForge API",
        "version": "2.0.0",
        "docs": "/docs"
    }


@app.get("/api/ai/status")
async def ai_status():
    """Check Ollama availability."""
    import requests
    from config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_BACKUP_MODEL
    
    status = {
        "ollama_url": OLLAMA_BASE_URL,
        "model": OLLAMA_MODEL,
        "backup_model": OLLAMA_BACKUP_MODEL,
        "ollama_running": False,
        "model_available": False,
        "backup_available": False,
        "recommendation": ""
    }
    
    try:
        r = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
        if r.status_code == 200:
            status["ollama_running"] = True
            models = [m.get("name", "") for m in r.json().get("models", [])]
            
            has_main = any(OLLAMA_MODEL in m for m in models)
            has_backup = any(OLLAMA_BACKUP_MODEL in m for m in models)
            
            status["model_available"] = has_main
            status["backup_available"] = has_backup
            
            if has_main:
                status["recommendation"] = f"{OLLAMA_MODEL} is ready for use."
            elif has_backup:
                status["recommendation"] = f"{OLLAMA_MODEL} not found, but backup {OLLAMA_BACKUP_MODEL} is available."
            else:
                status["recommendation"] = f"Ollama is running but neither {OLLAMA_MODEL} nor {OLLAMA_BACKUP_MODEL} found. Run: ollama pull {OLLAMA_MODEL}"
    except Exception:
        status["recommendation"] = f"Ollama is not running. Install from https://ollama.com and run: ollama serve && ollama pull {OLLAMA_MODEL}"
    
    return status


@app.get("/health")
async def health():
    # Get document count safely
    vector_store_documents = 0
    try:
        from ai.vector_store import get_document_count
        vector_store_documents = get_document_count()
    except Exception as e:
        logger.warning(f"Vector store not ready: {e}")

    return {
        "api": True,
        "database": "Supabase Cloud",
        "vector_store_documents": vector_store_documents,
    }


# --- Startup Event ---
@app.on_event("startup")
async def startup():
    logger.info("=" * 60)
    logger.info("  LegalForge API Server Starting...")
    logger.info("=" * 60)

    # Ensure directories exist
    from config import UPLOAD_DIR, GENERATED_DIR, LEGAL_DATA_DIR
    import os
    for d in [UPLOAD_DIR, GENERATED_DIR, LEGAL_DATA_DIR]:
        os.makedirs(d, exist_ok=True)

    # Initialize Supabase Auth DB (Seeding)
    try:
        from services.auth_service import init_auth_db
        init_auth_db()
    except Exception as e:
        logger.warning(f"Supabase Auth init skipped (Likely already seeded): {e}")

    # Initialize analytics & events DB (Deprecated for SQLite, now remote)
    try:
        from database.db import init_analytics_db
        init_analytics_db()
    except Exception as e:
        logger.warning(f"Analytics DB init skipped: {e}")

    # Auto-ingest legal documents if vector store is empty
    try:
        from ai.vector_store import get_document_count
        count = get_document_count()
        if count == 0:
            logger.info("Vector store is empty. Ingesting legal knowledge base...")
            from ai.rag_pipeline import ingest_all_legal_data
            total = ingest_all_legal_data()
            if total > 0:
                logger.info(f"Auto-ingested {total} chunks into vector store")
            else:
                logger.info("No legal data found in legal_data/. Add files there for RAG search.")
    except Exception as e:
        logger.warning(f"Vector store initialization skipped: {e}")

    logger.info("LegalForge API is ready.")
    logger.info("Docs: http://localhost:8000/docs")



if __name__ == "__main__":
    import sys
    port = 8000
    if "--port" in sys.argv:
        try:
            port_index = sys.argv.index("--port")
            port = int(sys.argv[port_index + 1])
        except (ValueError, IndexError):
            pass
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
