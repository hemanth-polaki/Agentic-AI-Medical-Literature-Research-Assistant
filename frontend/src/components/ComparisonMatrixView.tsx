import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { 
  Layers, 
  Database, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ExternalLink, 
  Quote, 
  Activity,
  FileSpreadsheet,
  ArrowRight,
  Filter,
  BarChart3
} from 'lucide-react';
import type { LiteratureReviewResponse, EvidenceItem } from '../types';

interface ComparisonMatrixViewProps {
  review?: LiteratureReviewResponse | null;
  mode?: 'comparison' | 'evidence';
  onNavigateToTab?: (tab: 'comparison' | 'evidence') => void;
  isCompactSplit?: boolean;
}

export const ComparisonMatrixView: FC<ComparisonMatrixViewProps> = ({ 
  review, 
  mode = 'comparison',
  onNavigateToTab,
  isCompactSplit = false
}) => {
  // If mode is 'evidence', default to 'evidence' tab.
  // If mode is 'comparison', default to 'datasets' tab so it never displays the same page as Evidence Table!
  const [activeTab, setActiveTab] = useState<'evidence' | 'datasets' | 'architectures' | 'metrics' | 'validation' | 'gaps'>(
    mode === 'evidence' ? 'evidence' : 'datasets'
  );
  const [evidenceSearch, setEvidenceSearch] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  // Sync activeTab when parent mode changes
  useEffect(() => {
    if (mode === 'evidence') {
      setActiveTab('evidence');
    } else if (mode === 'comparison') {
      if (activeTab === 'evidence') {
        setActiveTab('datasets');
      }
    }
  }, [mode]);

  if (!review || (mode === 'comparison' && !review.comparison)) {
    const isOngoing = review?.status && review.status !== 'Completed';
    return (
      <div className="rounded-2xl bg-white p-12 text-center border border-slate-200 text-slate-500 shadow-xs">
        <Layers className={`w-12 h-12 mx-auto mb-3 ${isOngoing ? 'text-indigo-600 animate-pulse' : 'text-slate-300'}`} />
        <h3 className="text-base font-bold text-slate-800">
          {isOngoing
            ? 'Comparison Agent Constructing Cross-Study Matrix...'
            : (mode === 'evidence' ? 'No Evidence Table Data Available' : 'No Cross-Study Comparison Data Available')}
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          {isOngoing
            ? `Multi-agent research pipeline is currently in phase "${review.status}". Comparative benchmarks across datasets, models, and protocols will appear once extraction concludes.`
            : 'Execute a literature review query above to populate this comparative matrix.'}
        </p>
      </div>
    );
  }

  const comparison = review.comparison;
  const evidenceList = (review.evidence_table || []).filter(e => {
    if (!evidenceSearch) return true;
    const s = evidenceSearch.toLowerCase();
    return (
      (e.paper_title || '').toLowerCase().includes(s) ||
      (e.dataset || '').toLowerCase().includes(s) ||
      (e.model_architecture || '').toLowerCase().includes(s) ||
      (e.validation_method || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className={`space-y-3.5 ${isCompactSplit ? 'max-h-[880px] overflow-y-auto pr-1' : ''}`}>
      {/* View Header Banner (Full mode or compact) */}
      {!isCompactSplit && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              {mode === 'evidence' ? (
                <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              ) : (
                <Layers className="w-5 h-5 text-indigo-600" />
              )}
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {mode === 'evidence' 
                  ? 'Evidence Extraction Table' 
                  : 'Cross-Study Synthesis & Comparative Benchmarking'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'evidence'
                ? `Granular study-by-study extraction across ${review.evidence_table?.length || 0} approved publications with verified metrics and source quotes.`
                : 'Multi-dimensional benchmarking across benchmark datasets, neural architectures, validation protocols, and quantitative evaluation metrics.'}
            </p>
          </div>

          {/* Quick Cross-Navigation Button */}
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab(mode === 'evidence' ? 'comparison' : 'evidence')}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-teal-800 border border-slate-200 transition-colors shadow-2xs"
            >
              <span>{mode === 'evidence' ? 'Switch to Cross-Study Matrix' : 'Switch to Evidence Table'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
            </button>
          )}
        </div>
      )}

      {/* Navigation Sub-Tabs & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
        {mode === 'comparison' ? (
          /* Sub-tabs for Cross-Study Matrix */
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveTab('datasets')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                activeTab === 'datasets'
                  ? 'bg-white text-indigo-950 shadow-xs font-bold border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3 h-3 text-indigo-600" />
              <span>Dataset Comparison ({comparison?.datasets_comparison?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('architectures')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                activeTab === 'architectures'
                  ? 'bg-white text-indigo-950 shadow-xs font-bold border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3 h-3 text-blue-600" />
              <span>Method Comparison ({comparison?.models_comparison?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                activeTab === 'metrics'
                  ? 'bg-white text-indigo-950 shadow-xs font-bold border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3 h-3 text-emerald-600" />
              <span>Evaluation Metrics ({comparison?.metrics_benchmark?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('validation')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                activeTab === 'validation'
                  ? 'bg-white text-indigo-950 shadow-xs font-bold border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3 h-3 text-purple-600" />
              <span>Protocols</span>
            </button>

            <button
              onClick={() => setActiveTab('gaps')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                activeTab === 'gaps'
                  ? 'bg-white text-indigo-950 shadow-xs font-bold border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>Findings & Gaps</span>
            </button>
          </div>
        ) : (
          /* Dedicated Evidence Table filter bar */
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            <span>Evidence Extraction Table ({review.evidence_table?.length || 0} studies)</span>
          </div>
        )}

        {/* Filter search bar */}
        <div className="relative">
          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search authors, datasets, models..."
            value={evidenceSearch}
            onChange={(e) => setEvidenceSearch(e.target.value)}
            className="pl-7 pr-2.5 py-1 rounded-lg bg-slate-50 text-[11px] text-slate-800 border border-slate-300 focus:border-teal-600 focus:bg-white outline-none w-44 sm:w-56 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* VIEW: Evidence Table (Active when mode is 'evidence' or activeTab is 'evidence') */}
      {(mode === 'evidence' || activeTab === 'evidence') && (
        <div className="rounded-xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Publication / Author</th>
                  <th className="py-2.5 px-2.5">Dataset & Cohort</th>
                  <th className="py-2.5 px-2.5">Architecture</th>
                  <th className="py-2.5 px-2.5">Validation</th>
                  <th className="py-2.5 px-2 font-mono text-center">Sens.</th>
                  <th className="py-2.5 px-2 font-mono text-center">Spec.</th>
                  <th className="py-2.5 px-2 font-mono text-center">FAR/h</th>
                  <th className="py-2.5 px-2 font-mono text-center">F1/AUC</th>
                  <th className="py-2.5 px-2.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evidenceList.map((item, idx) => (
                  <tr
                    key={item.paper_id || idx}
                    className="hover:bg-teal-50/30 transition-colors group"
                  >
                    <td className="py-2.5 px-3 max-w-[180px]">
                      <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors truncate">
                        {item.citation}
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {item.paper_title}
                      </p>
                      {item.pmid && (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${item.pmid}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-[9px] text-teal-700 font-mono font-semibold hover:underline mt-0.5 bg-teal-50 px-1 py-0.2 rounded border border-teal-200"
                        >
                          PMID: {item.pmid} <ExternalLink className="w-2 h-2" />
                        </a>
                      )}
                    </td>

                    <td className="py-2.5 px-2.5">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {item.dataset}
                      </span>
                      <p className="text-[9px] text-slate-500 mt-0.5 font-medium truncate max-w-[120px]">
                        {item.sample_size}
                      </p>
                    </td>

                    <td className="py-2.5 px-2.5 max-w-[120px]">
                      <span className="font-bold text-indigo-900 text-[11px] block truncate">
                        {item.model_architecture}
                      </span>
                      <p className="text-[9px] text-slate-500 truncate mt-0.5">
                        {item.input_representation}
                      </p>
                    </td>

                    <td className="py-2.5 px-2.5 max-w-[100px]">
                      <span className="text-slate-700 text-[10px] font-medium block truncate">
                        {item.validation_method}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50 text-[11px]">
                      {item.metrics?.sensitivity || 'N/A'}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-medium text-slate-700 text-[11px]">
                      {item.metrics?.specificity || 'N/A'}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-800 bg-amber-50/50 text-[11px]">
                      {item.metrics?.far_per_hr || 'N/A'}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-bold text-teal-800 text-[11px]">
                      {item.metrics?.f1 || item.metrics?.auc || 'N/A'}
                    </td>

                    <td className="py-2.5 px-2.5 text-right">
                      <button
                        onClick={() => setSelectedEvidence(item)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-teal-50 text-[10px] text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 font-semibold transition-colors shadow-2xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: Datasets Comparison */}
      {mode === 'comparison' && activeTab === 'datasets' && (
        <div className={`grid gap-3.5 ${isCompactSplit ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {(comparison?.datasets_comparison || []).map((ds, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-xs transition-all shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-teal-600" />
                    {ds.dataset_name}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {ds.recording_type}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  ds.public_access
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {ds.public_access ? 'Open Access' : 'Restricted'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Cohort:</span>
                  <span className="text-slate-900 font-mono font-bold text-[11px]">{ds.subjects_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">{(ds.seizure_types || '').toLowerCase().includes('seizure') ? 'Seizure Spectrum:' : 'Diagnostic Target / Spectrum:'}</span>
                  <span className="text-slate-800 font-medium text-[11px]">{ds.seizure_types}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                  <strong className="text-emerald-800 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Strengths:</strong>
                  <p className="text-[11px] leading-relaxed">{ds.pros}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-950">
                  <strong className="text-rose-800 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Limitations:</strong>
                  <p className="text-[11px] leading-relaxed">{ds.cons}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW: Model Architecture Taxonomy */}
      {mode === 'comparison' && activeTab === 'architectures' && (
        <div className={`grid gap-3.5 ${isCompactSplit ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {(comparison?.models_comparison || []).map((m, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all shadow-2xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {m.model_family}
                  </h3>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Architecture Specification:
                  </span>
                  <p className="text-slate-800 font-medium text-[11px]">
                    {m.typical_architecture}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Spatial-Temporal Handling:
                  </span>
                  <p className="text-slate-800 font-medium text-[11px]">
                    {m.spatial_temporal_handling}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>Complexity:</span>
                  <span className="font-mono text-slate-900 font-bold">{m.computational_complexity}</span>
                </div>
                <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-[10px] text-teal-950 font-medium">
                  <strong className="block text-teal-800 font-bold">Clinical Viability:</strong>
                  {m.clinical_realtime_viability}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW: Evaluation Metrics Benchmark Table */}
      {mode === 'comparison' && activeTab === 'metrics' && (
        <div className="rounded-xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Evaluation Metrics Benchmark Table
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-bold">
              {comparison?.metrics_benchmark?.length || 0} Models Compared
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3">Study / Citation</th>
                  <th className="py-2.5 px-3">Model Architecture</th>
                  <th className="py-2.5 px-2.5">Dataset</th>
                  <th className="py-2.5 px-2.5">Validation Strategy</th>
                  <th className="py-2.5 px-2 font-mono text-center">Sensitivity</th>
                  <th className="py-2.5 px-2 font-mono text-center">Specificity</th>
                  <th className="py-2.5 px-2 font-mono text-center">FAR / hr</th>
                  <th className="py-2.5 px-2 font-mono text-center">F1-Score</th>
                  <th className="py-2.5 px-2 font-mono text-center">AUC-ROC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(comparison?.metrics_benchmark || []).map((mb, idx) => (
                  <tr key={idx} className="hover:bg-teal-50/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      <div>{mb.citation}</div>
                      {mb.pmid && (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${mb.pmid}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-[9px] text-teal-700 font-mono font-semibold hover:underline mt-0.5"
                        >
                          PMID: {mb.pmid} <ExternalLink className="w-2 h-2" />
                        </a>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-indigo-900 text-[11px]">
                      {mb.model}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-700 font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px]">
                        {mb.dataset}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-600 text-[10px]">
                      {mb.validation}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50 text-[11px]">
                      {mb.sensitivity}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-medium text-slate-700 text-[11px]">
                      {mb.specificity}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-800 bg-amber-50/50 text-[11px]">
                      {mb.far_per_hour}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-teal-800 text-[11px]">
                      {mb.f1_score}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-purple-800 text-[11px]">
                      {mb.auc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: Validation Protocols */}
      {mode === 'comparison' && activeTab === 'validation' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-amber-900 block font-bold mb-0.5">Clinical Protocol Finding:</strong>
              Patient-specific evaluations achieve high sensitivity (&gt;97%) but suffer temporal data leakage. Only patient-independent cross-validation (LOOCV) represents genuine emergency bedside efficacy.
            </div>
          </div>

          <div className={`grid gap-3 ${isCompactSplit ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
            {(comparison?.validation_comparison || []).map((v, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5"
              >
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  {v.validation_strategy}
                </h4>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Sensitivity:</span>
                    <span className="font-mono font-bold text-emerald-800">{v.typical_reported_sensitivity}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Leakage Risk:</span>
                    <span className={`font-mono font-bold ${v.risk_of_data_leakage.toLowerCase().includes('high') ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {v.risk_of_data_leakage.split(':')[0]}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                    Clinical Realism:
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium text-[11px]">
                    {v.clinical_realism}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: Gaps & Consensus */}
      {mode === 'comparison' && activeTab === 'gaps' && (
        <div className={`grid gap-3.5 ${isCompactSplit ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {/* Key Findings */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Consensus Points & Core Findings
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-800">
              {(comparison?.key_findings || []).map((kf, i) => (
                <li key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/80 font-medium text-[11px] leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1 shrink-0"></span>
                  <span>{kf}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Research Gaps */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Identified Translational Gaps
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-800">
              {(comparison?.research_gaps || []).map((rg, i) => (
                <li key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50/50 border border-rose-200/80 text-rose-950 font-medium text-[11px] leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1 shrink-0"></span>
                  <span>{rg}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Evidence Quote Inspection Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-xl w-full rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-teal-700 uppercase tracking-wider font-bold">
                  Scholarly Evidence Profile
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedEvidence.citation}: {selectedEvidence.paper_title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-teal-800 font-bold uppercase text-[9px] tracking-wider">
                <Quote className="w-3 h-3 text-teal-600" />
                PubMed Abstract Quote:
              </div>
              <p className="italic text-slate-800 leading-relaxed pl-2 border-l-2 border-teal-600 text-xs">
                "{selectedEvidence.evidence_quote}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-600 block mb-0.5 font-bold text-[11px]">Findings:</strong>
                <p className="text-slate-800 font-medium text-[11px]">{selectedEvidence.key_findings}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <strong className="text-slate-600 block mb-0.5 font-bold text-[11px]">Limitations:</strong>
                <p className="text-slate-800 font-medium text-[11px]">{selectedEvidence.limitations}</p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-xs font-bold text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
