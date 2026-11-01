import React from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { X, ExternalLink, ShieldCheck, CheckCircle2, Terminal, Code, Cpu } from 'lucide-react';
import { Badge } from '../common/Badge';

export function ComponentDeepDiveDrawer() {
  const { selectedComponent, setSelectedComponent } = usePlatform();

  if (!selectedComponent) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div
        className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-700/50 text-indigo-400">
              {React.createElement(selectedComponent.icon, { className: 'w-6 h-6' })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">{selectedComponent.name}</h2>
                <Badge variant="success" size="sm">HEALTHY</Badge>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                {selectedComponent.tech} | Port {selectedComponent.port}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedComponent(null)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6 flex-1 text-sm text-slate-300">
          {/* Overview */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              Component Mission & Scope
            </h4>
            <p className="leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-slate-200">
              {selectedComponent.description}
            </p>
          </div>

          {/* Architectural Trade-Off / Why Chosen */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Enterprise Design Rationale
              </h4>
            </div>
            <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl space-y-2">
              <p className="text-emerald-200 font-medium text-xs leading-relaxed">
                {selectedComponent.why}
              </p>
            </div>
          </div>

          {/* Protocol & Specs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 block uppercase">Protocol / Interface</span>
              <span className="text-xs font-semibold text-slate-200 mt-1 block">{selectedComponent.protocol}</span>
            </div>
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 block uppercase">Clustering Mode</span>
              <span className="text-xs font-semibold text-slate-200 mt-1 block">Active-Active / Partitioned</span>
            </div>
          </div>

          {/* Codebase Link */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              Implementation Artifact
            </h4>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs">
              <div className="flex items-center gap-2 text-indigo-300">
                <Code className="w-4 h-4" />
                <span>{selectedComponent.codeRef}</span>
              </div>
              <Badge variant="brand" size="sm">Source</Badge>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={() => setSelectedComponent(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Close Deep Dive
          </button>
        </div>
      </div>
    </div>
  );
}

