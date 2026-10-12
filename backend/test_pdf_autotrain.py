import asyncio
import io
import PyPDF2
from app.models.schemas import Paper
from app.tools.pdf_processor import pdf_processor
from app.rag.vector_store import vector_store
from app.rag.rag_service import rag_service

def create_sample_pdf(title: str, is_unpublished: bool = True) -> bytes:
    """Generate a clean synthetic PDF for testing extraction and RAG autotraining"""
    pdf_template = f"""%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>> endobj
4 0 obj <</Length 950>> stream
BT
/F1 12 Tf
50 720 Td
({title}) Tj
0 -20 Td
(Authors: Dr. Evelyn Reed, Dr. Marcus Thorne, Department of Biomedical Informatics) Tj
0 -20 Td
(Abstract: We present an autonomous study on graph convolutional transformers for multi-channel scalp EEG seizure forecasting.) Tj
0 -20 Td
(Introduction: Early detection of epileptic seizures is a paramount clinical challenge in neurology and patient safety.) Tj
0 -20 Td
(Methodology: We designed a Spatio-Temporal Graph Neural Network with continuous wavelet spectrogram inputs and patient-specific normalization.) Tj
0 -20 Td
(Datasets: The model was evaluated on the CHB-MIT Scalp EEG database comprising 24 pediatric patients and 198 clinical seizures.) Tj
0 -20 Td
(Results: The proposed architecture achieved 98.4% sensitivity with a false alarm rate of 0.08 per hour under cross-validation.) Tj
0 -20 Td
(Discussion: Graph convolutions exhibit superior resilience against physiological electromyography artifacts compared to 1D CNN baselines.) Tj
0 -20 Td
(Conclusion: Continuous wavelet graph transformers offer a viable pathway toward real-time wearable clinical closed-loop neurostimulation.) Tj
0 -20 Td
({"Unpublished Draft Manuscript - Not Submitted for Formal Journal Indexing" if is_unpublished else "PMID: 38472910 DOI: 10.1016/j.bspc.2024.105992"}) Tj
ET
endstream
endobj
5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000001250 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
1315
%%EOF"""
    return pdf_template.encode("utf-8")

async def test_pipeline():
    print("=== TEST 1: PDF Parsing & Classification ===")
    unpublished_pdf = create_sample_pdf("Novel Wavelet Graph Transformer for EEG Seizure Forecasting", is_unpublished=True)
    text = pdf_processor.extract_text_from_pdf(unpublished_pdf)
    assert len(text) > 0, "PDF extraction failed"
    print(f"Extracted {len(text)} characters from unpublished PDF.")

    paper_unpublished = pdf_processor.parse_scientific_paper(text, "Unpublished_EEG_Study.pdf")
    print(f"Parsed Title: {paper_unpublished.title}")
    print(f"Publication Status: {paper_unpublished.journal}")
    print(f"Is Unpublished: {paper_unpublished.is_unpublished}")
    print(f"Parsed Sections: {list(paper_unpublished.sections.keys())}")

    assert paper_unpublished.is_unpublished == True, "Failed to classify unpublished manuscript"
    assert "Methodology" in paper_unpublished.sections, "Failed to extract Methodology section"
    assert "Results" in paper_unpublished.sections, "Failed to extract Results section"

    print("\n=== TEST 2: Internal RAG Auto-Training ===")
    initial_chunks = len(vector_store.chunks)
    train_res = await rag_service.autotrain_on_uploaded_paper(paper_unpublished)
    assert train_res["status"] == "success"
    assert train_res["chunks_added"] > 0
    print(f"Auto-trained RAG! Added {train_res['chunks_added']} chunks. Total chunks now: {len(vector_store.chunks)}")
    
    scope = vector_store.get_corpus_scope()
    print(f"Corpus Scope has_unpublished: {scope.get('has_unpublished')}")
    print(f"Corpus Scope unpublished_count: {scope.get('unpublished_count')}")
    assert scope.get("has_unpublished") == True, "Corpus scope missing unpublished flag"

    print("\n=== TEST 3: Grounded RAG Chat Over Uploaded Manuscript ===")
    rag_query = "What methodology was evaluated in the uploaded manuscript?"
    answer_resp = await rag_service.answer_question(rag_query)
    print(f"Q: '{rag_query}'")
    print(f"A:\n{answer_resp.answer}")
    print(f"Confidence: {answer_resp.confidence}")
    print(f"Sources count: {len(answer_resp.grounded_sources)}")
    for s in answer_resp.grounded_sources:
        print(f" - Source: {s['title']} | Unpublished: {s.get('is_unpublished')} | Section: {s.get('section')}")

    assert len(answer_resp.grounded_sources) > 0, "No sources retrieved for uploaded manuscript query"
    assert any(s.get("is_unpublished") for s in answer_resp.grounded_sources), "Expected source from unpublished manuscript"

    print("\n=== TEST 4: Query Specific Numerical Results ===")
    metrics_query = "What sensitivity and false alarm rate did the wavelet graph model achieve?"
    metrics_resp = await rag_service.answer_question(metrics_query)
    print(f"Q: '{metrics_query}'")
    print(f"A:\n{metrics_resp.answer}")
    assert "98.4" in metrics_resp.answer or any("98.4" in s.get("snippet", "") for s in metrics_resp.grounded_sources), "Failed to retrieve grounded metric"

    print("\n[OK] ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test_pipeline())
