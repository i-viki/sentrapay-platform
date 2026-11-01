import { apiClient } from './client';

export const authApi = {
  async login(username, password) {
    const res = await apiClient.post('/api/auth/login', { username, password });
    // Normalize response: res.data or res
    const payload = res.data || res;
    if (payload.token) {
      apiClient.setToken(payload.token);
    }
    return payload;
  },

  logout() {
    apiClient.setToken(null);
  },

  getCurrentToken() {
    return apiClient.getToken();
  }
};
