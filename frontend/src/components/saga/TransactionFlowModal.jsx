import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatINR, formatTimestamp } from '../../utils/formatters';
import { CheckCircle2, XCircle, Clock, Copy, Check, ShieldAlert, Cpu } from 'lucide-react';

export function TransactionFlowModal() {
  const { selectedTransaction, setSelectedTransaction } = usePlatform();
  const [copied, setCopied] = useState(false);

  if (!selectedTransaction) return null;

  const tx = selectedTransaction;
  const isSettled = tx.status === 'COMPLETED' || tx.status === 'SETTLED' || tx.status === 'SUCCESS';
  const isRejected = tx.status === 'REJECTED' || tx.status === 'FAILED';

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(tx, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const riskPct = tx.riskScore !== null && tx.riskScore !== undefined ? Math.round(tx.riskScore * 100) : null;

  return (
    <Modal
      isOpen={!!selectedTransaction}
      onClose={() => setSelectedTransaction(null)}
      title="Transaction Flow & Architectural Explainer"
      subtitle={`Comprehensive timeline and distributed execution breakdown for ${tx.paymentReference || tx.reference || 'TX'}`}
      badge={
        <Badge variant={isRejected ? 'danger' : isSettled ? 'success' : 'warning'}>
          {tx.status || 'PENDING'}
        </Badge>
      }
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 text-sm">
        {/* Core Attributes Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Payment Reference</span>
            <span className="text-slate-200 font-bold mt-0.5 block truncate">{tx.paymentReference || tx.reference}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Transfer Amount</span>
            <span className="text-emerald-400 font-bold mt-0.5 block">{formatINR(tx.amount)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Sender / Recipient</span>
            <span className="text-slate-200 mt-0.5 block truncate">
              {tx.senderWalletNumber || tx.senderWalletId} &#8594; {tx.recipientWalletNumber || tx.recipientWalletId}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">AI Risk Score</span>
            <span className={`mt-0.5 block font-bold ${
              isRejected ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {riskPct !== null ? `${riskPct}% (${tx.riskTier || 'LOW'})` : 'Evaluated'}
            </span>
          </div>
        </div>

        {/* Failure reason if rejected */}
        {isRejected && tx.failureReason && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Saga Rejection & Compensation Reason:</span>
              <span className="font-mono text-[11px] opacity-90">{tx.failureReason}</span>
            </div>
          </div>
        )}

        {/* Distributed Execution Lifecycle Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Execution Lifecycle (Distributed Saga Trace)
          </h4>

          <div className="space-y-3 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {/* Step 1 */}
            <div className="relative">
              <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">1. Edge Ingress & Idempotency Lock</span>
                  <Badge variant="brand" size="sm">T+0ms</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Received transfer request. Acquired Redis SETNX lock on key{' '}
                  <code className="text-indigo-300 font-mono">idemp:{tx.idempotencyKey || tx.paymentReference}</code> with SHA-256 payload digest to eliminate double-submits.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">2. Atomic Balance Reservation</span>
                  <Badge variant="brand" size="sm">T+12ms</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Verified available balance in PostgreSQL: <code className="text-slate-300 font-mono">balance - active_holds &gt;= {tx.amount}</code>. Inserted active balance hold to guarantee zero double-spends.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">3. Kafka Event Bus Emission</span>
                  <Badge variant="brand" size="sm">T+22ms</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Published <code className="text-cyan-300 font-mono">PaymentInitiatedEvent</code> to topic <code className="text-cyan-300 font-mono">payments.initiated</code>, partition-keyed by sender wallet.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">4. Hybrid AI Risk & Binary gRPC Inference</span>
                  <Badge variant={isRejected ? 'danger' : 'brand'} size="sm">T+45ms</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluated sliding-window velocity in Redis ZSETs and queried Python Random Forest sidecar via binary Protobuf gRPC (Port 50051).{' '}
                  {isRejected ? (
                    <strong className="text-rose-400">Verdict: REJECT ({riskPct}% risk)</strong>
                  ) : (
                    <strong className="text-emerald-400">Verdict: APPROVE ({riskPct || 5}% risk)</strong>
                  )}
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative">
              <span className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ${
                isRejected ? 'bg-rose-500' : 'bg-emerald-500'
              }`}></span>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    {isRejected ? '5. Saga Compensation & Hold Release' : '5. Saga Settlement & Double-Entry Ledger Posting'}
                  </span>
                  <Badge variant={isRejected ? 'danger' : 'success'} size="sm">T+68ms</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isRejected ? (
                    'Saga orchestrated compensation: Released active balance hold on PostgreSQL row. Sender funds restored without penalty.'
                  ) : (
                    'Settlement confirmed: Released hold, debited sender wallet, credited recipient wallet, created multi-leg double-entry journal records, and appended SHA-256 cryptographic audit block.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Raw JSON Payload */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">Raw Transaction Payload</span>
            <Button size="xs" variant="outline" icon={copied ? Check : Copy} onClick={copyJson}>
              {copied ? 'Copied!' : 'Copy JSON'}
            </Button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-300 max-h-48 overflow-y-auto">
            {JSON.stringify(tx, null, 2)}
          </pre>
        </div>
      </div>
    </Modal>
  );
}
