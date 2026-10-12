import asyncio
import json
import re
from typing import Optional
from app.models.schemas import QueryPlan
from app.config import settings

class QueryPlanningAgent:
    """Agent responsible for understanding the research question, decomposing it into sub-questions,
    generating keywords/MeSH terms, PubMed Boolean queries, and screening criteria."""

    async def plan(self, query: str) -> QueryPlan:
        # Sanitize query input (strip newlines, smart quotes, redundant whitespace)
        clean_query = " ".join(query.replace("\r", " ").replace("\n", " ").split()).strip()
        clean_query = clean_query.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')

        # If API key is available, attempt LLM formulation
        if settings.GEMINI_API_KEY:
            plan_obj = await self._plan_gemini(clean_query)
            if plan_obj:
                return plan_obj
        elif settings.OPENAI_API_KEY:
            plan_obj = await self._plan_openai(clean_query)
            if plan_obj:
                return plan_obj

        # Robust domain-specific heuristic planner
        return self._heuristic_plan(clean_query)

    async def _plan_gemini(self, query: str) -> Optional[QueryPlan]:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"""You are an expert medical literature search strategist and systematic reviewer.
Analyze the following biomedical research request and generate a structured search and screening protocol.

User Request: "{query}"

Output ONLY valid JSON matching this schema:
{{
  "original_query": "{query}",
  "clinical_problem": "Summary of the clinical or neuro-computational problem",
  "target_modalities": ["e.g. Scalp EEG", "Intracranial iEEG"],
  "generated_keywords": ["keyword1", "keyword2", "keyword3"],
  "sub_questions": [
    "Sub-question 1",
    "Sub-question 2",
    "Sub-question 3",
    "Sub-question 4"
  ],
  "pubmed_boolean_query": "PubMed Boolean expression with AND, OR, parentheses",
  "inclusion_criteria": ["Criteria 1", "Criteria 2", "Criteria 3"],
  "exclusion_criteria": ["Criteria 1", "Criteria 2", "Criteria 3"]
}}
"""
            models_to_try = [settings.GEMINI_MODEL, "gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite"]
            seen = set()
            unique_models = [m for m in models_to_try if not (m in seen or seen.add(m))]

            for model_name in unique_models:
                try:
                    def _call():
                        return client.models.generate_content(
                            model=model_name,
                            contents=prompt
                        )
                    res = await asyncio.wait_for(asyncio.to_thread(_call), timeout=18.0)
                    raw = res.text.strip()
                    match = re.search(r'\{.*\}', raw, re.DOTALL)
                    if match:
                        data = json.loads(match.group(0))
                    else:
                        data = json.loads(raw)
                    print(f"[QueryPlanningAgent] Formulated protocol using {model_name}")
                    return QueryPlan(**data)
                except Exception as e:
                    print(f"[QueryPlanningAgent] Gemini ({model_name}) error: {e}")
                    continue
            return None
        except Exception as e:
            print(f"[QueryPlanningAgent] Gemini plan error: {e}")
            return None

    async def _plan_openai(self, query: str) -> Optional[QueryPlan]:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            prompt = f"""You are an expert medical literature search strategist.
Analyze: "{query}"
Return JSON adhering to QueryPlan schema."""
            res = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            data = json.loads(res.choices[0].message.content)
            return QueryPlan(**data)
        except Exception as e:
            print(f"[QueryPlanningAgent] OpenAI plan error: {e}")
            return None

    def _heuristic_plan(self, query: str) -> QueryPlan:
        q_lower = query.lower()
        
        # Check if EEG Seizure Detection query
        if "eeg" in q_lower or "seizure" in q_lower or "epilep" in q_lower:
            return QueryPlan(
                original_query=query,
                clinical_problem="Automated detection and classification of epileptic seizures from multi-channel electroencephalogram (EEG) recordings using deep learning architectures.",
                target_modalities=["Scalp EEG", "Intracranial EEG (iEEG)", "Continuous Video-EEG"],
                generated_keywords=[
                    "EEG seizure detection",
                    "deep learning epilepsy",
                    "convolutional neural networks EEG",
                    "vision transformer EEG",
                    "CHB-MIT database",
                    "TUH EEG seizure corpus",
                    "patient-independent validation",
                    "false alarm rate"
                ],
                sub_questions=[
                    "What deep learning model architectures (CNN, RNN, Transformer, GCN) are most prevalent for EEG seizure detection?",
                    "Which public and private EEG datasets (e.g., CHB-MIT, TUH EEG) serve as primary evaluation benchmarks?",
                    "How do patient-specific versus patient-independent (cross-subject) validation schemes affect reported diagnostic accuracy?",
                    "What quantitative evaluation metrics (Sensitivity, Specificity, FAR/h, F1, Latency) are prioritized in clinical assessment?",
                    "What critical research gaps and clinical translation barriers persist in state-of-the-art literature?"
                ],
                pubmed_boolean_query='("EEG"[Title/Abstract] OR "electroencephalogram"[Title/Abstract]) AND ("seizure detection"[Title/Abstract] OR "epileptic seizure"[Title/Abstract]) AND ("deep learning"[Title/Abstract] OR "neural network"[Title/Abstract] OR "transformer"[Title/Abstract])',
                inclusion_criteria=[
                    "Peer-reviewed studies focusing on human EEG seizure detection or prediction",
                    "Utilizes deep learning architectures (e.g. CNNs, LSTMs, Transformers, GCNs)",
                    "Evaluated on concrete benchmark datasets (e.g., CHB-MIT, TUH EEG, Siena, or clinical hospital cohorts)",
                    "Reports empirical performance metrics (Sensitivity/Recall, False Alarm Rate, Specificity, or F1-Score)"
                ],
                exclusion_criteria=[
                    "Studies lacking empirical evaluation on EEG data (e.g., ECG or photoplethysmography only)",
                    "Exclusively classical hand-crafted feature methods without deep learning components",
                    "Non-seizure EEG classification (e.g., sleep staging, BCI motor imagery, emotion recognition)",
                    "Pure review or perspective papers without benchmark comparative data"
                ]
            )

        # Parkinson's Disease & Optimization Algorithms
        if "parkinson" in q_lower or "wolf" in q_lower or "gwo" in q_lower:
            return QueryPlan(
                original_query=query,
                clinical_problem="Early detection and diagnostic biomarker classification of Parkinson's Disease utilizing Grey Wolf Optimization (GWO) feature selection and machine learning classifiers.",
                target_modalities=["Vocal Phonetics", "Gait & Postural Dynamics", "Neurological Biomarkers"],
                generated_keywords=[
                    "Parkinson Disease",
                    "Grey Wolf Optimization",
                    "Gray Wolf Optimizer",
                    "GWO feature selection",
                    "early detection Parkinson",
                    "machine learning classification"
                ],
                sub_questions=[
                    "How do modified Grey Wolf Optimization algorithms enhance early-stage Parkinson's disease biomarker extraction?",
                    "Which medical datasets (e.g., voice acoustic datasets, motion sensor cohorts) benchmark GWO performance?",
                    "What classification architectures achieve optimal sensitivity when integrated with GWO feature subsets?",
                    "What empirical diagnostic metrics (Accuracy, Sensitivity, Specificity, AUC) are achieved?"
                ],
                pubmed_boolean_query='("Parkinson Disease"[Mesh] OR "Parkinson*"[Title/Abstract]) AND ("Grey Wolf"[Title/Abstract] OR "Gray Wolf"[Title/Abstract] OR "GWO"[Title/Abstract] OR "metaheuristic"[Title/Abstract] OR "optimization"[Title/Abstract]) AND ("early detection"[Title/Abstract] OR "early diagnosis"[Title/Abstract] OR "classification"[Title/Abstract] OR "feature selection"[Title/Abstract])',
                inclusion_criteria=[
                    "Directly investigates early Parkinson's disease diagnosis or detection",
                    "Applies metaheuristic optimization algorithms (GWO) or machine learning feature selection",
                    "Reports validated empirical diagnostic accuracy on clinical cohorts"
                ],
                exclusion_criteria=[
                    "Studies unrelated to Parkinson's disease",
                    "Theoretical papers lacking empirical validation or clinical evaluation"
                ]
            )

        # General biomedical query fallback
        terms = [w for w in re.findall(r'\b[a-zA-Z]{4,}\b', q_lower) if w not in ['with', 'from', 'that', 'this', 'what', 'which', 'about', 'review', 'based', 'early', 'detection', 'algorithm']]
        if len(terms) >= 2:
            pubmed_query = " AND ".join([f'("{t}"[Title/Abstract])' for t in terms[:4]])
        else:
            pubmed_query = f'("{query}"[Title/Abstract])'

        return QueryPlan(
            original_query=query,
            clinical_problem=f"Systematic biomedical literature synthesis addressing: {query}",
            target_modalities=["Clinical trials", "Observational cohorts", "Biomedical informatics"],
            generated_keywords=[query, "systematic review", "machine learning", "clinical evaluation"],
            sub_questions=[
                f"What are the primary methodological approaches applied to {query}?",
                "What benchmark datasets and patient cohorts are utilized?",
                "What are the reported clinical and quantitative outcomes?",
                "What methodological limitations or research gaps remain?"
            ],
            pubmed_boolean_query=pubmed_query,
            inclusion_criteria=[
                "Directly investigates the target research topic",
                "Presents reproducible methodology and concrete outcome measures",
                "Published in peer-reviewed biomedical or bioinformatics venues"
            ],
            exclusion_criteria=[
                "Studies unrelated to the target clinical or computational domain",
                "Non-peer-reviewed commentaries or editorial notes",
                "Insufficient methodological detail to extract evidence"
            ]
        )

query_planner = QueryPlanningAgent()
