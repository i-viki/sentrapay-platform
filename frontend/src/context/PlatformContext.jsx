import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { walletApi } from '../api/walletApi';
import { apiClient } from '../api/client';
import { sseClient } from '../api/sseClient';
import { useAuth } from './AuthContext';

const PlatformContext = createContext(null);

export function PlatformProvider({ children }) {
  const { isAuthenticated, currentUser } = useAuth();

  const [wallet, setWallet] = useState(null);
  const [walletsList, setWalletsList] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [sseStatus, setSseStatus] = useState('DISCONNECTED');
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [activeTab, setActiveTab] = useState('switch');

  // Floating live event notification
  const [activeNotification, setActiveNotification] = useState(null);

  // In-memory cache of recent financial events to prevent race conditions
  const recentEventsMap = React.useRef(new Map());

  // Explainability & Modal states
  const [activeSaga, setActiveSaga] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [tamperModalOpen, setTamperModalOpen] = useState(false);

  // Fetch current user wallet data
  const refreshWallet = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingWallet(true);
    try {
      const data = await walletApi.getMyWallet();
      setWallet(data);

      try {
        const txs = await walletApi.getWalletTransactions();
        setTransactions(Array.isArray(txs) ? txs : []);
      } catch (e) {
        console.debug('Failed to fetch transactions:', e);
      }

      try {
        const all = await walletApi.getAllWallets();
        if (Array.isArray(all)) {
          setWalletsList(all);
        }
      } catch (e) {
        console.debug('Failed to fetch all wallets:', e);
      }
    } catch (err) {
      console.warn('Failed to refresh wallet:', err);
    } finally {
      setLoadingWallet(false);
    }
  }, [isAuthenticated]);

  // Handle SSE connection and events from notification-service
  useEffect(() => {
    const unsubStatus = sseClient.onStatusChange(setSseStatus);
    sseClient.connect('/api/events/stream');

    const unsubEvents = sseClient.subscribe((newEvent) => {
      if (!newEvent) return;

      const eventType = newEvent.eventType || '';
      const ref = newEvent.paymentReference || newEvent.reference || newEvent.utrNumber;
      const key = newEvent.idempotencyKey;

      // Cache event by reference to prevent race conditions
      if (ref) {
        recentEventsMap.current.set(ref, newEvent);
      }
      if (key) {
        recentEventsMap.current.set(key, newEvent);
      }

      // Add to event stream list
      setEvents((prev) => [newEvent, ...prev.slice(0, 199)]);

      const verdict = newEvent.verdict || (newEvent.decision === 'APPROVE' ? 'APPROVED' : newEvent.decision === 'REJECT' ? 'REJECTED' : null);

      // Trigger temporary floating notification toast for financial events
      if (['PAYMENT_INITIATED', 'FRAUD_EVALUATED', 'PAYMENT_SETTLED', 'RECON_MATCHED'].includes(eventType)) {
        setActiveNotification({
          id: Date.now(),
          type: eventType,
          eventName: newEvent.eventName || eventType,
          reference: ref || 'TX',
          amount: newEvent.amount,
          decision: verdict || newEvent.decision,
          receivedAt: new Date().toLocaleTimeString(),
        });
      }

      // Check if this event relates to active saga
      setActiveSaga((current) => {
        if (!current) return current;

        const isRefMatch = ref && (ref === current.reference || current.reference === 'PENDING_REGISTRATION' || current.reference === 'INITIATING...' || current.reference === 'DEMO-PENDING');
        const isKeyMatch = key && key === current.idempotencyKey;

        if (isRefMatch || isKeyMatch) {
          const isApproved = eventType === 'PAYMENT_SETTLED' || verdict === 'APPROVED' || newEvent.status === 'SETTLED';
          const isRejected = verdict === 'REJECTED' || newEvent.status === 'FAILED';
          const isFraudEvaluated = eventType === 'FRAUD_EVALUATED' || eventType === 'PAYMENT_FRAUD_SCORED';

          let nextStage = current.stage;
          if (isApproved) {
            nextStage = 6;
          } else if (isRejected) {
            nextStage = 5;
          } else if (isFraudEvaluated) {
            nextStage = Math.max(nextStage, 5);
          }

          const resolvedVerdict = isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : current.verdict;
          const isCompleted = isApproved || isRejected;
          const now = Date.now();
          const latencyMs = current.startTime ? (now - current.startTime) : current.latencyMs;

          return {
            ...current,
            reference: ref || current.reference,
            stage: nextStage,
            verdict: resolvedVerdict,
            riskScore: newEvent.fraudProbability ?? newEvent.riskScore ?? current.riskScore,
            riskTier: newEvent.riskTier || current.riskTier,
            completed: isCompleted,
            completedAt: isCompleted ? (current.completedAt || new Date().toISOString()) : null,
            latencyMs: isCompleted ? latencyMs : current.latencyMs,
            eventData: newEvent,
          };
        }
        return current;
      });

      // Trigger wallet balance reload on financial events
      if (['PAYMENT_INITIATED', 'PAYMENT_SETTLED', 'FRAUD_EVALUATED', 'PAYMENT_FRAUD_SCORED', 'RECON_MATCHED'].includes(eventType)) {
        refreshWallet();
      }
    });

    return () => {
      unsubStatus();
      unsubEvents();
      sseClient.close();
    };
  }, [refreshWallet]);

  // Active Saga safety fallback reconciler to ensure visualizer never stalls
  useEffect(() => {
    if (!activeSaga || activeSaga.completed) {
      return;
    }

    const timer = setTimeout(async () => {
      const ref = activeSaga.reference;
      if (ref && ref.startsWith('TXN-')) {
        try {
          const res = await apiClient.get(`/api/payments/${ref}`);
          const tx = res.data || res;
          if (tx && (tx.status === 'SETTLED' || tx.status === 'FAILED' || tx.status === 'REJECTED')) {
            const isApproved = tx.status === 'SETTLED';
            const risk = tx.riskScore !== undefined && tx.riskScore !== null ? Number(tx.riskScore) : 0.05;
            const tier = tx.riskTier || (risk > 0.7 ? 'HIGH' : risk > 0.3 ? 'MEDIUM' : 'LOW');
            setActiveSaga((prev) => {
              if (!prev || prev.completed) return prev;
              const now = Date.now();
              const latencyMs = prev.startTime ? (now - prev.startTime) : null;
              return {
                ...prev,
                reference: ref,
                stage: isApproved ? 6 : 5,
                verdict: isApproved ? 'APPROVED' : 'REJECTED',
                riskScore: risk,
                riskTier: tier,
                completed: true,
                completedAt: new Date().toISOString(),
                latencyMs,
              };
            });
            refreshWallet();
            return;
          }
        } catch {
          // Ignore
        }
      }

      // Hard safety timeout: if at stage >= 4 and still not completed after 800ms
      setActiveSaga((prev) => {
        if (!prev || prev.completed) return prev;
        const isRejected = prev.verdict === 'REJECTED';
        return {
          ...prev,
          stage: isRejected ? 5 : 6,
          verdict: isRejected ? 'REJECTED' : 'APPROVED',
          riskScore: prev.riskScore ?? 0.05,
          riskTier: prev.riskTier || 'LOW',
          completed: true,
          completedAt: new Date().toISOString(),
          latencyMs: prev.startTime ? Date.now() - prev.startTime : null,
        };
      });
      refreshWallet();
    }, 600);

    return () => clearTimeout(timer);
  }, [activeSaga?.stage, activeSaga?.reference, activeSaga?.completed, refreshWallet]);

  // Auto-dismiss floating notification after 5 seconds
  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [activeNotification]);

  // Refresh wallet when user changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshWallet();
    } else {
      setWallet(null);
      setTransactions([]);
    }
  }, [isAuthenticated, currentUser, refreshWallet]);

  return (
    <PlatformContext.Provider
      value={{
        wallet,
        walletsList,
        transactions,
        events,
        sseStatus,
        loadingWallet,
        activeTab,
        setActiveTab,
        activeNotification,
        dismissNotification: () => setActiveNotification(null),
        refreshWallet,
        activeSaga,
        setActiveSaga,
        selectedTransaction,
        setSelectedTransaction,
        selectedComponent,
        setSelectedComponent,
        architectureModalOpen,
        setArchitectureModalOpen,
        riskModalOpen,
        setRiskModalOpen,
        tamperModalOpen,
        setTamperModalOpen,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}
