import React from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Badge } from './Badge';
import { formatINR } from '../../utils/formatters';
import { Radio, X, ExternalLink, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export function NotificationToast() {
  const { activeNotification, dismissNotification, setActiveTab } = usePlatform();

  if (!activeNotification) return null;

  const notif = activeNotification;
  const isSettled = notif.type === 'PAYMENT_SETTLED';
  const isFraud = notif.type === 'FRAUD_EVALUATED' || notif.type === 'PAYMENT_FRAUD_SCORED';
  const isInitiated = notif.type === 'PAYMENT_INITIATED';

  let borderColor = 'border-indigo-500/50 bg-slate-900/95';
  let badgeVariant = 'brand';
  if (isSettled) {
    borderColor = 'border-emerald-500/60 bg-emerald-950/90';
    badgeVariant = 'success';
  } else if (isFraud && notif.decision === 'REJECT') {
    borderColor = 'border-rose-500/60 bg-rose-950/90';
    badgeVariant = 'danger';
  } else if (isFraud) {
    borderColor = 'border-amber-500/60 bg-amber-950/90';
    badgeVariant = 'warning';
  }

  const handleInspect = () => {
    setActiveTab('events');
    dismissNotification();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`p-4 rounded-2xl border shadow-2xl shadow-black/80 backdrop-blur-md ${borderColor} text-slate-100 flex flex-col gap-2.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Notification Service Broadcast
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={badgeVariant} size="sm">
              {notif.eventName || notif.type}
            </Badge>
            <button
              onClick={dismissNotification}
              className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-xs font-mono">
          <div className="flex items-center justify-between text-slate-200 font-semibold">
            <span className="truncate max-w-[240px]">Ref: {notif.reference}</span>
            {notif.amount && (
              <span className="text-emerald-400 font-bold ml-2">
                {formatINR(notif.amount)}
              </span>
            )}
          </div>
          {notif.decision && (
            <div className="text-[11px] text-slate-400 mt-1">
              AI Decision: <strong className={notif.decision === 'APPROVE' ? 'text-emerald-400' : 'text-rose-400'}>{notif.decision}</strong>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
          <span>Received at {notif.receivedAt} via SSE :8084</span>
          <button
            onClick={handleInspect}
            className="flex items-center gap-1 text-indigo-300 hover:text-indigo-200 font-medium transition-colors"
          >
            <span>Open Stream Console</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

