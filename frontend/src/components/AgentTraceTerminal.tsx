import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { 
  Terminal, 
  Download, 
  Clock, 
  Cpu
} from 'lucide-react';
import type { AgentTraceStep } from '../types';

interface AgentTraceTerminalProps {
  traceSteps: AgentTraceStep[];
  isRunning: boolean;
  isCompactSplit?: boolean;
}

export const AgentTraceTerminal: FC<AgentTraceTerminalProps> = ({
  traceSteps,
  isRunning,
  isCompactSplit = false
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [liveTime, setLiveTime] = useState<string>(() => new Date().toLocaleTimeString());
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [traceSteps, autoScroll]);

  const filteredSteps = traceSteps.filter((step) => {
    if (filter === 'all') return true;
    return step.agent_name.toLowerCase().includes(filter.toLowerCase());
  });

  const getAgentColor = (agentName: string) => {
    if (agentName.includes('Query Planner')) return 'text-teal-800 border-teal-200 bg-teal-50';
    if (agentName.includes('Literature Retrieval')) return 'text-sky-800 border-sky-200 bg-sky-50';
    if (agentName.includes('Screening')) return 'text-emerald-800 border-emerald-200 bg-emerald-50';
    if (agentName.includes('Evidence Extractor')) return 'text-indigo-800 border-indigo-200 bg-indigo-50';
    if (agentName.includes('Comparison')) return 'text-purple-800 border-purple-200 bg-purple-50';
    if (agentName.includes('Synthesis') || agentName.includes('Reviewer')) return 'text-pink-800 border-pink-200 bg-pink-50';
    if (agentName.includes('RAG')) return 'text-amber-800 border-amber-200 bg-amber-50';
    return 'text-slate-700 border-slate-200 bg-slate-100';
  };

  const handleDownloadLogs = () => {
    const text = traceSteps
      .map(s => `[${s.timestamp}] [${s.agent_name}] [${s.action}] (${s.status})\nDetails: ${s.details}\n`)
      .join('\n---\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brightlit_agent_trace_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
          <span className="text-slate-800 text-xs font-bold ml-1.5 flex items-center gap-1.5 font-sans">
            <Terminal className="w-3.5 h-3.5 text-teal-600" />
            Agentic Execution Trace
          </span>
          {isRunning && (
            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] bg-teal-50 text-teal-700 border border-teal-200 font-sans font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-ping"></span>
              Live SSE
            </span>
          )}

          {/* Real Live Time Ticker */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-700 shadow-2xs ml-1">
            <Clock className="w-3 h-3 text-teal-600 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-sans">Live Time:</span>
            <span className="font-semibold text-slate-900">{liveTime}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white text-slate-700 text-[11px] rounded-lg px-2 py-1 border border-slate-300 outline-none font-sans shadow-2xs focus:border-teal-600"
          >
            <option value="all">All Agents ({traceSteps.length})</option>
            <option value="Planner">Query Planner</option>
            <option value="Retrieval">NCBI Retrieval</option>
            <option value="Screening">PRISMA Screening</option>
            <option value="Extraction">Evidence Extractor</option>
            <option value="Comparison">Comparison Agent</option>
            <option value="Synthesis">Reviewer Synthesis</option>
            <option value="RAG">RAG Service</option>
          </select>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded-lg text-[10px] font-sans font-semibold transition-colors ${
              autoScroll ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
            title="Auto-scroll"
          >
            Auto-scroll {autoScroll ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={handleDownloadLogs}
            disabled={traceSteps.length === 0}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors disabled:opacity-40"
            title="Export Logs"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className={`p-3.5 sm:p-4 overflow-y-auto space-y-2 bg-slate-50/60 scroll-smooth ${
          isCompactSplit ? 'h-[750px]' : 'h-[520px]'
        }`}
      >
        {filteredSteps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
            <Cpu className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-sans font-bold text-slate-700">No agent trace events yet.</p>
            <p className="text-xs text-slate-500 font-sans mt-1">Submit a research question to observe agent reasoning in real time.</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-mono text-slate-600 shadow-2xs">
              <Clock className="w-3 h-3 text-teal-600" />
              <span>Current Live Time: {liveTime}</span>
            </div>
          </div>
        ) : (
          filteredSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-2xs transition-all font-mono shadow-2xs space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1 font-mono font-medium" title="Real-time event timestamp">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    {step.timestamp}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getAgentColor(step.agent_name)}`}>
                    {step.agent_name}
                  </span>
                  <span className="text-slate-900 font-bold text-[11px]">
                    {step.action}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${
                    step.status === 'completed' || !isRunning
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      : 'text-teal-700 bg-teal-50 border border-teal-200 animate-pulse'
                  }`}>
                    {step.status === 'completed' || !isRunning ? 'completed' : 'in_progress'}
                  </span>
                </div>
              </div>

              <p className="text-slate-700 text-xs leading-relaxed pl-2 border-l-2 border-slate-200 ml-1 font-normal font-sans">
                {step.details}
              </p>
            </div>
          ))
        )}

        {isRunning && (
          <div className="flex items-center justify-between text-teal-800 text-xs p-2.5 bg-teal-50 border border-teal-200 rounded-xl font-sans font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping"></span>
              <span>Agent working... streaming reasoning tokens...</span>
            </div>
            <span className="text-[11px] font-mono text-teal-800 bg-white/90 px-2 py-0.5 rounded border border-teal-200 font-semibold shadow-2xs">
              Live: {liveTime}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
