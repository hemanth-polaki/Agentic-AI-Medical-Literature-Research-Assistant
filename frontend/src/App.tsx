import { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { QueryInputSection } from './components/QueryInputSection';
import { AgentStepper } from './components/AgentStepper';
import { MetricsOverview } from './components/MetricsOverview';
import { AgentTraceTerminal } from './components/AgentTraceTerminal';
import { SynthesisView } from './components/SynthesisView';
import { ComparisonMatrixView } from './components/ComparisonMatrixView';
import { PapersView } from './components/PapersView';
import { FindingsGapsView } from './components/FindingsGapsView';
import { RAGChatDrawer } from './components/RAGChatDrawer';
import { HistoryDrawer } from './components/HistoryDrawer';
import { PdfUploadModal } from './components/PdfUploadModal';
import { 
  BarChart3, 
  Layers, 
  Activity, 
  FileText, 
  Compass, 
  CheckCircle2, 
  ArrowRight,
  Columns2,
  LayoutDashboard,
  Lightbulb
} from 'lucide-react';
import type { 
  LiteratureReviewResponse, 
  AgentTraceStep, 
  ReviewSummaryListItem, 
  SampleBenchmarkQuery, 
  Paper,
  SidebarNavTab
} from './types';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>('landing');
  const [activeTab, setActiveTab] = useState<SidebarNavTab>('overview');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  
  // Workstation mode in Overview (Dual Split Workstation is the primary mode)
  const [overviewMode, setOverviewMode] = useState<'summary' | 'split'>('split');
  const [sidePaneView, setSidePaneView] = useState<'comparison' | 'evidence' | 'gaps' | 'trace'>('comparison');
  const [isQueryCollapsed, setIsQueryCollapsed] = useState(false);

  // Default query starts completely empty when page is redirected / refreshed
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(7);
  const [isRunning, setIsRunning] = useState(false);
  const [statusText, setStatusText] = useState('Idle');
  
  const [review, setReview] = useState<LiteratureReviewResponse | null>(null);
  const [traceSteps, setTraceSteps] = useState<AgentTraceStep[]>([]);
  const [historyList, setHistoryList] = useState<ReviewSummaryListItem[]>([]);
  const [sampleQueries, setSampleQueries] = useState<SampleBenchmarkQuery[]>([]);

  // Modals / Drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRAGOpen, setIsRAGOpen] = useState(false);

  // Initial load: Fetch past reviews and sample benchmarks without auto-populating query
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // 1. Fetch sample queries
      fetch(`${API_BASE_URL}/api/benchmarks/sample`)
        .then(res => res.json())
        .then(data => {
          if (data.sample_queries && data.sample_queries.length > 0) {
            setSampleQueries(data.sample_queries);
          }
        })
        .catch(err => console.log('Sample benchmark fetch error:', err));

      // 2. Fetch review history
      const res = await fetch(`${API_BASE_URL}/api/reviews`);
      if (res.ok) {
        const list: ReviewSummaryListItem[] = await res.json();
        setHistoryList(list);
      }
    } catch (e) {
      console.log('Error initializing data:', e);
    }
  };

  const loadReviewById = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/review/${id}`);
      if (res.ok) {
        const data: LiteratureReviewResponse = await res.json();
        setReview(data);
        if (data.query) {
          setQuery(data.query);
        }
        setStatusText(data.status || 'Completed');
        if (data.agent_trace && data.agent_trace.length > 0) {
          setTraceSteps(data.agent_trace);
        }
        setIsQueryCollapsed(true);
      }
    } catch (e) {
      console.error('Error loading review:', e);
    }
  };

  // Start fresh research query (idle review status and reset all remaining sections)
  const handleNewReview = () => {
    setActiveTab('overview');
    setReview(null);
    setStatusText('Idle');
    setIsRunning(false);
    setTraceSteps([]);
    setQuery('');
    setIsQueryCollapsed(false);
  };

  // Start real-time SSE multi-agent review
  const handleStartReview = async () => {
    if (!query.trim() || isRunning) return;

    setIsRunning(true);
    setStatusText('Searching');
    setTraceSteps([]);
    setActiveTab('overview');
    setIsQueryCollapsed(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/review/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          max_results: maxResults,
          use_llm: true
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to initiate agent stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const parsed = JSON.parse(raw);
              if (parsed.status) {
                setStatusText(parsed.status);
              }
              if (parsed.data) {
                const updated: LiteratureReviewResponse = parsed.data;
                setReview(updated);
                if (updated.agent_trace && updated.agent_trace.length > 0) {
                  setTraceSteps(updated.agent_trace);
                }
              }
            } catch {
              // Ignore non-json chunk fragments
            }
          }
        }
      }

      // Refresh history list once completed
      const historyRes = await fetch(`${API_BASE_URL}/api/reviews`);
      if (historyRes.ok) {
        const list: ReviewSummaryListItem[] = await historyRes.json();
        setHistoryList(list);
      }
      setIsQueryCollapsed(true);
    } catch (err) {
      console.error('SSE Stream error:', err);
    } finally {
      setIsRunning(false);
      setStatusText('Completed');
    }
  };

  const handlePaperExtracted = (newPaper: Paper, evidenceItem?: any) => {
    if (review) {
      const updatedRetrieved = [newPaper, ...(review.retrieved_papers || []).filter(p => p.id !== newPaper.id)];
      const updatedSelected = [newPaper, ...(review.selected_papers || []).filter(p => p.id !== newPaper.id)];
      const updatedEvidence = evidenceItem
        ? [evidenceItem, ...(review.evidence_table || []).filter(e => e.paper_id !== newPaper.id)]
        : review.evidence_table;

      setReview({
        ...review,
        retrieved_papers: updatedRetrieved,
        selected_papers: updatedSelected,
        evidence_table: updatedEvidence
      });
    }
  };

  // Counts for sidebar badges
  const papersCount = review?.retrieved_papers?.length || review?.selected_papers?.length || 0;
  const evidenceCount = review?.evidence_table?.length || 0;
  const referencesCount = review?.references?.length || 0;

  // Render Landing Page as default entry view
  if (currentView === 'landing') {
    return (
      <LandingPage
        onLaunchWorkspace={(initialQuery?: string) => {
          if (initialQuery) {
            setQuery(initialQuery);
            setIsQueryCollapsed(false);
            setCurrentView('workspace');
          } else {
            setQuery('');
            setIsQueryCollapsed(false);
            setCurrentView('workspace');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans selection:bg-teal-500/20 selection:text-teal-900 relative">
      {/* Background ambient clinical grid pattern */}
      <div className="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-10" />

      {/* Clinical Light Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onNewReview={handleNewReview}
        onGoLanding={() => setCurrentView('landing')}
        papersCount={papersCount}
        evidenceCount={evidenceCount}
        referencesCount={referencesCount}
        historyCount={historyList.length}
        isRunning={isRunning}
        onOpenRAG={() => setIsRAGOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        isOpenMobile={isSidebarMobileOpen}
        onCloseMobile={() => setIsSidebarMobileOpen(false)}
      />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        
        {/* Sleek Clinical Header (Navigation tabs removed as requested) */}
        <Header
          activeTab={activeTab}
          isRunning={isRunning}
          statusText={statusText}
          onToggleSidebarMobile={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
          activeQueryTitle={review?.query || query}
          onNewReview={handleNewReview}
          onGoLanding={() => setCurrentView('landing')}
        />

        {/* Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Research Query Console (Collapsible) */}
              <QueryInputSection
                query={query}
                setQuery={setQuery}
                maxResults={maxResults}
                setMaxResults={setMaxResults}
                isRunning={isRunning}
                onStartReview={handleStartReview}
                sampleQueries={sampleQueries}
                isCollapsed={isQueryCollapsed}
                onToggleCollapse={() => setIsQueryCollapsed(!isQueryCollapsed)}
                hasActiveReview={!!review}
                onNewReview={handleNewReview}
              />

              {/* Multi-Agent Visual Stepper */}
              <AgentStepper
                currentStatus={statusText}
                isRunning={isRunning}
              />

              {/* Scholarly Metrics Overview */}
              <MetricsOverview
                review={review}
              />

              {/* Explicit Search Query & Generated Keywords Protocol Bar */}
              {review && (
                <div className="rounded-xl bg-white p-4 border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-mono">
                          Search Query:
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 truncate">
                          {review.query || query}
                        </h3>
                      </div>
                      {review.query_plan?.clinical_problem && (
                        <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                          <span className="font-semibold text-slate-700">Clinical Focus: </span>
                          {review.query_plan.clinical_problem}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Generated Keywords Tags */}
                  {review.query_plan?.generated_keywords && review.query_plan.generated_keywords.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 font-mono mr-1">
                        Generated Keywords:
                      </span>
                      {review.query_plan.generated_keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mode Switcher inside Overview (Summary Cards vs Dual Split Workstation) */}
              <div className="flex items-center justify-between p-2 px-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 ring-2 ring-teal-500/20"></span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Clinical Review Workstation
                  </h2>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    onClick={() => setOverviewMode('split')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                      overviewMode === 'split'
                        ? 'bg-white text-indigo-950 shadow-xs border border-slate-200 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Columns2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Dual-Split Workstation (Primary)</span>
                  </button>

                  <button
                    onClick={() => setOverviewMode('summary')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                      overviewMode === 'summary'
                        ? 'bg-white text-teal-950 shadow-xs border border-slate-200 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-teal-600" />
                    <span>Executive Hub Cards</span>
                  </button>
                </div>
              </div>

              {/* OVERVIEW MODE A: Summary Hub Cards */}
              {overviewMode === 'summary' && review && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Executive Synthesis Spotlight */}
                  <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
                            <FileText className="w-4 h-4 text-teal-600" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Executive Clinical Synthesis
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                          PRISMA Synthesis
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed">
                        {review.final_synthesis ? (
                          review.final_synthesis.replace(/^[#*>\-\s]+/gm, '').substring(0, 240) + '...'
                        ) : (
                          'Autonomous multi-agent synthesis compiling qualitative clinical findings and quantitative benchmark comparisons.'
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('synthesis')}
                      className="self-start flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 group"
                    >
                      <span>Open Full Executive Synthesis</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* Card 2: Cross-Study Matrix Spotlight */}
                  <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Cross-Study Matrix & Benchmarks
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          {evidenceCount} Studies Extracted
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Comparative multi-dimensional matrix mapping {review.comparison?.datasets_comparison?.length || 0} clinical datasets, {review.comparison?.models_comparison?.length || 0} neural model architectures, and validation protocols.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveTab('comparison')}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 group"
                      >
                        <span>Cross-Study Matrix</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        onClick={() => setActiveTab('evidence')}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                      >
                        <span>Evidence Table</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Retrieved & Selected Papers Spotlight */}
                  <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Retrieved & Selected Papers
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {review.retrieved_papers?.length || 0} Retrieved • {review.selected_papers?.length || 0} Selected
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Systematic PRISMA eligibility screening with relevance scoring and reasoning for every PubMed candidate publication.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('papers')}
                      className="self-start flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 group"
                    >
                      <span>Explore Retrieved & Selected Papers</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* Card 4: Key Findings & Research Gaps */}
                  <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                            <Compass className="w-4 h-4 text-amber-600" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Key Findings & Research Gaps
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          {review.comparison?.key_findings?.length || 0} Findings • {review.comparison?.research_gaps?.length || 0} Gaps
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {review.comparison?.key_findings?.[0] || 'Synthesized clinical discoveries, consensus points, and unaddressed translational research gaps.'}
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('findings')}
                      className="self-start flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 group"
                    >
                      <span>Explore Key Findings & Research Gaps</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {overviewMode === 'summary' && !review && (
                <div className="rounded-2xl bg-white p-12 text-center border border-slate-200 text-slate-500 shadow-xs">
                  <LayoutDashboard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">
                    No Literature Review Generated Yet
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Start a fresh literature review by submitting a research query above, select a benchmark prompt, or load a prior study from history.
                  </p>
                </div>
              )}

              {/* OVERVIEW MODE B: DUAL WORKSTATION (Split View) */}
              {overviewMode === 'split' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                  {/* Left Pane: Executive Synthesis (7 of 12 cols = 58%) */}
                  <div className="xl:col-span-7 space-y-3.5">
                    <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-600 ring-2 ring-teal-500/20"></span>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          Executive Clinical Synthesis
                        </h2>
                      </div>
                      <span className="text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-mono font-bold">
                        PRISMA Primary Deliverable
                      </span>
                    </div>

                    <SynthesisView
                      review={review}
                      onOpenRAGWithTopic={() => setIsRAGOpen(true)}
                      isCompactSplit={true}
                    />
                  </div>

                  {/* Right Pane: Comparative Evidence Workbench (5 of 12 cols = 42%) */}
                  <div className="xl:col-span-5 space-y-3.5 xl:sticky xl:top-20">
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 px-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-500/20"></span>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Evidence Workbench
                        </h2>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
                        <button
                          onClick={() => setSidePaneView('comparison')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                            sidePaneView === 'comparison'
                              ? 'bg-white text-indigo-950 shadow-xs border border-slate-200/80 font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <BarChart3 className="w-3 h-3 text-indigo-600" />
                          <span>Matrix</span>
                        </button>

                        <button
                          onClick={() => setSidePaneView('evidence')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                            sidePaneView === 'evidence'
                              ? 'bg-white text-blue-950 shadow-xs border border-slate-200/80 font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Layers className="w-3 h-3 text-blue-600" />
                          <span>Evidence</span>
                        </button>

                        <button
                          onClick={() => setSidePaneView('gaps')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                            sidePaneView === 'gaps'
                              ? 'bg-white text-amber-950 shadow-xs border border-slate-200/80 font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Lightbulb className="w-3 h-3 text-amber-500" />
                          <span>Gaps</span>
                        </button>

                        <button
                          onClick={() => setSidePaneView('trace')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                            sidePaneView === 'trace'
                              ? 'bg-white text-teal-950 shadow-xs border border-slate-200/80 font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Activity className="w-3 h-3 text-teal-600" />
                          <span>Trace</span>
                        </button>
                      </div>
                    </div>

                    {sidePaneView === 'comparison' && (
                      <ComparisonMatrixView
                        review={review}
                        mode="comparison"
                        onNavigateToTab={(tab) => setSidePaneView(tab)}
                        isCompactSplit={true}
                      />
                    )}

                    {sidePaneView === 'evidence' && (
                      <ComparisonMatrixView
                        review={review}
                        mode="evidence"
                        onNavigateToTab={(tab) => setSidePaneView(tab)}
                        isCompactSplit={true}
                      />
                    )}

                    {sidePaneView === 'gaps' && (
                      <div className="max-h-[880px] overflow-y-auto pr-1">
                        <FindingsGapsView
                          review={review}
                          onNavigateToSynthesis={() => {}}
                        />
                      </div>
                    )}

                    {sidePaneView === 'trace' && (
                      <AgentTraceTerminal
                        traceSteps={traceSteps}
                        isRunning={isRunning}
                        isCompactSplit={true}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PAPERS */}
          {activeTab === 'papers' && (
            <PapersView
              review={review}
              onNavigateToEvidence={() => setActiveTab('evidence')}
            />
          )}

          {/* TAB 3: EVIDENCE TABLE */}
          {activeTab === 'evidence' && (
            <ComparisonMatrixView
              review={review}
              mode="evidence"
              onNavigateToTab={(tab) => setActiveTab(tab === 'comparison' ? 'comparison' : 'evidence')}
              isCompactSplit={false}
            />
          )}

          {/* TAB 4: COMPARISON */}
          {activeTab === 'comparison' && (
            <ComparisonMatrixView
              review={review}
              mode="comparison"
              onNavigateToTab={(tab) => setActiveTab(tab === 'comparison' ? 'comparison' : 'evidence')}
              isCompactSplit={false}
            />
          )}

          {/* TAB 5: FINDINGS & GAPS */}
          {activeTab === 'findings' && (
            <FindingsGapsView
              review={review}
              onNavigateToSynthesis={() => setActiveTab('synthesis')}
            />
          )}

          {/* TAB 6: SYNTHESIS */}
          {activeTab === 'synthesis' && (
            <SynthesisView
              review={review}
              onOpenRAGWithTopic={() => setIsRAGOpen(true)}
              isCompactSplit={false}
              initialSubTab="synthesis"
            />
          )}

          {/* TAB 7: REFERENCES */}
          {activeTab === 'references' && (
            <SynthesisView
              review={review}
              onOpenRAGWithTopic={() => setIsRAGOpen(true)}
              isCompactSplit={false}
              initialSubTab="references"
            />
          )}

          {/* TAB 8: AGENT TRACE */}
          {activeTab === 'trace' && (
            <AgentTraceTerminal
              traceSteps={traceSteps}
              isRunning={isRunning}
              isCompactSplit={false}
            />
          )}

        </main>

        {/* Clinical Footer */}
        <footer className="w-full border-t border-slate-200 bg-white/95 backdrop-blur-md py-5 text-center text-xs text-slate-500 shadow-2xs mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">BrightLit AI</span>
              <span>—</span>
              <span className="text-slate-500 font-medium">Clinical Light Research Workstation • PRISMA 2020 Compliant</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>NCBI Entrez PubMed</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>FAISS Vector RAG</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>100% Citation Grounded</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Interactive Drawers & Modals (Preserved exactly as before) */}
      <RAGChatDrawer
        isOpen={isRAGOpen}
        onClose={() => setIsRAGOpen(false)}
        reviewId={review?.id}
        queryTitle={review?.query || query}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        reviews={historyList}
        onSelectReview={loadReviewById}
        activeReviewId={review?.id}
      />

      <PdfUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        reviewId={review?.id}
        onPaperExtracted={handlePaperExtracted}
        onOpenRAG={() => setIsRAGOpen(true)}
      />

    </div>
  );
}

export default App;
