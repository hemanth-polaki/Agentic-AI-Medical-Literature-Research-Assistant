import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Search,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Upload,
  MessageSquareQuote,
  BarChart3,
  Zap,
  Compass,
  ArrowUpRight,
  FileCheck2,
  Scale,
  BrainCircuit
} from 'lucide-react';

interface LandingPageProps {
  onLaunchWorkspace: (initialQuery?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchWorkspace }) => {
  const [heroQuery, setHeroQuery] = useState('');
  const [activeFeatureTab, setActiveFeatureTab] = useState<'synthesis' | 'rag' | 'matrix' | 'pdf'>('synthesis');

  const popularTopics = [
    {
      title: "Deep Learning EEG Seizure Detection",
      query: "Review recent research on deep-learning methods for EEG seizure detection and compare datasets, models, validation methods, and evaluation metrics.",
      tag: "Neurology"
    },
    {
      title: "12-Lead ECG Arrhythmia Classification",
      query: "Synthesize recent advances in 12-lead ECG arrhythmia detection using convolutional transformers, evaluating MIT-BIH and PTB-XL datasets.",
      tag: "Cardiology"
    },
    {
      title: "Chest X-Ray Vision-Language Models",
      query: "Review multimodal vision-language models for chest radiograph pulmonary opacity detection, comparing CheXpert and MIMIC-CXR benchmarks.",
      tag: "Radiology"
    },
    {
      title: "CAR-T Cell Immunotherapy in Lymphoma",
      query: "Synthesize clinical efficacy and cytokine release syndrome toxicity profiles of CAR-T cell immunotherapies in diffuse large B-cell lymphoma.",
      tag: "Oncology"
    }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLaunchWorkspace(heroQuery.trim());
  };

  const handleTopicClick = (query: string) => {
    onLaunchWorkspace(query);
  };

  const agentSteps = [
    {
      number: "01",
      name: "Query Planning Agent",
      role: "Protocol Formulation",
      icon: Compass,
      description: "Deconstructs clinical problem into PICO elements, MeSH descriptors, and optimized PubMed boolean query.",
      badge: "NCBI MeSH"
    },
    {
      number: "02",
      name: "Literature Retrieval Agent",
      role: "Candidate Discovery",
      icon: BookOpen,
      description: "Directly queries NCBI Entrez E-Utilities (esearch, efetch) to harvest peer-reviewed candidates with PMIDs and DOIs.",
      badge: "Live PubMed"
    },
    {
      number: "03",
      name: "PRISMA Screening Agent",
      role: "Eligibility Filtering",
      icon: ShieldCheck,
      description: "Applies clinical inclusion & exclusion criteria with explicit structured reasoning and PRISMA decision tracking.",
      badge: "PRISMA 2020"
    },
    {
      number: "04",
      name: "Evidence Extraction Agent",
      role: "Methodological Profile",
      icon: FileCheck2,
      description: "Extracts clinical datasets, sample sizes, architecture classes, validation strategies, and reported metrics.",
      badge: "Deep Extraction"
    },
    {
      number: "05",
      name: "Comparison Agent",
      role: "Cross-Study Synthesis",
      icon: Scale,
      description: "Constructs multi-dimensional comparative matrices, architecture trade-offs, and detects unaddressed clinical research gaps.",
      badge: "Benchmarking"
    },
    {
      number: "06",
      name: "Synthesis & Reviewer Agent",
      role: "Grounded Claim Audit",
      icon: BrainCircuit,
      description: "Drafts systematic review synthesis and executes strict claim audit: 100% verified citations with zero hallucinated PMIDs.",
      badge: "Zero Hallucination"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200 relative overflow-x-hidden">
      
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-teal-500/15 via-teal-900/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[60%] left-[-10%] w-[500px] h-[500px] bg-teal-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20 ring-1 ring-teal-400/30">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                BrightLit AI
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
                  v2.4
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Agentic Medical Literature Research Assistant
              </p>
            </div>
          </div>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#agents" className="hover:text-teal-400 transition-colors">PRISMA Agents</a>
            <a href="#features" className="hover:text-teal-400 transition-colors">Core Capabilities</a>
            <a href="#metrics" className="hover:text-teal-400 transition-colors">Benchmarks</a>
            <a href="#faq" className="hover:text-teal-400 transition-colors">Methodology</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onLaunchWorkspace()}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 hover:shadow-teal-500/30 active:scale-95 transition-all"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        
        {/* Release / Standard Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold mb-8 backdrop-blur-sm animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
          <span>Autonomous PRISMA Multi-Agent System</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">Live NCBI PubMed E-Utilities</span>
        </div>

        {/* Grand Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
          Autonomous Medical Literature Research{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-300">
            Grounded in Verified Science
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
          Deconstruct complex clinical questions, screen candidate publications with PRISMA rigor, extract evidence matrices, and synthesize peer-reviewed findings with <strong className="text-slate-200">100% verified citation grounding</strong> and <strong className="text-slate-200">dense FAISS vector RAG</strong>.
        </p>

        {/* Interactive Query Input Bar */}
        <div className="mt-10 max-w-3xl mx-auto">
          <form 
            onSubmit={handleSearchSubmit}
            className="p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl shadow-teal-950/50 backdrop-blur-xl focus-within:border-teal-500/60 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-3 px-3 py-2 flex-1 min-w-0">
                <Search className="w-5 h-5 text-teal-400 shrink-0" />
                <input
                  type="text"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="Enter clinical research question (e.g. Deep learning EEG seizure detection...)"
                  className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 font-extrabold text-sm shadow-md shadow-teal-500/20 active:scale-98 transition-all shrink-0"
              >
                <span>Execute Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick topic suggestion chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold mr-1">Suggested topics:</span>
            {popularTopics.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTopicClick(item.query)}
                className="px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 transition-all flex items-center gap-1.5 group"
              >
                <span className="text-[10px] text-teal-400 font-mono bg-teal-500/10 px-1.5 py-0.2 rounded border border-teal-500/20">
                  {item.tag}
                </span>
                <span>{item.title}</span>
                <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-teal-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Quick Launch Direct Workspace Link */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs font-semibold text-slate-400">
          <button
            onClick={() => onLaunchWorkspace()}
            className="text-teal-400 hover:text-teal-300 underline underline-offset-4 flex items-center gap-1 transition-colors"
          >
            <span>Or open clean workstation with empty query</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </section>

      {/* 3. KEY METRICS STRIP */}
      <section id="metrics" className="border-y border-slate-800/80 bg-slate-900/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
              35M+
            </div>
            <div className="text-xs text-slate-400 font-medium">
              PubMed Publications Indexed
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-teal-400 tracking-tight font-mono">
              6
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Autonomous PRISMA Agents
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400 tracking-tight font-mono">
              100%
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Grounded Citation Verification
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight font-mono">
              &lt; 45s
            </div>
            <div className="text-xs text-slate-400 font-medium">
              End-to-End Review Pipeline
            </div>
          </div>

        </div>
      </section>

      {/* 4. THE 6 PRISMA AUTONOMOUS AGENTS PIPELINE */}
      <section id="agents" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider mb-3">
            Multi-Agent Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            6 Autonomous Agents Executing Systematic Reviews
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Each agent operates with specialized domain logic, maintaining working memory and PRISMA 2020 protocol integrity from query analysis to grounded synthesis.
          </p>
        </div>

        {/* 6 Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agentSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={idx}
                className="relative rounded-2xl bg-slate-900/80 border border-slate-800/90 p-6 hover:border-teal-500/40 hover:bg-slate-900 transition-all group flex flex-col justify-between shadow-lg shadow-black/20"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-teal-400 transition-colors">
                      AGENT {step.number}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                      {step.badge}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400 mb-4 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight group-hover:text-teal-300 transition-colors">
                    {step.name}
                  </h3>
                  <div className="text-xs text-teal-400 font-semibold mb-2">
                    {step.role}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center text-[11px] text-slate-500 group-hover:text-slate-300 font-medium">
                  <span>Included in real-time SSE stream</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. INTERACTIVE CAPABILITIES SHOWCASE */}
      <section id="features" className="py-20 border-t border-slate-800/80 bg-slate-900/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3">
              Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Clinical Rigor Meets Dense Semantic Intelligence
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Built to replace weeks of manual literature search with immediate, verified, and interactive research deliverables.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {[
              { id: 'synthesis', label: '100% Grounded Synthesis', icon: ShieldCheck },
              { id: 'rag', label: 'FAISS Dense Vector RAG', icon: MessageSquareQuote },
              { id: 'matrix', label: 'Cross-Study Benchmarks', icon: BarChart3 },
              { id: 'pdf', label: 'PDF Manuscript Autotraining', icon: Upload }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeFeatureTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Feature Tab Details Card */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 max-w-4xl mx-auto shadow-2xl">
            {activeFeatureTab === 'synthesis' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Strict Citation Grounding & Hallucination Elimination</h3>
                    <p className="text-xs text-slate-400">Zero unverified statements. Every single scientific claim is mapped to primary evidence.</p>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 font-mono text-xs space-y-2 text-slate-300">
                  <div className="text-emerald-400 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>CLAIM AUDIT: 100% VERIFIED TO SOURCE ABSTRACTS</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans text-xs">
                    "Convolutional transformers achieved 93.8% sensitivity on the CHB-MIT scalp EEG dataset, outperforming baseline CNNs while mitigating inter-subject electrode noise."
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-[11px] text-teal-400">
                    <span className="bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">PMID: 38472910</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">DOI: 10.1109/TBME.2024</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400 font-semibold">Status: VERIFIED</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'rag' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                    <MessageSquareQuote className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Dense Semantic FAISS Indexing with Multi-Granular Chunks</h3>
                    <p className="text-xs text-slate-400">Instant conversational Q&A over indexed publications, overview metadata, and full text excerpts.</p>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 font-mono text-xs space-y-2 text-slate-300">
                  <div className="text-cyan-400 font-bold flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" />
                    <span>FAISS IndexFlatIP (384-dimensional dense semantic vectors)</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed font-sans text-xs">
                    Researchers can query: <em className="text-slate-200">"Which architectures achieved the lowest false-alarm rate per hour?"</em> and receive an exact synthesized answer with highlighted sentence citations.
                  </p>
                </div>
              </div>
            )}

            {activeFeatureTab === 'matrix' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Automated Cross-Study Benchmark Extraction</h3>
                    <p className="text-xs text-slate-400">Standardized tables comparing clinical cohorts, architectures, validation protocols, and gaps.</p>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 text-xs space-y-2">
                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-300">Dataset</span>
                    <span className="font-bold text-slate-300">Architecture Family</span>
                    <span className="font-bold text-slate-300">Validation Protocol</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1">
                    <span>CHB-MIT Scalp EEG (64 subjects)</span>
                    <span className="text-teal-400 font-semibold">Spatial-Temporal CNN-LSTM</span>
                    <span>Patient-Specific 5-Fold CV</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                    <span>TUSZ Seizure Corpus (v1.5.2)</span>
                    <span className="text-cyan-400 font-semibold">Transformer Self-Attention</span>
                    <span>Cross-Patient Leave-One-Out</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'pdf' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Unpublished Manuscript Ingestion & Immediate Autotraining</h3>
                    <p className="text-xs text-slate-400">Benchmark your unpublished lab drafts directly against peer-reviewed PubMed literature.</p>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 font-mono text-xs space-y-2 text-slate-300">
                  <div className="text-emerald-400 font-bold flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Scientific PDF Processor (PyPDF2 + Section Extraction)</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed font-sans text-xs">
                    Upload any PDF draft. The system extracts methodology, cohort numbers, and outcomes, immediately indexing them into the FAISS vector space with an <span className="text-amber-400 font-semibold">[Unpublished Manuscript]</span> venue flag.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 6. RESEARCH METHODOLOGY & FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Answers for biomedical researchers, clinicians, and data scientists.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How does BrightLit AI prevent biomedical hallucinations?",
              a: "BrightLit AI uses a strict Grounding Policy enforced by the Synthesis & Reviewer Agent. Claims must cite a specific peer-reviewed record retrieved directly from PubMed via the NCBI API. Any statement failing citation audit is flagged as UNVERIFIED."
            },
            {
              q: "Does BrightLit AI adhere to PRISMA 2020 systematic review standards?",
              a: "Yes. The pipeline explicitly replicates the PRISMA identification, screening, eligibility, and inclusion steps. The screening agent logs reasons for paper exclusion (e.g. non-human cohorts, wrong modality) and outputs a transparent PRISMA audit log."
            },
            {
              q: "Can I benchmark unpublished local lab manuscripts?",
              a: "Yes. Use the Upload PDF feature to parse your draft. The system extracts sections, autotrains the FAISS vector store, and integrates your manuscript into the cross-study comparison matrix alongside published PubMed papers."
            },
            {
              q: "What LLMs and embedding models power the backend?",
              a: "The system supports Google Gemini (Gemini 2.5 Flash), OpenAI GPT-4o, and Anthropic Claude APIs, paired with dense sentence transformers (all-MiniLM-L6-v2) and FAISS IndexFlatIP. Deterministic heuristics are included as safe offline fallbacks."
            }
          ].map((faq, idx) => (
            <div key={idx} className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed pl-6 font-normal">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. GRAND CALL TO ACTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="relative rounded-3xl bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 border border-teal-500/30 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Accelerate Your Systematic Literature Research?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-normal">
              Execute comprehensive PRISMA reviews, cross-study benchmarks, and grounded synthesis in seconds with BrightLit AI.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onLaunchWorkspace()}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Launch Research Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span>BrightLit AI — Medical Literature Research Assistant</span>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-500">
            Compliant with PRISMA 2020 Guidelines • NCBI Entrez PubMed E-Utilities
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-slate-900 text-center text-[10px] text-slate-600">
          Medical Disclaimer: BrightLit AI is an automated academic research synthesis tool. Always verify primary literature before clinical decision-making.
        </div>
      </footer>

    </div>
  );
};
