import React, { useState, useEffect } from 'react';
import { walletApi } from '../../api/walletApi';
import { formatINR, formatTimestamp, generateUuid } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Inbox, Send, ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export function PaymentRequestsModal({ isOpen, onClose, onPaymentApproved }) {
  const [tab, setTab] = useState('incoming'); // 'incoming', 'outgoing', 'create'
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingRef, setProcessingRef] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Create form state
  const [payerWalletNumber, setPayerWalletNumber] = useState('');
  const [amount, setAmount] = useState('500');
  const [description, setDescription] = useState('Shared dinner expense');
  const [creating, setCreating] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [inc, out] = await Promise.all([
        walletApi.getIncomingPaymentRequests(),
        walletApi.getOutgoingPaymentRequests(),
      ]);
      setIncoming(Array.isArray(inc) ? inc : []);
      setOutgoing(Array.isArray(out) ? out : []);
    } catch (e) {
      console.debug('Failed to fetch payment requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleApprove = async (ref) => {
    setProcessingRef(ref);
    setError(null);
    setSuccess(null);
    try {
      const idempKey = generateUuid();
      const res = await walletApi.approvePaymentRequest(ref, idempKey);
      setSuccess(`Request ${ref} approved! Dispatched through Saga switch (TxRef: ${res.paymentReference || 'CONFIRMED'})`);
      fetchRequests();
      if (onPaymentApproved) onPaymentApproved(res);
    } catch (err) {
      setError(err.message || 'Approval failed');
    } finally {
      setProcessingRef(null);
    }
  };

  const handleReject = async (ref) => {
    setProcessingRef(ref);
    setError(null);
    try {
      await walletApi.rejectPaymentRequest(ref);
      setSuccess(`Request ${ref} rejected.`);
      fetchRequests();
    } catch (err) {
      setError(err.message || 'Rejection failed');
    } finally {
      setProcessingRef(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await walletApi.createPaymentRequest({
        payerWalletNumber,
        amount,
        description,
      });
      setSuccess(`Payment request ${res.requestReference} dispatched to ${payerWalletNumber}!`);
      setPayerWalletNumber('');
      setAmount('500');
      setDescription('');
      setTab('outgoing');
      fetchRequests();
    } catch (err) {
      setError(err.message || 'Failed to create payment request');
    } finally {
      setCreating(false);
    }
  };

  const pendingCount = incoming.filter((r) => r.status === 'PENDING').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="P2P Payment Requests & UPI Collect Protocol"
      size="lg"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setTab('incoming')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'incoming'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Incoming to Pay</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('outgoing')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'outgoing'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Outgoing Requests ({outgoing.length})</span>
          </button>
          <button
            onClick={() => setTab('create')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'create'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Request Money (Collect)</span>
          </button>
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

        {/* Tab 1: Incoming Requests to Pay */}
        {tab === 'incoming' && (
          <div className="space-y-3">
            {incoming.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No incoming payment requests found.
              </div>
            ) : (
              incoming.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-xs">{r.requesterName}</span>
                      <span className="text-[11px] font-mono text-slate-400">({r.requesterWalletNumber})</span>
                      <Badge
                        variant={
                          r.status === 'FULFILLED'
                            ? 'success'
                            : r.status === 'REJECTED'
                            ? 'danger'
                            : r.status === 'EXPIRED'
                            ? 'neutral'
                            : 'warning'
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-300">
                      Amount: <span className="font-bold text-emerald-400 font-mono">{formatINR(r.amount)}</span>
                      {r.description && <span className="text-slate-400 ml-2">"{r.description}"</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                      <span>Ref: {r.requestReference}</span>
                      <span>•</span>
                      <span>Expires: {formatTimestamp(r.expiresAt)}</span>
                    </div>
                  </div>

                  {r.status === 'PENDING' && !r.expired && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="xs"
                        variant="primary"
                        icon={CheckCircle2}
                        loading={processingRef === r.requestReference}
                        onClick={() => handleApprove(r.requestReference)}
                        className="text-xs"
                      >
                        Approve & Pay
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        icon={XCircle}
                        loading={processingRef === r.requestReference}
                        onClick={() => handleReject(r.requestReference)}
                        className="text-xs border-rose-500/40 text-rose-300"
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Outgoing Requests */}
        {tab === 'outgoing' && (
          <div className="space-y-3">
            {outgoing.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                You have not initiated any collect requests yet.
              </div>
            ) : (
              outgoing.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-xs">To: {r.payerName}</span>
                      <span className="text-[11px] font-mono text-slate-400">({r.payerWalletNumber})</span>
                      <Badge
                        variant={
                          r.status === 'FULFILLED'
                            ? 'success'
                            : r.status === 'REJECTED'
                            ? 'danger'
                            : r.status === 'EXPIRED'
                            ? 'neutral'
                            : 'warning'
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-300">
                      Requested: <span className="font-bold text-indigo-400 font-mono">{formatINR(r.amount)}</span>
                      {r.description && <span className="text-slate-400 ml-2">"{r.description}"</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Ref: {r.requestReference} • {formatTimestamp(r.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Request Money Form */}
        {tab === 'create' && (
          <form onSubmit={handleCreate} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Target Payer Wallet Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. W-BOB-003 or W-ALICE-002"
                value={payerWalletNumber}
                onChange={(e) => setPayerWalletNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Requested Amount (INR)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Description / Memo
              </label>
              <input
                type="text"
                placeholder="e.g. Project milestone payment"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" variant="primary" type="submit" loading={creating} className="text-xs">
                Dispatch Collect Request
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

