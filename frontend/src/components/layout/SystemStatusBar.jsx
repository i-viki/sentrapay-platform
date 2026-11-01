import React from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Server, Database, Cpu, Radio, Shield, BookOpen, Globe } from 'lucide-react';

export const SYSTEM_COMPONENTS = [
  {
    id: 'gateway',
    name: 'Edge Gateway',
    tech: 'Nginx Alpine',
    port: '8080',
    protocol: 'HTTP / SSE Reverse Proxy',
    status: 'ONLINE',
    icon: Globe,
    color: 'emerald',
    description: 'Edge reverse proxy, SSL termination, and unbuffered SSE event broadcaster to connected React clients.',
    why: 'Prevents backend port exposure; unbuffered proxying preserves real-time latency (< 5ms) for SSE streams without WebSocket handshakes.',
    codeRef: 'docker/nginx.conf',
  },
  {
    id: 'wallet',
    name: 'Wallet Switch',
    tech: 'Spring Boot 3.3',
    port: '8081',
    protocol: 'REST / Kafka Producer',
    status: 'ONLINE',
    icon: Server,
    color: 'indigo',
    description: 'Core ledger switch executing atomic balance holds and initiating Saga payment events.',
    why: 'Two-phase balance reservation with PostgreSQL row locking eliminates double-spending before Kafka event emission.',
    codeRef: 'services/wallet-service/WalletService.java',
  },
  {
    id: 'redis',
    name: 'Distributed Cache',
    tech: 'Redis 7.2',
    port: '6379',
    protocol: 'RESP3 / In-Memory',
    status: 'ONLINE',
    icon: Database,
    color: 'rose',
    description: 'Sliding-window velocity tracker via Redis Sorted Sets (ZSET) and idempotent SETNX lock coordinator.',
    why: 'Sub-millisecond sliding window aggregation ZREMRANGEBYSCORE + ZCARD without costly database aggregate queries.',
    codeRef: 'services/fraud-detection-service/VelocityEvaluator.java',
  },
  {
    id: 'kafka',
    name: 'Event Backbone',
    tech: 'Kafka 3.7 KRaft',
    port: '29092',
    protocol: 'Event Stream / KRaft Consensus',
    status: 'ONLINE',
    icon: Radio,
    color: 'cyan',
    description: 'Asynchronous event log orchestrating choreography Saga topics: payments.initiated, fraud-scored, settled.',
    why: 'Replaces rigid 2-Phase Commit (2PC) with distributed event-driven choreographies, partition-keyed by sender wallet.',
    codeRef: 'shared/event-contracts',
  },
  {
    id: 'fraud',
    name: 'Risk Engine',
    tech: 'Spring Boot 3.3 + gRPC',
    port: '8082',
    protocol: 'Binary Protobuf gRPC',
    status: 'ONLINE',
    icon: Shield,
    color: 'amber',
    description: 'Hybrid fraud evaluation combining sliding-window velocity rules with Random Forest ML predictions.',
    why: 'Dual verification: deterministic rate-limiting stops brute bursts; ML inference catches nuanced anomalous behaviors.',
    codeRef: 'services/fraud-detection-service/HybridRiskEngine.java',
  },
  {
    id: 'ml',
    name: 'ML Inference',
    tech: 'Python 3.11 + FastAPI',
    port: '50051 / 8000',
    protocol: 'Protobuf gRPC / ASGI',
    status: 'ONLINE',
    icon: Cpu,
    color: 'purple',
    description: 'Random Forest model inference engine serving sub-3ms predictions over binary Protobuf gRPC.',
    why: 'Binary Protobuf serialization reduces network overhead and parsing latency by ~70% compared to standard JSON REST.',
    codeRef: 'services/ml-inference-service/server_grpc.py',
  },
  {
    id: 'recon',
    name: 'Ledger & Recon',
    tech: 'Spring Batch 5',
    port: '8083',
    protocol: 'PostgreSQL 16 / Hash Audit',
    status: 'ONLINE',
    icon: BookOpen,
    color: 'emerald',
    description: 'Double-entry zero-sum journal poster, bank statement UTR matcher, and SHA-256 cryptographic audit chain.',
    why: 'Mathematical balance constraint (Sum Debits - Sum Credits = 0) with immutable hash chaining prevents tampering.',
    codeRef: 'services/reconciliation-service/JournalPostingService.java',
  },
];

export function SystemStatusBar() {
  const { setSelectedComponent } = usePlatform();

  return (
    <div className="bg-slate-950/90 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 2xl:px-12 py-2">
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto flex items-center justify-between gap-3 overflow-x-auto text-xs scrollbar-none">
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] font-semibold tracking-wider uppercase shrink-0">
          <span>Cluster Mesh:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {SYSTEM_COMPONENTS.map((comp) => {
            const Icon = comp.icon;
            return (
              <button
                key={comp.id}
                onClick={() => setSelectedComponent(comp)}
                title={`Click to inspect ${comp.name} architecture & design rationale`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 text-[11px] font-mono transition-all shrink-0 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:animate-pulse"></span>
                <Icon className="w-3 h-3 text-slate-400 group-hover:text-indigo-400" />
                <span className="text-slate-300 font-medium">{comp.name}</span>
                <span className="text-slate-500">:{comp.port.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

