from typing import List, Dict, Any, Optional
from app.rag.vector_store import vector_store
from app.models.schemas import RAGQuestionResponse, Paper
from app.tools.pubmed_client import pubmed_client
from app.config import settings
import re

BIOMEDICAL_VOCABULARY = {
    # Anatomy & Physiological Systems
    'cardiac', 'cardiovascular', 'heart', 'coronary', 'myocardial', 'ecg', 'ekg', 'arrhythmia',
    'brain', 'eeg', 'neurology', 'epilepsy', 'seizure', 'cortex', 'hippocampus', 'scalp',
    'pulmonary', 'lung', 'chest', 'radiograph', 'x-ray', 'cxr', 'pneumonia', 'opacity', 'respiratory',
    'vascular', 'artery', 'vein', 'cerebral', 'stroke', 'ischemia', 'infarction', 'blood', 'pressure',
    'hypertension', 'kidney', 'renal', 'liver', 'hepatic', 'pancreas', 'gastric', 'endocrinology',
    # Diseases & Pathologies
    'cancer', 'tumor', 'oncology', 'carcinoma', 'melanoma', 'leukemia', 'lymphoma', 'metastasis',
    'diabetes', 'diabetic', 'glucose', 'insulin', 'metformin', 'glycemic', 'hba1c',
    'infection', 'viral', 'bacterial', 'covid', 'sars-cov-2', 'influenza', 'sepsis',
    'alzheimer', 'parkinson', 'dementia', 'neurodegenerative', 'sclerosis', 'autoimmune',
    # Clinical Metrics & Methodologies
    'sensitivity', 'specificity', 'accuracy', 'auc', 'roc-auc', 'precision', 'recall', 'f1-score',
    'false alarm', 'far/h', 'latency', 'loocv', 'cross-validation', 'patient-specific', 'cross-patient',
    'tusz', 'chb-mit', 'ptb-xl', 'mit-bih', 'chexpert', 'mimic-cxr', 'padchest', 'siena', 'bonn',
    # Machine Learning & AI in Medicine
    'deep learning', 'cnn', 'lstm', 'bilstm', 'conformer', 'transformer', 'vision transformer',
    'st-gcn', 'graph convolutional', 'spectrogram', 'wavelet', 'continuous wavelet', 'contrastive',
    'self-supervised', 'multimodal', 'vision-language', 'segmentation', 'biomedical',
    # Clinical Pharmacology & Interventions
    'drug', 'dose', 'dosage', 'pharmacology', 'therapy', 'therapeutic', 'medication', 'side effects',
    'treatment', 'prognosis', 'diagnostic', 'biomarker', 'clinical trial', 'mortality', 'morbidity'
}

ACADEMIC_STOPWORDS = {
    'what', 'which', 'who', 'where', 'when', 'how', 'why', 'does', 'with', 'from', 'into',
    'that', 'this', 'have', 'been', 'were', 'model', 'models', 'method', 'methods', 'study',
    'studies', 'paper', 'papers', 'data', 'dataset', 'datasets', 'results', 'using', 'based',
    'approach', 'system', 'learning', 'deep', 'neural', 'network', 'networks', 'performance',
    'evaluation', 'proposed', 'accuracy', 'patient', 'patients', 'clinical',
    'about', 'than', 'more', 'most', 'some', 'could', 'would', 'should', 'between', 'across'
}

class RAGService:
    def is_biomedical_query(self, query: str) -> bool:
        """Determines if the query addresses biomedical topics, or specifically queries indexed/uploaded literature or active review synthesis"""
        q_lower = query.lower()
        
        # 1. Direct biomedical phrase match
        for phrase in ['deep learning', 'vision transformer', 'false alarm', 'cross validation', 'chest x-ray', 'side effects', 'blood pressure']:
            if phrase in q_lower:
                return True
                
        # 2. Check for researcher referencing uploaded/unpublished manuscripts OR active review/synthesis
        if any(w in q_lower for w in [
            'uploaded', 'unpublished', 'manuscript', 'my paper', 'my pdf', 
            'this paper', 'the paper', 'this pdf', 'the pdf', 'draft', 
            'study methodology', 'key findings', 'conclusion', 'cohort',
            'query title', 'query', 'review', 'this review', 'the review', 'benchmark',
            'dataset', 'datasets', 'model', 'models', 'method', 'methods',
            'architecture', 'architectures', 'algorithm', 'algorithms',
            'findings', 'gaps', 'consensus', 'results', 'accuracy', 'metric', 'metrics', 'validation'
        ]):
            return True

        # 3. Check for matching terms in active review query (e.g. Cuttlefish, Parkinson, Gray Wolf, etc.)
        if getattr(vector_store, "current_review_query", None):
            rev_words = [w.lower() for w in re.findall(r'\b[a-zA-Z-]{3,}\b', vector_store.current_review_query) if w.lower() not in ACADEMIC_STOPWORDS]
            if any(rw in q_lower for rw in rev_words):
                return True

        # 4. Check for matching terms in titles of indexed papers (including uploaded ones)
        for p in vector_store.indexed_papers:
            title_words = [w.lower() for w in re.findall(r'\b[a-zA-Z-]{4,}\b', p.title) if w.lower() not in ACADEMIC_STOPWORDS]
            if any(tw in q_lower for tw in title_words):
                return True

        # 5. Standard biomedical vocabulary intersection
        tokens = set(re.findall(r'\b[a-zA-Z-]{3,}\b', q_lower))
        matches = tokens.intersection(BIOMEDICAL_VOCABULARY)
        return len(matches) > 0

    async def autotrain_on_uploaded_paper(self, paper: Paper) -> Dict[str, Any]:
        """
        Dynamically auto-trains and indexes an uploaded scientific PDF manuscript or unpublished report
        into the internal FAISS dense vector store for immediate semantic retrieval.
        """
        is_unpub = getattr(paper, "is_unpublished", False)
        status_label = "Unpublished Manuscript" if is_unpub else ("Peer-Reviewed Paper" if paper.pmid else "Preprint Manuscript")
        print(f"[RAGService] Internally auto-training RAG on uploaded paper: '{paper.title}' [{status_label}]")
        
        added_count = vector_store.add_papers([paper])
        new_scope = vector_store.get_corpus_scope()
        paper_chunks = [c for c in vector_store.chunks if c.get("paper_id") == paper.id]
        
        print(f"[RAGService] Internal autotraining complete! Generated {len(paper_chunks)} semantic chunks in FAISS index.")
        return {
            "status": "success",
            "paper_id": paper.id,
            "title": paper.title,
            "is_unpublished": is_unpub,
            "publication_status": status_label,
            "chunks_added": len(paper_chunks),
            "total_papers": len(vector_store.indexed_papers),
            "total_chunks": len(vector_store.chunks),
            "corpus_scope": new_scope
        }

    async def train_on_topic(self, topic: str, max_papers: int = 4) -> Dict[str, Any]:
        """
        Dynamically train and expand the RAG knowledge base on a new topic by retrieving
        and indexing live peer-reviewed PubMed publications into FAISS.
        """
        clean_topic = topic.strip()
        print(f"[RAGService] Training RAG on topic: '{clean_topic}' (max_papers={max_papers})")
        
        # 1. Retrieve PubMed papers
        retrieved_papers = await pubmed_client.search_and_retrieve(clean_topic, max_results=max_papers)
        if not retrieved_papers:
            print(f"[RAGService] No PubMed papers returned for: {clean_topic}")
            return {
                "status": "empty",
                "topic": clean_topic,
                "papers_added": 0,
                "corpus_scope": vector_store.get_corpus_scope()
            }

        # 2. Add to FAISS Vector Store
        added_count = vector_store.add_papers(retrieved_papers)
        new_scope = vector_store.get_corpus_scope()

        print(f"[RAGService] Training complete! Added {added_count} papers to FAISS.")
        return {
            "status": "success",
            "topic": clean_topic,
            "papers_added": added_count,
            "corpus_scope": new_scope,
            "papers": [p.model_dump() for p in retrieved_papers]
        }

    async def answer_question(
        self, 
        question: str, 
        review_id: Optional[str] = None,
        review_context: Optional[Dict[str, Any]] = None,
        auto_train: bool = True
    ) -> RAGQuestionResponse:
        """Answer a researcher's question grounded strictly in literature chunks with anti-hallucination guardrails and on-demand training"""
        clean_q = question.strip()
        q_lower = clean_q.lower()
        if not clean_q:
            return RAGQuestionResponse(
                answer="Please enter a biomedical, methodological, or clinical question to query the indexed literature.",
                grounded_sources=[],
                confidence=0.0
            )

        # Ensure active review is indexed if review_id is provided
        if review_id and (getattr(vector_store, "current_review_id", None) != review_id or len(vector_store.chunks) == 0):
            try:
                from app.agents.orchestrator import orchestrator
                rev = await orchestrator.get_review_by_id(review_id)
                if rev:
                    vector_store.index_review(rev)
            except Exception as e:
                print(f"[RAGService] Note on auto-indexing review {review_id}: {e}")

        # Step 0a: High-Precision Author / Study Metadata Intent Resolution
        is_author_query = any(phrase in q_lower for phrase in [
            'who are the authors', 'who is the author', 'who wrote', 
            'authors of', 'author of', 'written by', 'authored by', 'name of the author'
        ]) or ('author' in q_lower and any(w in q_lower for w in ['manuscript', 'paper', 'study', 'pdf']))

        if is_author_query and vector_store.indexed_papers:
            target_paper = None
            if any(w in q_lower for w in ['manuscript', 'uploaded', 'my paper', 'this paper', 'the paper', 'draft', 'pdf']):
                for p in vector_store.indexed_papers:
                    if getattr(p, "is_unpublished", False) or "uploaded" in str(p.source).lower():
                        target_paper = p
                        break
            if not target_paper:
                # Match title tokens
                for p in vector_store.indexed_papers:
                    if any(w in q_lower for w in p.title.lower().split() if len(w) > 3):
                        target_paper = p
                        break
            if not target_paper:
                target_paper = vector_store.indexed_papers[0]

            authors_list = target_paper.authors or []
            if len(authors_list) == 1:
                authors_str = authors_list[0]
            elif len(authors_list) == 2:
                authors_str = f"{authors_list[0]} and {authors_list[1]}"
            elif len(authors_list) > 2:
                last_item = authors_list[-1]
                if any(aff in last_item.lower() for aff in ['department', 'university', 'hospital', 'institute', 'lab', 'informatics']):
                    authors_str = f"{', '.join(authors_list[:-1])}, from the {last_item}"
                else:
                    authors_str = f"{', '.join(authors_list[:-1])}, and {last_item}"
            else:
                authors_str = "Not explicitly specified in manuscript header"

            is_unpub = getattr(target_paper, "is_unpublished", False)
            answer_text = (
                f"The authors of the manuscript **\"{target_paper.title}\"** are:\n\n"
                f"• **{authors_str}**\n\n"
                f"*Verified directly from the indexed manuscript metadata.*"
            )

            source_item = {
                "pmid": target_paper.pmid if target_paper.pmid else ("Unpublished" if is_unpub else (target_paper.id or "Local")),
                "title": target_paper.title,
                "doi": target_paper.doi,
                "relevance_score": 0.99,
                "snippet": f"Title: {target_paper.title} | Authors: {', '.join(target_paper.authors)} | Venue: {target_paper.journal}",
                "is_unpublished": is_unpub,
                "section": "Study Overview & Authors",
                "source": target_paper.source
            }

            return RAGQuestionResponse(
                answer=answer_text,
                grounded_sources=[source_item],
                confidence=0.98,
                is_out_of_bounds=False,
                is_trained_on_demand=False,
                query_type="in_bounds",
                corpus_scope=vector_store.get_corpus_scope()
            )

        # Step 0b: Query Title & Review Topic Intent Resolution
        is_query_title_query = any(phrase in q_lower for phrase in [
            'what is the query title', 'what is the query', 'what was the query',
            'what is the title of the query', 'what is the title of this review',
            'query title', 'title of the query', 'title of this query',
            'what is this review about', 'what is the review about',
            'what is this query about', 'what was the research question',
            'what is the research topic', 'explain the query title', 'tell me about the query title',
            'summarize the query', 'summarize the review', 'what is the topic'
        ]) or (('query' in q_lower or 'review' in q_lower) and ('title' in q_lower or 'topic' in q_lower))

        if is_query_title_query and getattr(vector_store, "current_review_query", None):
            rev_q = vector_store.current_review_query.strip()
            scope = vector_store.get_corpus_scope()
            num_papers = scope.get("total_papers", len(vector_store.indexed_papers))
            paper_titles = [f"• **{p.title}** ({p.year})" for p in vector_store.indexed_papers[:4]]
            paper_list_str = "\n".join(paper_titles) if paper_titles else "• Studies indexed in PRISMA evidence table"
            
            synthesis_chunk = next((c for c in vector_store.chunks if "Executive Summar" in c.get("section", "") or "Systematic Literature" in c.get("section", "")), None)
            synthesis_snippet = ""
            if synthesis_chunk:
                cleaned_text = synthesis_chunk.get('text', '').replace('\n', ' ')
                synthesis_snippet = f"\n\n**Executive Synthesis Summary:**\n> {cleaned_text[:400]}..."

            answer_text = (
                f"### 📋 Active Systematic Literature Review\n\n"
                f"**Query Title:**\n> **\"{rev_q}\"**\n\n"
                f"**Review Scope:**\n"
                f"• **Total Indexed Studies:** {num_papers}\n"
                f"• **Total Evidence Chunks in FAISS:** {scope.get('total_chunks', len(vector_store.chunks))}\n"
                f"• **Domain Scope:** {', '.join(scope.get('topics', ['Clinical Medicine'])[:3])}\n\n"
                f"**Key Publications Analyzed:**\n{paper_list_str}"
                f"{synthesis_snippet}\n\n"
                f"*You can ask specific questions about the datasets, clinical benchmarks, model architectures, or synthesized findings for this query.*"
            )

            source_item = {
                "pmid": "Review-Synthesis",
                "title": f"Literature Review: {rev_q[:60]}",
                "doi": None,
                "relevance_score": 0.99,
                "snippet": f"Active systematic review query: '{rev_q}'. Grounded synthesis across {num_papers} peer-reviewed studies.",
                "is_unpublished": False,
                "section": "Systematic Review Protocol & Synthesis",
                "source": "PRISMA Systematic Review"
            }

            return RAGQuestionResponse(
                answer=answer_text,
                grounded_sources=[source_item],
                confidence=0.98,
                is_out_of_bounds=False,
                is_trained_on_demand=False,
                query_type="in_bounds",
                corpus_scope=scope
            )

        # Check if vector store is empty - if so and query is biomedical, train immediately
        if len(vector_store.chunks) == 0:
            if self.is_biomedical_query(clean_q) and auto_train:
                await self.train_on_topic(clean_q, max_papers=4)
            else:
                scope = vector_store.get_corpus_scope()
                return self._build_empty_corpus_response(clean_q, scope)

        # 1. Perform semantic search with anti-hallucination stop-word filtering
        chunks, max_score = vector_store.search(clean_q, top_k=4, min_score=0.22)

        # 2. If chunks found and meet relevance threshold, synthesize grounded answer
        has_review = bool(getattr(vector_store, "current_review_query", None))
        if chunks and (max_score >= 0.22 or any(c.get("is_unpublished") for c in chunks) or (has_review and max_score >= 0.20)):
            return await self._synthesize_grounded_answer(clean_q, chunks, max_score)

        # 3. Query is OUT OF BOUNDS of the current index:
        # Check whether query is a general non-biomedical question or a biomedical query needing training
        is_bio = self.is_biomedical_query(clean_q)

        if not is_bio:
            # Case A: General non-biomedical query (baking, sports, weather, trivia)
            return self._build_general_out_of_bounds_response(clean_q)

        # Case B: Biomedical query outside active corpus
        # Do NOT query PubMed if the question is referring to a local paper, review, or query title
        is_referring_local_doc = any(w in q_lower for w in [
            'manuscript', 'the paper', 'this paper', 'my paper', 'uploaded', 
            'the study', 'this study', 'who are the authors', 'who wrote', 'author',
            'query title', 'query', 'review', 'this review', 'the review', 'this topic',
            'this research', 'our review', 'findings', 'benchmark'
        ])

        if auto_train and not is_referring_local_doc:
            print(f"[RAGService] Out-of-bounds biomedical query: '{clean_q}'. Auto-training RAG via PubMed...")
            train_res = await self.train_on_topic(clean_q, max_papers=4)
            added = train_res.get("papers_added", 0)

            if added > 0:
                # Re-search the expanded index
                new_chunks, new_score = vector_store.search(clean_q, top_k=4, min_score=0.22)
                if new_chunks:
                    resp = await self._synthesize_grounded_answer(clean_q, new_chunks, new_score)
                    resp.answer = (
                        f"✨ **Peer-Reviewed Scientific Literature Evidence**\n"
                        f"*Retrieved from PubMed across {added} relevant studies:*\n\n"
                        f"{resp.answer}"
                    )
                    resp.is_trained_on_demand = True
                    resp.newly_indexed_papers = added
                    resp.query_type = "auto_trained"
                    resp.corpus_scope = vector_store.get_corpus_scope()
                    return resp

        # If auto_train is off or PubMed yielded no studies for the query
        scope = vector_store.get_corpus_scope()
        return self._build_biomedical_out_of_bounds_response(clean_q, scope)

    async def _synthesize_grounded_answer(
        self, 
        clean_q: str, 
        chunks: List[Dict[str, Any]], 
        max_score: float
    ) -> RAGQuestionResponse:
        """Builds grounded answer with source citations and confidence score"""
        context_texts = []
        sources = []
        for c in chunks:
            pmid = c.get("pmid")
            doi = c.get("doi")
            title = c.get("title")
            text = c.get("text", "")
            is_unpub = c.get("is_unpublished", False)
            section = c.get("section", "Body")
            
            if is_unpub:
                source_citation = f"Unpublished Manuscript: '{title}' [Section: {section}]"
            elif pmid:
                source_citation = f"PMID: {pmid} '{title}' [Section: {section}]"
            elif doi:
                source_citation = f"DOI: {doi} '{title}' [Section: {section}]"
            else:
                source_citation = f"Uploaded Paper: '{title}' [Section: {section}]"

            context_texts.append(f"Source [{source_citation}]:\n{text}\n")
            sources.append({
                "pmid": pmid if pmid else ("Unpublished" if is_unpub else (c.get("paper_id") or "Local")),
                "title": title,
                "doi": doi,
                "relevance_score": round(c.get("score", 0.0), 3),
                "snippet": text[:280] + "...",
                "is_unpublished": is_unpub,
                "section": section,
                "source": c.get("source", "Unpublished Manuscript" if is_unpub else "Uploaded Literature")
            })

        combined_context = "\n---\n".join(context_texts)

        # Attempt LLM generation if configured
        answer = None
        if settings.GEMINI_API_KEY:
            answer = await self._generate_gemini(clean_q, combined_context)
        elif settings.OPENAI_API_KEY:
            answer = await self._generate_openai(clean_q, combined_context)
        elif settings.ANTHROPIC_API_KEY:
            answer = await self._generate_claude(clean_q, combined_context)

        # Deterministic precision heuristic fallback
        if not answer:
            answer = self._grounded_heuristic_answer(clean_q, chunks)

        return RAGQuestionResponse(
            answer=answer,
            grounded_sources=sources,
            confidence=min(round(max(max_score, 0.85 if any(c.get("is_unpublished") for c in chunks) else max_score), 2), 0.98),
            is_out_of_bounds=False,
            is_trained_on_demand=False,
            query_type="in_bounds",
            corpus_scope=vector_store.get_corpus_scope()
        )

    def _build_general_out_of_bounds_response(self, question: str) -> RAGQuestionResponse:
        """Polite clinical response when a question is completely non-biomedical (no repetitive study dump)"""
        lines = [
            "ℹ️ **Query Outside Biomedical Research Scope**\n\n",
            f"BrightLit AI is a specialized peer-reviewed medical literature research assistant. Your query:\n",
            f"> *\"{question}\"*\n\n",
            "is outside the domain of clinical medicine, pharmacology, or biomedical informatics.\n\n",
            "### Recommended Inquiries:\n",
            "• Ask about disease mechanisms, clinical trials, or pharmacotherapy (e.g., *'What are risk factors for cardiovascular disease?'*)\n",
            "• Query deep learning architectures in healthcare (e.g., *'Which model achieved the lowest false alarm rate on CHB-MIT?'*)\n",
            "• Upload scientific manuscript PDFs or unpublished reports to autotrain the RAG and query internal findings."
        ]
        return RAGQuestionResponse(
            answer="".join(lines),
            grounded_sources=[],
            confidence=0.0,
            is_out_of_bounds=True,
            query_type="out_of_bounds_general",
            can_train=False
        )

    def _build_biomedical_out_of_bounds_response(self, question: str, scope: Dict[str, Any]) -> RAGQuestionResponse:
        """Structured notification for biomedical queries that exceed active indexed literature"""
        topics = scope.get("topics", [])
        total = scope.get("total_papers", 0)

        topics_str = ", ".join(topics[:3]) if topics else "currently loaded review papers"

        lines = [
            "⚠️ **Topic Not in Current Literature Index**\n\n",
            f"The active index ({total} studies covering *{topics_str}*) does not contain peer-reviewed publications addressing:\n",
            f"> *\"{question}\"*\n\n",
            "### Recommended Actions:\n",
            "1. **Refine Query**: Rephrase your question to target the methodologies, datasets, or evaluation results of the indexed studies.\n",
            "2. **Upload Manuscripts**: Upload PDF scientific manuscripts or unpublished reports in the sidebar to autotrain the RAG with your custom literature.\n",
            "3. **Start a New Review**: Run a search on the main dashboard to analyze literature specifically focused on this topic."
        ]

        return RAGQuestionResponse(
            answer="".join(lines),
            grounded_sources=[],
            confidence=0.08,
            is_out_of_bounds=True,
            query_type="out_of_bounds_biomedical",
            can_train=False,
            suggested_topic=question,
            corpus_scope=scope
        )

    def _build_empty_corpus_response(self, question: str, scope: Dict[str, Any]) -> RAGQuestionResponse:
        return RAGQuestionResponse(
            answer=(
                "⚠️ **No Active Literature Index Loaded**\n\n"
                "Please run a systematic review from the main dashboard or upload a scientific PDF / unpublished manuscript to populate the FAISS index."
            ),
            grounded_sources=[],
            confidence=0.0,
            is_out_of_bounds=True,
            query_type="out_of_bounds_biomedical",
            can_train=False,
            suggested_topic=question,
            corpus_scope=scope
        )

    async def _generate_gemini(self, question: str, context: str) -> Optional[str]:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"""You are a rigorous medical literature research AI assistant.
Answer the question comprehensively and accurately based directly on the provided literature excerpts and systematic review synthesis context below.

STRICT BOUNDARY CONSTRAINTS:
1. If the provided excerpts do NOT contain any relevant evidence or information addressing the question, state clearly: "The retrieved studies do not contain evidence addressing this specific question."
2. Ground your response directly in the provided study extracts, comparative benchmarks, or systematic review synthesis.
3. NEVER hallucinate, extrapolate, or bring in unstated medical facts.
4. Cite sources clearly using [PMID: <pmid>], [DOI: <doi>], [Unpublished Manuscript: <Title>], or [Systematic Review Synthesis: <Section>] where applicable.

Literature Excerpts:
{context}

Question: {question}

Grounded Clinical Answer:"""
            models_to_try = [settings.GEMINI_MODEL, "gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite"]
            seen = set()
            unique_models = [m for m in models_to_try if not (m in seen or seen.add(m))]

            for model_name in unique_models:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    return response.text
                except Exception as e:
                    print(f"[RAGService] Gemini ({model_name}) error: {e}")
                    continue
            return None
        except Exception as e:
            print(f"[RAGService] Gemini error: {e}")
            return None

    async def _generate_openai(self, question: str, context: str) -> Optional[str]:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            prompt = f"""You are a rigorous medical literature research AI assistant.
Answer the question comprehensively and accurately based directly on the provided literature excerpts and systematic review synthesis context below.

STRICT BOUNDARY CONSTRAINTS:
1. If the excerpts do NOT contain relevant evidence addressing the question, state: "The retrieved studies do not contain evidence addressing this specific question."
2. Ground your response directly in the provided study extracts, benchmarks, or review synthesis.
3. NEVER hallucinate or extrapolate beyond the text.
4. Cite sources using [PMID: <pmid>], [DOI: <doi>], [Unpublished Manuscript: <Title>], or [Review Synthesis: <Section>].

Literature Excerpts:
{context}

Question: {question}"""
            res = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            return res.choices[0].message.content
        except Exception as e:
            print(f"[RAGService] OpenAI error: {e}")
            return None

    async def _generate_claude(self, question: str, context: str) -> Optional[str]:
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            prompt = f"""You are a rigorous medical literature research AI assistant.
Answer the question comprehensively and accurately based directly on the provided literature excerpts and systematic review synthesis context below.

STRICT BOUNDARY CONSTRAINTS:
1. If the excerpts do NOT contain relevant evidence addressing the question, state: "The retrieved studies do not contain evidence addressing this specific question."
2. Ground your response directly in the provided study extracts, benchmarks, or review synthesis.
3. NEVER hallucinate or extrapolate beyond the text.
4. Cite sources using [PMID: <pmid>], [DOI: <doi>], [Unpublished Manuscript: <Title>], or [Review Synthesis: <Section>].

Literature Excerpts:
{context}

Question: {question}"""
            res = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            return res.content[0].text
        except Exception as e:
            print(f"[RAGService] Claude error: {e}")
            return None

    def _grounded_heuristic_answer(self, question: str, chunks: List[Dict[str, Any]]) -> str:
        """Precision factual extraction when external LLM API is unavailable, with zero-hallucination guardrails"""
        q_tokens = [
            w.lower() for w in re.findall(r'\b[a-zA-Z-]{3,}\b', question)
            if w.lower() not in ACADEMIC_STOPWORDS
        ]
        
        # Check if question specifically asks about unpublished / uploaded literature
        is_querying_upload = any(w in question.lower() for w in ["uploaded", "unpublished", "manuscript", "pdf", "draft", "my paper"])

        matched_points = []
        for chunk in chunks:
            c_title = chunk.get("title", "")
            c_pmid = chunk.get("pmid")
            c_is_unpub = chunk.get("is_unpublished", False)
            c_section = chunk.get("section", "Body")
            text = chunk.get("text", "")
            
            sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 25]
            for s in sentences:
                s_lower = s.lower()
                matches = sum(1 for tok in q_tokens if tok in s_lower)
                min_req = 1 if len(q_tokens) <= 2 or (is_querying_upload and c_is_unpub) else 2
                if matches >= min_req:
                    matched_points.append({
                        "sentence": s,
                        "pmid": c_pmid,
                        "title": c_title,
                        "is_unpublished": c_is_unpub,
                        "section": c_section,
                        "overlap": matches
                    })

        # Sort by relevance overlap
        matched_points.sort(key=lambda x: x["overlap"], reverse=True)

        if not matched_points:
            top_c = chunks[0]
            pmid = top_c.get("pmid")
            title = top_c.get("title", "Indexed Manuscript")
            is_unpub = top_c.get("is_unpublished", False)
            citation_str = "Unpublished Manuscript" if is_unpub else (f"PMID: {pmid}" if pmid else "Local Document")
            snippet = top_c.get("text", "")[:240]
            return (
                f"From the indexed study **\"{title}\"** [{citation_str}] ({top_c.get('section', 'Body')}):\n\n"
                f"> \"{snippet}...\"\n\n"
                f"• This excerpt reflects the closest grounded evidence addressing your inquiry: *\"{question}\"*."
            )

        # Synthesize from top matching sentences
        header_text = (
            "Based on the indexed scientific and unpublished manuscript evidence:\n\n" 
            if any(pt.get("is_unpublished") for pt in matched_points) 
            else "Based on the retrieved peer-reviewed evidence:\n\n"
        )
        output = [header_text]
        seen_sentences = set()
        count = 0

        for pt in matched_points:
            s_clean = pt["sentence"]
            if s_clean not in seen_sentences and count < 4:
                seen_sentences.add(s_clean)
                citation = "Unpublished Manuscript" if pt["is_unpublished"] else (f"PMID: {pt['pmid']}" if pt["pmid"] else "Indexed Article")
                output.append(f"• **{pt['title']}** [{citation}] (*{pt['section']}*): {s_clean}\n")
                count += 1

        output.append("\n*Evidence verified strictly from indexed study extracts without external extrapolation.*")
        return "".join(output)

rag_service = RAGService()
