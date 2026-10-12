import asyncio
from fastapi.testclient import TestClient
from app.main import app

def test_rag_query_title_and_related_questions():
    client = TestClient(app)
    
    # 1. Test get corpus with review_id
    review_id = 'f880f85f-fba'
    
    # Pre-populate review cache for standalone test execution
    from app.agents.orchestrator import orchestrator
    from app.models.schemas import LiteratureReviewResponse, Paper
    if review_id not in orchestrator.reviews_cache:
        orchestrator.reviews_cache[review_id] = LiteratureReviewResponse(
            id=review_id,
            query="Optimized Cuttlefish Algorithm for EEG Seizure Detection",
            status="Completed",
            created_at="2026-10-12 00:00:00",
            selected_papers=[
                Paper(
                    id="paper-1",
                    title="Optimized Cuttlefish Algorithm for Seizure Detection in EEG",
                    abstract="Systematic evaluation of the Optimized Cuttlefish Algorithm for EEG epileptic seizure detection. The main findings demonstrate that the proposed bio-inspired metaheuristic method achieved 98.4% sensitivity and 99.1% specificity on CHB-MIT and Bonn EEG benchmarks, outperforming baseline SVM and CNN architectures.",
                    methods="ST-GCN feature extraction combined with Gray Wolf and Cuttlefish optimization hyperparameter tuning.",
                    findings="The primary findings indicate superior seizure onset detection with significantly reduced false alarm rates across adult cohorts. Benchmark datasets evaluated include CHB-MIT and Bonn EEG cohorts.",
                    datasets=["CHB-MIT", "Bonn EEG"],
                    models=["ST-GCN", "Cuttlefish Optimization"],
                    sections={
                        "Datasets & Cohorts": "Benchmark datasets and patient cohorts evaluated include the CHB-MIT Scalp EEG database and Bonn University EEG benchmark dataset evaluated across 24 pediatric and adult cohorts."
                    }
                )
            ]
        )
    
    corpus_res = client.get(f"/api/rag/corpus?review_id={review_id}")
    assert corpus_res.status_code == 200, f"Corpus fetch failed: {corpus_res.text}"
    corpus_data = corpus_res.json()
    print("[Test 1] Corpus fetched successfully:")
    print(f" - Query: {corpus_data.get('query')}")
    print(f" - Total papers: {corpus_data.get('total_papers')}")
    print(f" - Total chunks: {corpus_data.get('total_chunks')}")
    print(f" - Suggested questions count: {len(corpus_data.get('suggested_questions', []))}")
    for sq in corpus_data.get('suggested_questions', []):
        print(f"   * {sq}")
    assert corpus_data.get('query') is not None
    assert len(corpus_data.get('suggested_questions', [])) > 0

    # 2. Test asking "What is the query title?"
    chat_q_title = client.post("/api/rag/chat", json={
        "review_id": review_id,
        "question": "What is the query title?",
        "auto_train": False
    })
    assert chat_q_title.status_code == 200, f"Query title question failed: {chat_q_title.text}"
    data_title = chat_q_title.json()
    print("\n[Test 2] 'What is the query title?' response:")
    print(f" - is_out_of_bounds: {data_title.get('is_out_of_bounds')}")
    print(f" - confidence: {data_title.get('confidence')}")
    print(f" - answer preview: {data_title.get('answer', '').encode('ascii', 'replace')[:200]}...")
    assert not data_title.get('is_out_of_bounds')
    assert "Optimized Cuttlefish Algorithm" in data_title.get('answer')

    # 3. Test asking a related question on query title: "What are the main findings for this query?"
    chat_findings = client.post("/api/rag/chat", json={
        "review_id": review_id,
        "question": "What are the main findings for this query?",
        "auto_train": False
    })
    assert chat_findings.status_code == 200, f"Findings question failed: {chat_findings.text}"
    data_findings = chat_findings.json()
    print("\n[Test 3] 'What are the main findings for this query?' response:")
    print(f" - is_out_of_bounds: {data_findings.get('is_out_of_bounds')}")
    print(f" - confidence: {data_findings.get('confidence')}")
    print(f" - sources count: {len(data_findings.get('grounded_sources', []))}")
    print(f" - answer preview: {data_findings.get('answer', '').encode('ascii', 'replace')[:200]}...")
    assert not data_findings.get('is_out_of_bounds')
    assert len(data_findings.get('grounded_sources', [])) > 0

    # 4. Test asking: "What benchmark datasets and cohorts were evaluated?"
    chat_datasets = client.post("/api/rag/chat", json={
        "review_id": review_id,
        "question": "What benchmark datasets and cohorts were evaluated?",
        "auto_train": False
    })
    assert chat_datasets.status_code == 200, f"Datasets question failed: {chat_datasets.text}"
    data_datasets = chat_datasets.json()
    print("\n[Test 4] 'What benchmark datasets and cohorts were evaluated?' response:")
    print(f" - is_out_of_bounds: {data_datasets.get('is_out_of_bounds')}")
    print(f" - confidence: {data_datasets.get('confidence')}")
    print(f" - sources count: {len(data_datasets.get('grounded_sources', []))}")
    print(f" - answer preview: {data_datasets.get('answer', '').encode('ascii', 'replace')[:200]}...")
    assert not data_datasets.get('is_out_of_bounds')

    print("\n[SUCCESS] ALL RAG QUERY TITLE TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    test_rag_query_title_and_related_questions()
