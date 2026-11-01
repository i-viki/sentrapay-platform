import React, { useState, useEffect } from 'react';
import { reconApi } from '../../api/reconApi';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatINR, formatTimestamp } from '../../utils/formatters';
import { ChevronDown, ChevronRight, RefreshCw, BookOpen } from 'lucide-react';

export function JournalEntriesTable() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await reconApi.getJournalEntries(30);
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.debug('Failed to fetch journal entries:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Card
      title="Posted Journal Entries & Ledger Lines"
      subtitle="Immutable multi-legged double-entry transaction journals"
      badge={<Badge variant="neutral">{entries.length} Journals</Badge>}
      action={
        <button
          onClick={fetchEntries}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Refresh Journal Entries"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      }
    >
      {entries.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400">
          No journal entries recorded yet. Executing payment transfers will post balanced double-entry records here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <th className="pb-3 w-8"></th>
                <th className="pb-3 font-semibold">Entry ID / Ref</th>
                <th className="pb-3 font-semibold">Narration</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {entries.map((entry) => {
                const isExpanded = expandedId === (entry.id || entry.journalEntryId);
                const lines = entry.lines || [];

                return (
                  <React.Fragment key={entry.id || entry.journalEntryId}>
                    <tr
                      onClick={() => toggleExpand(entry.id || entry.journalEntryId)}
                      className="hover:bg-slate-850/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 text-slate-400">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </td>
                      <td className="py-3 font-bold text-slate-200">
                        {entry.paymentReference || entry.reference || `JE-${entry.id}`}
                      </td>
                      <td className="py-3 text-slate-300 max-w-xs truncate">
                        {entry.narration || entry.description || 'Inter-wallet transfer settlement'}
                      </td>
                      <td className="py-3 text-emerald-400 font-bold">
                        {formatINR(entry.amount || entry.totalAmount)}
                      </td>
                      <td className="py-3">
                        <Badge variant="success">POSTED</Badge>
                      </td>
                      <td className="py-3 text-slate-400">
                        {formatTimestamp(entry.postedAt || entry.createdAt)}
                      </td>
                    </tr>

                    {/* Expanded Journal Lines Sub-table */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80">
                        <td colSpan={6} className="p-4">
                          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 space-y-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Balanced Journal Lines (DR = CR)
                            </span>
                            {lines.length > 0 ? (
                              <div className="space-y-1.5 font-mono text-xs">
                                {lines.map((line, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Badge variant={line.entryType === 'DEBIT' ? 'brand' : 'success'}>
                                        {line.entryType}
                                      </Badge>
                                      <span className="font-semibold text-slate-200">{line.accountNumber || line.accountCode}</span>
                                      <span className="text-slate-400 text-[11px]">- {line.accountName || 'Account'}</span>
                                    </div>
                                    <span className="font-bold text-slate-100">{formatINR(line.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400">
                                Multi-leg lines balanced across User Liability and Cash Settlement accounts.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

