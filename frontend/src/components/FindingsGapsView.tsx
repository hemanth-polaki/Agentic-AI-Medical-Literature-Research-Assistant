import type { FC } from 'react';
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2, 
  GitCompare, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import type { LiteratureReviewResponse } from '../types';

interface FindingsGapsViewProps {
  review?: LiteratureReviewResponse | null;
  onNavigateToSynthesis?: () => void;
}

export const FindingsGapsView: FC<FindingsGapsViewProps> = ({ 
  review,
  onNavigateToSynthesis 
}) => {
  if (!review || !review.comparison || ((review.comparison.key_findings || []).length === 0 && (review.comparison.research_gaps || []).length === 0)) {
    const isOngoing = review?.status && review.status !== 'Completed';
    return (
      <div className="rounded-2xl bg-white p-12 text-center border border-slate-200 text-slate-500 shadow-xs">
        <Lightbulb className={`w-12 h-12 mx-auto mb-3 ${isOngoing ? 'text-amber-500 animate-pulse' : 'text-slate-300'}`} />
        <h3 className="text-base font-bold text-slate-800">
          {isOngoing ? 'Comparison Agent Formulating Clinical Findings & Gaps...' : 'No Findings & Gaps Synthesized Yet'}
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          {isOngoing
            ? `Multi-agent research pipeline is currently in phase "${review.status}". Qualitative findings and translational gaps will appear once cross-study analysis finishes.`
            : 'Execute a literature review to generate the comparative taxonomy, key findings, and research gaps.'}
        </p>
      </div>
    );
  }

  const comparison = review.comparison;
  const keyFindings = comparison.key_findings || [];
  const researchGaps = comparison.research_gaps || [];
  const consensusPoints = comparison.consensus_points || [];
  const discrepancyPoints = comparison.discrepancy_points || [];

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Clinical Findings, Gaps & Consensus Analysis
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Synthesized across {review.selected_papers?.length || 0} eligible publications to highlight evidence consensus and clinical translation barriers.
          </p>
        </div>

        {onNavigateToSynthesis && (
          <button
            onClick={onNavigateToSynthesis}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors shadow-2xs"
          >
            <span>Read Full Synthesis</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
          </button>
        )}
      </div>

      {/* Grid: Key Findings & Research Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* 1. Key Findings Panel */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
                <Sparkles className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Key Findings
                </h3>
                <p className="text-[11px] text-slate-500">
                  Verified discoveries across peer-reviewed evaluations
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
              {keyFindings.length} Insights
            </span>
          </div>

          <div className="space-y-2.5">
            {keyFindings.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No specific key findings extracted.</p>
            ) : (
              keyFindings.map((finding, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs leading-relaxed flex items-start gap-3 hover:border-teal-200 transition-colors"
                >
                  <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-100/70 border border-teal-200 px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                    F{idx + 1}
                  </span>
                  <p className="text-slate-800 font-medium">
                    {finding}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Research Gaps Panel */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Research Gaps
                </h3>
                <p className="text-[11px] text-slate-500">
                  Identified blindspots and clinical deployment hurdles
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {researchGaps.length} Gaps
            </span>
          </div>

          <div className="space-y-2.5">
            {researchGaps.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No specific research gaps extracted.</p>
            ) : (
              researchGaps.map((gap, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200 text-xs leading-relaxed flex items-start gap-3"
                >
                  <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                    G{idx + 1}
                  </span>
                  <p className="text-slate-800 font-medium">
                    {gap}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Grid: Scientific Consensus & Discrepancies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* 3. Scientific Consensus */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Evidence Consensus Points
                </h3>
                <p className="text-[11px] text-slate-500">
                  Corroborated across multiple independent studies
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {consensusPoints.length} Points
            </span>
          </div>

          <div className="space-y-2.5">
            {consensusPoints.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Consensus points under analysis.</p>
            ) : (
              consensusPoints.map((point, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl bg-emerald-50/30 border border-emerald-200/80 text-xs leading-relaxed flex items-start gap-3"
                >
                  <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                    C{idx + 1}
                  </span>
                  <p className="text-slate-800 font-medium">
                    {point}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Discrepancy & Controversy Points */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                <GitCompare className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Discrepancies & Methodological Variances
                </h3>
                <p className="text-[11px] text-slate-500">
                  Conflicting benchmark outcomes and protocol divergence
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
              {discrepancyPoints.length} Variances
            </span>
          </div>

          <div className="space-y-2.5">
            {discrepancyPoints.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No significant discrepancies reported.</p>
            ) : (
              discrepancyPoints.map((point, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs leading-relaxed flex items-start gap-3"
                >
                  <span className="font-mono text-[10px] font-bold text-indigo-800 bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                    D{idx + 1}
                  </span>
                  <p className="text-slate-800 font-medium">
                    {point}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
