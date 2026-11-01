import React from 'react';

const variantConfig = {
  neutral: {
    bg: 'bg-slate-800/80 text-slate-300 border-slate-700/60 shadow-sm',
    dot: 'bg-slate-400',
  },
  brand: {
    bg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20',
    dot: 'bg-indigo-400',
  },
  success: {
    bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  warning: {
    bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20',
    dot: 'bg-amber-400',
  },
  danger: {
    bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20',
    dot: 'bg-rose-400',
  },
  cyan: {
    bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20',
    dot: 'bg-cyan-400',
  },
  purple: {
    bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20',
    dot: 'bg-purple-400',
  },
  outline: {
    bg: 'bg-transparent text-slate-300 border-slate-700/80',
    dot: 'bg-slate-400',
  },
};

const sizeClasses = {
  xs: 'text-[9.5px] px-2 py-0.5 tracking-wider',
  sm: 'text-[10px] px-2.5 py-0.5 tracking-wider',
  md: 'text-[11px] px-3 py-1 tracking-wider',
  lg: 'text-xs px-3.5 py-1.5 tracking-wider',
};

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = true,
  pulse = false,
  className = '',
}) {
  const config = variantConfig[variant] || variantConfig.neutral;
  const isOutline = variant === 'outline';

  return (
    <span
      className={`inline-flex items-center max-w-full min-w-0 overflow-hidden font-mono font-semibold uppercase rounded-full border backdrop-blur-md transition-all duration-200 select-none shrink-0 ${config.bg} ${sizeClasses[size] || sizeClasses.sm} ${className}`}
    >
      {dot && !isOutline && (
        <span className="relative flex h-1.5 w-1.5 mr-1.5 shrink-0">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`} />
        </span>
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}

