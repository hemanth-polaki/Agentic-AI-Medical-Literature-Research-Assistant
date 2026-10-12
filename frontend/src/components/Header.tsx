import type { FC } from 'react';
import { 
  Menu,
  Activity,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import type { SidebarNavTab } from '../types';

interface HeaderProps {
  activeTab: SidebarNavTab;
  isRunning: boolean;
  statusText: string;
  onToggleSidebarMobile?: () => void;
  activeQueryTitle?: string;
  onNewReview?: () => void;
  onGoLanding?: () => void;
}

export const Header: FC<HeaderProps> = ({
  activeTab,
  isRunning,
  statusText,
  onToggleSidebarMobile,
  activeQueryTitle,
  onNewReview,
  onGoLanding
}) => {
  const getTabLabel = (tab: SidebarNavTab) => {
    switch (tab) {
      case 'overview': return 'Overview';
      case 'papers': return 'Retrieved Papers';
      case 'evidence': return 'Evidence Table';
      case 'comparison': return 'Cross-Study Matrix';
      case 'findings': return 'Findings & Gaps';
      case 'synthesis': return 'Executive Synthesis';
      case 'references': return 'References & Bibliography';
      case 'trace': return 'Agent Execution Trace';
      default: return 'Overview';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-3">
          
          {/* Left: Mobile hamburger & Clinical Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu button */}
            {onToggleSidebarMobile && (
              <button
                onClick={onToggleSidebarMobile}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
                aria-label="Open sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 min-w-0 text-xs">
              {onGoLanding ? (
                <button
                  onClick={onGoLanding}
                  className="font-bold text-slate-800 hover:text-teal-700 tracking-tight shrink-0 hidden sm:inline transition-colors"
                  title="Return to Landing Page"
                >
                  BrightLit AI
                </button>
              ) : (
                <span className="font-bold text-slate-800 tracking-tight shrink-0 hidden sm:inline">
                  BrightLit AI
                </span>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
              <span className="font-bold text-teal-900 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-md tracking-tight truncate shadow-2xs">
                {getTabLabel(activeTab)}
              </span>

              {activeQueryTitle && (
                <span className="hidden xl:inline text-slate-400 font-medium truncate max-w-md">
                  — {activeQueryTitle}
                </span>
              )}
            </div>
          </div>

          {/* Right: Pipeline Status & Clinical Standards Indicator */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* PRISMA 2020 Standard Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>PRISMA 2020</span>
            </div>

            {/* Pipeline Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${
                isRunning 
                  ? 'bg-amber-500 animate-pulse' 
                  : statusText === 'Idle' 
                  ? 'bg-slate-400 ring-2 ring-slate-300' 
                  : 'bg-emerald-500'
              }`}></span>
              <span className="text-slate-700 font-semibold font-mono text-[11px]">
                {isRunning ? (
                  <span className="flex items-center gap-1 text-teal-900">
                    <Activity className="w-3 h-3 text-teal-600 animate-spin" />
                    {statusText || 'Executing Agents'}
                  </span>
                ) : statusText === 'Idle' ? (
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    Idle / Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {statusText === 'Completed' ? 'Review Completed' : statusText || 'Pipeline Ready'}
                  </span>
                )}
              </span>
            </div>

            {/* New Review Quick Button */}
            {onNewReview && (
              <button
                onClick={onNewReview}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-2xs shadow-teal-600/20 active:scale-95 disabled:opacity-50"
                title="Start a new literature review"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Review</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
