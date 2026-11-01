import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Badge } from '../common/Badge';
import { formatINR, formatTimeOnly } from '../../utils/formatters';
import { Lock, Wallet, Radio, Cpu, ShieldCheck, BookOpen, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const SAGA_STAGES = [
  {
    stage: 1,
    name: 'Idempotency Lock',
    tech: 'Redis 7.2 SETNX',
    icon: Lock,
    desc: 'Locks Idempotency-Key with SHA-256 payload hash in Redis to eliminate duplicate executions and double-submits.',
  },
  {
    stage: 2,
    name: 'Balance Hold',
    tech: 'PostgreSQL Hold',
    icon: Wallet,
    desc: 'Verifies available balance (balance - active_holds >= amount) and places atomic hold row.',
  },
  {
    stage: 3,
    name: 'Kafka Dispatch',
    tech: 'payments.initiated',
    icon: Radio,
    desc: 'Publishes PaymentInitiatedEvent to Kafka KRaft topic, partition-keyed by sender wallet ID.',
  },
  {
    stage: 4,
    name: 'AI Risk Scoring',
    tech: 'Protobuf gRPC ML',
    icon: Cpu,
    desc: 'Calculates Redis ZSET sliding-window velocity and queries Random Forest ML model over binary gRPC.',
  },
  {
    stage: 5,
    name: 'Saga Verdict',
    tech: 'payments.settled',
    icon: ShieldCheck,
    desc: 'Evaluates risk score. If Approved: commits settlement. If Rejected: triggers compensating hold release.',
  },
  {
    stage: 6,
    name: 'Double-Entry Posting',
    tech: 'Zero-Sum Ledger',
    icon: BookOpen,
    desc: 'Creates balanced multi-leg journal entries and appends SHA-256 cryptographic audit block.',
  },
];

export function SagaPipelineVisualizer() {
  const { activeSaga, setActiveSaga } = usePlatform();
  const [expandedStage, setExpandedStage] = useState(null);

  if (!activeSaga) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-mono uppercase tracking-wider mb-1">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Saga Choreography Pipeline Idle</span>
        </div>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Execute a transfer above or run an Architectural Scenario below to observe real-time distributed Saga stage-by-stage progression.
        </p>
      </div>
    );
  }

  const currentStage = activeSaga.stage || 1;
  const isComplete = activeSaga.completed || currentStage >= 6;
  const isRejected = activeSaga.verdict === 'REJECTED';

  const stageDescriptions = {
    1: 'Acquiring distributed lock on Redis 7.2 using SETNX with SHA-256 payload digest...',
    2: 'Verifying available balance and placing atomic PostgreSQL row-level hold...',
    3: 'Publishing PaymentInitiatedEvent to Kafka KRaft topic payments.initiated...',
    4: 'Computing Redis ZSET sliding-window velocity and querying Protobuf gRPC ML inference...',
    5: isRejected
      ? 'Risk threshold exceeded: executing compensating balance hold release in PostgreSQL...'
      : 'Risk verdict approved: committing settlement and publishing payments.settled...',
    6: 'Double-entry zero-sum journal entries posted and SHA-256 audit block sealed.',
  };

  const progressPercent = isComplete ? 100 : Math.round((currentStage / 6) * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-black/40">
      {/* Visualizer Header */}
      <div className="p-4 bg-slate-850/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isRejected ? 'bg-rose-500' : isComplete ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'}`}></div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-200">
                SAGA TX: {activeSaga.reference || 'INITIATED'}
              </span>
              <Badge variant={isRejected ? 'danger' : isComplete ? 'success' : 'brand'} pulse={!isComplete}>
                {isRejected ? 'REJECTED & COMPENSATED' : isComplete ? 'SETTLED & POSTED' : `STAGE ${currentStage} OF 6`}
              </Badge>
              {activeSaga.latencyMs !== undefined && activeSaga.latencyMs !== null && (
                <Badge variant="success" size="sm" dot={false}>
                  {activeSaga.latencyMs} MS TOTAL
                </Badge>
              )}
              {activeSaga.riskScore !== undefined && activeSaga.riskScore !== null && (
                <Badge
                  variant={activeSaga.riskTier === 'HIGH' ? 'danger' : activeSaga.riskTier === 'MEDIUM' ? 'warning' : 'success'}
                  size="sm"
                >
                  RISK {Number(activeSaga.riskScore).toFixed(2)} · {activeSaga.riskTier || 'LOW'}
                </Badge>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              {formatINR(activeSaga.amount)} from {activeSaga.senderWalletId} to {activeSaga.recipientWalletId}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isComplete && (
            <button
              onClick={() => setActiveSaga(null)}
              className="text-xs text-slate-400 hover:text-slate-200 font-medium px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-950 h-1 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out ${
            isRejected ? 'bg-rose-500' : isComplete ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Live Stage Status Explanation Ribbon */}
      <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-indigo-400 font-bold">Stage 0{currentStage}:</span>
          <span>{stageDescriptions[currentStage]}</span>
        </div>
        <span className="text-[11px] text-slate-500 shrink-0">Click any stage card below to inspect architecture</span>
      </div>

      {/* 6-Stage Progress Stepper */}
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {SAGA_STAGES.map((s) => {
            const Icon = s.icon;
            const isPassed = currentStage > s.stage;
            const isCurrent = currentStage === s.stage;
            const isStageRejected = isRejected && s.stage >= 5;

            let borderStyle = 'border-slate-800 bg-slate-950/40 text-slate-500';
            if (isStageRejected) {
              borderStyle = 'border-rose-500/50 bg-rose-950/20 text-rose-300 shadow-md shadow-rose-950/40';
            } else if (isPassed || (isComplete && s.stage <= 6)) {
              borderStyle = 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300 shadow-sm shadow-emerald-950/30';
            } else if (isCurrent) {
              borderStyle = 'border-indigo-500 bg-indigo-950/30 text-indigo-200 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/50';
            }

            return (
              <div
                key={s.stage}
                onClick={() => setExpandedStage(expandedStage === s.stage ? null : s.stage)}
                className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${borderStyle}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                    <span>0{s.stage}</span>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {isStageRejected ? (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  ) : isPassed || (isComplete && s.stage <= 6) ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>

                <div className="text-xs font-semibold text-slate-200">{s.name}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">{s.tech}</div>

                {expandedStage === s.stage && (
                  <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-300 leading-normal animate-in fade-in duration-200">
                    {s.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

