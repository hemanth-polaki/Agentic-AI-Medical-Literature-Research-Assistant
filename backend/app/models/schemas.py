from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class QueryPlan(BaseModel):
    original_query: str
    clinical_problem: str
    target_modalities: List[str] = Field(default_factory=list)
    generated_keywords: List[str] = Field(default_factory=list)
    sub_questions: List[str] = Field(default_factory=list)
    pubmed_boolean_query: str
    inclusion_criteria: List[str] = Field(default_factory=list)
    exclusion_criteria: List[str] = Field(default_factory=list)

class Paper(BaseModel):
    id: str
    pmid: Optional[str] = None
    pmcid: Optional[str] = None
    doi: Optional[str] = None
    title: str
    authors: List[str] = Field(default_factory=list)
    journal: str = ""
    year: int = 2024
    abstract: str = ""
    full_text: Optional[str] = None
    url: str = ""
    mesh_terms: List[str] = Field(default_factory=list)
    source: str = "PubMed"
    is_unpublished: bool = False
    sections: Dict[str, str] = Field(default_factory=dict)

class ScreeningResult(BaseModel):
    paper_id: str
    decision: str  # "INCLUDED" | "EXCLUDED" | "UNCERTAIN"
    relevance_score: float  # 0.0 - 1.0
    matched_inclusion: List[str] = Field(default_factory=list)
    matched_exclusion: List[str] = Field(default_factory=list)
    reasoning: str

class EvidenceItem(BaseModel):
    paper_id: str
    paper_title: str
    citation: str
    pmid: Optional[str] = None
    doi: Optional[str] = None
    dataset: Optional[str] = "Clinical Cohort"
    sample_size: Optional[str] = "Clinical Cohort"
    model_architecture: Optional[str] = "Machine Learning"
    input_representation: Optional[str] = "Biomedical Features"
    validation_method: Optional[str] = "Cross-Validation"
    metrics: Dict[str, Any] = Field(default_factory=dict)
    key_findings: Optional[str] = ""
    limitations: Optional[str] = ""
    evidence_quote: Optional[str] = ""

class DatasetComparisonItem(BaseModel):
    dataset_name: str = "Clinical Benchmark Cohort"
    subjects_count: str = "Multi-subject cohort"
    recording_type: str = "Biomedical signals / clinical telemetry"
    public_access: bool = True
    seizure_types: str = "Clinical Diagnostic Spectrum"
    pros: str = "Standardized benchmark data with reported metrics"
    cons: str = "Requires multi-center external cohort validation"

    @model_validator(mode='before')
    @classmethod
    def normalize_dataset_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Normalize seizure_types from target_spectrum, diagnostic_target, etc.
            if "seizure_types" not in data or not data["seizure_types"]:
                for k in ["diagnostic_target", "target_spectrum", "target_disease", "clinical_spectrum", "spectrum", "target"]:
                    if k in data and data[k]:
                        data["seizure_types"] = str(data[k])
                        break
                else:
                    data["seizure_types"] = "Clinical Diagnostic Spectrum"
            
            # Normalize public_access if string
            if "public_access" in data and not isinstance(data["public_access"], bool):
                val_str = str(data["public_access"]).lower()
                data["public_access"] = any(w in val_str for w in ["true", "open", "public", "yes", "1"])
        return data

class ModelComparisonItem(BaseModel):
    model_family: str = "Machine Learning / Deep Learning Framework"
    typical_architecture: str = "Algorithmic specification"
    spatial_temporal_handling: str = "Feature selection & representation learning"
    computational_complexity: str = "Moderate complexity"
    clinical_realtime_viability: str = "Clinical translation feasible"

    @model_validator(mode='before')
    @classmethod
    def normalize_model_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "model_family" not in data or not data["model_family"]:
                for k in ["model", "model_name", "architecture_class", "name", "family"]:
                    if k in data and data[k]:
                        data["model_family"] = str(data[k])
                        break
            if "typical_architecture" not in data or not data["typical_architecture"]:
                for k in ["architecture", "methodology", "specification", "description"]:
                    if k in data and data[k]:
                        data["typical_architecture"] = str(data[k])
                        break
            if "spatial_temporal_handling" not in data or not data["spatial_temporal_handling"]:
                for k in ["feature_selection", "optimization_strategy", "feature_handling", "strategy"]:
                    if k in data and data[k]:
                        data["spatial_temporal_handling"] = str(data[k])
                        break
            if "clinical_realtime_viability" not in data or not data["clinical_realtime_viability"]:
                for k in ["clinical_viability", "viability", "feasibility", "realtime_viability"]:
                    if k in data and data[k]:
                        data["clinical_realtime_viability"] = str(data[k])
                        break
        return data

class ValidationComparisonItem(BaseModel):
    validation_strategy: str = "Cross-Validation"
    typical_reported_sensitivity: str = "88% - 96%"
    risk_of_data_leakage: str = "Low to moderate"
    clinical_realism: str = "Standard clinical benchmark protocol"

    @model_validator(mode='before')
    @classmethod
    def normalize_val_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "validation_strategy" not in data or not data["validation_strategy"]:
                for k in ["strategy", "protocol", "method", "validation_method"]:
                    if k in data and data[k]:
                        data["validation_strategy"] = str(data[k])
                        break
            if "typical_reported_sensitivity" not in data or not data["typical_reported_sensitivity"]:
                for k in ["sensitivity", "accuracy", "reported_accuracy", "performance_range"]:
                    if k in data and data[k]:
                        data["typical_reported_sensitivity"] = str(data[k])
                        break
            if "risk_of_data_leakage" not in data or not data["risk_of_data_leakage"]:
                for k in ["leakage_risk", "risk", "leakage"]:
                    if k in data and data[k]:
                        data["risk_of_data_leakage"] = str(data[k])
                        break
            if "clinical_realism" not in data or not data["clinical_realism"]:
                for k in ["realism", "applicability", "clinical_utility"]:
                    if k in data and data[k]:
                        data["clinical_realism"] = str(data[k])
                        break
        return data

class MetricBenchmarkItem(BaseModel):
    citation: str
    pmid: Optional[str] = None
    model: Optional[str] = "Machine Learning"
    dataset: Optional[str] = "Clinical Benchmark"
    validation: Optional[str] = "Cross-Validation"
    sensitivity: Optional[str] = "N/A"
    specificity: Optional[str] = "N/A"
    far_per_hour: Optional[str] = "N/A"
    f1_score: Optional[str] = "N/A"
    auc: Optional[str] = "N/A"

class ComparisonAnalysis(BaseModel):
    datasets_comparison: List[DatasetComparisonItem] = Field(default_factory=list)
    models_comparison: List[ModelComparisonItem] = Field(default_factory=list)
    validation_comparison: List[ValidationComparisonItem] = Field(default_factory=list)
    metrics_benchmark: List[MetricBenchmarkItem] = Field(default_factory=list)
    key_findings: List[str] = Field(default_factory=list)
    research_gaps: List[str] = Field(default_factory=list)
    consensus_points: List[str] = Field(default_factory=list)
    discrepancy_points: List[str] = Field(default_factory=list)

class GroundedClaim(BaseModel):
    claim_id: str
    claim_text: str
    cited_pmid: Optional[str] = None
    cited_doi: Optional[str] = None
    supporting_quote: str
    verification_status: str  # "VERIFIED" | "UNVERIFIED"
    confidence_score: float

class ReferenceItem(BaseModel):
    index: int
    pmid: Optional[str] = None
    doi: Optional[str] = None
    title: str
    authors: str
    journal: str
    year: int
    url: str

class AgentTraceStep(BaseModel):
    timestamp: str
    agent_name: str
    action: str
    status: str = "in_progress"
    details: str
    output_summary: Optional[str] = None

class LiteratureReviewResponse(BaseModel):
    id: str
    query: str
    status: str
    created_at: str
    query_plan: Optional[QueryPlan] = None
    retrieved_papers: List[Paper] = Field(default_factory=list)
    screened_results: List[ScreeningResult] = Field(default_factory=list)
    selected_papers: List[Paper] = Field(default_factory=list)
    evidence_table: List[EvidenceItem] = Field(default_factory=list)
    comparison: Optional[ComparisonAnalysis] = None
    grounded_claims: List[GroundedClaim] = Field(default_factory=list)
    references: List[ReferenceItem] = Field(default_factory=list)
    final_synthesis: str = ""
    agent_trace: List[AgentTraceStep] = Field(default_factory=list)

class SearchRequest(BaseModel):
    query: str
    max_results: int = 10
    use_llm: bool = True
    llm_provider: Optional[str] = "gemini"  # "gemini" | "openai" | "heuristic"

class RAGQuestionRequest(BaseModel):
    review_id: Optional[str] = ""
    question: str
    auto_train: bool = True

class RAGQuestionResponse(BaseModel):
    answer: str
    grounded_sources: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: float
    is_out_of_bounds: bool = False
    is_trained_on_demand: bool = False
    newly_indexed_papers: int = 0
    corpus_scope: Optional[Dict[str, Any]] = None
    query_type: str = "in_bounds"  # "in_bounds" | "out_of_bounds_biomedical" | "out_of_bounds_general" | "auto_trained"
    can_train: bool = False
    suggested_topic: Optional[str] = None

class RAGTrainRequest(BaseModel):
    topic: str
    review_id: Optional[str] = ""
    max_papers: int = 4

