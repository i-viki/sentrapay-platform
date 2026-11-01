import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { fraudApi } from '../../api/fraudApi';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Shield, Cpu, Activity, Sliders, CheckCircle2, AlertTriangle, XCircle, Zap } from 'lucide-react';

export function AiDecisionExplainer() {
  const { setRiskModalOpen } = usePlatform();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const data = await fraudApi.getStats();
        setStats(data);
      } catch (e) {
        console.debug('Failed to fetch fraud stats:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner: Hybrid Architecture Explanation */}
      <Card
        title="Hybrid AI Risk & Velocity Scoring Engine"
        subtitle="Dual-tier evaluation: In-Memory Redis ZSET Sliding-Window Rules + Binary gRPC Random Forest Inference"
        badge={<Badge variant="brand">Sub-3ms Latency</Badge>}
        action={
          <Button
            size="sm"
            variant="primary"
            icon={Sliders}
            onClick={() => setRiskModalOpen(true)}
            className="text-xs"
          >
            Launch Risk Simulator
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tier 1: Deterministic Velocity */}
          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/40">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Tier 1: Sliding-Window Velocity</h4>
                  <span className="text-[10px] font-mono text-slate-400">Redis 7.2 Sorted Sets (ZSET)</span>
                </div>
              </div>
              <Badge variant="danger">Deterministic</Badge>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every payment records a Unix timestamp member in <code className="text-rose-300 font-mono">user:&#123;id&#125;:velocity</code>. When a transaction arrives, the engine performs atomic <code className="text-rose-300 font-mono">ZREMRANGEBYSCORE</code> to purge entries older than 3600s, followed by <code className="text-rose-300 font-mono">ZCARD</code>. Exceeding 5 tx/min triggers an immediate REJECT verdict without burdening the ML model.
            </p>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="text-indigo-400 font-semibold">Formula: </span>
              Count(Tx in [now - 3600, now]) &gt; MaxPermitted &#8594; REJECT
            </div>
          </div>

          {/* Tier 2: Machine Learning */}
          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/40">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Tier 2: Random Forest ML Model</h4>
                  <span className="text-[10px] font-mono text-slate-400">Python 3.11 / Protobuf gRPC :50051</span>
                </div>
              </div>
              <Badge variant="brand">Probabilistic</Badge>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Trained on transactional fraud patterns. Features including amount ratios, device fingerprints, and geographic consistency are encoded into binary Protobuf messages. Predictions evaluate in &lt; 3ms, returning a calibrated risk probability between 0.00 and 1.00.
            </p>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="text-purple-400 font-semibold">Model: </span>
              RandomForestClassifier (100 estimators, balanced class weights)
            </div>
          </div>
        </div>
      </Card>

      {/* Decision Threshold Matrix & Feature Attribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Thresholds */}
        <Card
          title="Risk Decision Boundaries"
          subtitle="How fraud scores map to automated Saga verdicts"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300">0.00 - 0.29 : Low Risk</span>
                <Badge variant="success">APPROVE</Badge>
              </div>
              <p className="text-[11px] text-emerald-200/70">
                Immediate settlement. Hold released and debited, double-entry ledger updated.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300">0.30 - 0.69 : Elevated Risk</span>
                <Badge variant="warning">MANUAL REVIEW</Badge>
              </div>
              <p className="text-[11px] text-amber-200/70">
                Balance hold maintained. Flagged for compliance review or step-up authentication.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-300">0.70 - 1.00 : Severe Risk</span>
                <Badge variant="danger">REJECT & COMPENSATE</Badge>
              </div>
              <p className="text-[11px] text-rose-200/70">
                Saga publishes compensation event. Active balance hold is immediately released.
              </p>
            </div>
          </div>
        </Card>

        {/* Feature Importance Waterfall */}
        <Card
          title="Feature Attribution Weights"
          subtitle="Relative importance in Random Forest tree splits"
          className="lg:col-span-2"
        >
          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300">Amount Ratio (Tx Amount / 24h Average)</span>
                <span className="text-indigo-400 font-bold">34.2%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '34.2%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300">1-Hour Velocity Count (Redis ZSET)</span>
                <span className="text-rose-400 font-bold">28.5%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '28.5%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300">Device Fingerprint Risk Score</span>
                <span className="text-amber-400 font-bold">16.4%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '16.4%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300">24-Hour Velocity Aggregate</span>
                <span className="text-cyan-400 font-bold">12.1%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: '12.1%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300">IP Geolocation Discrepancy</span>
                <span className="text-purple-400 font-bold">8.8%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '8.8%' }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

