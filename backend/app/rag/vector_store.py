import numpy as np
import re
from typing import List, Dict, Any, Optional, Tuple

try:
    import faiss
except ImportError:
    # Pure-NumPy Inner Product (cosine) vector index fallback if FAISS is not installed
    class NumpyIndexFlatIP:
        def __init__(self, dimension: int):
            self.dimension = dimension
            self.vectors = np.empty((0, dimension), dtype=np.float32)
            self.ntotal = 0

        def add(self, x: np.ndarray):
            if x.ndim == 1:
                x = np.expand_dims(x, 0)
            self.vectors = np.vstack([self.vectors, x]) if self.ntotal > 0 else x.astype(np.float32)
            self.ntotal = len(self.vectors)

        def search(self, q: np.ndarray, k: int):
            if self.ntotal == 0:
                return np.zeros((1, 0)), np.zeros((1, 0), dtype=int)
            sims = np.dot(q, self.vectors.T)[0]
            top_k_indices = np.argsort(sims)[::-1][:k]
            top_k_scores = sims[top_k_indices]
            return np.expand_dims(top_k_scores, 0), np.expand_dims(top_k_indices, 0)

    class DummyFaiss:
        IndexFlatIP = NumpyIndexFlatIP

    faiss = DummyFaiss()

from app.models.schemas import Paper
from app.rag.embeddings import embedding_model

class PaperVectorStore:
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)
        self.chunks: List[Dict[str, Any]] = []
        self.indexed_papers: List[Paper] = []
        self.current_review_id: Optional[str] = None
        self.current_review_query: Optional[str] = None

    def chunk_paper(self, paper: Paper) -> List[Dict[str, Any]]:
        """
        Split abstract, structured sections, and full text into multi-granular semantic chunks
        with explicit metadata tracking (sections, publication status, identifiers).
        """
        chunks = []
        is_unpub = getattr(paper, "is_unpublished", False)
        venue_tag = paper.journal or ("Unpublished Manuscript" if is_unpub else "Published Article")
        
        # 1. Primary Overview Chunk with Authors and Metadata
        authors_formatted = ", ".join(paper.authors) if paper.authors else "Unknown Authors"
        overview_text = (
            f"Study Title: {paper.title}\n"
            f"Authors: {authors_formatted}\n"
            f"Publication Status: {venue_tag} ({paper.year})\n"
            f"Identifiers: {paper.pmid or paper.doi or 'Unpublished Local Manuscript'}\n"
            f"Abstract: {paper.abstract}"
        )
        chunks.append({
            "paper_id": paper.id,
            "pmid": paper.pmid,
            "doi": paper.doi,
            "title": paper.title,
            "authors": paper.authors,
            "section": "Study Overview & Authors",
            "source": paper.source,
            "is_unpublished": is_unpub,
            "text": overview_text
        })

        # 2. Granular Sentence-Window Sub-Chunks from Abstract (2-3 sentences each)
        if paper.abstract:
            sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', paper.abstract) if len(s.strip()) > 20]
            for i in range(0, len(sentences), 2):
                window = " ".join(sentences[i:i+3])
                if len(window) > 40:
                    chunks.append({
                        "paper_id": paper.id,
                        "pmid": paper.pmid,
                        "doi": paper.doi,
                        "title": paper.title,
                        "section": f"Abstract Excerpt {i//2 + 1}",
                        "source": paper.source,
                        "is_unpublished": is_unpub,
                        "text": f"Study: {paper.title} [{venue_tag}]\nSection: Abstract\nExcerpt: {window}"
                    })

        # 3. Structured Canonical Sections (Methodology, Datasets, Results, Discussion, Conclusion)
        sections = getattr(paper, "sections", {}) or {}
        if sections:
            for sec_name, sec_text in sections.items():
                if sec_name == "Abstract" or not sec_text.strip():
                    continue
                
                # Split section into paragraphs or ~180-word blocks
                paragraphs = [p.strip() for p in sec_text.split("\n\n") if len(p.strip()) > 25]
                curr_block = []
                curr_words = 0
                block_idx = 1
                
                for p in paragraphs:
                    curr_block.append(p)
                    curr_words += len(p.split())
                    if curr_words >= 150:
                        chunks.append({
                            "paper_id": paper.id,
                            "pmid": paper.pmid,
                            "doi": paper.doi,
                            "title": paper.title,
                            "section": f"{sec_name} (Part {block_idx})",
                            "source": paper.source,
                            "is_unpublished": is_unpub,
                            "text": f"Study: {paper.title} [{venue_tag}]\nSection: {sec_name}\nContent: " + " ".join(curr_block)
                        })
                        curr_block = []
                        curr_words = 0
                        block_idx += 1
                        
                if curr_block:
                    chunks.append({
                        "paper_id": paper.id,
                        "pmid": paper.pmid,
                        "doi": paper.doi,
                        "title": paper.title,
                        "section": f"{sec_name} (Part {block_idx})" if block_idx > 1 else sec_name,
                        "source": paper.source,
                        "is_unpublished": is_unpub,
                        "text": f"Study: {paper.title} [{venue_tag}]\nSection: {sec_name}\nContent: " + " ".join(curr_block)
                    })

        # 4. Fallback Full Text Segments (if sections dictionary was empty)
        elif paper.full_text and len(paper.full_text) > len(paper.abstract):
            paragraphs = paper.full_text.split("\n\n")
            current_chunk = []
            current_len = 0
            for para in paragraphs:
                p_text = para.strip()
                if not p_text:
                    continue
                current_chunk.append(p_text)
                current_len += len(p_text.split())
                if current_len >= 200:
                    chunks.append({
                        "paper_id": paper.id,
                        "pmid": paper.pmid,
                        "doi": paper.doi,
                        "title": paper.title,
                        "section": "Methodology / Body",
                        "source": paper.source,
                        "is_unpublished": is_unpub,
                        "text": f"Study: {paper.title} [{venue_tag}]\n" + "\n".join(current_chunk)
                    })
                    current_chunk = []
                    current_len = 0
            if current_chunk:
                chunks.append({
                    "paper_id": paper.id,
                    "pmid": paper.pmid,
                    "doi": paper.doi,
                    "title": paper.title,
                    "section": "Methodology / Body",
                    "source": paper.source,
                    "is_unpublished": is_unpub,
                    "text": f"Study: {paper.title} [{venue_tag}]\n" + "\n".join(current_chunk)
                })

        return chunks

    def index_papers(self, papers: List[Paper]):
        """Index a list of papers into FAISS with multi-granular chunks"""
        self.indexed_papers = list(papers)
        all_chunks = []
        for p in papers:
            all_chunks.extend(self.chunk_paper(p))

        if not all_chunks:
            self.index = faiss.IndexFlatIP(self.dimension)
            self.chunks = []
            return

        texts = [c["text"] for c in all_chunks]
        embeddings = embedding_model.embed_documents(texts)
        
        # Reset and add to FAISS
        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(embeddings.astype(np.float32))
        self.chunks = all_chunks
        print(f"[VectorStore] Indexed {len(papers)} papers into {len(all_chunks)} granular FAISS chunks.")

    def index_review(self, review: Any):
        """
        Index an entire literature review (selected papers, evidence table, cross-study comparisons, and synthesis)
        into FAISS so RAG answers both granular study questions and high-level review inquiry.
        """
        self.current_review_id = getattr(review, "id", None)
        self.current_review_query = getattr(review, "query", None)
        papers = getattr(review, "selected_papers", []) or getattr(review, "retrieved_papers", []) or []
        self.indexed_papers = list(papers)
        all_chunks = []

        # 1. Multi-granular chunks from all candidate and selected papers
        for p in papers:
            all_chunks.extend(self.chunk_paper(p))

        # 2. Evidence extraction profile chunks
        evidence_table = getattr(review, "evidence_table", []) or []
        for e in evidence_table:
            cit = getattr(e, "citation", "Included Study")
            findings = getattr(e, "key_findings", "")
            metrics_dict = getattr(e, "metrics", {}) or {}
            metrics_str = ", ".join(f"{k}: {v}" for k, v in metrics_dict.items()) if isinstance(metrics_dict, dict) else str(metrics_dict)
            text = (
                f"Evidence Extraction Profile for {cit}:\n"
                f"Paper Title: {getattr(e, 'paper_title', '')}\n"
                f"Model Architecture: {getattr(e, 'model_architecture', 'N/A')}\n"
                f"Dataset & Cohort: {getattr(e, 'dataset', 'N/A')} ({getattr(e, 'sample_size', 'N/A')})\n"
                f"Validation Strategy: {getattr(e, 'validation_method', 'N/A')}\n"
                f"Extracted Metrics: {metrics_str}\n"
                f"Key Findings: {findings}\n"
                f"Limitations: {getattr(e, 'limitations', 'N/A')}\n"
                f"Direct Clinical Evidence Quote: {getattr(e, 'evidence_quote', '')}"
            )
            all_chunks.append({
                "paper_id": getattr(e, "paper_id", ""),
                "pmid": getattr(e, "pmid", ""),
                "doi": getattr(e, "doi", ""),
                "title": getattr(e, "paper_title", cit),
                "section": f"Evidence Matrix: {cit}",
                "source": "PRISMA Evidence Table",
                "is_unpublished": False,
                "text": text
            })

        # 3. Cross-Study Comparison & Key Findings / Gaps chunks
        comparison = getattr(review, "comparison", None)
        if comparison:
            kf = getattr(comparison, "key_findings", []) or []
            if kf:
                all_chunks.append({
                    "paper_id": "review-findings",
                    "title": f"Synthesis Findings: {getattr(review, 'query', 'Clinical Review')}",
                    "section": "Key Findings & Consensus",
                    "source": "PRISMA Comparative Synthesis",
                    "is_unpublished": False,
                    "text": f"Synthesized Key Discoveries across included studies on '{getattr(review, 'query', '')}':\n" + "\n".join(f"• {f}" for f in kf)
                })
            gaps = getattr(comparison, "research_gaps", []) or []
            if gaps:
                all_chunks.append({
                    "paper_id": "review-gaps",
                    "title": f"Translational Research Gaps: {getattr(review, 'query', 'Clinical Review')}",
                    "section": "Identified Research Gaps",
                    "source": "PRISMA Comparative Synthesis",
                    "is_unpublished": False,
                    "text": f"Identified Methodological & Clinical Translation Gaps for '{getattr(review, 'query', '')}':\n" + "\n".join(f"• {g}" for g in gaps)
                })
            datasets_comp = getattr(comparison, "datasets_comparison", []) or []
            if datasets_comp:
                ds_texts = []
                for d in datasets_comp:
                    dname = getattr(d, 'dataset_name', '')
                    subj = getattr(d, 'subjects_count', '')
                    rectype = getattr(d, 'recording_type', '')
                    pros = getattr(d, 'pros', '')
                    cons = getattr(d, 'cons', '')
                    ds_texts.append(f"Dataset {dname} ({subj}, {rectype}): Strengths: {pros}. Limitations: {cons}")
                all_chunks.append({
                    "paper_id": "review-datasets",
                    "title": f"Dataset Benchmark Matrix: {getattr(review, 'query', 'Clinical Review')}",
                    "section": "Comparative Datasets Benchmark",
                    "source": "PRISMA Comparison Matrix",
                    "is_unpublished": False,
                    "text": f"Dataset Comparative Analysis for '{getattr(review, 'query', '')}':\n" + "\n".join(ds_texts)
                })
            models_comp = getattr(comparison, "models_comparison", []) or []
            if models_comp:
                m_texts = []
                for m in models_comp:
                    mfam = getattr(m, 'model_family', '')
                    march = getattr(m, 'typical_architecture', '')
                    mviab = getattr(m, 'clinical_realtime_viability', '')
                    mcomp = getattr(m, 'computational_complexity', '')
                    m_texts.append(f"Architecture Family {mfam}: Architecture: {march}. Viability: {mviab}. Complexity: {mcomp}")
                all_chunks.append({
                    "paper_id": "review-models",
                    "title": f"Model Architectures Benchmark: {getattr(review, 'query', 'Clinical Review')}",
                    "section": "Computational Architectures Benchmark",
                    "source": "PRISMA Comparison Matrix",
                    "is_unpublished": False,
                    "text": f"Model Architectures Comparative Analysis for '{getattr(review, 'query', '')}':\n" + "\n".join(m_texts)
                })

        # 4. Final Executive Synthesis Chunks
        final_synthesis = getattr(review, "final_synthesis", "") or ""
        if final_synthesis:
            sections = final_synthesis.split("\n## ")
            for sec in sections:
                sec_text = sec.strip()
                if not sec_text:
                    continue
                header = sec_text.split("\n")[0].strip("# ").strip()
                body = "\n".join(sec_text.split("\n")[1:]).strip()
                if body:
                    all_chunks.append({
                        "paper_id": "review-synthesis",
                        "title": f"Literature Review Synthesis: {getattr(review, 'query', 'Systematic Review')}",
                        "section": f"Synthesis: {header}",
                        "source": "Systematic Review Synthesis",
                        "is_unpublished": False,
                        "text": f"Systematic Review on '{getattr(review, 'query', '')}' [{header}]:\n{body[:1200]}"
                    })

        if not all_chunks:
            self.index = faiss.IndexFlatIP(self.dimension)
            self.chunks = []
            return

        texts = [c["text"] for c in all_chunks]
        embeddings = embedding_model.embed_documents(texts)
        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(embeddings.astype(np.float32))
        self.chunks = all_chunks
        print(f"[VectorStore] Indexed review '{getattr(review, 'id', '')}' ({len(papers)} papers, {len(all_chunks)} total semantic chunks in FAISS).")

    def add_papers(self, papers: List[Paper]) -> int:
        """Dynamically train and expand the FAISS index with newly retrieved or uploaded papers without wiping existing corpus"""
        existing_ids = {p.id for p in self.indexed_papers}
        new_papers = [p for p in papers if p.id not in existing_ids]
        
        if not new_papers:
            return 0

        # If vector store is currently uninitialized or empty, index directly
        if len(self.chunks) == 0:
            self.index_papers(new_papers)
            return len(new_papers)

        new_chunks = []
        for p in new_papers:
            new_chunks.extend(self.chunk_paper(p))

        if not new_chunks:
            return 0

        texts = [c["text"] for c in new_chunks]
        new_embeddings = embedding_model.embed_documents(texts)

        # Append to FAISS index
        self.index.add(new_embeddings.astype(np.float32))
        self.chunks.extend(new_chunks)
        self.indexed_papers.extend(new_papers)
        print(f"[VectorStore] Added {len(new_papers)} papers ({len(new_chunks)} chunks). Total in index: {len(self.indexed_papers)} papers, {len(self.chunks)} chunks.")
        return len(new_papers)

    def get_corpus_scope(self) -> Dict[str, Any]:
        """Returns metadata detailing the topics, unpublished manuscripts, and papers currently indexed in FAISS"""
        topics = set()
        unpublished_titles = []
        uploaded_count = 0

        if getattr(self, "current_review_query", None):
            clean_q = self.current_review_query.replace("\n", " ").strip()
            if len(clean_q) > 48:
                clean_q = clean_q[:48] + "..."
            topics.add(clean_q)

        for p in self.indexed_papers:
            title_lower = p.title.lower()
            is_unpub = getattr(p, "is_unpublished", False)
            if is_unpub:
                unpublished_titles.append(p.title)
            if "uploaded" in str(p.source).lower():
                uploaded_count += 1

            if any(k in title_lower for k in ["parkinson", "wolf", "gwo", "grey wolf"]):
                topics.add("Parkinson's & Metaheuristic Optimizers")
            elif any(k in title_lower for k in ["eeg", "seizure", "epilep"]):
                topics.add("Epileptic Seizure & Scalp EEG Detection")
            elif any(k in title_lower for k in ["ecg", "cardiac", "arrhythmia", "heart"]):
                topics.add("12-Lead ECG & Cardiac Arrhythmia")
            elif any(k in title_lower for k in ["cxr", "x-ray", "radiograph", "pneumonia", "pulmonary"]):
                topics.add("Chest Radiography & Pulmonary Opacity")
            elif any(k in title_lower for k in ["diabetes", "metformin", "glucose"]):
                topics.add("Endocrinology & Diabetes")
            elif any(k in title_lower for k in ["cancer", "oncology", "tumor"]):
                topics.add("Oncology & Cancer Diagnostics")
            elif p.mesh_terms:
                topics.add(", ".join(p.mesh_terms[:2]))
            elif is_unpub or "uploaded" in str(p.source).lower():
                clean_title = p.title.strip()
                prefix = "Unpublished:" if is_unpub else "Uploaded:"
                topics.add(f"{prefix} {clean_title[:32]}..." if len(clean_title) > 32 else f"{prefix} {clean_title}")

        if not topics and self.indexed_papers:
            topics.add(self.indexed_papers[0].title[:45] + "...")

        # Dynamic suggested questions tailored to the active review query
        suggested_questions = []
        if getattr(self, "current_review_query", None):
            clean_q = self.current_review_query.replace("\n", " ").strip()
            short_q = clean_q[:42] + "..." if len(clean_q) > 42 else clean_q
            suggested_questions = [
                f"What are the main findings for \"{short_q}\"?",
                "What benchmark datasets and cohorts were evaluated?",
                "What machine learning architectures and models were compared?",
                "What clinical translation gaps were identified?"
            ]
        elif unpublished_titles:
            suggested_questions = [
                "What methodology is used in the uploaded manuscript?",
                "What are the main findings of the unpublished study?",
                "What datasets or patient cohorts are evaluated in the uploaded paper?",
                "Compare the unpublished manuscript against published literature."
            ]
        else:
            suggested_questions = [
                "Which architecture achieved the lowest false alarm rate?",
                "Why does ST-GCN resist muscle artifacts?",
                "What datasets had adult patients?",
                "What is the sensitivity drop in patient-independent validation?"
            ]

        return {
            "total_papers": len(self.indexed_papers),
            "total_chunks": len(self.chunks),
            "topics": list(topics),
            "query": getattr(self, "current_review_query", None),
            "review_id": getattr(self, "current_review_id", None),
            "suggested_questions": suggested_questions,
            "titles": [p.title for p in self.indexed_papers],
            "pmids": [p.pmid for p in self.indexed_papers if p.pmid],
            "journals": list(set([p.journal for p in self.indexed_papers if p.journal])),
            "has_unpublished": len(unpublished_titles) > 0,
            "unpublished_count": len(unpublished_titles),
            "unpublished_titles": unpublished_titles,
            "uploaded_count": uploaded_count
        }

    def search(self, query: str, top_k: int = 5, min_score: float = 0.20) -> Tuple[List[Dict[str, Any]], float]:
        """
        Perform dense semantic search with stop-word filtered lexical verification to prevent cross-domain hallucinations.
        Automatically boosts relevance for queries targeting uploaded scientific PDFs or unpublished manuscripts.
        Returns: (filtered_chunks, max_similarity_score)
        """
        if self.index.ntotal == 0 or not self.chunks:
            return [], 0.0

        query_vec = embedding_model.embed_query(query)
        query_vec = np.expand_dims(query_vec.astype(np.float32), axis=0)

        # Search top K candidates
        k = min(top_k * 4, self.index.ntotal)
        scores, indices = self.index.search(query_vec, k)

        query_lower = query.lower()
        is_querying_upload = any(w in query_lower for w in ["uploaded", "unpublished", "manuscript", "my paper", "my pdf", "pdf", "draft"])

        # Retain domain terms (dataset, model, method, accuracy, results) as query discriminators
        academic_stopwords = {
            'what', 'which', 'who', 'where', 'when', 'how', 'why', 'does', 'with', 'from', 'into',
            'that', 'this', 'have', 'has', 'had', 'been', 'were', 'about', 'than', 'more', 'most',
            'some', 'could', 'would', 'should', 'between', 'across', 'the', 'and', 'for', 'are', 'was',
            'query', 'title', 'review', 'tell', 'explain', 'give', 'show', 'please', 'regarding', 'related',
            'question', 'questions'
        }

        # Check if user query references the active review synthesis or query topic
        rev_q = getattr(self, "current_review_query", None)
        is_querying_review = any(w in query_lower for w in ["query", "review", "synthesis", "benchmark", "findings", "gaps", "consensus", "summary"]) or (
            bool(rev_q and any(w in query_lower for w in rev_q.lower().split() if len(w) > 3))
        )

        # Extract only discriminating domain keywords
        query_tokens = [
            w.lower() for w in re.findall(r'\b[a-zA-Z-]{3,}\b', query)
            if w.lower() not in academic_stopwords
        ]

        ranked_results = []
        max_score = 0.0

        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.chunks) and idx >= 0:
                raw_score = float(score)
                chunk = self.chunks[idx].copy()
                
                chunk_text_lower = chunk["text"].lower()
                chunk_title_lower = chunk.get("title", "").lower()
                is_chunk_upload = chunk.get("is_unpublished", False) or "uploaded" in str(chunk.get("source", "")).lower()
                is_chunk_synthesis = "synthesis" in chunk.get("section", "").lower() or "comparison" in str(chunk.get("source", "")).lower()

                # Check for discriminating token overlap
                matching_tokens = sum(
                    1 for tok in query_tokens 
                    if tok in chunk_text_lower or tok in chunk_title_lower
                )
                lexical_ratio = (matching_tokens / max(len(query_tokens), 1)) if query_tokens else 0.0
                
                # Hybrid score
                hybrid_score = round((0.70 * max(raw_score, 0.0)) + (0.30 * lexical_ratio), 3)

                # Affinity boost if query explicitly targets uploaded/unpublished manuscript
                if is_querying_upload and is_chunk_upload:
                    hybrid_score = round(min(hybrid_score + 0.20, 1.0), 3)

                # Affinity boost for review synthesis chunks when user asks about review findings or query topic
                if is_querying_review and is_chunk_synthesis:
                    hybrid_score = round(min(hybrid_score + 0.15, 1.0), 3)

                chunk["score"] = hybrid_score
                chunk["dense_score"] = round(raw_score, 3)

                if hybrid_score > max_score:
                    max_score = hybrid_score

                # Special case: If user explicitly asks about the uploaded manuscript, bypass generic filter
                if is_querying_upload and is_chunk_upload and (hybrid_score >= 0.20 or raw_score >= 0.22):
                    ranked_results.append(chunk)
                    continue

                # Special case: If user asks about the review query/topic and chunk is from review synthesis
                if is_querying_review and is_chunk_synthesis and (hybrid_score >= 0.22 or raw_score >= 0.22):
                    ranked_results.append(chunk)
                    continue

                # Anti-hallucination filter: only disqualify if lexical match is zero AND dense score is poor (< 0.28)
                if query_tokens and matching_tokens == 0 and raw_score < 0.28:
                    continue

                # Threshold verification
                if hybrid_score >= min_score or raw_score >= 0.28:
                    ranked_results.append(chunk)

        # Sort by hybrid score and return top_k
        ranked_results.sort(key=lambda x: x["score"], reverse=True)
        return ranked_results[:top_k], max_score

vector_store = PaperVectorStore()
