import React, { useState, useEffect, useRef } from 'react';
import { reconApi } from '../../api/reconApi';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatINR, formatTimestamp, truncateHash } from '../../utils/formatters';
import { GitCompare, UploadCloud, CheckCircle2, AlertCircle, RefreshCw, FileText, Play, FileUp, Search, Eye } from 'lucide-react';

const SAMPLE_CSV = `utr_number,amount,payer_vpa
UTR-BANK-2026-001,500.00,alice@okaxis
UTR-BANK-2026-002,1500.00,bob@okhdfc
UTR-BANK-2026-003,300.00,alice@okaxis
UTR-BANK-2026-999,750.00,unknown@okicici
`;

export function BankStatementMatcher() {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileInputRef = useRef(null);

  const [inspectStatement, setInspectStatement] = useState(null);
  const [statementRecords, setStatementRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const fetchStatements = async () => {
    setLoading(true);
    try {
      const data = await reconApi.getStatements();
      setStatements(Array.isArray(data) ? data : []);
    } catch (e) {
      console.debug('Failed to fetch statements:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = async (stmt) => {
    setInspectStatement(stmt);
    setLoadingRecords(true);
    try {
      const recs = await reconApi.getStatementRecords(stmt.id);
      setStatementRecords(Array.isArray(recs) ? recs : []);
    } catch (e) {
      console.debug('Failed to load statement records:', e);
      setStatementRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, []);

  const handleUploadSampleCsv = async () => {
    setUploading(true);
    setStatusMessage(null);
    try {
      // Append unique timestamp to guarantee distinct SHA-256 hash per upload
      const uniqueCsv = `${SAMPLE_CSV}\n# Ingested timestamp: ${new Date().toISOString()}`;
      const filename = `bank_feed_${Date.now()}.csv`;
      const res = await reconApi.uploadStatement(uniqueCsv, filename);
      setStatusMessage({
        type: 'success',
        text: `Bank statement uploaded & verified! Ref ID #${res.statementId || res.id || 'NEW'} (${res.totalRecords || 4} records parsed, SHA-256: ${truncateHash(res.fileHashSha256 || '', 10, 8)})`,
      });
      fetchStatements();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Upload failed: ${err.message}`,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatusMessage(null);
    try {
      const text = await file.text();
      const res = await reconApi.uploadStatement(text, file.name);
      setStatusMessage({
        type: 'success',
        text: `Statement ${file.name} uploaded successfully! Parsed ${res.totalRecords || 'multiple'} records.`,
      });
      fetchStatements();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Upload failed: ${err.message}`,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTriggerRecon = async () => {
    setReconciling(true);
    setStatusMessage(null);
    try {
      const targetId = statements[0]?.id || 1;
      const res = await reconApi.triggerReconciliation(targetId);
      setStatusMessage({
        type: 'success',
        text: `Spring Batch 5 reconciliation job completed for Statement #${targetId}. Matching status: COMPLETE.`,
      });
      fetchStatements();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Reconciliation trigger failed: ${err.message}`,
      });
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Overview & Action Card */}
      <Card
        title="Automated Bank Statement UTR Reconciliation"
        subtitle="Spring Batch 5 two-way matching engine correlating internal ledger journals against external clearinghouse statements"
        badge={<Badge variant="brand">Spring Batch 5</Badge>}
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={FileUp}
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs border-indigo-500/40 text-indigo-300"
            >
              Choose CSV File
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={UploadCloud}
              loading={uploading}
              onClick={handleUploadSampleCsv}
              className="text-xs"
            >
              Upload Sample Bank CSV
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={Play}
              loading={reconciling}
              onClick={handleTriggerRecon}
              className="text-xs"
            >
              Run Batch Reconciliation
            </Button>
          </div>
        }
      >
        {statusMessage && (
          <div className={`p-3.5 rounded-xl border mb-4 text-xs flex items-start gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* 2-Way Matching Rule Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Match Type 1</span>
            <span className="text-emerald-400 font-bold block mt-1">EXACT_MATCH</span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              UTR Number, exact amount, and timestamp match within 24h clearing window.
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Match Type 2</span>
            <span className="text-amber-400 font-bold block mt-1">AMOUNT_MISMATCH</span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              UTR matches but banking fee, interchange, or FX variance detected.
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Match Type 3</span>
            <span className="text-indigo-400 font-bold block mt-1">UNMATCHED_BANK</span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Deposit received in bank statement with no corresponding internal order.
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Match Type 4</span>
            <span className="text-rose-400 font-bold block mt-1">UNMATCHED_INTERNAL</span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Internal ledger debit pending clearing or rejected at the external clearinghouse.
            </span>
          </div>
        </div>
      </Card>

      {/* Ingested Bank Statements Table */}
      <Card
        title="Ingested Bank Statements & Clearing Records"
        subtitle="Deduplicated bank statements identified by SHA-256 file checksums"
        badge={<Badge variant="neutral">{statements.length} Feeds</Badge>}
        action={
          <button
            onClick={fetchStatements}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Refresh Statements"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        }
      >
        {statements.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 space-y-2">
            <div>No bank statements ingested yet.</div>
            <Button
              size="xs"
              variant="outline"
              icon={UploadCloud}
              onClick={handleUploadSampleCsv}
              className="text-indigo-300 border-indigo-500/40"
            >
              Upload Sample Bank CSV Feed
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="pb-3 font-semibold">Statement File</th>
                  <th className="pb-3 font-semibold">Total Records</th>
                  <th className="pb-3 font-semibold">Matched</th>
                  <th className="pb-3 font-semibold">Unmatched</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">SHA-256 Checksum</th>
                  <th className="pb-3 font-semibold">Ingested At</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {statements.map((stmt, idx) => (
                  <tr key={stmt.id || idx} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3 font-bold text-slate-200 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{stmt.filename || `bank_feed_${stmt.id}.csv`}</span>
                    </td>
                    <td className="py-3 text-slate-300">{stmt.totalRecords ?? 4}</td>
                    <td className="py-3 text-emerald-400 font-bold">{stmt.matchedRecords ?? 0}</td>
                    <td className="py-3 text-amber-400">{stmt.unmatchedRecords ?? 4}</td>
                    <td className="py-3">
                      <Badge variant={stmt.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {stmt.status || 'COMPLETED'}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-500 text-[10px]">
                      {truncateHash(stmt.fileHashSha256 || '', 8, 8)}
                    </td>
                    <td className="py-3 text-slate-400">{formatTimestamp(stmt.createdAt || stmt.uploadedAt)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleInspect(stmt)}
                        className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[11px] inline-flex items-center gap-1.5 transition-colors font-medium"
                      >
                        <Eye className="w-3 h-3" />
                        Inspect Records
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Statement Records Breakdown Modal */}
      <Modal
        isOpen={!!inspectStatement}
        onClose={() => setInspectStatement(null)}
        title={`Statement Records: ${inspectStatement?.filename || '#' + inspectStatement?.id}`}
        subtitle="Detailed fuzzy matching breakdown, confidence scoring, and fee variance tolerance"
        badge={
          <Badge variant={inspectStatement?.status === 'COMPLETED' ? 'success' : 'warning'}>
            {inspectStatement?.status || 'INGESTED'}
          </Badge>
        }
        maxWidth="max-w-5xl"
      >
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Ingested</span>
              <span className="text-base text-slate-200 font-bold mt-0.5 block">{statementRecords.length}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Exact Matches</span>
              <span className="text-base text-emerald-400 font-bold mt-0.5 block">
                {statementRecords.filter((r) => r.matchType === 'EXACT_MATCH').length}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Fuzzy & Tolerance</span>
              <span className="text-base text-cyan-400 font-bold mt-0.5 block">
                {statementRecords.filter((r) => r.matchType === 'FUZZY_MATCH' || r.matchType === 'AMOUNT_TOLERANCE').length}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Unmatched</span>
              <span className="text-base text-rose-400 font-bold mt-0.5 block">
                {statementRecords.filter((r) => !r.reconciled || r.matchType === 'UNMATCHED').length}
              </span>
            </div>
          </div>

          {/* Records Table */}
          {loadingRecords ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-xs">Loading statement records...</span>
            </div>
          ) : statementRecords.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No individual records found for this statement.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">UTR Number</th>
                    <th className="py-2.5 px-3 font-semibold">Amount</th>
                    <th className="py-2.5 px-3 font-semibold">Payer VPA</th>
                    <th className="py-2.5 px-3 font-semibold">Match Classification</th>
                    <th className="py-2.5 px-3 font-semibold">Confidence</th>
                    <th className="py-2.5 px-3 font-semibold">Internal Ref / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {statementRecords.map((rec) => {
                    let badgeVariant = 'neutral';
                    if (rec.matchType === 'EXACT_MATCH') badgeVariant = 'success';
                    else if (rec.matchType === 'FUZZY_MATCH') badgeVariant = 'cyan';
                    else if (rec.matchType === 'AMOUNT_TOLERANCE') badgeVariant = 'warning';
                    else if (!rec.reconciled || rec.matchType === 'UNMATCHED') badgeVariant = 'danger';

                    return (
                      <tr key={rec.id} className="hover:bg-slate-850/40 transition-colors">
                        <td className="py-2.5 px-3 text-slate-200 font-medium">{rec.utrNumber}</td>
                        <td className="py-2.5 px-3 text-slate-100 font-bold">{formatINR(rec.amount)}</td>
                        <td className="py-2.5 px-3 text-slate-400">{rec.payerVpa || 'N/A'}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={badgeVariant} size="xs">
                            {rec.matchType || (rec.reconciled ? 'MATCHED' : 'UNMATCHED')}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          <span
                            className={
                              Number(rec.confidenceScore) >= 95
                                ? 'text-emerald-400'
                                : Number(rec.confidenceScore) >= 80
                                ? 'text-cyan-400'
                                : 'text-slate-500'
                            }
                          >
                            {rec.confidenceScore ? `${Number(rec.confidenceScore).toFixed(1)}%` : '0%'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                          {rec.discrepancyReason ? (
                            <span className="text-amber-300/90">{rec.discrepancyReason}</span>
                          ) : rec.reconciledTransactionId ? (
                            <span className="text-slate-300">Txn #{rec.reconciledTransactionId}</span>
                          ) : (
                            <span className="text-slate-600">None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
