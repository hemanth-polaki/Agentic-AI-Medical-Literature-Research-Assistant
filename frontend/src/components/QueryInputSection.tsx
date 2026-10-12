import { useState } from 'react';
import type { FC } from 'react';
import { 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  Loader2, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus
} from 'lucide-react';
import type { SampleBenchmarkQuery } from '../types';

interface QueryInputSectionProps {
  query: string;
  setQuery: (q: string) => void;
  maxResults: number;
  setMaxResults: (n: number) => void;
  isRunning: boolean;
  onStartReview: () => void;
  sampleQueries: SampleBenchmarkQuery[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  hasActiveReview?: boolean;
  onNewReview?: () => void;
}

export const QueryInputSection: FC<QueryInputSectionProps> = ({
  query,
  setQuery,
  maxResults,
  setMaxResults,
  isRunning,
  onStartReview,
  sampleQueries,
  isCollapsed = false,
  onToggleCollapse,
  hasActiveReview = false,
  onNewReview
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Compact clinical bar mode when active review is displayed
  if (isCollapsed && hasActiveReview) {
    return (
      <section className="rounded-xl bg-white border border-slate-200/90 shadow-2xs p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all animate-fadeIn">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 shrink-0">
            <Search className="w-4 h-4 text-teal-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.2 rounded">
                Active Protocol Query
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {maxResults} papers target
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 truncate mt-0.5" title={query}>
              {query}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {onNewReview && (
            <button
              onClick={onNewReview}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition-colors shadow-2xs"
              title="Start a new review query"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>New Review</span>
            </button>
          )}

          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
            title="Expand to modify query or options"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Modify Query</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          <button
            onClick={onStartReview}
            disabled={isRunning || !query.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm shadow-teal-600/20 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-run Review</span>
              </>
            )}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-xs">
      <div className="relative z-10 space-y-4">
        
        {/* Title, Clinical Protocol Badge & Collapse Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                PRISMA Autonomous Medical Literature Synthesizer
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 100% Citation Grounded
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Automates Query Formulation, NCBI Entrez Retrieval, PRISMA Eligibility Screening, Methodological Extraction, Cross-Study Benchmarking & Grounded Review.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {hasActiveReview && onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold shadow-2xs transition-colors"
                title="Collapse into compact toolbar to maximize workstation space"
              >
                <span>Compact View</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-teal-700 transition-colors px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 font-medium shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Config ({maxResults} papers)</span>
            </button>
          </div>
        </div>

        {/* Search Console Input box */}
        <div className="relative group">
          <div className="relative flex flex-col sm:flex-row gap-2 bg-white border border-slate-300 rounded-xl p-2.5 shadow-2xs focus-within:border-teal-600 focus-within:ring-3 focus-within:ring-teal-500/10 transition-all">
            <div className="flex items-start gap-2.5 flex-1 px-1 pt-1.5 sm:pt-0.5">
              <Search className="w-5 h-5 text-teal-600 mt-1 shrink-0" />
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a clinical research question (e.g. 'Review recent research on deep-learning methods for EEG seizure detection and compare datasets, models, validation methods, and evaluation metrics')..."
                rows={2}
                disabled={isRunning}
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 resize-none outline-none leading-relaxed font-normal"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    if (!isRunning && query.trim()) onStartReview();
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 px-1 pb-1 sm:pb-0 pt-1 border-t sm:border-t-0 border-slate-100">
              <span className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <CornerDownLeft className="w-3 h-3 text-slate-400" /> Ctrl+Enter to run
              </span>

              <button
                onClick={onStartReview}
                disabled={isRunning || !query.trim()}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-md transition-all ${
                  isRunning
                    ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 shadow-teal-600/20 active:scale-95'
                }`}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    <span className="text-slate-700 font-semibold">Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Run Literature Review</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Config drawer */}
        {showAdvanced && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center gap-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-slate-600 font-semibold">Max Studies to Retrieve:</span>
              <div className="flex gap-1.5">
                {[5, 7, 10, 15].map((count) => (
                  <button
                    key={count}
                    onClick={() => setMaxResults(count)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      maxResults === count
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>NCBI Entrez API Live: <strong className="text-emerald-700">Active</strong></span>
            </div>
          </div>
        )}

        {/* Curated Benchmark Queries */}
        <div className="pt-1">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Curated Clinical Benchmark Scenarios:
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((item) => (
              <button
                key={item.id}
                onClick={() => setQuery(item.query)}
                disabled={isRunning}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 text-xs text-left transition-all shadow-2xs"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${item.recommended ? 'bg-teal-600 ring-2 ring-teal-500/20' : 'bg-slate-400'}`}></span>
                <span className="text-slate-700 group-hover:text-teal-900 font-semibold">
                  {item.title}
                </span>
                <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {item.domain}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
