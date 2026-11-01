import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Modal } from '../common/Modal';
import { SYSTEM_COMPONENTS } from '../layout/SystemStatusBar';
import { Badge } from '../common/Badge';
import { Server, Database, Radio, Shield, BookOpen, Globe, Cpu, ArrowRight, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

export function ArchitectureBlueprintModal() {
  const { architectureModalOpen, setArchitectureModalOpen, setSelectedComponent } = usePlatform();
  const [activeStep, setActiveStep] = useState('saga');

  const openComponent = (id) => {
    const comp = SYSTEM_COMPONENTS.find((c) => c.id === id);
    if (comp) {
      setArchitectureModalOpen(false);
      setSelectedComponent(comp);
    }
  };

  return (
    <Modal
      isOpen={architectureModalOpen}
      onClose={() => setArchitectureModalOpen(false)}
      title="SentraPay Distributed Architecture Blueprint"
      subtitle="Interactive Enterprise Topology: Event-Driven Switch, High-Speed AI Risk Engine & Zero-Sum Ledger"
      badge={<Badge variant="brand">KRaft + SSE</Badge>}
      maxWidth="max-w-6xl"
    >
      <div className="space-y-8">
        {/* Architecture Topology Visual Flow */}
        <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Event Flow & Component Interconnects (Click any node to deep dive)
            </h4>
            <span className="text-[11px] font-mono text-indigo-400">7 Connected Microservices</span>
          </div>

          {/* Graphical Flow Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Column 1: Ingress */}
            <div className="space-y-4">
              <div className="text-[11px] font-mono uppercase text-slate-500 font-bold tracking-wider">Tier 1: Edge Ingress</div>
              <div
                onClick={() => openComponent('gateway')}
                className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 hover:bg-slate-850 cursor-pointer transition-all group shadow-sm shadow-emerald-950/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    <Globe className="w-5 h-5" />
                  </div>
                  <Badge variant="success">8080</Badge>
                </div>
                <h5 className="font-semibold text-slate-100 text-sm group-hover:text-emerald-300 transition-colors">
                  Edge Gateway
                </h5>
                <p className="text-xs text-slate-400 mt-1">Nginx Reverse Proxy & Unbuffered SSE Broadcaster</p>
              </div>
            </div>

            {/* Column 2: Switch & State */}
            <div className="space-y-4">
              <div className="text-[11px] font-mono uppercase text-slate-500 font-bold tracking-wider">Tier 2: Switch & Locks</div>
              <div
                onClick={() => openComponent('wallet')}
                className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-400 hover:bg-slate-850 cursor-pointer transition-all group shadow-sm shadow-indigo-950/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                    <Server className="w-5 h-5" />
                  </div>
                  <Badge variant="brand">8081</Badge>
                </div>
                <h5 className="font-semibold text-slate-100 text-sm group-hover:text-indigo-300 transition-colors">
                  Wallet Switch
                </h5>
                <p className="text-xs text-slate-400 mt-1">Spring Boot 3.3, Idempotency & Two-Phase Balance Holds</p>
              </div>

              <div
                onClick={() => openComponent('redis')}
                className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 hover:border-rose-400 hover:bg-slate-850 cursor-pointer transition-all group shadow-sm shadow-rose-950/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/40">
                    <Database className="w-5 h-5" />
                  </div>
                  <Badge variant="danger">6379</Badge>
                </div>
                <h5 className="font-semibold text-slate-100 text-sm group-hover:text-rose-300 transition-colors">
                  Redis 7.2 Store
                </h5>
                <p className="text-xs text-slate-400 mt-1">Sliding-Window ZSETs & Idempotency Key SETNX</p>
              </div>
            </div>

            {/* Column 3: Event Spine & Risk */}
            <div className="space-y-4">
              <div className="text-[11px] font-mono uppercase text-slate-500 font-bold tracking-wider">Tier 3: Kafka & AI Risk</div>
              <div
                onClick={() => openComponent('kafka')}
                className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-850 cursor-pointer transition-all group shadow-sm shadow-cyan-950/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                    <Radio className="w-5 h-5" />
                  </div>
                  <Badge variant="cyan">29092</Badge>
                </div>
                <h5 className="font-semibold text-slate-100 text-sm group-hover:text-cyan-300 transition-colors">
                  Kafka 3.7 KRaft
                </h5>
                <p className="text-xs text-slate-400 mt-1">Partitioned Event Log, Zero-Zookeeper Choreography</p>
              </div>

              <div
                onClick={() => openComponent('fraud')}
                className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 hover:border-amber-400 hover:bg-slate-850 cursor-pointer transition-all group shadow-sm shadow-amber-950/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40">
                    <Shield className="w-5 h-5" />
                  </div>
                  <Badge variant="warning">8082</Badge>
                </div>
                <h5 className="font-semibold text-slate-100 text-sm group-hover:text-amber-300 transition-colors">
                  Hybrid Risk Engine
                </h5>
                <p className="text-xs text-slate-400 mt-1">Spring Boot 3.3 Rule Evaluator & Binary gRPC Client</p>
              </div>

              <div
                onClick={() => openComponent('ml')}
                className="p-4 rounded-xl bg-slate-900 border border-purple-500/30 hover:border-purple-400 hover:bg-slate-850 cursor-pointer transition-all group shadow-sm shadow-purple-950/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/40">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <Badge variant="brand">50051</Badge>
                </div>
                <h5 className="font-semibold text-slate-100 text-sm group-hover:text-purple-300 transition-colors">
                  ML Inference
                </h5>
                <p className="text-xs text-slate-400 mt-1">Python 3.11, Protobuf gRPC Random Forest Scorer</p>
              </div>
            </div>

            {/* Column 4: Settlement & Audit */}
            <div className="space-y-4">
              <div className="text-[11px] font-mono uppercase text-slate-500 font-bold tracking-wider">Tier 4: Ledger & Audit</div>
              <div
                onClick={() => openComponent('recon')}
                className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 hover:bg-slate-850 cursor-pointer transition-all group shadow-sm shadow-emerald-950/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <Badge variant="success">8083</Badge>
                </div>
                <h5 className="font-semibold text-slate-100 text-sm group-hover:text-emerald-300 transition-colors">
                  Recon & General Ledger
                </h5>
                <p className="text-xs text-slate-400 mt-1">Double-Entry Zero-Sum Ledger & SHA-256 Audit Trail</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="text-xs font-mono text-slate-400 uppercase font-bold mb-1">PostgreSQL 16</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ACID persistent store with database-level CHECK constraints: Sum Debits - Sum Credits = 0.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why This Architecture Over Legacy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Key Architectural Decisions & Enterprise Trade-offs
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <h5 className="font-mono font-bold text-indigo-300 uppercase mb-2">1. Saga vs 2-Phase Commit (2PC)</h5>
              <p className="text-slate-400 leading-relaxed">
                Traditional distributed 2PC holds database locks across service boundaries, creating catastrophic thread exhaustion under high traffic. SentraPay uses asynchronous Kafka Saga choreography with compensating transactions to release holds upon rejection.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <h5 className="font-mono font-bold text-amber-300 uppercase mb-2">2. Binary gRPC vs REST ML</h5>
              <p className="text-slate-400 leading-relaxed">
                Evaluating fraud via HTTP/JSON REST adds 15-25ms of string parsing overhead per payment. Protobuf gRPC compresses binary payloads, multiplexes HTTP/2 frames, and completes inference in under 3 milliseconds.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <h5 className="font-mono font-bold text-emerald-300 uppercase mb-2">3. Zero-Sum Double-Entry</h5>
              <p className="text-slate-400 leading-relaxed">
                Single-column account balances invite silent financial discrepancies. SentraPay enforces multi-legged double-entry journal lines with hard PostgreSQL CHECK constraints, guaranteeing mathematical integrity across all transactions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

