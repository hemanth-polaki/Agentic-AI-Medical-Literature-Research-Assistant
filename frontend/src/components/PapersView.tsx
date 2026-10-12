import { useState } from 'react';
import type { FC } from 'react';
import { 
  FileText, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Tag, 
  Calendar, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import type { LiteratureReviewResponse, Paper, ScreeningResult } from '../types';

interface PapersViewProps {
  review?: LiteratureReviewResponse | null;
  onNavigateToEvidence?: () => void;
}

export const PapersView: FC<PapersViewProps> = ({ 
  review,
  onNavigateToEvidence 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'INCLUDED' | 'EXCLUDED'>('ALL');
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);

  if (!review) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center border border-slate-200 text-slate-500 shadow-xs">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Literature Records Retrieved Yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Submit a research query to initiate the PRISMA retrieval and screening pipeline.
        </p>
      </div>
    );
  }

  const allPapers: Paper[] = review.retrieved_papers || [];
  const screeningMap = new Map<string, ScreeningResult>();
  (review.screened_results || []).forEach(res => {
    screeningMap.set(res.paper_id, res);
  });

  const evidencePaperIds = new Set(
    (review.evidence_table || []).map(e => e.paper_id)
  );

  const filteredPapers = allPapers.filter(paper => {
    const screening = screeningMap.get(paper.id);
    const decision = screening?.decision || 'UNCERTAIN';

    if (statusFilter === 'INCLUDED' && decision !== 'INCLUDED') return false;
    if (statusFilter === 'EXCLUDED' && decision !== 'EXCLUDED') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = paper.title.toLowerCase().includes(q);
    const authorsMatch = (paper.authors || []).some(a => a.toLowerCase().includes(q));
    const journalMatch = (paper.journal || '').toLowerCase().includes(q);
    const pmidMatch = (paper.pmid || '').includes(q);
    const meshMatch = (paper.mesh_terms || []).some(m => m.toLowerCase().includes(q));

    return titleMatch || authorsMatch || journalMatch || pmidMatch || meshMatch;
  });

  const includedCount = (review.screened_results || []).filter(s => s.decision === 'INCLUDED').length;
  const excludedCount = (review.screened_results || []).filter(s => s.decision === 'EXCLUDED').length;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Retrieved & Screened Publications
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 rounded-full">
              {allPapers.length} Studies
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Systematic PRISMA 2020 record identification, citation deduplication, and automated inclusion/exclusion audit.
          </p>
        </div>

        {/* Counts summary pills */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{includedCount} Included</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-bold flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>{excludedCount} Excluded</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg transition-all font-semibold ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Retrieved Papers ({allPapers.length})
          </button>
          <button
            onClick={() => setStatusFilter('INCLUDED')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all font-semibold ${
              statusFilter === 'INCLUDED'
                ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Selected Papers ({includedCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('EXCLUDED')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all font-semibold ${
              statusFilter === 'EXCLUDED'
                ? 'bg-white text-rose-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>Excluded Papers ({excludedCount})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search title, authors, MeSH terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 text-xs text-slate-800 border border-slate-300 focus:border-teal-600 focus:bg-white outline-none transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Papers List */}
      <div className="space-y-3">
        {filteredPapers.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center border border-slate-200 text-slate-500">
            <p className="text-xs">No publications matched your search criteria.</p>
          </div>
        ) : (
          filteredPapers.map((paper, idx) => {
            const screening = screeningMap.get(paper.id);
            const isIncluded = screening?.decision === 'INCLUDED';
            const isExcluded = screening?.decision === 'EXCLUDED';
            const isExpanded = expandedPaperId === paper.id;
            const hasEvidence = evidencePaperIds.has(paper.id);

            return (
              <div 
                key={paper.id || idx}
                className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs space-y-3"
              >
                {/* Paper Header / Decision badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{idx + 1}
                    </span>

                    {/* PRISMA Screening Decision */}
                    {isIncluded ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        PRISMA Eligible
                      </span>
                    ) : isExcluded ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                        <XCircle className="w-3 h-3 text-rose-500" />
                        Excluded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                        <HelpCircle className="w-3 h-3 text-slate-500" />
                        Uncertain
                      </span>
                    )}

                    {/* Publication Type / Unpublished Badge */}
                    {paper.is_unpublished ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs">
                        <FileText className="w-3 h-3 text-purple-600" />
                        Unpublished Manuscript
                      </span>
                    ) : (paper.source || '').includes("Uploaded") ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
                        <Zap className="w-3 h-3 text-teal-600" />
                        RAG Auto-Trained
                      </span>
                    ) : null}

                    {/* Relevance Score */}
                    {screening?.relevance_score !== undefined && (
                      <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.2 rounded">
                        Score: {Math.round(screening.relevance_score * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Actions / External links */}
                  <div className="flex items-center gap-2">
                    {hasEvidence && onNavigateToEvidence && (
                      <button
                        onClick={onNavigateToEvidence}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg hover:bg-indigo-100 transition-colors shadow-2xs"
                      >
                        <Layers className="w-3 h-3 text-indigo-600" />
                        <span>Evidence Mapped</span>
                      </button>
                    )}

                    {paper.pmid && (
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-teal-800 hover:text-teal-900 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg hover:bg-teal-100 transition-colors shadow-2xs"
                      >
                        <span>PMID: {paper.pmid}</span>
                        <ExternalLink className="w-3 h-3 text-teal-600 ml-0.5" />
                      </a>
                    )}

                    {paper.doi && (
                      <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-indigo-800 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg hover:bg-indigo-100 transition-colors shadow-2xs"
                      >
                        <span>DOI</span>
                        <ExternalLink className="w-3 h-3 text-indigo-600 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {paper.title}
                </h3>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-700 font-medium truncate max-w-sm">
                      {(paper.authors || []).join(', ') || 'Unknown Authors'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{paper.journal} ({paper.year})</span>
                  </div>
                </div>

                {/* Screening Reasoning Box */}
                {screening?.reasoning && (
                  <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>PRISMA Screener Analysis:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-normal">
                      {screening.reasoning}
                    </p>
                  </div>
                )}

                {/* MeSH Terms */}
                {paper.mesh_terms && paper.mesh_terms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    {paper.mesh_terms.slice(0, 6).map((term, tIdx) => (
                      <span 
                        key={tIdx}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-medium"
                      >
                        {term}
                      </span>
                    ))}
                    {paper.mesh_terms.length > 6 && (
                      <span className="text-[10px] text-slate-400">
                        +{paper.mesh_terms.length - 6} more
                      </span>
                    )}
                  </div>
                )}

                {/* Expandable Abstract */}
                {paper.abstract && (
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => setExpandedPaperId(isExpanded ? null : paper.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide Abstract' : 'Read Abstract'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed animate-fadeIn">
                        {paper.abstract}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
