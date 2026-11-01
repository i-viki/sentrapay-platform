import React from 'react';
import { ArrowLeftRight, ShieldAlert, BookOpenCheck, GitCompare, FileLock2, Radio } from 'lucide-react';

export function Navigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'switch', label: 'Payment Switch & Saga', icon: ArrowLeftRight },
    { id: 'fraud', label: 'AI Fraud & Risk Engine', icon: ShieldAlert },
    { id: 'ledger', label: 'Double-Entry Ledger', icon: BookOpenCheck },
    { id: 'reconciliation', label: 'Bank Reconciliation', icon: GitCompare },
    { id: 'audit', label: 'Cryptographic Audit Trail', icon: FileLock2 },
    { id: 'events', label: 'Live SSE Stream', icon: Radio },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50">
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

