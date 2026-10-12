import type { FC, ReactNode } from 'react';
import { 
  Search, 
  Filter, 
  Table, 
  GitCompare, 
  FileCheck2, 
  CheckCircle2, 
  Loader2, 
  CircleDot 
} from 'lucide-react';

interface AgentStepperProps {
  currentStatus: string;
  isRunning: boolean;
}

interface StepDef {
  id: string;
  name: string;
  role: string;
  icon: ReactNode;
  activeStatuses: string[];
  doneWhen: string[];
}

export const AgentStepper: FC<AgentStepperProps> = ({ currentStatus, isRunning }) => {
  const steps: StepDef[] = [
    {
      id: 'searching',
      name: 'Searching',
      role: 'PubMed & Keywords',
      icon: <Search className="w-4 h-4" />,
      activeStatuses: ['Searching'],
      doneWhen: ['Screening', 'Extracting', 'Comparing', 'Synthesizing', 'Completed']
    },
    {
      id: 'screening',
      name: 'Screening',
      role: 'PRISMA Eligibility',
      icon: <Filter className="w-4 h-4" />,
      activeStatuses: ['Screening'],
      doneWhen: ['Extracting', 'Comparing', 'Synthesizing', 'Completed']
    },
    {
      id: 'extracting',
      name: 'Extracting',
      role: 'Evidence & Metrics',
      icon: <Table className="w-4 h-4" />,
      activeStatuses: ['Extracting'],
      doneWhen: ['Comparing', 'Synthesizing', 'Completed']
    },
    {
      id: 'comparing',
      name: 'Comparing',
      role: 'Cross-Study Matrix',
      icon: <GitCompare className="w-4 h-4" />,
      activeStatuses: ['Comparing'],
      doneWhen: ['Synthesizing', 'Completed']
    },
    {
      id: 'synthesizing',
      name: 'Synthesizing',
      role: 'Review & Audit',
      icon: <FileCheck2 className="w-4 h-4" />,
      activeStatuses: ['Synthesizing'],
      doneWhen: ['Completed']
    },
    {
      id: 'completed',
      name: 'Completed',
      role: 'Literature Ready',
      icon: <CheckCircle2 className="w-4 h-4" />,
      activeStatuses: [],
      doneWhen: ['Completed']
    }
  ];

  const getStepState = (step: StepDef) => {
    if (currentStatus === 'Idle') return 'pending';
    if (currentStatus === 'Completed') return 'completed';
    if (step.doneWhen.includes(currentStatus)) return 'completed';
    if (step.activeStatuses.includes(currentStatus) && isRunning) return 'active';
    return 'pending';
  };

  const statusPhases = ['Searching', 'Screening', 'Extracting', 'Comparing', 'Synthesizing', 'Completed'];

  const isIdle = currentStatus === 'Idle';

  return (
    <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs">
      {/* Explicit Literature Review Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`w-2.5 h-2.5 rounded-full ${
            isRunning 
              ? 'bg-amber-500 animate-pulse' 
              : isIdle 
              ? 'bg-slate-400 ring-2 ring-slate-300' 
              : 'bg-teal-600 ring-2 ring-teal-500/20'
          }`}></span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Literature Review Status:
          </h2>
          <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold shadow-2xs ${
            isIdle
              ? 'text-slate-700 bg-slate-100 border border-slate-200'
              : 'text-teal-900 bg-teal-50 border border-teal-200'
          }`}>
            {currentStatus || 'Idle'}
          </span>
        </div>

        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 flex-wrap">
          <span className="font-bold text-slate-400 mr-1">Progression:</span>
          {isIdle ? (
            <span className="text-slate-400 font-medium italic">Pipeline Ready • Awaiting Research Query</span>
          ) : (
            statusPhases.map((phase, idx) => {
              const isCurrent = currentStatus === phase;
              const isPassed = steps.find(s => s.name === phase)?.doneWhen.includes(currentStatus) || currentStatus === 'Completed';

              return (
                <span key={phase} className="flex items-center gap-1">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                      isCurrent
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : isPassed
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {phase}
                  </span>
                  {idx < statusPhases.length - 1 && <span className="text-slate-300">/</span>}
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* 6 Progression Step Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {steps.map((step, idx) => {
          const state = getStepState(step);
          const isCurrentActive = state === 'active';
          const isDone = state === 'completed';

          return (
            <div
              key={step.id}
              className={`relative flex flex-col p-3 rounded-xl border transition-all ${
                isCurrentActive
                  ? 'bg-teal-50/80 border-teal-500 shadow-md ring-2 ring-teal-500/20 text-teal-950'
                  : isDone
                  ? 'bg-slate-50/90 border-emerald-300 text-slate-800 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-400 opacity-80'
              }`}
            >
              {/* Header inside step card */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono font-bold ${
                  isCurrentActive ? 'text-teal-700' : isDone ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  0{idx + 1}
                </span>
                <div>
                  {isCurrentActive && (
                    <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                  )}
                  {isDone && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {state === 'pending' && (
                    <CircleDot className="w-4 h-4 text-slate-300" />
                  )}
                </div>
              </div>

              {/* Icon & Title */}
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    isCurrentActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step.icon}
                </div>
                <div className="truncate">
                  <p className={`text-xs font-bold truncate ${
                    isCurrentActive ? 'text-teal-950' : isDone ? 'text-slate-900' : 'text-slate-600'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {step.role}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
