# ⚖️ JurisAI — Premium Legal Intelligence

[![Status](https://img.shields.io/badge/Status-Production--Ready-success.svg?style=flat-square)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI-blue.svg?style=flat-square)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb.svg?style=flat-square)]()
[![AI](https://img.shields.io/badge/AI-NVIDIA%20Gemma--3n-76b900.svg?style=flat-square)]()

JurisAI is a state-of-the-art legal research and document analysis platform designed for modern law practices. It combines high-performance neural auditing with a robust RAG (Retrieval-Augmented Generation) pipeline to deliver precise, actionable legal insights.

---

## ✨ Core Intelligence Features

- **🧠 Neural Audit**: Deep-dive document analysis powered by NVIDIA Gemma-3n for unmatched precision.
- **📚 RAG Research Engine**: Augmented intelligence drawing from Landmark cases, IPC, and CrPC datasets.
- **🖼️ Visual Evidence Gallery**: Real-time web-source visualization with automated favicon mapping and link verification.
- **⚖️ Strategic Advisory**: Advanced AI-driven litigation strategy and negotiation modeling.
- **⚡ High-Fidelity Interface**: A premium, minimalist design system built for professional focus.

---

## 🚀 Getting Started

### 📦 1. Installation

Ensure you have **Node.js 18+**, **Python 3.10+**, and **Docker Desktop** installed.

```powershell
# Clone the repository
git clone https://github.com/armaa11/legalai.git
cd legalai

# Install dependencies
npm install
cd backend
pip install -r requirements.txt
cd ..
```

### 🛠️ 2. Infrastructure Setup

The research pipeline requires a local **Firecrawl** stack for premium web scraping and data extraction.

```powershell
# Start the scraping infrastructure
.\scripts\start_firecrawl.ps1
```

### 🔥 3. Running the Platform

You can start the entire stack (Infrastructure + Backend + Frontend) with a single command:

```powershell
npm run dev:full
```

Alternatively, start them separately:

**Backend API:**
```powershell
cd backend
python main.py
```

**Frontend App:**
```powershell
npm run dev
```

---

## 📁 Project Structure

```text
├── 📂 backend         # FastAPI server, AI services, and database logic
├── 📂 src             # React + Vite frontend with Tailwind CSS
├── 📂 scripts         # Automation and utility scripts
├── 📂 tests           # E2E and unit testing suites
├── 📂 datasets        # Legal reference materials (IPC, CrPC, Cases)
├── 📂 docs            # Documentation and architecture guides
└── 📂 public          # Static assets
```

---

## 🔒 Security & Privacy

JurisAI is designed with privacy in mind. All document processing can be configured to run within your private infrastructure. Ensure your `.env` files are properly configured and never committed to version control.

---

## 🤝 Contributing

We welcome contributions from legal tech enthusiasts. Please read our `CONTRIBUTING.md` (coming soon) for details on our code of conduct and the process for submitting pull requests.

---

<p align="center">
  Developed with ❤️ for the Legal Community.
</p>
