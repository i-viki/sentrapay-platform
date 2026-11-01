import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PlatformProvider } from './context/PlatformContext';

import { Header } from './components/layout/Header';
import { SystemStatusBar } from './components/layout/SystemStatusBar';
import { Navigation } from './components/layout/Navigation';

import { SagaPipelineVisualizer } from './components/saga/SagaPipelineVisualizer';
import { ScenarioRunner } from './components/saga/ScenarioRunner';
import { TransactionFlowModal } from './components/saga/TransactionFlowModal';

import { TransferForm } from './components/transfer/TransferForm';
import { TransactionsList } from './components/transfer/TransactionsList';

import { AiDecisionExplainer } from './components/fraud/AiDecisionExplainer';
import { RiskSimulatorModal } from './components/fraud/RiskSimulatorModal';

import { TrialBalanceSummary } from './components/ledger/TrialBalanceSummary';
import { DoubleEntryTAccounts } from './components/ledger/DoubleEntryTAccounts';
import { JournalEntriesTable } from './components/ledger/JournalEntriesTable';

import { BankStatementMatcher } from './components/reconciliation/BankStatementMatcher';
import { AuditChainExplorer } from './components/audit/AuditChainExplorer';
import { TamperSimulationModal } from './components/audit/TamperSimulationModal';

import { LiveEventStreamConsole } from './components/events/LiveEventStreamConsole';
import { ArchitectureBlueprintModal } from './components/architecture/ArchitectureBlueprintModal';
import { ComponentDeepDiveDrawer } from './components/architecture/ComponentDeepDiveDrawer';
import { NotificationToast } from './components/common/NotificationToast';
import { usePlatform } from './context/PlatformContext';

function AppContent() {
  const { activeTab, setActiveTab } = usePlatform();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header & Sticky Status */}
      <Header />
      <SystemStatusBar />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1720px] 2xl:max-w-[1880px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 space-y-6">
        {activeTab === 'switch' && (
          <div className="space-y-6">
            <SagaPipelineVisualizer />
            
            {/* Architectural Scenarios Suite takes full width to maximize room for all 4 test cards */}
            <ScenarioRunner />

            {/* Split layout: Initiate Transfer Form alongside Real-Time Ledger Transactions */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-5 2xl:col-span-4">
                <TransferForm />
              </div>
              <div className="xl:col-span-7 2xl:col-span-8">
                <TransactionsList />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fraud' && (
          <div className="space-y-6">
            <AiDecisionExplainer />
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <TrialBalanceSummary />
            <DoubleEntryTAccounts />
            <JournalEntriesTable />
          </div>
        )}

        {activeTab === 'reconciliation' && (
          <div className="space-y-6">
            <BankStatementMatcher />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-6">
            <AuditChainExplorer />
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            <LiveEventStreamConsole />
          </div>
        )}
      </main>

      {/* System Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 mt-auto">
        <div className="max-w-[1720px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div>
            <span>SentraPay Platform v1.0.0-PROD</span>
            <span className="mx-2 text-slate-600">|</span>
            <span>Apache Kafka 3.7.0 KRaft + Spring Boot 3.3 + Python 3.11 gRPC</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">PostgreSQL 16 ACID</span>
            <span className="text-slate-400">Redis 7.2 In-Memory</span>
            <span className="text-emerald-400 font-semibold">Zero-Sum Ledger Verified</span>
          </div>
        </div>
      </footer>

      {/* Global Modals & Drawers */}
      <ArchitectureBlueprintModal />
      <ComponentDeepDiveDrawer />
      <TransactionFlowModal />
      <RiskSimulatorModal />
      <TamperSimulationModal />

      {/* Real-Time Live Notification Toast Stack */}
      <NotificationToast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PlatformProvider>
        <AppContent />
      </PlatformProvider>
    </AuthProvider>
  );
}

