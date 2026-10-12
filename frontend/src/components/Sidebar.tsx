import type { FC } from 'react';
import { 
  Sparkles,
  LayoutGrid, 
  FileText, 
  Table, 
  BarChart3, 
  Lightbulb, 
  BookOpen, 
  Activity, 
  MessageSquareQuote, 
  Upload, 
  History,
  ShieldCheck,
  X,
  Plus
} from 'lucide-react';
import type { SidebarNavTab } from '../types';

interface SidebarProps {
  activeTab: SidebarNavTab;
  onSelectTab: (tab: SidebarNavTab) => void;
  onNewReview?: () => void;
  papersCount?: number;
  evidenceCount?: number;
  referencesCount?: number;
  historyCount?: number;
  isRunning?: boolean;
  onOpenRAG: () => void;
  onOpenUpload: () => void;
  onOpenHistory: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onNewReview,
  papersCount = 0,
  evidenceCount = 0,
  referencesCount = 0,
  historyCount = 0,
  isRunning = false,
  onOpenRAG,
  onOpenUpload,
  onOpenHistory,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const reviewNavItems: {
    id: SidebarNavTab;
    label: string;
    icon: typeof LayoutGrid;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'papers', label: 'Papers', icon: FileText, badge: papersCount },
    { id: 'evidence', label: 'Evidence table', icon: Table, badge: evidenceCount },
    { id: 'comparison', label: 'Comparison', icon: BarChart3 },
    { id: 'findings', label: 'Findings & gaps', icon: Lightbulb },
    { id: 'synthesis', label: 'Synthesis', icon: FileText },
    { id: 'references', label: 'References', icon: BookOpen, badge: referencesCount },
  ];

  const handleNavClick = (tabId: SidebarNavTab) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSystemAction = (action: () => void) => {
    action();
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Navigation scroll container */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between px-1.5 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/30 ring-2 ring-teal-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">
                  BrightLit AI
                </h1>
                <p className="text-[11px] text-slate-600 font-medium truncate mt-1">
                  Medical literature review
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* New Review Primary Action */}
          {onNewReview && (
            <button
              onClick={() => handleSystemAction(onNewReview)}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-xs shadow-sm shadow-teal-700/20 active:scale-98 transition-all disabled:opacity-50"
              title="Start a new systematic literature review"
            >
              <Plus className="w-4 h-4" />
              <span>New Literature Review</span>
            </button>
          )}

          {/* Section: REVIEW */}
          <div className="space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Review
            </div>

            <nav className="space-y-0.5">
              {reviewNavItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-teal-50 text-teal-900 border border-teal-200/90 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent 
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-teal-600' : 'text-slate-500 group-hover:text-slate-700'
                        }`} 
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span 
                        className={`ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold shrink-0 transition-colors ${
                          isActive
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section: SYSTEM */}
          <div className="space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              System
            </div>

            <nav className="space-y-0.5">
              {/* Agent trace */}
              <button
                onClick={() => handleNavClick('trace')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group ${
                  activeTab === 'trace'
                    ? 'bg-teal-50 text-teal-900 border border-teal-200/90 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Activity 
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      activeTab === 'trace' ? 'text-teal-600' : 'text-slate-500 group-hover:text-slate-700'
                    }`} 
                  />
                  <span className="truncate">Agent trace</span>
                </div>

                {isRunning && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                  </span>
                )}
              </button>

              {/* Ask RAG */}
              <button
                onClick={() => handleSystemAction(onOpenRAG)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent transition-all group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MessageSquareQuote className="w-4 h-4 text-slate-500 group-hover:text-teal-600 shrink-0 transition-colors" />
                  <span className="truncate">Ask RAG</span>
                </div>
                <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-mono font-semibold">
                  FAISS
                </span>
              </button>

              {/* Upload PDF */}
              <button
                onClick={() => handleSystemAction(onOpenUpload)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent transition-all group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Upload className="w-4 h-4 text-slate-500 group-hover:text-teal-600 shrink-0 transition-colors" />
                  <span className="truncate">Upload PDF</span>
                </div>
              </button>

              {/* History */}
              <button
                onClick={() => handleSystemAction(onOpenHistory)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent transition-all group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <History className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 shrink-0 transition-colors" />
                  <span className="truncate">History</span>
                </div>
                {historyCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
                    {historyCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Card: Grounding Policy */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/60">
          <div className="rounded-xl p-3 bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-teal-900">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="text-xs font-bold tracking-tight">
                Grounding policy
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug font-normal">
              Every claim must cite a record retrieved from PubMed. Claims without citations are flagged as UNVERIFIED.
            </p>
            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                PRISMA 2020 Compliant
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
