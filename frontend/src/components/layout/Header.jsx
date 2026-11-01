import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatINR } from '../../utils/formatters';
import { Activity, ShieldCheck, Layers, RefreshCw, UserCheck } from 'lucide-react';

export function Header() {
  const { currentUser, switchUser, preseededUsers } = useAuth();
  const { wallet, sseStatus, refreshWallet, loadingWallet, setArchitectureModalOpen } = usePlatform();

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONNECTED':
        return 'bg-emerald-500 shadow-emerald-500/50';
      case 'CONNECTING':
      case 'RECONNECTING':
        return 'bg-amber-500 shadow-amber-500/50';
      default:
        return 'bg-rose-500 shadow-rose-500/50';
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
            SP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">SentraPay</h1>
              <Badge variant="brand" size="sm">ENTERPRISE SWITCH</Badge>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Event-Driven Real-Time Payment Switch, AI Fraud Scoring & Double-Entry Ledger
            </p>
          </div>
        </div>

        {/* Live SSE Pulse & Architecture Blueprint CTA */}
        <div className="flex items-center gap-3">
          {/* SSE Pulse Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              {sseStatus === 'CONNECTED' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusColor(sseStatus)}`}></span>
            </span>
            <span className="font-mono text-[11px] font-medium tracking-wide">
              SSE: {sseStatus}
            </span>
          </div>

          {/* Architecture Blueprint Button */}
          <Button
            variant="outline"
            size="sm"
            icon={Layers}
            onClick={() => setArchitectureModalOpen(true)}
            className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40"
          >
            Architecture Blueprint
          </Button>

          {/* Wallet Balance Chip */}
          {wallet && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-medium">AVAILABLE BALANCE</div>
                <div className="text-xs font-mono font-bold text-emerald-400">
                  {formatINR(wallet.availableBalance ?? wallet.balance)}
                </div>
              </div>
              <button
                onClick={refreshWallet}
                disabled={loadingWallet}
                title="Refresh Wallet Balance"
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingWallet ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>
          )}

          {/* Account Quick Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <div className="flex items-center gap-1">
              {preseededUsers.map((user) => {
                const isActive = currentUser && currentUser.username === user.username;
                return (
                  <button
                    key={user.username}
                    onClick={() => switchUser(user.username)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {user.username}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

