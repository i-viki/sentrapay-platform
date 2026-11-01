import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatINR, formatTimestamp, truncateHash } from '../../utils/formatters';
import { Eye, ArrowUpRight, ArrowDownLeft, RefreshCw, Filter } from 'lucide-react';

export function TransactionsList() {
  const { transactions, setSelectedTransaction, refreshWallet, loadingWallet } = usePlatform();
  const [filter, setFilter] = useState('ALL');

  const filtered = transactions.filter((tx) => {
    if (filter === 'ALL') return true;
    if (filter === 'SETTLED') return tx.status === 'COMPLETED' || tx.status === 'SETTLED' || tx.status === 'SUCCESS';
    if (filter === 'REJECTED') return tx.status === 'FAILED' || tx.status === 'REJECTED';
    return true;
  });

  return (
    <Card
      title="Recent Ledger Transactions"
      subtitle="Immutable event logs with full Saga audit trails"
      badge={<Badge variant="neutral">{transactions.length} Records</Badge>}
      action={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
            {['ALL', 'SETTLED', 'REJECTED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filter === f
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={refreshWallet}
            disabled={loadingWallet}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Refresh Transactions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingWallet ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400">
          No transactions found matching criteria. Submit a transfer or run a scenario to generate transactions.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <th className="pb-3 font-semibold">Reference</th>
                <th className="pb-3 font-semibold">Sender</th>
                <th className="pb-3 font-semibold">Recipient</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Risk Tier</th>
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold text-right">Flow Explainer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filtered.map((tx, idx) => {
                const isSettled = tx.status === 'COMPLETED' || tx.status === 'SETTLED' || tx.status === 'SUCCESS';
                const isRejected = tx.status === 'REJECTED' || tx.status === 'FAILED';

                return (
                  <tr key={tx.id || tx.paymentReference || tx.reference || idx} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3 font-bold text-slate-200">
                      {tx.paymentReference || tx.reference || 'TX-UNKNOWN'}
                    </td>
                    <td className="py-3 text-slate-400">
                      {tx.senderWalletNumber || tx.senderWalletId || '--'}
                    </td>
                    <td className="py-3 text-slate-400">
                      {tx.recipientWalletNumber || tx.recipientWalletId || '--'}
                    </td>
                    <td className="py-3">
                      <span className="text-emerald-400 font-bold">
                        {formatINR(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge variant={isRejected ? 'danger' : isSettled ? 'success' : 'warning'}>
                        {tx.status || 'PENDING'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {tx.riskTier ? (
                        <Badge variant={tx.riskTier === 'HIGH' ? 'danger' : tx.riskTier === 'MEDIUM' ? 'warning' : 'success'}>
                          {tx.riskTier} ({Math.round((tx.riskScore || 0) * 100)}%)
                        </Badge>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>
                    <td className="py-3 text-slate-400">
                      {formatTimestamp(tx.createdAt || tx.timestamp)}
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        icon={Eye}
                        onClick={() => setSelectedTransaction(tx)}
                        className="text-[10px] text-indigo-300 border-indigo-500/30 hover:bg-indigo-950/40"
                      >
                        Explain Flow
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
