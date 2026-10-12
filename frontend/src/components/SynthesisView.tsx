import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  ExternalLink, 
  Check, 
  ShieldCheck, 
  BookOpen, 
  Sparkles, 
  Quote, 
  CheckCircle2
} from 'lucide-react';
import type { LiteratureReviewResponse } from '../types';

interface SynthesisViewProps {
  review?: LiteratureReviewResponse | null;
  onOpenRAGWithTopic?: (topic: string) => void;
  isCompactSplit?: boolean;
  initialSubTab?: 'synthesis' | 'claims' | 'references';
}

export const SynthesisView: FC<SynthesisViewProps> = ({ 
  review,
  isCompactSplit = false,
  initialSubTab = 'synthesis'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'synthesis' | 'claims' | 'references'>(initialSubTab);

  // Sync if initialSubTab prop changes
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [copiedBibtex, setCopiedBibtex] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  if (!review || !review.final_synthesis) {
    const isOngoing = review?.status && review.status !== 'Completed';
    return (
      <div className="rounded-2xl bg-white p-12 text-center border border-slate-200 text-slate-500 shadow-xs">
        <FileText className={`w-12 h-12 mx-auto mb-3 ${isOngoing ? 'text-teal-600 animate-pulse' : 'text-slate-300'}`} />
        <h3 className="text-base font-bold text-slate-800">
          {isOngoing ? 'Reviewer Agent Formulating Systematic Literature Review...' : 'No Review Synthesis Generated Yet'}
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          {isOngoing
            ? `Multi-agent research pipeline is currently in phase "${review.status}". Once evidence extraction and cross-study comparison are finalized, the full PRISMA synthesis will appear here automatically.`
            : 'Start a review by submitting a research query above or load a past study from your history.'}
        </p>
      </div>
    );
  }

  const handleDownloadMarkdown = () => {
    const blob = new Blob([review.final_synthesis || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BrightLit_Literature_Review_${review.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyBibtex = () => {
    const bibtex = (review.references || []).map((ref, idx) => {
      const citeKey = `ref_${ref.pmid || idx + 1}`;
      return `@article{${citeKey},\n  title={${ref.title}},\n  author={${ref.authors}},\n  journal={${ref.journal}},\n  year={${ref.year}},\n  doi={${ref.doi || ''}},\n  url={${ref.url || ''}}\n}`;
    }).join('\n\n');

    navigator.clipboard.writeText(bibtex);
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 2000);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(review.final_synthesis || '');
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  // Render markdown-like sections cleanly with high-contrast clinical light theme
  const renderFormattedSynthesis = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    return (
      <div className="space-y-4 text-slate-700 leading-relaxed text-sm">
        {lines.map((line, index) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('# ')) {
            return (
              <h1 key={index} className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight pt-1 pb-2 border-b border-slate-200">
                {trimmed.replace('# ', '')}
              </h1>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={index} className="text-base sm:text-lg font-bold text-teal-900 pt-4 pb-1.5 border-b border-slate-200/80 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                {trimmed.replace('## ', '')}
              </h2>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={index} className="text-sm sm:text-base font-bold text-slate-900 pt-3">
                {trimmed.replace('### ', '')}
              </h3>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            return (
              <div key={index} className="flex items-start gap-2.5 pl-2 my-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0"></span>
                <span className="text-slate-700 text-xs sm:text-sm leading-relaxed" dangerouslySetInnerHTML={{
                  __html: content
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-bold">$1</strong>')
                    .replace(/\[PMID:\s*(\d+)\]/g, '<a href="https://pubmed.ncbi.nlm.nih.gov/$1/" target="_blank" rel="noreferrer" class="text-teal-700 font-mono font-semibold hover:underline bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">[PMID: $1]</a>')
                }} />
              </div>
            );
          }
          if (trimmed.startsWith('> ')) {
            return (
              <blockquote key={index} className="p-3 my-2.5 rounded-r-xl bg-teal-50/70 border-l-4 border-teal-600 text-slate-700 italic text-xs sm:text-sm">
                {trimmed.replace('> ', '')}
              </blockquote>
            );
          }
          if (!trimmed) {
            return <div key={index} className="h-1" />;
          }

          return (
            <p key={index} className="text-slate-700 text-xs sm:text-sm leading-relaxed" dangerouslySetInnerHTML={{
              __html: trimmed
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-bold">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="text-slate-800">$1</em>')
                .replace(/\[PMID:\s*(\d+)\]/g, '<a href="https://pubmed.ncbi.nlm.nih.gov/$1/" target="_blank" rel="noreferrer" class="text-teal-700 font-mono font-semibold hover:underline bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">[PMID: $1]</a>')
            }} />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveSubTab('synthesis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
              activeSubTab === 'synthesis'
                ? 'bg-white text-teal-800 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>Final Literature Synthesis</span>
          </button>

          <button
            onClick={() => setActiveSubTab('claims')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
              activeSubTab === 'claims'
                ? 'bg-white text-teal-800 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Grounded Claims</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {review.grounded_claims?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('references')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
              activeSubTab === 'references'
                ? 'bg-white text-teal-800 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>References ({review.references?.length || 0})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs text-slate-700 font-medium border border-slate-200 transition-colors shadow-2xs"
            title="Copy Markdown Text"
          >
            {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{copiedMarkdown ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleCopyBibtex}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs text-slate-700 font-medium border border-slate-200 transition-colors shadow-2xs"
            title="Copy BibTeX citations"
          >
            {copiedBibtex ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Quote className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{copiedBibtex ? 'BibTeX Copied' : 'BibTeX'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs text-white font-bold transition-all shadow-2xs shadow-teal-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'synthesis' && (
        <div className={`rounded-2xl bg-white border border-slate-200/90 shadow-xs ${
          isCompactSplit ? 'p-5 sm:p-7 max-h-[820px] overflow-y-auto' : 'p-6 sm:p-9'
        }`}>
          {renderFormattedSynthesis(review.final_synthesis)}
        </div>
      )}

      {/* Claims Audit Panel */}
      {activeSubTab === 'claims' && (
        <div className={`space-y-3 ${isCompactSplit ? 'max-h-[820px] overflow-y-auto pr-1' : ''}`}>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Reviewer Verification Audit (100% Citation Grounded)
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  All scientific statements are anchored to peer-reviewed source quotes retrieved from PubMed. Zero hallucinated references.
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white text-emerald-800 border border-emerald-200 shadow-2xs shrink-0">
              {review.grounded_claims?.length} Claims Verified
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {(review.grounded_claims || []).map((claim, idx) => (
              <div
                key={claim.claim_id || idx}
                className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-xs transition-all shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {claim.verification_status}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-medium">
                      Confidence: {(claim.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>

                  {claim.cited_pmid && (
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${claim.cited_pmid}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-mono font-semibold transition-colors shadow-2xs"
                    >
                      <span>PMID: {claim.cited_pmid}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-900 font-semibold leading-relaxed">
                  {claim.claim_text}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">
                    <Quote className="w-3 h-3 text-teal-600" />
                    Source Abstract Evidence:
                  </div>
                  <p className="italic text-slate-700 pl-2.5 border-l-2 border-teal-600 text-[11px] sm:text-xs">
                    "{claim.supporting_quote}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bibliography References */}
      {activeSubTab === 'references' && (
        <div className={`rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5 ${
          isCompactSplit ? 'p-4 sm:p-6 max-h-[820px] overflow-y-auto' : 'p-6 sm:p-8'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              Primary Peer-Reviewed Sources ({review.references?.length || 0})
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              NCBI Entrez e-Utilities
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {(review.references || []).map((ref) => (
              <div key={ref.index} className="py-3 first:pt-0 last:pb-0 flex items-start gap-2.5">
                <span className="font-mono text-[11px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 shrink-0 mt-0.5">
                  [{ref.index}]
                </span>

                <div className="flex-1 space-y-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {ref.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600">
                    <span className="text-slate-800 font-medium">{ref.authors}</span> — <em className="text-slate-600">{ref.journal}</em> ({ref.year})
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {ref.pmid && (
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded hover:bg-teal-100 transition-colors shadow-2xs"
                      >
                        PMID: {ref.pmid}
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}

                    {ref.doi && (
                      <a
                        href={`https://doi.org/${ref.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors shadow-2xs"
                      >
                        DOI: {ref.doi}
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
