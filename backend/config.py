import os
from dotenv import load_dotenv

load_dotenv()

# --- Paths ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
GENERATED_DIR = os.path.join(BASE_DIR, "generated_documents")
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
LEGAL_DATA_DIR = os.path.join(BASE_DIR, "legal_data")
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")

# Create directories if they don't exist
for d in [UPLOAD_DIR, GENERATED_DIR, TEMPLATE_DIR, LEGAL_DATA_DIR, CHROMA_DIR]:
    os.makedirs(d, exist_ok=True)

# --- JWT Auth ---
JWT_SECRET = "jurisai-secret-key-change-in-production"
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

# --- SQLite Databases (Legacy) ---
SQLITE_DB_PATH = os.path.join(BASE_DIR, "jurisai_auth.db")

# --- Secure Service Keys (Internal) ---
APP_CORE_TOKEN = os.environ.get("APP_CORE_TOKEN", os.environ.get("INTERNAL_SERVICE_KEY", ""))

# --- Supabase Cloud Config ---
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://lmdgukrozlxtagfszvep.supabase.co")
SUPABASE_KEY = os.environ.get("STORAGE_SERVICE_KEY", os.environ.get("SUPABASE_KEY", ""))

# --- SaaS Services ---
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")

# --- Logo ---
LOGO_PATH = os.path.join(BASE_DIR, "assets", "jurisai_logo.png")
os.makedirs(os.path.join(BASE_DIR, "assets"), exist_ok=True)

# --- File Upload ---
MAX_FILE_SIZE_MB = 20
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".jpg", ".jpeg", ".png"}
