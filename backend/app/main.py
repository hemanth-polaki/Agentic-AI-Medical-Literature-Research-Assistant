from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
import json
from typing import List, Optional

from app.config import settings
from app.models.schemas import (
    SearchRequest,
    LiteratureReviewResponse,
    RAGQuestionRequest,
    RAGQuestionResponse,
    RAGTrainRequest
)
from app.models.database import init_db
from app.agents.orchestrator import orchestrator
from app.tools.pdf_processor import pdf_processor
from app.rag.rag_service import rag_service
from app.rag.vector_store import vector_store

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Agentic AI Medical Literature Research Assistant automating literature search, screening, extraction, cross-study comparison, and grounded synthesis.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()
    print("[Server] Database initialized.")
    # Warm up embedding model in background thread for fast RAG indexing
    import asyncio
    from app.rag.embeddings import embedding_model
    asyncio.create_task(asyncio.to_thread(embedding_model._load_model))

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "technology_stack": {
            "backend": "Python / FastAPI / Async APIs / Pydantic",
            "agent_framework": "Custom PRISMA Multi-Agent System",
            "llm_apis": "OpenAI / Gemini / Claude APIs",
            "scholarly_api": "NCBI Entrez PubMed API",
            "vector_store": "FAISS Vector Store",
            "embeddings": "Sentence Transformers (all-MiniLM-L6-v2)",
            "database_and_memory": "PostgreSQL / Redis Agent Memory",
            "pdf_processing": "Scientific PDF Processing (PyPDF2)",
            "frontend": "React.js / TypeScript / Tailwind CSS"
        },
        "agents": [
            "Query Planning Agent",
            "Literature Retrieval Agent (PubMed)",
            "Screening Agent (PRISMA)",
            "Evidence Extraction Agent",
            "Comparison Agent",
            "Synthesis & Reviewer Agent"
        ],
        "rag_vector_chunks": len(vector_store.chunks)
    }

@app.post("/api/review/stream")
async def stream_review(request: SearchRequest):
    """Streams the multi-agent literature research workflow via Server-Sent Events (SSE).
    Emits real-time agent trace events, status transitions, and data updates."""
    async def event_generator():
        async for chunk_json in orchestrator.stream_review(request):
            yield {"event": "message", "data": chunk_json}
    
    return EventSourceResponse(event_generator())

@app.post("/api/review/sync", response_model=LiteratureReviewResponse)
async def sync_review(request: SearchRequest):
    """Runs the full agent pipeline synchronously and returns the complete literature review."""
    last_response = None
    async for chunk_json in orchestrator.stream_review(request):
        data = json.loads(chunk_json)
        if data.get("type") in ["completed", "synthesis_ready"]:
            last_response = LiteratureReviewResponse(**data["data"])
    
    if not last_response:
        raise HTTPException(status_code=500, detail="Review generation failed")
    return last_response

@app.get("/api/review/{review_id}", response_model=LiteratureReviewResponse)
async def get_review(review_id: str):
    review = await orchestrator.get_review_by_id(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review

@app.get("/api/reviews")
async def list_reviews():
    return await orchestrator.list_reviews()

from app.agents.evidence_extractor import evidence_extractor

@app.post("/api/pdf/upload")
async def upload_pdf(file: UploadFile = File(...), review_id: Optional[str] = Form(None)):
    """Uploads a scientific PDF manuscript (published or unpublished), extracts sections, and autotrains the internal FAISS RAG immediately."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    content = await file.read()
    text = pdf_processor.extract_text_from_pdf(content)
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from the provided PDF.")
    
    paper = pdf_processor.parse_scientific_paper(text, file.filename)

    # ⚡ Autotrain the internal FAISS RAG vector store with the uploaded manuscript
    train_result = await rag_service.autotrain_on_uploaded_paper(paper)

    # Extract clinical evidence profile for the paper
    evidence_items = await evidence_extractor.extract_evidence([paper])
    evidence = evidence_items[0] if evidence_items else None

    # If review_id is provided and review is cached, append to review
    if review_id and review_id in orchestrator.reviews_cache:
        rev = orchestrator.reviews_cache[review_id]
        if not any(p.id == paper.id for p in rev.retrieved_papers):
            rev.retrieved_papers.insert(0, paper)
        if not any(p.id == paper.id for p in rev.selected_papers):
            rev.selected_papers.insert(0, paper)
        if evidence and not any(e.paper_id == paper.id for e in rev.evidence_table):
            rev.evidence_table.insert(0, evidence)

    return {
        "status": "success",
        "paper": paper.model_dump(),
        "extracted_chars": len(text),
        "is_unpublished": paper.is_unpublished,
        "publication_status": train_result.get("publication_status", "Unpublished Manuscript" if paper.is_unpublished else "Published Paper"),
        "rag_autotrained": True,
        "chunks_indexed": train_result.get("chunks_added", 0),
        "total_corpus_papers": train_result.get("total_papers", len(vector_store.indexed_papers)),
        "total_corpus_chunks": train_result.get("total_chunks", len(vector_store.chunks)),
        "corpus_scope": train_result.get("corpus_scope", vector_store.get_corpus_scope()),
        "evidence": evidence.model_dump() if evidence else None
    }

@app.post("/api/rag/chat", response_model=RAGQuestionResponse)
async def rag_chat(request: RAGQuestionRequest):
    """Answers research questions grounded directly in the retrieved literature chunks using FAISS"""
    if request.review_id:
        if getattr(vector_store, "current_review_id", None) != request.review_id or len(vector_store.chunks) == 0:
            rev = await orchestrator.get_review_by_id(request.review_id)
            if rev:
                vector_store.index_review(rev)
    return await rag_service.answer_question(request.question, review_id=request.review_id, auto_train=request.auto_train)

@app.post("/api/rag/train")
async def rag_train(request: RAGTrainRequest):
    """Dynamically trains and expands the FAISS RAG index with peer-reviewed literature on a specified topic"""
    if request.review_id:
        if getattr(vector_store, "current_review_id", None) != request.review_id or len(vector_store.chunks) == 0:
            rev = await orchestrator.get_review_by_id(request.review_id)
            if rev:
                vector_store.index_review(rev)
    return await rag_service.train_on_topic(request.topic, max_papers=request.max_papers)

@app.get("/api/rag/corpus")
async def get_rag_corpus(review_id: Optional[str] = None):
    """Returns current active literature corpus statistics, topics, and paper counts"""
    if review_id:
        if getattr(vector_store, "current_review_id", None) != review_id or len(vector_store.chunks) == 0:
            rev = await orchestrator.get_review_by_id(review_id)
            if rev:
                vector_store.index_review(rev)
    return vector_store.get_corpus_scope()


@app.get("/api/benchmarks/sample")
async def get_sample_benchmark():
    """Provides sample pre-configured research queries for one-click testing"""
    return {
        "sample_queries": [
            {
                "id": "eeg-seizure-dl",
                "title": "Deep Learning EEG Seizure Detection Benchmark",
                "query": "Review recent research on deep-learning methods for EEG seizure detection and compare datasets, models, validation methods, and evaluation metrics.",
                "domain": "Neurology & Neuro-Informatics",
                "recommended": True
            },
            {
                "id": "cardiac-arrhythmia-ecg",
                "title": "Deep Learning for ECG Arrhythmia Classification",
                "query": "Synthesize recent advances in 12-lead ECG arrhythmia detection using convolutional transformers, evaluating MIT-BIH and PTB-XL datasets.",
                "domain": "Cardiology & AI",
                "recommended": False
            },
            {
                "id": "cxr-pneumonia-multimodal",
                "title": "Chest X-Ray Pneumonia and COVID-19 Detection",
                "query": "Review multimodal vision-language models for chest radiograph pulmonary opacity detection, comparing CheXpert and MIMIC-CXR benchmarks.",
                "domain": "Radiology & Multimodal AI",
                "recommended": False
            }
        ]
    }
