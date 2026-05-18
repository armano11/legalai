import os
from dotenv import load_dotenv

# --- Paths ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# --- Paths ---
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
GENERATED_DIR = os.path.join(BASE_DIR, "generated_documents")
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
LEGAL_DATA_DIR = os.path.join(BASE_DIR, "legal_data")
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")

# Create directories if they don't exist
for d in [UPLOAD_DIR, GENERATED_DIR, TEMPLATE_DIR, LEGAL_DATA_DIR, CHROMA_DIR]:
    os.makedirs(d, exist_ok=True)
# --- JWT Auth ---
# Dev-safe fallback prevents "signup succeeds but login fails" when JWT_SECRET is missing.
# In production, set JWT_SECRET explicitly via environment variable.
JWT_SECRET = os.environ.get("JWT_SECRET", "jurisai-dev-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

# --- AI Models ---
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CHROMA_COLLECTION = "legal_documents"
RAG_SIMILARITY_THRESHOLD = 0.40
RAG_TOP_K = 5

# --- Ollama Configuration ---
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_URL = f"{OLLAMA_BASE_URL}/api/generate"
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1")
OLLAMA_BACKUP_MODEL = os.environ.get("OLLAMA_BACKUP_MODEL", "qwen2.5:7b")

# --- Firecrawl Web Research ---
FIRECRAWL_ENABLED = os.environ.get("FIRECRAWL_ENABLED", "false").lower() == "true"
FIRECRAWL_BASE_URL = os.environ.get("FIRECRAWL_BASE_URL", "").rstrip("/")
FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY", "")
FIRECRAWL_TIMEOUT_SECONDS = int(os.environ.get("FIRECRAWL_TIMEOUT_SECONDS", "30"))
FIRECRAWL_SEARCH_LIMIT = int(os.environ.get("FIRECRAWL_SEARCH_LIMIT", "3"))

# --- Managed AI Gateway ---
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_PRIMARY_MODEL = os.environ.get(
    "OPENROUTER_PRIMARY_MODEL",
    "meta-llama/llama-3.3-70b-instruct:free",
)
OPENROUTER_RESEARCH_MODEL = os.environ.get(
    "OPENROUTER_RESEARCH_MODEL",
    OPENROUTER_PRIMARY_MODEL,
)
OPENROUTER_DOCUMENT_MODEL = os.environ.get(
    "OPENROUTER_DOCUMENT_MODEL",
    OPENROUTER_PRIMARY_MODEL,
)

# --- Minimax API Configuration ---
MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY", "")
MINIMAX_BASE_URL = os.environ.get("MINIMAX_BASE_URL", "https://api.minimax.ai/v1").rstrip("/")
MINIMAX_PRIMARY_MODEL = os.environ.get("MINIMAX_PRIMARY_MODEL", "mistral-7b")
MINIMAX_RESEARCH_MODEL = os.environ.get(
    "MINIMAX_RESEARCH_MODEL",
    MINIMAX_PRIMARY_MODEL,
)
MINIMAX_DOCUMENT_MODEL = os.environ.get(
    "MINIMAX_DOCUMENT_MODEL",
    MINIMAX_PRIMARY_MODEL,
)

# --- NVIDIA GLM API Configuration (OpenAI-compatible) ---
NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "")
NVIDIA_BASE_URL = os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1").rstrip("/")
NVIDIA_PRIMARY_MODEL = os.environ.get("NVIDIA_PRIMARY_MODEL", "z-ai/glm-5.1")
NVIDIA_RESEARCH_MODEL = os.environ.get(
    "NVIDIA_RESEARCH_MODEL",
    NVIDIA_PRIMARY_MODEL,
)
NVIDIA_DOCUMENT_MODEL = os.environ.get(
    "NVIDIA_DOCUMENT_MODEL",
    NVIDIA_PRIMARY_MODEL,
)

AI_PROVIDER = os.environ.get("AI_PROVIDER", "nvidia").lower()
AI_HTTP_TIMEOUT_SECONDS = int(os.environ.get("AI_HTTP_TIMEOUT_SECONDS", "45"))
AI_ENABLE_MANAGED_MODELS = os.environ.get("AI_ENABLE_MANAGED_MODELS", "true").lower() == "true"
AI_ENABLE_LOCAL_FALLBACK = os.environ.get("AI_ENABLE_LOCAL_FALLBACK", "true").lower() == "true"

# --- SQLite Databases (Legacy) ---
SQLITE_DB_PATH = os.path.join(BASE_DIR, "jurisai_auth.db")

# --- Secure Service Keys (Internal) ---
APP_CORE_TOKEN = os.environ.get("APP_CORE_TOKEN", os.environ.get("INTERNAL_SERVICE_KEY", ""))
LEGAL_PAPER_ENABLE_NEURAL_AUDIT = os.environ.get("LEGAL_PAPER_ENABLE_NEURAL_AUDIT", "false").lower() == "true"
LEGAL_PAPER_NEURAL_TIMEOUT_SECONDS = int(os.environ.get("LEGAL_PAPER_NEURAL_TIMEOUT_SECONDS", "6"))

# --- Supabase Cloud Config ---
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://lmdgukrozlxtagfszvep.supabase.co")
SUPABASE_KEY = os.environ.get("STORAGE_SERVICE_KEY", os.environ.get("SUPABASE_KEY", ""))

# --- SaaS Services ---
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")

# --- Twilio Configuration ---
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.environ.get(
    "TWILIO_PHONE_NUMBER",
    os.environ.get("TWILIO_FROM_NUMBER", ""),
)
TWILIO_SMS_NUMBER = os.environ.get("TWILIO_SMS_NUMBER", TWILIO_PHONE_NUMBER)
TWILIO_VOICE_NAME = os.environ.get("TWILIO_VOICE_NAME", "Polly.Joanna")

# --- Logo ---
LOGO_PATH = os.path.join(BASE_DIR, "assets", "jurisai_logo.png")
os.makedirs(os.path.join(BASE_DIR, "assets"), exist_ok=True)

# --- File Upload ---
MAX_FILE_SIZE_MB = 20
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".rtf", ".jpg", ".jpeg", ".png"}
