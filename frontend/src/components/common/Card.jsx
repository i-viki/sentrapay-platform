import React from 'react';

export function Card({
  title,
  subtitle,
  badge,
  action,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
}) {
  return (
    <div
      className={`bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-sm shadow-slate-950/40 ${className}`}
    >
      {(title || subtitle || badge || action) && (
        <div
          className={`px-5 py-4 border-b border-slate-800/80 flex items-center justify-between gap-3 ${headerClassName}`}
        >
          <div>
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="text-sm font-semibold text-slate-100 tracking-tight">
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

