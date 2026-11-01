import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export const PRESEEDED_USERS = [
  { username: 'jayavignesh', password: 'StrongPassword123!', role: 'ADMIN', walletId: 'W-JAYAVIGNESH-001', label: 'Jayavignesh (Admin)' },
  { username: 'alice', password: 'StrongPassword123!', role: 'USER', walletId: 'W-ALICE-002', label: 'Alice (Merchant)' },
  { username: 'bob', password: 'StrongPassword123!', role: 'USER', walletId: 'W-BOB-003', label: 'Bob (Consumer)' },
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(authApi.getCurrentToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-login default user if token exists or login as jayavignesh
  useEffect(() => {
    async function initAuth() {
      const savedUser = localStorage.getItem('sentrapay_user');
      const savedToken = localStorage.getItem('sentrapay_jwt_token');

      if (savedToken && savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
          setToken(savedToken);
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('sentrapay_user');
        }
      }

      // Default login to jayavignesh for immediate rich experience
      try {
        await switchUser('jayavignesh');
      } catch (err) {
        console.warn('Initial auto-login error:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const res = await authApi.login(username, password);
      const payload = res.data || res;
      const userObj = {
        username: payload.username || username,
        role: payload.role || 'USER',
        walletId: payload.walletNumber || payload.walletId || `W-${username.toUpperCase()}-001`,
        email: payload.email,
        userId: payload.userId,
      };
      setCurrentUser(userObj);
      setToken(payload.token);
      localStorage.setItem('sentrapay_user', JSON.stringify(userObj));
      return userObj;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const switchUser = async (targetUsername) => {
    const target = PRESEEDED_USERS.find((u) => u.username === targetUsername) || PRESEEDED_USERS[0];
    return login(target.username, target.password);
  };

  const logout = () => {
    authApi.logout();
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('sentrapay_user');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        error,
        login,
        switchUser,
        logout,
        isAuthenticated: !!token,
        preseededUsers: PRESEEDED_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
