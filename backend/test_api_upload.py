import asyncio
import io
from fastapi.testclient import TestClient
from app.main import app
from test_pdf_autotrain import create_sample_pdf

def test_api_upload_endpoint():
    client = TestClient(app)
    
    # 1. Test health check
    health_res = client.get("/api/health")
    assert health_res.status_code == 200, f"Health check failed: {health_res.text}"
    print("[API Test] Health check passed.")

    # 2. Test PDF upload and autotrain
    pdf_bytes = create_sample_pdf("Multi-Task Deep Learning for Neonatal EEG Seizure Detection", is_unpublished=True)
    files = {"file": ("unpublished_neonatal_study.pdf", pdf_bytes, "application/pdf")}
    
    upload_res = client.post("/api/pdf/upload", files=files)
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    data = upload_res.json()
    
    print("[API Test] Upload response received:")
    print(f" - Status: {data.get('status')}")
    print(f" - Publication Status: {data.get('publication_status')}")
    print(f" - Is Unpublished: {data.get('is_unpublished')}")
    print(f" - RAG Auto-trained: {data.get('rag_autotrained')}")
    print(f" - Chunks Indexed: {data.get('chunks_indexed')}")
    print(f" - Total Corpus Papers: {data.get('total_corpus_papers')}")
    print(f" - Total Corpus Chunks: {data.get('total_corpus_chunks')}")
    
    assert data.get("rag_autotrained") == True
    assert data.get("is_unpublished") == True
    assert data.get("chunks_indexed") > 0
    assert data.get("evidence") is not None

    # 3. Test RAG Chat query through API
    chat_res = client.post("/api/rag/chat", json={
        "question": "What is the methodology in the uploaded neonatal study?",
        "auto_train": False
    })
    assert chat_res.status_code == 200, f"Chat failed: {chat_res.text}"
    chat_data = chat_res.json()
    print("[API Test] RAG Chat response:")
    print(f" - Answer preview: {chat_data.get('answer')[:180]}...")
    print(f" - Sources: {len(chat_data.get('grounded_sources', []))}")
    assert len(chat_data.get("grounded_sources", [])) > 0
    print("[API Test] ALL ENDPOINT TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    test_api_upload_endpoint()
