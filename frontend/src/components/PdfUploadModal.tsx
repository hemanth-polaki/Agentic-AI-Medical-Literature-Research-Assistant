import { useState } from 'react';
import type { FC } from 'react';
import { 
  FileUp, 
  X, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Zap,
  MessageSquareQuote,
  BookOpen,
  FileText
} from 'lucide-react';
import type { Paper, UploadResponse } from '../types';

interface PdfUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId?: string;
  onPaperExtracted?: (paper: Paper, evidence?: any, autotrainStats?: any) => void;
  onOpenRAG?: () => void;
}

export const PdfUploadModal: FC<PdfUploadModalProps> = ({
  isOpen,
  onClose,
  reviewId,
  onPaperExtracted,
  onOpenRAG
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (reviewId) {
      formData.append('review_id', reviewId);
    }

    try {
      const res = await fetch('/api/pdf/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to process scientific manuscript PDF');
      }

      const data: UploadResponse = await res.json();
      setUploadData(data);
      if (onPaperExtracted) {
        onPaperExtracted(data.paper, data.evidence, data);
      }
    } catch (err: any) {
      setError(err.message || 'Error uploading and indexing PDF manuscript');
    } finally {
      setUploading(false);
    }
  };

  const extractedPaper = uploadData?.paper;
  const isUnpublished = uploadData?.is_unpublished ?? (extractedPaper?.is_unpublished ?? false);
  const sectionsList = extractedPaper?.sections ? Object.keys(extractedPaper.sections) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative max-w-xl w-full rounded-2xl bg-white p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shadow-xs">
              <FileUp className="w-5 h-5" />
            </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Upload Scientific PDF or Unpublished Manuscript
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Automatically extracts canonical sections, detects publication status, and auto-trains internal FAISS RAG
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Zone */}
        {!uploadData ? (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                file
                  ? 'border-teal-500 bg-teal-50/50'
                  : 'border-slate-300 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/20'
              }`}
            >
              <Upload className="w-9 h-9 text-slate-400 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-slate-800 font-bold">
                {file ? file.name : 'Drag and drop scientific PDF manuscript or click to browse'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                Supports published journal papers (PMID/DOI), preprints (arXiv/bioRxiv), and unpublished manuscripts / lab drafts (up to 30MB)
              </p>

              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="pdf-input"
              />
              <label
                htmlFor="pdf-input"
                className="inline-block mt-3 px-4 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs text-slate-700 cursor-pointer font-semibold border border-slate-300 transition-colors shadow-2xs"
              >
                {file ? 'Choose Different File' : 'Select PDF Manuscript'}
              </label>
            </div>

            {/* Feature Highlights */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Internal Autonomous Processing:</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  <span>Auto-detects published vs unpublished</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  <span>Extracts Methods, Datasets & Results</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  <span>Auto-trains FAISS RAG dense index</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  <span>Instant grounded Q&A over manuscript</span>
                </li>
              </ul>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg bg-slate-100 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-xs font-bold text-white transition-all shadow-sm shadow-teal-600/20"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing & Auto-Training RAG...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current text-teal-200" />
                    <span>Upload & Auto-Train RAG</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Extracted & Auto-Trained Preview */
          <div className="space-y-3.5">
            {/* Success notification banner */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Manuscript Parsed & FAISS RAG Auto-Trained!</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-300">
                  <Zap className="w-3 h-3 text-emerald-600 fill-current" />
                  {uploadData.chunks_indexed} Semantic Chunks Indexed
                </span>
                {isUnpublished ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold bg-purple-100 text-purple-800 border border-purple-300">
                    <FileText className="w-3 h-3 text-purple-600" />
                    Unpublished Manuscript
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold bg-teal-100 text-teal-800 border border-teal-300">
                    <BookOpen className="w-3 h-3 text-teal-600" />
                    {uploadData.publication_status || 'Published Literature'}
                  </span>
                )}
                <span className="text-slate-600">
                  Total Active Corpus: <strong>{uploadData.total_corpus_papers} papers</strong> ({uploadData.total_corpus_chunks} chunks)
                </span>
              </div>
            </div>

            {/* Manuscript Metadata Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5 max-h-72 overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Parsed Study Title:
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">
                  {extractedPaper?.title}
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px]">
                <span>Authors: <strong className="text-slate-700">{extractedPaper?.authors?.join(', ') || 'Extracted from PDF'}</strong></span>
                <span>Year: <strong className="text-slate-700">{extractedPaper?.year || 2024}</strong></span>
                {extractedPaper?.doi && <span>DOI: <strong className="text-slate-700">{extractedPaper.doi}</strong></span>}
                {extractedPaper?.pmid && <span>PMID: <strong className="text-slate-700">{extractedPaper.pmid}</strong></span>}
              </div>

              {/* Sections extracted */}
              {sectionsList.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="block text-slate-600 text-[10px] uppercase font-bold mb-1.5">
                    Extracted Semantic Sections (Indexed into FAISS):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sectionsList.map((sec) => (
                      <span
                        key={sec}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs"
                      >
                        ✓ {sec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Abstract snippet */}
              <div className="pt-2 border-t border-slate-200 text-slate-700">
                <strong className="block text-slate-600 text-[10px] uppercase font-bold mb-1">
                  Extracted Abstract Overview:
                </strong>
                <p className="line-clamp-3 leading-relaxed font-normal text-slate-600">
                  {extractedPaper?.abstract}
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2">
              <button
                onClick={() => {
                  setUploadData(null);
                  setFile(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium order-2 sm:order-1"
              >
                Upload Another Manuscript
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                {onOpenRAG && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRAG();
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors shadow-2xs"
                  >
                    <MessageSquareQuote className="w-3.5 h-3.5 text-teal-600" />
                    <span>Ask Questions via RAG</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
