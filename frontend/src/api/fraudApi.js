import { apiClient } from './client';

export const fraudApi = {
  getStatus() {
    return apiClient.get('/api/fraud/status');
  },

  getStats() {
    return apiClient.get('/api/fraud/status');
  },

  evaluateRisk(payload) {
    return apiClient.post('/api/fraud/evaluate', payload);
  }
};
