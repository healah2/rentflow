import React, { useState, useEffect } from 'react';
import { User, Invoice, Receipt, Payment, AgentProfile, LandlordProfile } from './types';
import { db } from './services/db';
import { Header } from './components/common/Header';
import { MpesaModal } from './components/common/MpesaModal';
import { ReceiptModal } from './components/common/ReceiptModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { DjangoCodeModal } from './components/shared/DjangoCodeModal';

import { AdminDashboard } from './components/admin/AdminDashboard';
import { AgentDashboard } from './components/agent/AgentDashboard';
import { AgentPaywall } from './components/agent/AgentPaywall';
import { LandlordDashboard } from './components/landlord/LandlordDashboard';
import { LandlordPaywall } from './components/landlord/LandlordPaywall';
import { TenantDashboard } from './components/tenant/TenantDashboard';
import { LoginForm } from './components/auth/LoginForm';
import { Building2, Code2, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => db.getCurrentUser());
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDjangoCodeOpen, setIsDjangoCodeOpen] = useState(false);
  
  // Checkout & Receipt Modals
  const [activeMpesaInvoice, setActiveMpesaInvoice] = useState<Invoice | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    const u = db.getCurrentUser();
    if (u) {
      setCurrentUser(u);
    }
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleResetData = () => {
    if (confirm('Reset demo database to original seed data? This will restore all default properties, invoices, and users.')) {
      db.resetToSeed();
      handleRefresh();
    }
  };

  const handlePaymentSuccess = (receipt: Receipt) => {
    setActiveReceipt(receipt);
    handleRefresh();
  };

  const handleManualSubmitted = (payment: Payment) => {
    alert(`M-Pesa transaction reference ${payment.mpesaReference} submitted successfully. Your payment is queued for verification.`);
    handleRefresh();
  };

  // If no user is logged in, show the Universal Login Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                RentFlow
              </span>
              <span className="hidden sm:inline-block text-xs font-mono text-slate-400 border-l border-slate-200 pl-2.5">
                Universal Multi-Tenant Login
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <button 
                onClick={() => setIsDjangoCodeOpen(true)}
                className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 transition-colors"
                title="Inspect Django DRF Backend Code"
              >
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Django Backend Spec</span>
              </button>

              <button 
                onClick={handleResetData}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors"
                title="Reset database to initial seed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Demo DB</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center">
          <LoginForm
            onLoginSuccess={(user) => {
              db.setCurrentUser(user.id);
              setCurrentUser(user);
              setRefreshKey(prev => prev + 1);
            }}
          />
        </main>

        <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">RentFlow</span>
              <span>·</span>
              <span>Kenya Multi-Tenant SaaS Rental & Property Management System</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span>Currency: KES</span>
              <span>·</span>
              <span>Credentials verified by Django</span>
            </div>
          </div>
        </footer>

        <DjangoCodeModal 
          isOpen={isDjangoCodeOpen} 
          onClose={() => setIsDjangoCodeOpen(false)} 
        />
      </div>
    );
  }

  const notifications = db.getIsolatedNotifications(currentUser);

  // Helper profiles
  const agentProfile: AgentProfile | undefined = currentUser.role === 'AGENT' ? db.getAgentByUserId(currentUser.id) : undefined;
  const landlordProfile: LandlordProfile | undefined = currentUser.role === 'LANDLORD' ? db.getLandlordByUserId(currentUser.id) : undefined;

  // Find relevant active unpaid invoice for paywalls
  const agentSubInvoice = currentUser.role === 'AGENT' 
    ? db.getIsolatedInvoices(currentUser, 'PLATFORM_SUBSCRIPTION').find(i => i.status !== 'paid')
    : undefined;

  const landlordFeeInvoice = currentUser.role === 'LANDLORD'
    ? db.getIsolatedInvoices(currentUser, 'AGENT_MANAGEMENT_FEE').find(i => i.status !== 'paid')
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 3-Zone Top Bar Header */}
      <Header
        currentUser={currentUser}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenDjangoCode={() => setIsDjangoCodeOpen(true)}
        onResetData={handleResetData}
        onLogout={handleLogout}
        unreadNotifsCount={notifications.length}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 pb-16">
        {/* Role 1: SYSTEM ADMINISTRATOR */}
        {currentUser.role === 'ADMIN' && (
          <AdminDashboard
            key={refreshKey}
            currentUser={currentUser}
            onViewReceipt={(r) => setActiveReceipt(r)}
            onRefresh={handleRefresh}
          />
        )}

        {/* Role 2: MANAGING AGENT */}
        {currentUser.role === 'AGENT' && agentProfile && (
          <>
            {/* If subscription is expired or unpaid, enforce strict Paywall */}
            {agentProfile.subscriptionStatus === 'expired' || agentProfile.subscriptionStatus === 'pending_payment' ? (
              <AgentPaywall
                key={refreshKey}
                currentUser={currentUser}
                agentProfile={agentProfile}
                subscriptionInvoice={agentSubInvoice}
                onPayMpesa={(inv) => setActiveMpesaInvoice(inv)}
              />
            ) : (
              <AgentDashboard
                key={refreshKey}
                currentUser={currentUser}
                agentProfile={agentProfile}
                onViewReceipt={(r) => setActiveReceipt(r)}
                onRefresh={handleRefresh}
              />
            )}
          </>
        )}

        {/* Role 3: LANDLORD */}
        {currentUser.role === 'LANDLORD' && landlordProfile && (
          <>
            {/* If management fee is overdue, enforce strict Landlord Paywall */}
            {landlordProfile.feeStatus === 'overdue' ? (
              <LandlordPaywall
                key={refreshKey}
                currentUser={currentUser}
                landlordProfile={landlordProfile}
                managementFeeInvoice={landlordFeeInvoice}
                onPayMpesa={(inv) => setActiveMpesaInvoice(inv)}
              />
            ) : (
              <LandlordDashboard
                key={refreshKey}
                currentUser={currentUser}
                landlordProfile={landlordProfile}
                onPayMpesa={(inv) => setActiveMpesaInvoice(inv)}
                onViewReceipt={(r) => setActiveReceipt(r)}
                onRefresh={handleRefresh}
              />
            )}
          </>
        )}

        {/* Role 4: TENANT */}
        {currentUser.role === 'TENANT' && (
          <TenantDashboard
            key={refreshKey}
            currentUser={currentUser}
            onPayMpesa={(inv) => setActiveMpesaInvoice(inv)}
            onViewReceipt={(r) => setActiveReceipt(r)}
            onRefresh={handleRefresh}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">RentFlow</span>
            <span>·</span>
            <span>Kenya Multi-Tenant SaaS Rental & Property Management System</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Currency: KES</span>
            <span>·</span>
            <span>M-Pesa STK & Manual Clearances</span>
            <span>·</span>
            <span>Version: 1.0.0</span>
          </div>
        </div>
      </footer>

      {/* Interactive Global Modals */}
      <MpesaModal
        isOpen={!!activeMpesaInvoice}
        onClose={() => setActiveMpesaInvoice(null)}
        invoice={activeMpesaInvoice}
        onPaymentSuccess={handlePaymentSuccess}
        onManualSubmitted={handleManualSubmitted}
      />

      <ReceiptModal
        isOpen={!!activeReceipt}
        onClose={() => setActiveReceipt(null)}
        receipt={activeReceipt}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
      />

      <DjangoCodeModal
        isOpen={isDjangoCodeOpen}
        onClose={() => setIsDjangoCodeOpen(false)}
      />
    </div>
  );
}
