# BrightLit AI — Cloud Deployment Guide

This guide provides step-by-step instructions to deploy the **Backend on Render** and the **Frontend on Vercel**.

---

## Architecture Overview

- **Backend**: FastAPI running on Python 3.11 with FAISS vector search, asyncpg for PostgreSQL, and optional Redis/LLM keys. Hosted as a Web Service on **Render**.
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS SPA. Hosted as a Static Web Application on **Vercel**.
- **Communication**: Frontend communicates with Backend via REST and Server-Sent Events (SSE) streaming using the `VITE_API_URL` environment variable.

---

## 1. Deploying the Backend on Render

You can deploy the backend using either **Render Blueprints (render.yaml)** or **Manual Setup**.

### Option A: 1-Click Blueprint Deploy (Recommended)

1. Push your repository to GitHub or GitLab.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Connect your repository.
5. Render will detect `render.yaml` at the root and automatically configure:
   - **Service Name**: `brightlit-backend`
   - **Environment**: `python`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `python run.py`
   - **Database**: Managed PostgreSQL instance (`brightlit-db`), automatically connected via `DATABASE_URL`.
6. Provide optional API keys when prompted:
   - `GEMINI_API_KEY`: *(Optional)* Your Google AI Gemini API key.
   - `OPENAI_API_KEY`: *(Optional)* Your OpenAI API key.
7. Click **Apply**.
8. Once deployment is complete, copy your Render service URL (e.g., `https://brightlit-backend.onrender.com`).

---

### Option B: Manual Web Service Setup

If you prefer to configure manually or connect your own external database (e.g., Neon or Supabase):

1. In Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Name**: `brightlit-backend`
   - **Region**: Select closest to your users (e.g., Oregon, Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `python run.py`
   - **Plan**: Free (or Starter)
4. Under **Environment Variables**, add:
   | Variable | Value | Description |
   |---|---|---|
   | `PYTHON_VERSION` | `3.11.9` | Ensures prebuilt wheels for torch/FAISS |
   | `ENVIRONMENT` | `production` | Disables debug reload |
   | `HOST` | `0.0.0.0` | Binds to all network interfaces |
   | `CORS_ORIGINS` | `*` *(or your Vercel URL)* | Allows cross-origin requests from Vercel |
   | `DATABASE_URL` | `postgresql+asyncpg://...` | *(Optional)* PostgreSQL connection string |
   | `GEMINI_API_KEY` | `AIza...` | *(Optional)* Google Gemini API key |
   | `OPENAI_API_KEY` | `sk-...` | *(Optional)* OpenAI API key |
   | `PUBMED_EMAIL` | `your-email@domain.com` | Contact email for NCBI PubMed Entrez |
5. Click **Create Web Service**.

> **Note on Free Tier Wake-up**: Render free web services spin down after 15 minutes of inactivity. When a request arrives, Render automatically spins the service back up within 30–45 seconds.

---

## 2. Deploying the Frontend on Vercel

### Step 1: Import Project to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository (`brightcone.ai`).

### Step 2: Configure Project Settings

1. **Framework Preset**: Select **Vite** (detected automatically).
2. **Root Directory**: Click **Edit** and select `frontend`.
   *(Note: A root `vercel.json` is also provided in the repository so builds succeed even if you leave the root directory unchanged).*
3. **Build and Output Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Step 3: Configure Environment Variables

Under **Environment Variables**, add:

| Key | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://brightlit-backend.onrender.com` | Your live Render backend URL (no trailing slash) |

4. Click **Deploy**.
5. Vercel will build and deploy the React application in ~30 seconds, generating a live URL like `https://brightlit.vercel.app`.

---

## 3. Post-Deployment Verification

### 1. Verify Backend Health
Open `https://<YOUR-RENDER-BACKEND-URL>/api/health` in your browser. You should receive a JSON response:
```json
{
  "status": "healthy",
  "service": "BrightLit AI Agentic Medical Literature Research Assistant",
  "technology_stack": { ... },
  "rag_vector_chunks": 0
}
```

### 2. Verify Frontend & Stream Integration
1. Open your Vercel frontend URL: `https://<YOUR-VERCEL-FRONTEND-URL>`.
2. Select a benchmark query (e.g., *Deep Learning EEG Seizure Detection*).
3. Click **Execute Systematic Review**.
4. Observe the real-time SSE agent traces streaming from the Render backend:
   - Query Planning Agent
   - Literature Retrieval Agent (live PubMed search)
   - PRISMA Screening Agent
   - Evidence Extraction Agent
   - Comparison Agent
   - Synthesis & Reviewer Agent
   - FAISS Vector RAG Indexing
5. Open the **FAISS RAG Research Assistant** drawer and ask a grounded question to verify the semantic vector index.
