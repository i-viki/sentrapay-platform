import React, { useState, useEffect } from 'react';
import { walletApi } from '../../api/walletApi';
import { formatINR, formatTimestamp } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Users, UserPlus, Clock, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';

export function BeneficiariesModal({ isOpen, onClose, onSelectBeneficiary }) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [walletNumber, setWalletNumber] = useState('');
  const [limit, setLimit] = useState('50000');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const data = await walletApi.getBeneficiaries();
      setBeneficiaries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.debug('Failed to fetch beneficiaries:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBeneficiaries();
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await walletApi.addBeneficiary({
        beneficiaryName: name,
        recipientWalletNumber: walletNumber,
        dailyLimit: limit,
      });
      setSuccess(`Beneficiary '${name}' registered with 24-hour security cooling-off period.`);
      setName('');
      setWalletNumber('');
      setShowAddForm(false);
      fetchBeneficiaries();
    } catch (err) {
      setError(err.message || 'Failed to add beneficiary');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Beneficiary Management & Anti-Takeover Guardrails"
      size="lg"
    >
      <div className="space-y-4">
        {/* Anti-Takeover Info Banner */}
        <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-xs text-indigo-300 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block text-indigo-200">24-Hour Cooling-Off Security Protocol</span>
            <p className="text-[11px] text-indigo-300/80 leading-relaxed">
              To defend against account takeovers and unauthorized wallet draining, newly registered beneficiaries are strictly capped at <span className="font-mono font-bold text-white">INR 5,000.00</span> per transfer during their first 24 hours.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300">
            {success}
          </div>
        )}

        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Registered Payees ({beneficiaries.length})
          </h4>
          <Button
            size="xs"
            variant="outline"
            icon={UserPlus}
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs border-indigo-500/40 text-indigo-300"
          >
            {showAddForm ? 'Cancel' : 'Add New Beneficiary'}
          </Button>
        </div>

        {/* Add Form Accordion */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Beneficiary Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Personal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Wallet Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. W-BOB-003"
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Configured Daily Limit (INR)</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button size="sm" variant="primary" type="submit" loading={saving} className="text-xs">
                Save & Enforce Cooling-Off
              </Button>
            </div>
          </form>
        )}

        {/* Beneficiaries List */}
        {beneficiaries.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No registered beneficiaries yet. Click above to add your first trusted payee.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            {beneficiaries.map((b) => (
              <div key={b.id} className="p-3.5 flex items-center justify-between hover:bg-slate-900/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{b.beneficiaryName}</span>
                    <span className="text-[11px] font-mono text-slate-400">({b.recipientWalletNumber})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Limit: {formatINR(b.dailyLimit)}</span>
                    <span>•</span>
                    {b.coolingOffActive ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                        <Clock className="w-3 h-3" />
                        Cooling-Off Active ({b.coolingOffRemainingHours}h left, max INR 5,000)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle className="w-3 h-3" />
                        Fully Verified Payee
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  size="xs"
                  variant="outline"
                  icon={ArrowRight}
                  onClick={() => {
                    onSelectBeneficiary(b.recipientWalletNumber);
                    onClose();
                  }}
                  className="text-xs border-indigo-500/30 text-indigo-300"
                >
                  Pay Now
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

