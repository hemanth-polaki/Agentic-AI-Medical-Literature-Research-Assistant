import asyncio
import json
import re
from typing import Optional
from app.models.schemas import QueryPlan
from app.config import settings, LLMCircuitBreaker

class QueryPlanningAgent:
    """Agent responsible for understanding the research question, decomposing it into sub-questions,
    generating keywords/MeSH terms, PubMed Boolean queries, and screening criteria."""

    async def plan(self, query: str) -> QueryPlan:
        # Sanitize query input (strip newlines, smart quotes, redundant whitespace)
        clean_query = " ".join(query.replace("\r", " ").replace("\n", " ").split()).strip()
        clean_query = clean_query.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')

        # If API key is available and quota not exhausted, attempt LLM formulation
        if settings.GEMINI_API_KEY and LLMCircuitBreaker.is_gemini_available():
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
                    err_str = str(e)
                    print(f"[QueryPlanningAgent] Gemini ({model_name}) error: {err_str[:120]}")
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                        LLMCircuitBreaker.mark_gemini_exhausted()
                        break
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

        # Alzheimer's Disease / Dementia / MCI / Neuroimaging
        if "alzheimer" in q_lower or "mci" in q_lower or "adni" in q_lower or "dementia" in q_lower:
            return QueryPlan(
                original_query=query,
                clinical_problem="Multimodal neuroimaging and deep learning synthesis for early Alzheimer's Disease and Mild Cognitive Impairment (MCI) progression prediction using structural MRI and FDG-PET.",
                target_modalities=["Structural MRI (sMRI)", "FDG-PET", "Amyloid-PET", "Cognitive Assessment Scores"],
                generated_keywords=[
                    "Alzheimer Disease",
                    "Mild Cognitive Impairment",
                    "ADNI database",
                    "multimodal deep learning",
                    "structural MRI",
                    "FDG-PET",
                    "convolutional neural network",
                    "progression prediction"
                ],
                sub_questions=[
                    "What multimodal deep learning architectures effectively fuse structural MRI and FDG-PET for MCI conversion prediction?",
                    "How is the Alzheimer's Disease Neuroimaging Initiative (ADNI) benchmark utilized across studies?",
                    "What validation protocols (subject-separated cross-validation) prevent data leakage across longitudinal scans?",
                    "What diagnostic metrics (AUC, Accuracy, Sensitivity, Specificity) are achieved?"
                ],
                pubmed_boolean_query='("Alzheimer Disease"[Title/Abstract] OR "Alzheimer*"[Title/Abstract] OR "Mild Cognitive Impairment"[Title/Abstract]) AND ("MRI"[Title/Abstract] OR "PET"[Title/Abstract] OR "neuroimaging"[Title/Abstract]) AND ("deep learning"[Title/Abstract] OR "neural network"[Title/Abstract] OR "multimodal"[Title/Abstract])',
                inclusion_criteria=[
                    "Investigates Alzheimer's Disease, MCI, or dementia progression prediction",
                    "Utilizes deep learning or machine learning on neuroimaging modalities (MRI, PET)",
                    "Evaluated on ADNI, OASIS, AIBL, or validated clinical cohorts",
                    "Reports quantitative classification performance metrics (AUC, Accuracy, Sensitivity)"
                ],
                exclusion_criteria=[
                    "Studies lacking empirical neuroimaging data or computational validation",
                    "Editorial commentaries or perspective articles without comparative evaluation"
                ]
            )

        # 12-Lead ECG / Cardiac Arrhythmia / Electrophysiology
        if "ecg" in q_lower or "arrhythmia" in q_lower or "mit-bih" in q_lower or "ptb-xl" in q_lower or "cardiac" in q_lower:
            return QueryPlan(
                original_query=query,
                clinical_problem="Automated detection and classification of cardiac arrhythmias from 12-lead and single-lead electrocardiography (ECG) using convolutional transformers and deep neural architectures.",
                target_modalities=["12-Lead Standard ECG", "Ambulatory Holter ECG", "Lead-II Rhythm Strips"],
                generated_keywords=[
                    "ECG arrhythmia detection",
                    "12-lead electrocardiogram",
                    "MIT-BIH Arrhythmia Database",
                    "PTB-XL database",
                    "convolutional transformer",
                    "spatial-temporal attention",
                    "clinical real-time viability",
                    "cardiac rhythm classification"
                ],
                sub_questions=[
                    "What convolutional transformer and deep neural architectures are applied to 12-lead ECG signals?",
                    "How do benchmark databases (MIT-BIH vs PTB-XL) compare in clinical diversity and multi-label arrhythmia representation?",
                    "What are the computational complexity and real-time inference viability trade-offs?",
                    "What evaluation metrics (F1-score, sensitivity, macro-AUC) are prioritized in cardiac assessment?"
                ],
                pubmed_boolean_query='("ECG"[Title/Abstract] OR "electrocardiogram"[Title/Abstract] OR "electrocardiography"[Title/Abstract]) AND ("arrhythmia"[Title/Abstract] OR "cardiac rhythm"[Title/Abstract]) AND ("deep learning"[Title/Abstract] OR "transformer"[Title/Abstract] OR "neural network"[Title/Abstract])',
                inclusion_criteria=[
                    "Peer-reviewed studies focusing on ECG arrhythmia detection or cardiac rhythm classification",
                    "Applies deep neural models (CNNs, Transformers, Residual Networks, BiLSTM)",
                    "Evaluated on clinical ECG datasets (MIT-BIH, PTB-XL, CPSC, PhysioNet)",
                    "Reports validated diagnostic metrics (F1-score, Sensitivity, Specificity, AUC)"
                ],
                exclusion_criteria=[
                    "Studies without quantitative ECG evaluation or non-cardiac physiological recordings",
                    "Pure hardware descriptions without algorithmic performance benchmarking"
                ]
            )

        # Digital Pathology / Whole-Slide Imaging (WSI) / Oncology
        if "pathology" in q_lower or "whole-slide" in q_lower or "wsi" in q_lower or "gigapixel" in q_lower or "tcga" in q_lower:
            return QueryPlan(
                original_query=query,
                clinical_problem="Weakly supervised multiple instance learning (MIL) and attention aggregation for gigapixel whole-slide histopathology classification and subtyping in computational oncology.",
                target_modalities=["Gigapixel Whole-Slide Histopathology (WSI)", "H&E Stained Tissue Sections", "Biopsy TMA"],
                generated_keywords=[
                    "whole-slide imaging",
                    "computational pathology",
                    "multiple instance learning",
                    "weakly supervised learning",
                    "TCGA benchmark",
                    "attention-based slide aggregation",
                    "cancer subtyping",
                    "gigapixel histopathology"
                ],
                sub_questions=[
                    "What multiple instance learning (MIL) algorithms effectively aggregate patch-level representations from gigapixel WSIs?",
                    "How are The Cancer Genome Atlas (TCGA) and CAMELYON cohorts utilized for cross-site benchmarking?",
                    "How do attention mechanisms provide interpretable heatmaps for clinical pathologists?",
                    "What classification metrics (slide-level AUC, F1, Accuracy) are achieved across cancer types?"
                ],
                pubmed_boolean_query='("whole slide imaging"[Title/Abstract] OR "whole-slide"[Title/Abstract] OR "histopathology"[Title/Abstract] OR "computational pathology"[Title/Abstract]) AND ("multiple instance learning"[Title/Abstract] OR "weakly supervised"[Title/Abstract] OR "deep learning"[Title/Abstract])',
                inclusion_criteria=[
                    "Focuses on digital pathology, whole-slide imaging, or computational histopathology",
                    "Utilizes weakly supervised multiple instance learning or deep learning architectures",
                    "Evaluated on benchmark cohorts (TCGA, CAMELYON, or institutional clinical biopsies)",
                    "Reports slide-level diagnostic evaluation metrics (AUROC, F1-Score, Balanced Accuracy)"
                ],
                exclusion_criteria=[
                    "Non-histopathology image classification (e.g. non-microscopy radiology only)",
                    "Abstract-only publications lacking experimental methodology"
                ]
            )

        # Intensive Care / Sepsis Prediction / Critical Care Time-Series
        if "sepsis" in q_lower or "icu" in q_lower or "critical care" in q_lower or "mimic" in q_lower or "eicu" in q_lower:
            return QueryPlan(
                original_query=query,
                clinical_problem="Early prediction of sepsis onset and clinical deterioration from physiological time-series and laboratory telemetry in intensive care units.",
                target_modalities=["Physiological Vital Signs Time-Series", "EHR Laboratory Measurements", "ICU Telemetry"],
                generated_keywords=[
                    "early sepsis prediction",
                    "intensive care unit",
                    "physiological time series",
                    "MIMIC-IV dataset",
                    "eICU collaborative research database",
                    "lead time prediction",
                    "temporal data leakage",
                    "Sepsis-3 criteria"
                ],
                sub_questions=[
                    "What machine learning and temporal deep learning models optimize early sepsis detection prior to Sepsis-3 onset?",
                    "How do MIMIC-IV and eICU datasets benchmark multi-center clinical generalizability?",
                    "What prediction horizons (2h, 4h, 6h lead time) balance sensitivity with clinical actionability?",
                    "How do studies safeguard against temporal data leakage in ICU time-series?"
                ],
                pubmed_boolean_query='("sepsis"[Title/Abstract] OR "septic shock"[Title/Abstract]) AND ("intensive care"[Title/Abstract] OR "ICU"[Title/Abstract] OR "critical care"[Title/Abstract]) AND ("machine learning"[Title/Abstract] OR "deep learning"[Title/Abstract] OR "prediction"[Title/Abstract])',
                inclusion_criteria=[
                    "Investigates early sepsis onset prediction or clinical deterioration in ICU patients",
                    "Applies machine learning or deep learning to physiological time-series / EHR data",
                    "Evaluated on clinical ICU databases (MIMIC-IV, eICU, PhysioNet Sepsis Challenge)",
                    "Reports predictive performance (AUROC, Sensitivity, Specificity, Lead-Time Horizon)"
                ],
                exclusion_criteria=[
                    "In-vitro biological assays lacking computational predictive modeling",
                    "Non-ICU ambulatory outpatient studies"
                ]
            )

        # Radiology / Chest X-Ray / CheXpert
        if "x-ray" in q_lower or "radiology" in q_lower or "chest" in q_lower or "chexpert" in q_lower or "ct scan" in q_lower:
            return QueryPlan(
                original_query=query,
                clinical_problem="Computer-aided diagnostic triage and multimodal vision-language modeling for chest radiography and thoracic disease detection.",
                target_modalities=["Chest X-Ray (CXR)", "Thoracic CT Scans", "Radiology Reports"],
                generated_keywords=[
                    "chest radiograph",
                    "CheXpert dataset",
                    "MIMIC-CXR",
                    "vision language models",
                    "thoracic disease detection",
                    "convolutional neural networks",
                    "radiology report generation"
                ],
                sub_questions=[
                    "What deep learning and vision-language architectures lead thoracic pathology classification?",
                    "How do CheXpert and MIMIC-CXR benchmarks evaluate multi-label radiological findings?",
                    "What are the reported clinical metrics (multi-label AUC, Sensitivity, Specificity)?",
                    "How is zero-shot clinical generalization verified?"
                ],
                pubmed_boolean_query='("chest radiography"[Title/Abstract] OR "chest X-ray"[Title/Abstract] OR "radiology"[Title/Abstract]) AND ("deep learning"[Title/Abstract] OR "convolutional"[Title/Abstract] OR "vision language"[Title/Abstract]) AND ("detection"[Title/Abstract] OR "classification"[Title/Abstract])',
                inclusion_criteria=[
                    "Focuses on thoracic radiology, chest X-rays, or computed tomography",
                    "Applies deep neural networks or multimodal foundation models",
                    "Evaluated on public or institutional radiology benchmarks (CheXpert, MIMIC-CXR, NIH CXR14)",
                    "Reports diagnostic metrics (AUROC, F1, Sensitivity)"
                ],
                exclusion_criteria=[
                    "Non-radiological imaging modalities without computational benchmarking",
                    "Editorial perspectives lacking empirical evaluation"
                ]
            )

        # Intelligent general biomedical query fallback
        stop_words = {
            'synthesize', 'review', 'recent', 'advances', 'using', 'evaluating', 'compare',
            'methods', 'approaches', 'algorithm', 'algorithms', 'model', 'models', 'deep', 'learning',
            'machine', 'with', 'from', 'that', 'this', 'what', 'which', 'about', 'lead', 'early',
            'detection', 'prediction', 'classification', 'study', 'studies', 'research', 'analysis',
            'benchmarks', 'datasets', 'protocols', 'into', 'over', 'between', 'across'
        }
        all_words = re.findall(r'\b[a-zA-Z]{3,}\b', q_lower)
        significant_terms = [w for w in all_words if w not in stop_words]

        if len(significant_terms) >= 2:
            clinical_terms = significant_terms[:3]
            pubmed_query = " AND ".join([f'("{t}"[Title/Abstract])' for t in clinical_terms])
            pubmed_query += ' AND ("machine learning"[Title/Abstract] OR "deep learning"[Title/Abstract] OR "clinical"[Title/Abstract])'
        elif len(significant_terms) == 1:
            pubmed_query = f'("{significant_terms[0]}"[Title/Abstract]) AND ("deep learning"[Title/Abstract] OR "clinical evaluation"[Title/Abstract])'
        else:
            pubmed_query = f'("{clean_query[:50]}"[Title/Abstract])'

        target_modalities = [f"{t.capitalize()} Modality" for t in significant_terms[:3]] or ["Clinical telemetry", "Biomedical informatics"]
        keywords = [query] + [t.capitalize() for t in significant_terms[:4]] + ["deep learning", "clinical evaluation", "benchmark dataset"]

        return QueryPlan(
            original_query=query,
            clinical_problem=f"Systematic biomedical literature synthesis and comparative evaluation addressing: {query}",
            target_modalities=target_modalities,
            generated_keywords=keywords,
            sub_questions=[
                f"What are the leading computational and deep learning methodologies applied to {query}?",
                "Which public benchmark datasets and clinical patient cohorts benchmark model performance?",
                "What empirical diagnostic metrics (Accuracy, Sensitivity, Specificity, AUC, F1) are reported?",
                "What clinical translation barriers and methodological limitations persist in published literature?"
            ],
            pubmed_boolean_query=pubmed_query,
            inclusion_criteria=[
                f"Directly investigates {significant_terms[0] if significant_terms else 'the target clinical topic'}",
                "Applies empirical machine learning, deep learning, or statistical computational models",
                "Evaluated on concrete clinical cohorts, databases, or biomedical benchmarks",
                "Reports validated quantitative performance metrics (Sensitivity, Accuracy, AUC, or F1)"
            ],
            exclusion_criteria=[
                "Studies unrelated to the specified clinical or bioinformatics domain",
                "Non-peer-reviewed commentaries, editorials, or theoretical notes lacking empirical validation"
            ]
        )

query_planner = QueryPlanningAgent()
