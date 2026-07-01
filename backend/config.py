from functools import lru_cache
from pathlib import Path
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Application ─────────────────────────────────────────────────────────
    APP_NAME: str = "LegalForge"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = Field(default="development", validation_alias="ENV")
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # ─── Paths ──────────────────────────────────────────────────────────────
    BASE_DIR: Path = Path(__file__).parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    GENERATED_DIR: Path = BASE_DIR / "generated_documents"
    TEMPLATE_DIR: Path = BASE_DIR / "templates"
    LEGAL_DATA_DIR: Path = BASE_DIR / "legal_data"
    CHROMA_DIR: Path = BASE_DIR / "chroma_db"
    ASSETS_DIR: Path = BASE_DIR / "assets"
    LOGO_PATH: Path = BASE_DIR / "assets" / "legalforge_logo.png"

    @field_validator("UPLOAD_DIR", "GENERATED_DIR", "TEMPLATE_DIR", "LEGAL_DATA_DIR", "CHROMA_DIR", "ASSETS_DIR", mode="before")
    @classmethod
    def _ensure_dirs(cls, v: Path) -> Path:
        v.mkdir(parents=True, exist_ok=True)
        return v

    # ─── Security (NO DEFAULTS FOR SECRETS) ─────────────────────────────────
    JWT_SECRET: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_EXPIRY_HOURS: int = 24
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ISSUER: str = "legalforge"
    JWT_AUDIENCE: str = "legalforge-api"

    APP_CORE_TOKEN: str = Field(default="")
    ENCRYPTION_KEY: str = Field(default="", min_length=32)

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_AUTH: str = "10/minute"
    RATE_LIMIT_SEARCH: str = "30/minute"
    RATE_LIMIT_AI: str = "20/minute"

    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    )

    # ─── Database (Supabase) ────────────────────────────────────────────────
    SUPABASE_URL: str = Field(..., pattern=r"^https://.*\.supabase\.co$")
    SUPABASE_KEY: str = Field(..., min_length=20)
    SUPABASE_SERVICE_KEY: str = Field(default="", min_length=20)
    SUPABASE_POOL_SIZE: int = 20
    SUPABASE_MAX_OVERFLOW: int = 10

    # ─── AI / LLM Providers ─────────────────────────────────────────────────
    # Primary Provider Selection
    AI_PROVIDER: str = Field(default="openrouter", pattern="^(openrouter|nvidia|ollama|openai)$")
    AI_ENABLE_MANAGED_MODELS: bool = True
    AI_ENABLE_LOCAL_FALLBACK: bool = True
    AI_HTTP_TIMEOUT_SECONDS: int = 60
    AI_MAX_RETRIES: int = 3
    AI_COST_LIMIT_USD_PER_DAY: float = 50.0

    # OpenRouter
    OPENROUTER_API_KEY: str = Field(default="")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_PRIMARY_MODEL: str = "meta-llama/llama-3.3-70b-instruct:free"
    OPENROUTER_RESEARCH_MODEL: str = "meta-llama/llama-3.3-70b-instruct:free"
    OPENROUTER_DOCUMENT_MODEL: str = "meta-llama/llama-3.3-70b-instruct:free"
    OPENROUTER_SYNTHESIS_MODEL: str = "nvidia/nemotron-3-ultra:free"

    # NVIDIA (Gemma 3n / GLM)
    NVIDIA_API_KEY: str = Field(default="")
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_PRIMARY_MODEL: str = "google/gemma-3n-e2b-it"
    NVIDIA_RESEARCH_MODEL: str = "google/gemma-3n-e2b-it"
    NVIDIA_DOCUMENT_MODEL: str = "google/gemma-3n-e2b-it"

    # Ollama (Local)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"
    OLLAMA_BACKUP_MODEL: str = "llama3.1:8b"
    OLLAMA_TIMEOUT_SECONDS: int = 120

    # OpenAI (Direct)
    OPENAI_API_KEY: str = Field(default="")
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"

    # ─── Embeddings ──────────────────────────────────────────────────────────
    EMBEDDING_MODEL: str = "BAAI/bge-large-en-v1.5"
    EMBEDDING_DIMENSION: int = 1024
    EMBEDDING_BATCH_SIZE: int = 32
    EMBEDDING_DEVICE: str = "cpu"  # cpu, cuda, mps
    EMBEDDING_LOCAL_FILES_ONLY: bool = False

    # ─── Vector Store (ChromaDB) ────────────────────────────────────────────
    CHROMA_COLLECTION: str = "legal_documents"
    CHROMA_HNSW_SPACE: str = "cosine"
    CHROMA_HNSW_M: int = 16
    CHROMA_HNSW_EF_CONSTRUCTION: int = 200
    CHROMA_HNSW_EF_SEARCH: int = 100

    # ─── RAG Pipeline ───────────────────────────────────────────────────────
    RAG_CHUNK_SIZE: int = 512
    RAG_CHUNK_OVERLAP: int = 50
    RAG_CHUNK_MIN_SIZE: int = 100
    RAG_SIMILARITY_THRESHOLD: float = 0.35
    RAG_TOP_K: int = 10
    RAG_RERANK_TOP_K: int = 5
    RAG_HYBRID_ALPHA: float = 0.5  # 0 = BM25 only, 1 = Dense only
    RAG_MAX_CONTEXT_TOKENS: int = 8000
    RAG_QUERY_EXPANSION: bool = True
    RAG_USE_HYPOTHETICAL_DOCS: bool = True

    # Cross-Encoder Reranking
    RERANKER_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    RERANKER_BATCH_SIZE: int = 16
    RERANKER_ENABLED: bool = True

    # ─── Scrapling Web Research ─────────────────────────────────────────────
    SCRAPLING_FETCH_TIMEOUT: int = 15
    SCRAPLING_MAX_CONTENT_LENGTH: int = 5000
    SCRAPLING_RESULTS_PER_QUERY: int = 5

    # ─── Legal Data Ingestion ───────────────────────────────────────────────
    INGEST_BATCH_SIZE: int = 256
    INGEST_MAX_WORKERS: int = 4
    INGEST_AUTO_ON_STARTUP: bool = True

    # ─── Email (Resend) ─────────────────────────────────────────────────────
    RESEND_API_KEY: str = Field(default="")
    EMAIL_FROM: str = "noreply@legalforge.legal"
    EMAIL_FROM_NAME: str = "LegalForge"

    # ─── File Upload ────────────────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 20
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt", ".md", ".rtf", ".jpg", ".jpeg", ".png"]

    # ─── Redis (Caching, Rate Limiting, Sessions) ───────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_MAX_CONNECTIONS: int = 50
    REDIS_SOCKET_TIMEOUT: int = 5
    REDIS_SOCKET_CONNECT_TIMEOUT: int = 5

    # ─── Celery (Background Workers) ────────────────────────────────────────
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    CELERY_ACCEPT_CONTENT: List[str] = ["json"]
    CELERY_TIMEZONE: str = "UTC"
    CELERY_TASK_TRACK_STARTED: bool = True
    CELERY_TASK_TIME_LIMIT: int = 300
    CELERY_WORKER_PREFETCH_MULTIPLIER: int = 1

    # ─── Monitoring & Observability ────────────────────────────────────────
    OTEL_ENABLED: bool = True
    OTEL_SERVICE_NAME: str = "legalforge-api"
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"
    OTEL_EXPORTER_OTLP_HEADERS: str = ""
    LOG_FORMAT: str = "json"  # json or console

    # ─── Feature Flags ──────────────────────────────────────────────────────
    FEATURE_NEURAL_AUDIT: bool = False
    FEATURE_DRAFT_GENERATION: bool = True
    FEATURE_CASE_MANAGEMENT: bool = True
    FEATURE_LAWYER_DIRECTORY: bool = True
    FEATURE_CLIENT_PORTAL: bool = True
    FEATURE_ANALYTICS: bool = True
    FEATURE_WEB_RESEARCH: bool = True

    # ─── Bootstrap Admin (Optional) ────────────────────────────────────────
    ENABLE_BOOTSTRAP_ADMIN: bool = False
    DEFAULT_ADMIN_EMAIL: str = Field(default="")
    DEFAULT_ADMIN_PASSWORD: str = Field(default="", min_length=10)
    DEFAULT_ADMIN_FIRM_ID: str = "JA-DEFAULT"
    DEFAULT_ADMIN_FIRM_NAME: str = "LegalForge Legal"

    # ─── Legal Paper Analysis ──────────────────────────────────────────────
    LEGAL_PAPER_ENABLE_NEURAL_AUDIT: bool = False
    LEGAL_PAPER_NEURAL_TIMEOUT_SECONDS: int = 60


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()