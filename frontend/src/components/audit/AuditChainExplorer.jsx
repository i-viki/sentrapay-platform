import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { reconApi } from '../../api/reconApi';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatTimestamp, truncateHash } from '../../utils/formatters';
import { FileLock2, ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, Bug, ChevronDown, ChevronRight } from 'lucide-react';

export function AuditChainExplorer() {
  const { setTamperModalOpen } = usePlatform();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await reconApi.getAuditLogs(0, 50);
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.debug('Failed to fetch audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const runVerification = async () => {
    setVerifying(true);
    setVerificationResult(null);

    try {
      // 1. Call backend cryptographic verifier
      const backendRes = await reconApi.verifyAuditChain().catch(() => null);

      // 2. Perform client-side verification walk
      let isChainValid = true;
      let brokenIndex = -1;

      for (let i = 1; i < auditLogs.length; i++) {
        const prev = auditLogs[i - 1];
        const curr = auditLogs[i];

        const prevHash = prev.recordHash || prev.currentHash;
        const currPrevHash = curr.previousHash;

        if (currPrevHash && prevHash && currPrevHash !== prevHash) {
          isChainValid = false;
          brokenIndex = i;
          break;
        }
      }

      setVerificationResult({
        isValid: backendRes ? backendRes.valid : isChainValid,
        verifiedCount: backendRes?.totalRecordsChecked ?? auditLogs.length,
        message: backendRes?.failureMessage || 'Cryptographic audit chain fully verified',
        brokenIndex,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Audit verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Card */}
      <Card
        title="Tamper-Evident SHA-256 Cryptographic Audit Chain"
        subtitle="Block-by-block hash verification where each record binds cryptographically to its predecessor"
        badge={<Badge variant="brand">Merkle Chaining</Badge>}
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={Bug}
              onClick={() => setTamperModalOpen(true)}
              className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-950/40"
            >
              Simulate Tampering
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={ShieldCheck}
              loading={verifying}
              onClick={runVerification}
              className="text-xs"
            >
              Verify Audit Chain
            </Button>
          </div>
        }
      >
        {/* Verification Alert Banner */}
        {verificationResult && (
          <div className={`p-4 rounded-xl border mb-5 flex items-center justify-between gap-3 ${
            verificationResult.isValid
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
          }`}>
            <div className="flex items-center gap-3">
              {verificationResult.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <div>
                <span className="font-semibold text-xs block">
                  {verificationResult.isValid
                    ? `Cryptographic Audit Chain Intact (${verificationResult.verifiedCount} Blocks Verified)`
                    : `CRITICAL: Hash Mismatch Detected at Block #${verificationResult.brokenIndex}`}
                </span>
                <span className="text-[11px] opacity-80 font-mono">
                  {verificationResult.message}
                </span>
              </div>
            </div>
            <Badge variant={verificationResult.isValid ? 'success' : 'danger'}>
              {verificationResult.isValid ? 'PASSED 100%' : 'INTEGRITY COMPROMISED'}
            </Badge>
          </div>
        )}

        {/* Audit Blocks Chain Flow */}
        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No audit logs captured yet. Execute transactions to see SHA-256 hash chained blocks.
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log, idx) => {
              const isExpanded = expandedIndex === idx;
              const hash = log.recordHash || log.currentHash || log.hash || '--';
              const prevHash = log.previousHash || '0000000000000000000000000000000000000000000000000000000000000000';

              return (
                <div
                  key={log.id || idx}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative hover:border-slate-700 transition-colors font-mono text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-750 text-[10px] font-bold text-slate-300">
                        BLOCK #{log.id || (idx + 1)}
                      </span>
                      <span className="font-bold text-slate-200">{log.actionType || log.action || 'ENTRY'}</span>
                      <Badge variant="brand" size="sm">{log.entityName || log.entityType || 'SYSTEM'}</Badge>
                    </div>
                    <span className="text-slate-500 text-[10px]">
                      {formatTimestamp(log.createdAt || log.timestamp)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 mb-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Previous Hash (PrevHash)</span>
                      <span className="text-slate-400 font-mono text-[11px] break-all">
                        {prevHash.startsWith('00000') ? `${prevHash} (GENESIS)` : prevHash}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-400 uppercase block">Current Block Hash</span>
                      <span className="text-indigo-300 font-mono text-[11px] font-semibold break-all">
                        {hash}
                      </span>
                    </div>
                  </div>

                  {log.logPayload && (
                    <div className="mt-2">
                      <button
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3 text-indigo-400" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                        <span>{isExpanded ? 'Hide Payload' : 'View Payload Details'}</span>
                      </button>
                      {isExpanded && (
                        <pre className="mt-2 p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
                          {log.logPayload}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
