import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatTimeOnly, formatINR } from '../../utils/formatters';
import { Radio, Play, Pause, Trash2, Filter, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

export function LiveEventStreamConsole() {
  const { events, sseStatus } = usePlatform();
  const [isPaused, setIsPaused] = useState(false);
  const [filterTopic, setFilterTopic] = useState('ALL');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const displayEvents = isPaused ? events : events;

  const filteredEvents = displayEvents.filter((ev) => {
    if (filterTopic === 'ALL') return true;
    const type = (ev.eventType || ev.type || ev.eventName || '').toLowerCase();
    return type.includes(filterTopic.toLowerCase());
  });

  const getEventBadge = (type) => {
    switch (type) {
      case 'PAYMENT_INITIATED':
        return <Badge variant="brand">payments.initiated</Badge>;
      case 'FRAUD_EVALUATED':
      case 'PAYMENT_FRAUD_SCORED':
        return <Badge variant="warning">payments.fraud-scored</Badge>;
      case 'PAYMENT_SETTLED':
        return <Badge variant="success">payments.settled</Badge>;
      case 'RECON_MATCHED':
        return <Badge variant="cyan">recon.matched</Badge>;
      default:
        return <Badge variant="neutral">{type || 'EVENT'}</Badge>;
    }
  };

  const copyEvent = (ev, idx) => {
    navigator.clipboard.writeText(JSON.stringify(ev, null, 2));
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card
      title="Live Server-Sent Events (SSE) Stream Console"
      subtitle="Reactive unbuffered stream of all Kafka KRaft events broadcasted by Spring WebFlux :8084"
      badge={
        <Badge variant={sseStatus === 'CONNECTED' ? 'success' : 'danger'}>
          SSE: {sseStatus}
        </Badge>
      }
      action={
        <div className="flex items-center gap-2">
          {/* Topic Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
            {['ALL', 'INITIATED', 'FRAUD', 'SETTLED', 'RECON'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterTopic(f)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterTopic === f
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Pause / Resume */}
          <Button
            size="xs"
            variant="outline"
            icon={isPaused ? Play : Pause}
            onClick={() => setIsPaused(!isPaused)}
            className="text-[11px]"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
        </div>
      }
    >
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-400 font-mono">
          Listening on /api/events/stream... Trigger a transfer or scenario to observe live streaming events.
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 font-mono text-xs">
          {filteredEvents.map((ev, idx) => {
            const isExpanded = expandedIndex === idx;
            const eventType = ev.eventType || ev.type || 'UNKNOWN_EVENT';
            const timestamp = ev.timestamp || ev.createdAt || new Date().toISOString();

            return (
              <div
                key={idx}
                className="bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden hover:border-slate-700 transition-colors"
              >
                {/* Event Summary Bar */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span className="text-slate-500 text-[11px]">{formatTimeOnly(timestamp)}</span>
                    {getEventBadge(eventType)}
                    <span className="text-slate-300 font-semibold truncate max-w-xs sm:max-w-md">
                      Ref: {ev.paymentReference || ev.reference || ev.utrNumber || '--'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {ev.amount && (
                      <span className="text-emerald-400 font-bold">{formatINR(ev.amount)}</span>
                    )}
                    {ev.decision && (
                      <Badge variant={ev.decision === 'APPROVE' ? 'success' : 'danger'}>
                        {ev.decision}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Expanded Raw Payload */}
                {isExpanded && (
                  <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-[11px] relative">
                    <div className="flex items-center justify-between mb-2 text-slate-400 text-[10px] uppercase font-bold">
                      <span>Event JSON Payload</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyEvent(ev, idx);
                        }}
                        className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
                      >
                        {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-slate-300 overflow-x-auto p-2 bg-slate-950 rounded border border-slate-800/80">
                      {JSON.stringify(ev, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

