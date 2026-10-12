export interface QueryPlan {
  original_query: string;
  clinical_problem: string;
  target_modalities: string[];
  generated_keywords: string[];
  sub_questions: string[];
  pubmed_boolean_query: string;
  inclusion_criteria: string[];
  exclusion_criteria: string[];
}

export interface Paper {
  id: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  full_text?: string;
  url: string;
  mesh_terms: string[];
  source: string;
  is_unpublished?: boolean;
  sections?: Record<string, string>;
}

export interface ScreeningResult {
  paper_id: string;
  decision: "INCLUDED" | "EXCLUDED" | "UNCERTAIN";
  relevance_score: number;
  matched_inclusion: string[];
  matched_exclusion: string[];
  reasoning: string;
}

export interface EvidenceItem {
  paper_id: string;
  paper_title: string;
  citation: string;
  pmid?: string;
  doi?: string;
  dataset: string;
  sample_size: string;
  model_architecture: string;
  input_representation: string;
  validation_method: string;
  metrics: Record<string, any>;
  key_findings: string;
  limitations: string;
  evidence_quote: string;
}

export interface DatasetComparisonItem {
  dataset_name: string;
  subjects_count: string;
  recording_type: string;
  public_access: boolean;
  seizure_types: string;
  pros: string;
  cons: string;
}

export interface ModelComparisonItem {
  model_family: string;
  typical_architecture: string;
  spatial_temporal_handling: string;
  computational_complexity: string;
  clinical_realtime_viability: string;
}

export interface ValidationComparisonItem {
  validation_strategy: string;
  typical_reported_sensitivity: string;
  risk_of_data_leakage: string;
  clinical_realism: string;
}

export interface MetricBenchmarkItem {
  citation: string;
  pmid?: string;
  model: string;
  dataset: string;
  validation: string;
  sensitivity: string;
  specificity: string;
  far_per_hour: string;
  f1_score: string;
  auc: string;
}

export interface ComparisonAnalysis {
  datasets_comparison: DatasetComparisonItem[];
  models_comparison: ModelComparisonItem[];
  validation_comparison: ValidationComparisonItem[];
  metrics_benchmark: MetricBenchmarkItem[];
  key_findings: string[];
  research_gaps: string[];
  consensus_points: string[];
  discrepancy_points: string[];
}

export interface GroundedClaim {
  claim_id: string;
  claim_text: string;
  cited_pmid?: string;
  cited_doi?: string;
  supporting_quote: string;
  verification_status: "VERIFIED" | "UNVERIFIED";
  confidence_score: number;
}

export interface ReferenceItem {
  index: number;
  pmid?: string;
  doi?: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  url: string;
}

export interface AgentTraceStep {
  timestamp: string;
  agent_name: string;
  action: string;
  status: string;
  details: string;
  output_summary?: string;
}

export interface LiteratureReviewResponse {
  id: string;
  query: string;
  status: string;
  created_at: string;
  query_plan?: QueryPlan;
  retrieved_papers: Paper[];
  screened_results: ScreeningResult[];
  selected_papers: Paper[];
  evidence_table: EvidenceItem[];
  comparison?: ComparisonAnalysis;
  grounded_claims: GroundedClaim[];
  references: ReferenceItem[];
  final_synthesis: string;
  agent_trace: AgentTraceStep[];
}

export interface ReviewSummaryListItem {
  id: string;
  query: string;
  status: string;
  created_at: string;
}

export interface SampleBenchmarkQuery {
  id: string;
  title: string;
  query: string;
  domain: string;
  recommended: boolean;
}

export interface RAGSource {
  pmid: string;
  title: string;
  doi?: string;
  relevance_score: number;
  snippet: string;
  section?: string;
  source?: string;
  is_unpublished?: boolean;
}

export interface RAGAnswer {
  answer: string;
  grounded_sources: RAGSource[];
  confidence: number;
  is_out_of_bounds?: boolean;
  is_trained_on_demand?: boolean;
  newly_indexed_papers?: number;
  corpus_scope?: {
    total_papers: number;
    total_chunks: number;
    topics: string[];
    titles: string[];
    has_unpublished?: boolean;
    unpublished_count?: number;
    unpublished_titles?: string[];
    uploaded_count?: number;
  };
  query_type?: 'in_bounds' | 'out_of_bounds_biomedical' | 'out_of_bounds_general' | 'auto_trained';
  can_train?: boolean;
  suggested_topic?: string;
}

export interface UploadResponse {
  status: string;
  paper: Paper;
  extracted_chars: number;
  is_unpublished: boolean;
  publication_status: string;
  rag_autotrained: boolean;
  chunks_indexed: number;
  total_corpus_papers: number;
  total_corpus_chunks: number;
  corpus_scope: any;
  evidence?: EvidenceItem;
}

export type LayoutMode = 'split' | 'synthesis' | 'comparison' | 'evidence' | 'trace';

export type SidebarNavTab = 
  | 'overview' 
  | 'papers' 
  | 'evidence' 
  | 'comparison' 
  | 'findings' 
  | 'synthesis' 
  | 'references' 
  | 'trace';

