import React, { useState, useEffect } from 'react';
import { reconApi } from '../../api/reconApi';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/formatters';
import { BookOpen, ArrowRight } from 'lucide-react';

const STATIC_ACCOUNTS = [
  {
    code: '1010',
    name: 'CASH_SETTLEMENT_ACCOUNT',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    debits: 135000.0,
    credits: 0.0,
    balance: 135000.0,
    description: 'Nostro clearing account holding pooled fiat reserves backed by banking partners.',
  },
  {
    code: '2010',
    name: 'USER_WALLET_LIABILITIES',
    type: 'LIABILITY',
    normalBalance: 'CREDIT',
    debits: 0.0,
    credits: 135000.0,
    balance: 135000.0,
    description: 'Aggregate user balance claims owed to consumers and merchants on the platform.',
  },
  {
    code: '4010',
    name: 'PLATFORM_FEE_REVENUE',
    type: 'REVENUE',
    normalBalance: 'CREDIT',
    debits: 0.0,
    credits: 0.0,
    balance: 0.0,
    description: 'Interchange and settlement processing fee income earned by SentraPay switch.',
  },
  {
    code: '5010',
    name: 'DISPUTE_RESERVE_ACCOUNT',
    type: 'EQUITY_RESERVE',
    normalBalance: 'CREDIT',
    debits: 0.0,
    credits: 0.0,
    balance: 0.0,
    description: 'Collateral buffer held in escrow against chargebacks and fraudulent reversals.',
  },
];

export function DoubleEntryTAccounts() {
  const [accounts, setAccounts] = useState(STATIC_ACCOUNTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAccounts() {
      setLoading(true);
      try {
        const data = await reconApi.getAccounts();
        if (Array.isArray(data) && data.length > 0) {
          // Merge API data with descriptions
          setAccounts(data);
        }
      } catch (e) {
        console.debug('Using default accounts chart:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAccounts();
  }, []);

  return (
    <Card
      title="General Ledger T-Accounts Visualizer"
      subtitle="Standard accounting dual-aspect ledger visualization with Debit (DR) and Credit (CR) legs"
      badge={<Badge variant="brand">Chart of Accounts</Badge>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5">
        {accounts.map((acc) => {
          const isAsset = acc.type === 'ASSET';
          const isLiability = acc.type === 'LIABILITY';

          return (
            <div
              key={acc.code}
              className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col justify-between"
            >
              {/* Account Header */}
              <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-100">{acc.code}</span>
                    <span className="text-xs font-semibold text-slate-300">{acc.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{acc.description}</span>
                </div>
                <Badge variant={isAsset ? 'brand' : isLiability ? 'success' : 'neutral'}>
                  {acc.type}
                </Badge>
              </div>

              {/* T-Account Table (Debits Left, Credits Right) */}
              <div className="grid grid-cols-2 divide-x divide-slate-800 p-3 text-xs font-mono min-h-24">
                {/* Left: DEBIT */}
                <div className="pr-3">
                  <div className="text-[10px] text-indigo-400 font-bold uppercase mb-1.5 flex justify-between">
                    <span>Debit (DR)</span>
                    <span>+</span>
                  </div>
                  <div className="text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[10px]">Total Dr:</span>
                      <span className="font-semibold">{formatINR(acc.debits || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: CREDIT */}
                <div className="pl-3">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1.5 flex justify-between">
                    <span>Credit (CR)</span>
                    <span>-</span>
                  </div>
                  <div className="text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[10px]">Total Cr:</span>
                      <span className="font-semibold">{formatINR(acc.credits || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Net Account Balance */}
              <div className="px-3.5 py-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between font-mono text-xs">
                <span className="text-[11px] text-slate-400">Net Balance ({acc.normalBalance || 'NORMAL'})</span>
                <span className="font-bold text-slate-100">{formatINR(acc.balance || 0)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

