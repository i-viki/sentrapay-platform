import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { fraudApi } from '../../api/fraudApi';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatINR } from '../../utils/formatters';
import { Sliders, ShieldCheck, ShieldAlert, Cpu, Activity, RefreshCw } from 'lucide-react';

export function RiskSimulatorModal() {
  const { riskModalOpen, setRiskModalOpen } = usePlatform();

  const [amount, setAmount] = useState(1500);
  const [velocity1h, setVelocity1h] = useState(2);
  const [velocity24h, setVelocity24h] = useState(5);
  const [deviceRisk, setDeviceRisk] = useState(0.15);
  const [ipRisk, setIpRisk] = useState(0.10);

  const [score, setScore] = useState(0.08);
  const [verdict, setVerdict] = useState('APPROVE');
  const [evaluating, setEvaluating] = useState(false);
  const [latencyMs, setLatencyMs] = useState(2.3);

  // Evaluate risk whenever inputs change
  useEffect(() => {
    let isCancelled = false;

    async function runEval() {
      setEvaluating(true);
      const start = performance.now();

      try {
        const payload = {
          amount: parseFloat(amount),
          velocity1h: parseInt(velocity1h, 10),
          velocity24h: parseInt(velocity24h, 10),
          deviceRisk: parseFloat(deviceRisk),
          ipRisk: parseFloat(ipRisk),
        };

        const res = await fraudApi.evaluateRisk(payload);
        if (!isCancelled && res) {
          const evalScore = res.riskScore !== undefined ? res.riskScore : res.score;
          setScore(evalScore);
          setVerdict(res.decision || (evalScore > 0.7 ? 'REJECT' : evalScore > 0.3 ? 'REVIEW' : 'APPROVE'));
          setLatencyMs(parseFloat((performance.now() - start).toFixed(1)));
        }
      } catch (err) {
        // Fallback local calculation matching Random Forest weights if direct endpoint unreachable
        if (!isCancelled) {
          const vScore = velocity1h > 5 ? 0.85 : (velocity1h * 0.08);
          const aScore = amount > 50000 ? 0.6 : (amount / 100000);
          const computed = Math.min(0.99, Math.max(0.02, (aScore * 0.35) + (vScore * 0.35) + (deviceRisk * 0.2) + (ipRisk * 0.1)));
          setScore(parseFloat(computed.toFixed(3)));
          setVerdict(computed > 0.7 || velocity1h > 5 ? 'REJECT' : computed > 0.3 ? 'REVIEW' : 'APPROVE');
          setLatencyMs(parseFloat((performance.now() - start).toFixed(1)));
        }
      } finally {
        if (!isCancelled) setEvaluating(false);
      }
    }

    const timer = setTimeout(runEval, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [amount, velocity1h, velocity24h, deviceRisk, ipRisk]);

  const scorePct = Math.round(score * 100);

  let gaugeColor = 'bg-emerald-500';
  let badgeVariant = 'success';
  if (verdict === 'REJECT') {
    gaugeColor = 'bg-rose-500';
    badgeVariant = 'danger';
  } else if (verdict === 'REVIEW') {
    gaugeColor = 'bg-amber-500';
    badgeVariant = 'warning';
  }

  return (
    <Modal
      isOpen={riskModalOpen}
      onClose={() => setRiskModalOpen(false)}
      title="Interactive AI Risk & Feature Attribution Simulator"
      subtitle="Adjust synthetic features in real time to observe Random Forest & sliding-window boundary thresholds"
      badge={<Badge variant="brand">gRPC :50051</Badge>}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Real-time Verdict & Score Gauge */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Automated Saga Risk Verdict
            </span>
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
                {scorePct}% Risk
              </span>
              <Badge variant={badgeVariant} size="lg">
                {verdict}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Inference Latency: <strong className="text-indigo-400 font-mono">{latencyMs} ms</strong> via binary Protobuf gRPC
            </p>
          </div>

          {/* Gauge Bar */}
          <div className="w-full md:w-1/2 space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">0% Safe</span>
              <span className="text-amber-400 font-bold">30% Review</span>
              <span className="text-rose-400 font-bold">70% Reject</span>
            </div>
            <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${gaugeColor}`}
                style={{ width: `${Math.max(4, Math.min(100, scorePct))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Feature Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Amount Slider */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between font-mono">
              <span className="text-slate-300 font-semibold">Transaction Amount</span>
              <span className="text-indigo-400 font-bold">{formatINR(amount)}</span>
            </div>
            <input
              type="range"
              min="100"
              max="100000"
              step="500"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <span className="text-[10px] text-slate-500 block">
              High values (&gt; 50,000 INR) trigger elevated scrutiny weights.
            </span>
          </div>

          {/* 1-Hour Velocity Slider */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between font-mono">
              <span className="text-slate-300 font-semibold">1-Hour Velocity Count</span>
              <span className={velocity1h > 5 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {velocity1h} tx / hr
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={velocity1h}
              onChange={(e) => setVelocity1h(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <span className="text-[10px] text-slate-500 block">
              Hard threshold at &gt; 5 tx/hr triggers immediate deterministic velocity rejection.
            </span>
          </div>

          {/* 24-Hour Velocity Slider */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between font-mono">
              <span className="text-slate-300 font-semibold">24-Hour Velocity Aggregate</span>
              <span className="text-slate-200 font-bold">{velocity24h} tx / 24h</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={velocity24h}
              onChange={(e) => setVelocity24h(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <span className="text-[10px] text-slate-500 block">
              Sliding historical baseline for anomaly detection.
            </span>
          </div>

          {/* Device Risk Score */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between font-mono">
              <span className="text-slate-300 font-semibold">Device Fingerprint Risk</span>
              <span className="text-amber-400 font-bold">{deviceRisk.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={deviceRisk}
              onChange={(e) => setDeviceRisk(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <span className="text-[10px] text-slate-500 block">
              Emulators, incognito sessions, or spoofed User-Agents increase this score.
            </span>
          </div>
        </div>

        {/* Reset / Presets */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Quick Presets:</span>
            <Button
              size="xs"
              variant="outline"
              onClick={() => { setAmount(500); setVelocity1h(1); setVelocity24h(3); setDeviceRisk(0.05); setIpRisk(0.05); }}
            >
              Safe Low-Risk
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => { setAmount(75000); setVelocity1h(3); setVelocity24h(12); setDeviceRisk(0.4); setIpRisk(0.3); }}
            >
              High Ticket
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => { setAmount(2000); setVelocity1h(8); setVelocity24h(20); setDeviceRisk(0.8); setIpRisk(0.7); }}
            >
              Velocity Attack
            </Button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setRiskModalOpen(false)}
          >
            Close Simulator
          </Button>
        </div>
      </div>
    </Modal>
  );
}

