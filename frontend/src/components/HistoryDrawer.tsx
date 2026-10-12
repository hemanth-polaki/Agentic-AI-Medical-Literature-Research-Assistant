import type { FC } from 'react';
import { 
  History, 
  X, 
  Clock, 
  ArrowRight,
  Database
} from 'lucide-react';
import type { ReviewSummaryListItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: ReviewSummaryListItem[];
  onSelectReview: (id: string) => void;
  activeReviewId?: string;
}

export const HistoryDrawer: FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  reviews,
  onSelectReview,
  activeReviewId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Review History ({reviews.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Persistent reviews stored in SQLite
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Reviews */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12 text-center">
              <Database className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-700">No saved reviews yet.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Completed systematic reviews are automatically saved and re-indexed here.
              </p>
            </div>
          ) : (
            reviews.map((rev) => {
              const isActive = rev.id === activeReviewId;
              return (
                <div
                  key={rev.id}
                  onClick={() => {
                    onSelectReview(rev.id);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-teal-50 border-teal-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">
                      ID: {rev.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {rev.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 line-clamp-2 leading-relaxed mb-2">
                    {rev.query}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2.5 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {rev.created_at}
                    </span>
                    <span className="flex items-center gap-1 text-teal-700 font-bold">
                      Load Review <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
