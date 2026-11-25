import React, { useState } from 'react';
import { User, AgentProfile, Payment, Invoice, Receipt } from '../../types';
import { db } from '../../services/db';
import { 
  ShieldCheck, 
  DollarSign, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Smartphone, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Layers,
  ArrowUpRight,
  Settings,
  FileBarChart,
  Lock,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  Database,
  UserPlus
} from 'lucide-react';
import { AddAgentForm } from './AddAgentForm';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface AdminDashboardProps {
  currentUser: User;
  onViewReceipt: (receipt: Receipt) => void;
  onRefresh: () => void;
}

type AdminNavView = 
  | 'overview'
  | 'add_agent'
  | 'subscriptions'
  | 'verifications'
  | 'dummy_users'
  | 'dummy_audit'
  | 'dummy_reports'
  | 'dummy_gateways'
  | 'dummy_settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onViewReceipt,
  onRefresh
}) => {
  const [activeView, setActiveView] = useState<AdminNavView>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const metrics = db.getAdminMetrics();
  const agents = db.getAgents();
  const payments = db.getPayments().filter(p => p.pipelineType === 'PLATFORM_SUBSCRIPTION');
  const receipts = db.getReceipts().filter(r => r.pipelineType === 'PLATFORM_SUBSCRIPTION');

  const pendingPayments = payments.filter(p => p.status === 'pending_verification');

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (paymentId: string) => {
    try {
      await db.verifyManualPayment(paymentId, true, `${currentUser.fullName} (System Administrator)`);
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not verify this payment.');
    }
  };

  const handleDecline = async (paymentId: string) => {
    if (!rejectReason) {
      alert('Please specify a reason for declining.');
      return;
    }
    try {
      await db.verifyManualPayment(paymentId, false, `${currentUser.fullName} (System Administrator)`, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not reject this payment.');
    }
  };

  const handleExtendAgent = async (agent: AgentProfile) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    try {
      await db.updateAgentSubscription(agent.id, 'active', futureDate.toISOString());
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not extend the agent subscription.');
    }
  };

  const handleSuspendAgent = async (agent: AgentProfile) => {
    try {
      await db.updateAgentSubscription(agent.id, 'expired');
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not suspend the agent subscription.');
    }
  };

  const revenueChartData = [
    { month: 'Jun', revenue: 18500 },
    { month: 'Jul', revenue: 23000 },
    { month: 'Aug', revenue: 27500 },
    { month: 'Sep', revenue: 32000 },
    { month: 'Oct', revenue: 37500 },
    { month: 'Nov (Proj)', revenue: 45000 },
  ];

  // Admin Sidebar Nav Items (Active + Dummy Nav Items as requested)
  const primaryNavItems = [
    { id: 'overview', label: 'Platform Overview', icon: Layers },
    { id: 'add_agent', label: 'Add Agent', icon: UserPlus },
    { id: 'subscriptions', label: `Agent Subscriptions (${agents.length})`, icon: Users },
    { id: 'verifications', label: `M-Pesa Verification Queue (${pendingPayments.length})`, icon: Smartphone, badge: pendingPayments.length > 0 ? pendingPayments.length : undefined },
  ];

  const dummyNavItems = [
    { id: 'dummy_users', label: 'User Directory (Dummy)', icon: Users, note: 'Dummy Nav Item' },
    { id: 'dummy_audit', label: 'Security & Audit (Dummy)', icon: Lock, note: 'Dummy Nav Item' },
    { id: 'dummy_reports', label: 'System Reports (Dummy)', icon: FileBarChart, note: 'Dummy Nav Item' },
    { id: 'dummy_gateways', label: 'Gateways Config (Dummy)', icon: CreditCard, note: 'Dummy Nav Item' },
    { id: 'dummy_settings', label: 'Platform Settings (Dummy)', icon: Settings, note: 'Dummy Nav Item' },
  ];

  const handleSelectNav = (view: AdminNavView) => {
    setActiveView(view);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex-1 flex min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ================================================================ */}
      {/* ADMIN SIDEBAR */}
      {/* ================================================================ */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 
        flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-purple-700 tracking-wider">
                PLATFORM SUPERUSER
              </div>
              <div className="text-sm font-bold text-slate-900">
                System Administration
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                RentFlow SaaS Control
              </div>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Functional Nav Items */}
          <div className="space-y-1">
            <div className="px-2 pb-1.5 text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Platform Controls
            </div>
            {primaryNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id as AdminNavView)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Requested Dummy Nav Items */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="px-2 pb-1.5 text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Placeholder Modules (Dummy Items)
            </div>
            {dummyNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id as AdminNavView)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                    Dummy
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500">
          <div className="font-mono">Global Currency: KES</div>
          <div className="text-[10px] text-purple-700 mt-0.5 font-semibold">
            All pipelines isolated
          </div>
        </div>
      </aside>

      {/* ================================================================ */}
      {/* ADMIN CONTENT VIEW */}
      {/* ================================================================ */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="md:hidden flex items-center justify-between pb-3 border-b border-slate-200">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <Menu className="w-4 h-4" />
            <span>Admin Menu</span>
          </button>
          <span className="text-xs font-mono text-purple-700 font-semibold">
            ADMIN CONSOLE
          </span>
        </div>

        {/* VIEW: OVERVIEW */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-purple-700 uppercase tracking-wider font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Platform Owner Console · Pipeline A</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                  System Administrator Operations
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Global SaaS revenue, managing agent licensing, and Safaricom M-Pesa manual clearance desk
                </p>
              </div>
            </div>

            {/* 4 Primary Platform KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>SaaS Subscription Revenue</span>
                  <span className="text-purple-600 bg-purple-50 p-1.5 rounded-md">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
                  KES {metrics.totalSaaSRevenue.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Pure Platform SaaS ARR (No Rent Mixed)</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Subscribed Agencies</span>
                  <span className="text-emerald-600 bg-emerald-50 p-1.5 rounded-md">
                    <Users className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
                  {metrics.activeAgents} <span className="text-xs font-normal text-slate-400">/ {metrics.totalAgents}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {metrics.expiredAgents} agency expired/pending
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Pending Verifications</span>
                  <span className="text-amber-600 bg-amber-50 p-1.5 rounded-md">
                    <Clock className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
                  {pendingPayments.length}
                </div>
                <div className="text-[11px] text-amber-700 font-medium mt-1">
                  Manual submissions awaiting clearance
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Subscription Retention</span>
                  <span className="text-indigo-600 bg-indigo-50 p-1.5 rounded-md">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
                  94.2%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Zero auto-deletion policy
                </div>
              </div>
            </div>

            {/* Split: Verification Queue & Growth Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Agent M-Pesa Verification Queue</span>
                  </h3>
                  <button
                    onClick={() => setActiveView('verifications')}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-800"
                  >
                    View Queue ({pendingPayments.length}) →
                  </button>
                </div>

                {pendingPayments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No pending agent subscription submissions.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pendingPayments.slice(0, 3).map(pay => (
                      <div key={pay.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold text-xs text-slate-900">{pay.payerName}</div>
                          <div className="text-[11px] font-mono text-emerald-700 font-bold">REF: {pay.mpesaReference}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs text-slate-900">KES {pay.amount.toLocaleString()}</span>
                          <button
                            onClick={() => handleApprove(pay.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chart */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    SaaS ARR Growth
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Monthly recurring licensing revenue (KES)
                  </p>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                        <Tooltip formatter={(val: any) => [`KES ${Number(val).toLocaleString()}`, 'SaaS ARR']} />
                        <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: ADD AGENT */}
        {activeView === 'add_agent' && (
          <div className="space-y-6">
            <AddAgentForm
              currentUser={currentUser}
              onSuccess={(newAgentUser) => {
                onRefresh();
                setActiveView('subscriptions');
              }}
              onCancel={() => setActiveView('overview')}
            />
          </div>
        )}

        {/* VIEW: SUBSCRIPTIONS */}
        {activeView === 'subscriptions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Registered Managing Agencies & Licensing</h2>
                <p className="text-xs text-slate-500">Track agency subscription tiers, monthly platform ARR fees, and billing statuses</p>
              </div>
              <button
                onClick={() => setActiveView('add_agent')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Agent</span>
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Agency Name</th>
                    <th className="py-3 px-4 font-semibold">Tier & Fee</th>
                    <th className="py-3 px-4 font-semibold">Paybill</th>
                    <th className="py-3 px-4 font-semibold">Expiry Date</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {agents.map(agent => {
                    const isExpired = agent.subscriptionStatus === 'expired';
                    return (
                      <tr key={agent.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{agent.agencyName}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">{agent.subscriptionPlan}</span>
                          <div className="font-mono text-slate-500">KES {agent.monthlySubscriptionFee.toLocaleString()}/mo</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{agent.paybillNumber}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{new Date(agent.subscriptionExpiry).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            isExpired ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {agent.subscriptionStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          {isExpired ? (
                            <button
                              onClick={() => handleExtendAgent(agent)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
                            >
                              Activate (+30d)
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspendAgent(agent)}
                              className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded"
                            >
                              Suspend (Test Paywall)
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: VERIFICATIONS */}
        {activeView === 'verifications' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">M-Pesa Subscription Verification Desk</h2>
            <div className="space-y-3">
              {pendingPayments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                  No pending manual submissions from agents.
                </div>
              ) : (
                pendingPayments.map(pay => (
                  <div key={pay.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{pay.payerName}</div>
                      <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5">REF: {pay.mpesaReference} · Amount: KES {pay.amount.toLocaleString()}</div>
                      <div className="text-xs text-slate-500 mt-1">Phone: {pay.phoneNumber} · Invoice: {pay.invoiceNumber}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecline(pay.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleApprove(pay.id)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Verify & Activate (+30d)</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW: DUMMY NAV ITEM VIEWS (As requested: "meanwhile, we can put there dummy nav items because we don't have the nav items that we need to use") */}
        {activeView.startsWith('dummy_') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-8 max-w-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 capitalize">
                {activeView.replace('dummy_', '').replace('_', ' ')} Module (Dummy Nav Item)
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                This sidebar item is configured as a placeholder in accordance with your specifications while future admin features are finalized.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 inline-block">
              Route: /admin/{activeView.replace('dummy_', '')}/ · Role: ADMIN
            </div>
            <div className="pt-2">
              <button
                onClick={() => setActiveView('overview')}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Return to Platform Overview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
