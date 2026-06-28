<div align="center">

# ⚖️ JurisAI

**AI-Powered Legal Intelligence Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb.svg)](src/)
[![AI](https://img.shields.io/badge/AI-NVIDIA%20Gemma--3n-76b900.svg)]()
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab.svg)](backend/requirements.txt)
[![Node](https://img.shields.io/badge/Node.js-18+-339933.svg)](package.json)

</div>

---

JurisAI is a full-stack legal research and document analysis platform that combines RAG (Retrieval-Augmented Generation) with a modern web interface. It ingests Indian legal datasets — Supreme Court judgments, IPC/CrPC sections, and landmark cases — into a vector store for intelligent semantic search and AI-powered analysis.

## Features

- **Neural Document Audit** — Deep analysis of legal documents using NVIDIA Gemma-3n
- **RAG Research Engine** — Semantic search across Supreme Court judgments, IPC, and CrPC datasets
- **Contract Analyzer** — AI-driven contract review with risk identification
- **Draft Generator** — Automated legal document drafting
- **Case Dashboard** — Track and manage cases with analytics
- **Lawyer Directory** — Browse and connect with legal professionals
- **Client Portal** — Public case tracking for clients (`/track`)
- **Admin Panel** — User management, analytics, and system oversight

## Architecture

```
legalai/
├── backend/                 # FastAPI server
│   ├── ai/                  # RAG pipeline, embeddings, vector store
│   ├── api/routes/          # API route handlers (auth, research, contracts, etc.)
│   ├── services/            # Business logic (auth, email, AI gateway, Twilio)
│   ├── database/            # Database schemas and initialization
│   ├── legal_data/          # Ingested legal documents (git-ignored)
│   ├── chroma_db/           # Vector store (git-ignored)
│   ├── uploads/             # User uploads (git-ignored)
│   ├── main.py              # Application entrypoint
│   ├── config.py            # Centralized configuration
│   └── requirements.txt     # Python dependencies
├── src/                     # React + Vite frontend
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Design system (buttons, cards, inputs)
│   │   ├── layout/          # Navbar, Footer, AppLayout
│   │   ├── landing/         # Landing page sections
│   │   └── editorial/       # Editorial landing components
│   ├── pages/               # Route-level page components
│   ├── lib/                 # API client, utilities, design tokens
│   ├── config.js            # Frontend configuration
│   ├── App.jsx              # Root component with routing
│   └── main.jsx             # Entry point
├── scripts/                 # Automation scripts (data download, setup)
├── tests/                   # Backend test suites
├── datasets/                # Legal reference data (git-ignored, generate locally)
├── docs/                    # Documentation
├── docker-compose.yml       # Multi-service orchestration
├── vite.config.js           # Vite + Tailwind configuration
└── package.json             # Frontend dependencies
```

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **Docker Desktop** (optional, for Firecrawl web research)

### 1. Clone & Install

```bash
git clone https://github.com/armaa11/legalai.git
cd legalai

# Frontend
npm install

# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cd ..
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys (NVIDIA, Twilio, Resend, Supabase, etc.)
cd ..
```

### 3. Run

```powershell
# Start everything (frontend + backend)
npm run dev:full

# Or start separately:
npm run dev              # Frontend on http://localhost:5173
cd backend && python main.py  # Backend on http://localhost:8000
```

### 4. Docker (Optional)

```bash
# Backend + Frontend only
docker compose up backend frontend

# With Ollama (local LLM)
docker compose --profile ai up

# Full stack
docker compose --profile ai --profile api --profile web up
```

## API Endpoints

| Route | Description |
|-------|-------------|
| `GET /` | Health check |
| `GET /docs` | Swagger UI |
| `POST /api/auth/login` | User login |
| `POST /api/auth/register` | User registration |
| `GET /api/research/search` | Semantic legal search |
| `POST /api/contracts/analyze` | Contract analysis |
| `POST /api/drafts/generate` | Legal draft generation |
| `GET /api/cases` | Case management |
| `GET /api/lawyers` | Lawyer directory |
| `GET /api/analytics` | Platform analytics |

Full API documentation available at `http://localhost:8000/docs` when the server is running.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, React Router 7 |
| Backend | FastAPI, Uvicorn, SQLAlchemy |
| AI/ML | NVIDIA Gemma-3n, Ollama (local), ChromaDB, sentence-transformers |
| Database | Supabase (PostgreSQL), SQLite (legacy) |
| Auth | JWT (python-jose), bcrypt |
| Services | Resend (email), Twilio (voice/SMS), Firecrawl (web scraping) |
| Infra | Docker Compose, PowerShell scripts |

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for all configuration options. Key variables:

| Variable | Description |
|----------|-------------|
| `NVIDIA_API_KEY` | NVIDIA API key for Gemma-3n |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/service key |
| `JWT_SECRET` | JWT signing secret |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `RESEND_API_KEY` | Resend email API key |
| `OLLAMA_MODEL` | Local LLM model name |

## Datasets

Legal data is not committed to the repository. Use the scripts in `scripts/` to generate datasets locally:

```bash
python scripts/download_court_cases.py
python scripts/download_bare_acts.py
python scripts/download_hf_datasets.py
python scripts/generate_contracts.py
```

Place generated data in `backend/legal_data/` for RAG ingestion. The system auto-ingests on first startup if the vector store is empty.

## Security

- **Never commit `.env` files** — use `.env.example` as a template
- All secrets are loaded from environment variables
- JWT-based authentication with bcrypt password hashing
- CORS configured for local development only

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built for the legal community
</div>
