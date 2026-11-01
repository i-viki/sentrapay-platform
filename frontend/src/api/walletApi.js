import { apiClient } from './client';

export const walletApi = {
  async getMyWallet() {
    const res = await apiClient.get('/api/wallets/me');
    const data = res.data || res;
    return {
      walletId: data.walletNumber || data.walletId || `W-USER-001`,
      balance: data.currentBalance ?? data.balance ?? 0,
      availableBalance: data.availableBalance ?? data.currentBalance ?? 0,
      activeHolds: data.activeHolds ?? 0,
      currency: data.currency || 'INR',
      status: data.status || 'ACTIVE',
      username: data.username,
      fullName: data.fullName,
    };
  },

  async getAllWallets() {
    try {
      const res = await apiClient.get('/api/wallets');
      const list = res.data || res;
      if (Array.isArray(list)) {
        return list.map((w) => ({
          walletId: w.walletNumber || w.walletId,
          walletNumber: w.walletNumber || w.walletId,
          username: w.username,
          fullName: w.fullName,
          balance: w.currentBalance ?? w.balance ?? 0,
          availableBalance: w.availableBalance ?? w.currentBalance ?? w.balance ?? 0,
          activeHolds: w.activeHolds ?? 0,
          currency: w.currency || 'INR',
          status: w.status || 'ACTIVE',
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  async getWalletTransactions() {
    const res = await apiClient.get('/api/payments/history');
    const raw = res.data || res;
    if (raw && Array.isArray(raw.content)) {
      return raw.content;
    }
    if (Array.isArray(raw)) {
      return raw;
    }
    return [];
  },

  async submitTransfer({ recipientWalletId, amount, currency = 'INR', remarks = '' }, idempotencyKey) {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const res = await apiClient.post('/api/payments/transfer', {
      recipientWalletNumber: recipientWalletId,
      amount,
      currency,
      narration: remarks,
      deviceFingerprint: 'SENTRAPAY-WEB-CLIENT-V1',
    }, headers);
    return res.data || res;
  },

  async getBeneficiaries() {
    try {
      const res = await apiClient.get('/api/wallets/beneficiaries');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async addBeneficiary({ beneficiaryName, recipientWalletNumber, dailyLimit }) {
    const res = await apiClient.post('/api/wallets/beneficiaries', {
      beneficiaryName,
      recipientWalletNumber,
      dailyLimit: dailyLimit ? parseFloat(dailyLimit) : 50000.0,
    });
    return res.data || res;
  },

  async getIncomingPaymentRequests() {
    try {
      const res = await apiClient.get('/api/wallets/requests/incoming');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async getOutgoingPaymentRequests() {
    try {
      const res = await apiClient.get('/api/wallets/requests/outgoing');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async createPaymentRequest({ payerWalletNumber, amount, description }) {
    const res = await apiClient.post('/api/wallets/requests', {
      payerWalletNumber,
      amount: parseFloat(amount),
      description,
      currency: 'INR',
    });
    return res.data || res;
  },

  async approvePaymentRequest(reference, idempotencyKey) {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const res = await apiClient.post(`/api/wallets/requests/${reference}/approve`, {}, headers);
    return res.data || res;
  },

  async rejectPaymentRequest(reference) {
    const res = await apiClient.post(`/api/wallets/requests/${reference}/reject`);
    return res.data || res;
  }
};
