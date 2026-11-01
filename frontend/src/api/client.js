// Central HTTP client with JWT token management and error handling

const API_BASE = ''; // Relative path, handled by Nginx proxy or Vite dev proxy

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('sentrapay_jwt_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('sentrapay_jwt_token', token);
    } else {
      localStorage.removeItem('sentrapay_jwt_token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle HTTP 401 Unauthorized
      if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
        // Clear token on 401 session expiry
        console.warn('Session expired or unauthorized. Token cleared.');
      }

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok) {
        const error = new Error((data && (data.message || data.error)) || `HTTP ${response.status} ${response.statusText}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  post(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  }

  put(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers,
    });
  }
}

export const apiClient = new ApiClient();

