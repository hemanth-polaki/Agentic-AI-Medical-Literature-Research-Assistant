# BrightLit AI — Autonomous Medical Literature Research Assistant

An enterprise-grade, PRISMA-compliant multi-agent AI system for automated biomedical literature search, study screening, evidence extraction, cross-study benchmarking, reviewer citation audit, and dense FAISS vector RAG interaction.

---

## Architecture Overview

```
                      +------------------------------------------+
                      |         User Research Question           |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |       1. Query Planning Agent            |
                      |   Clinical Deconstruction & MeSH Query   |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |   2. Literature Retrieval Agent (NCBI)   |
                      |    Live PubMed API Candidate Search      |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |        3. Screening Agent (PRISMA)       |
                      |   Eligibility & Exclusion Filtering      |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |     4. Evidence Extraction Agent         |
                      |  Models, Datasets, Metrics Extraction    |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |      5. Cross-Study Comparison Agent     |
                      |   Taxonomy, Benchmarks & Research Gaps   |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |     6. Synthesis & Reviewer Agent        |
                      |  100% Grounded Claim Verification Audit  |
                      +------------------------------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |       7. FAISS Vector Store Indexer      |
                      |    Interactive Literature RAG Chat       |
                      +------------------------------------------+
```

---

## Technology Stack

### Backend
- **Python**: Core programming language
- **FastAPI**: High-performance asynchronous web framework
- **Custom Agent Framework**: 6-agent autonomous PRISMA systematic literature pipeline
- **LLM APIs**: OpenAI (GPT-4o) / Google Gemini (Gemini 2.5 Flash) / Anthropic Claude (Claude 3.5 Sonnet)
- **Pydantic**: Type validation, data parsing, and schemas
- **Async APIs**: Non-blocking asynchronous routes, SSE streaming, and async HTTP clients

### Frontend
- **React.js**: Modern component-based user interface
- **TypeScript**: Static typing and full schema safety
- **Tailwind CSS**: Clinical light design system and responsive utilities
- **Modular Components**: Dual-pane split workstation, executive summary, cross-study matrix, evidence table, agent trace terminal

### Domain & Storage Components
- **PubMed API**: NCBI Entrez E-Utilities (`esearch`, `efetch`, `esummary`)
- **FAISS**: Dense vector index (`IndexFlatIP`) for grounded semantic literature search
- **PostgreSQL / Redis**: Asynchronous relational persistence (SQLAlchemy + asyncpg) and Redis Agent Memory
- **Scientific PDF Processing**: PDF section extraction and parsing (`PyPDF2`)
- **Sentence Transformers**: `all-MiniLM-L6-v2` dense embedding generation
- **RAG**: Dense retrieval-augmented generation over indexed publications
- **Citation/Evidence Tracking**: 100% verified claim grounding anchored to PMIDs, DOIs, and quotes
- **Agent Memory**: Multi-tier working memory (Redis cache + persistent database records)

---

## Quick Start

### 1. Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```
Backend runs at: `http://localhost:8000`

### 2. Frontend (React + Vite + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## API Endpoints

- `GET /api/health` — Agent pipeline and vector store health check
- `POST /api/review/stream` — Real-time SSE multi-agent review pipeline stream
- `POST /api/review/sync` — Synchronous review generation
- `GET /api/review/{id}` — Fetch review by ID (re-populating FAISS vector index)
- `GET /api/reviews` — List past reviews from PostgreSQL
- `POST /api/rag/chat` — FAISS grounded Q&A over retrieved corpus
- `POST /api/pdf/upload` — Scientific PDF manuscript extraction
- `GET /api/benchmarks/sample` — Pre-configured clinical research benchmarks

---

## Cloud Deployment

BrightLit AI is pre-configured for zero-friction cloud deployment:
- **Backend on Render**: Uses [render.yaml](file:///render.yaml) for 1-click Blueprint deployment with FastAPI and managed PostgreSQL.
- **Frontend on Vercel**: Uses [vercel.json](file:///vercel.json) with Vite build optimizations and SPA routing.

For complete step-by-step instructions and environment variable references, see the **[Cloud Deployment Guide](file:///DEPLOYMENT.md)**.

