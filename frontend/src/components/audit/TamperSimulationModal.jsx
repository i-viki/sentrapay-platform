import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { computeSha256 } from '../../utils/formatters';
import { ShieldAlert, CheckCircle2, XCircle, RotateCcw, AlertTriangle, ArrowDown } from 'lucide-react';

export function TamperSimulationModal() {
  const { tamperModalOpen, setTamperModalOpen } = usePlatform();

  // Synthetic 3-block chain
  const [isTampered, setIsTampered] = useState(false);
  const [tamperedAmount, setTamperedAmount] = useState('50000.00');

  // Block 1 (Genesis / Root)
  const block1Hash = '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4';

  // Block 2 (Transfer from Alice to Bob)
  const block2OriginalPayload = '{"action":"TRANSFER","amount":500.00,"sender":"W-ALICE-002","recipient":"W-BOB-003"}';
  const block2TamperedPayload = `{"action":"TRANSFER","amount":${tamperedAmount},"sender":"W-ALICE-002","recipient":"W-BOB-003"}`;
  const block2OriginalHash = '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a';

  // In tampered state, the recalculated hash differs from the stored/chained hash
  const block2CurrentPayload = isTampered ? block2TamperedPayload : block2OriginalPayload;
  const block2CalculatedHash = isTampered
    ? 'e9b31122ab00cdef998877665544332211aabbccddeeff001122334455667788'
    : block2OriginalHash;

  // Block 3 points to Block 2's original hash
  const block3PrevHash = block2OriginalHash;
  const block3Hash = 'a1f899bb33112233445566778899aabbccddeeff00112233445566778899aabb';

  const isChainBroken = isTampered;

  return (
    <Modal
      isOpen={tamperModalOpen}
      onClose={() => setTamperModalOpen(false)}
      title="Cryptographic Chain Tamper Simulation Sandbox"
      subtitle="Demonstration of why direct database alterations fail in a hash-chained ledger"
      badge={<Badge variant={isChainBroken ? 'danger' : 'success'}>
        {isChainBroken ? 'TAMPERED / CORRUPTED' : 'CRYPTOGRAPHICALLY VALID'}
      </Badge>}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Explainer callout */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
          <p className="leading-relaxed">
            In traditional systems, an insider with root database access could run <code className="text-amber-400 font-mono">UPDATE transactions SET amount = 50000 WHERE id = 2</code> without detection.
          </p>
          <p className="leading-relaxed">
            In SentraPay, every block stores <code className="text-indigo-400 font-mono">current_hash = SHA256(index + prev_hash + payload + timestamp)</code>. If an attacker modifies the payload in Block #2, its calculated hash changes. When Block #3 checks its <code className="text-indigo-400 font-mono">prev_hash</code> link, the chain breaks instantly.
          </p>
        </div>

        {/* Tamper Control Toggle */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-200 block">Inject Malicious DB Modification into Block #2</span>
            <span className="text-[11px] text-slate-400">
              Modifies amount from INR 500.00 to INR {tamperedAmount} in the database row
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isTampered ? (
              <Button
                variant="danger"
                size="sm"
                icon={ShieldAlert}
                onClick={() => setIsTampered(true)}
              >
                Inject Tampering
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                icon={RotateCcw}
                onClick={() => setIsTampered(false)}
                className="border-emerald-500/40 text-emerald-300"
              >
                Restore Original Block
              </Button>
            )}
          </div>
        </div>

        {/* Visual 3-Block Chain Flow */}
        <div className="space-y-4 font-mono text-xs">
          {/* Block 1 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-200">BLOCK #1 (Genesis)</span>
              <Badge variant="success">VALID</Badge>
            </div>
            <div className="text-[11px] text-slate-400 truncate">Payload: System Initialization & Chart of Accounts Seed</div>
            <div className="mt-2 text-[10px] text-slate-500 break-all">
              Hash: <span className="text-emerald-400">{block1Hash}</span>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-slate-600" />
          </div>

          {/* Block 2 (Target of Tampering) */}
          <div className={`p-4 rounded-xl border transition-all ${
            isTampered
              ? 'bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/40'
              : 'bg-slate-950 border-emerald-500/40'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">BLOCK #2 (Alice Transfer to Bob)</span>
                {isTampered && <Badge variant="danger">PAYLOAD ALTERED</Badge>}
              </div>
              <Badge variant={isTampered ? 'danger' : 'success'}>
                {isTampered ? 'CORRUPTED' : 'VALID'}
              </Badge>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 mb-2">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Block Payload Data:</span>
              <code className={isTampered ? 'text-rose-300 font-bold' : 'text-slate-300'}>
                {block2CurrentPayload}
              </code>
            </div>

            <div className="space-y-1 text-[10px]">
              <div>Stored Hash in Database: <span className="text-slate-400 break-all">{block2OriginalHash}</span></div>
              <div>
                Recalculated SHA-256 Hash:{' '}
                <span className={isTampered ? 'text-rose-400 font-bold break-all' : 'text-emerald-400 break-all'}>
                  {block2CalculatedHash}
                </span>
              </div>
            </div>

            {isTampered && (
              <div className="mt-3 p-2 rounded bg-rose-950/50 border border-rose-800/60 text-rose-300 text-[11px] flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  Tampering Detected! Recalculated SHA-256 does not equal the stored block hash.
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <ArrowDown className={`w-4 h-4 ${isTampered ? 'text-rose-500' : 'text-slate-600'}`} />
          </div>

          {/* Block 3 */}
          <div className={`p-4 rounded-xl border transition-all ${
            isTampered
              ? 'bg-rose-950/20 border-rose-500/50'
              : 'bg-slate-950 border-emerald-500/40'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">BLOCK #3 (Subsequent Transfer)</span>
                {isTampered && <Badge variant="danger">LINK BROKEN</Badge>}
              </div>
              <Badge variant={isTampered ? 'danger' : 'success'}>
                {isTampered ? 'CHAIN BROKEN' : 'VALID'}
              </Badge>
            </div>

            <div className="space-y-1 text-[10px]">
              <div>
                Expected PrevHash (Points to original Block #2):{' '}
                <span className="text-slate-400 break-all">{block3PrevHash}</span>
              </div>
              {isTampered && (
                <div className="text-rose-400">
                  Actual Block #2 Hash changed to: <span className="font-bold break-all">{block2CalculatedHash}</span>
                </div>
              )}
            </div>

            {isTampered && (
              <p className="mt-2 text-[11px] text-rose-400">
                Block #3 is orphaned because its predecessor hash cannot be reconciled with Block #2.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setTamperModalOpen(false)}
          >
            Close Sandbox
          </Button>
        </div>
      </div>
    </Modal>
  );
}

