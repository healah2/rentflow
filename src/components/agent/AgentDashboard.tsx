import React, { useState } from 'react';
import { 
  User, 
  AgentProfile, 
  Property, 
  Unit, 
  Invoice, 
  Payment, 
  Receipt, 
  MaintenanceComplaint, 
  LandlordProfile 
} from '../../types';
import { db } from '../../services/db';
import { AddLandlordForm } from './AddLandlordForm';
import { AddApartmentForm } from './AddApartmentForm';
import { AddTenantForm } from './AddTenantForm';
import { SendInvoiceForm } from './SendInvoiceForm';

import { 
  Building2, 
  Home, 
  Users, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus, 
  Wrench, 
  Smartphone, 
  Send, 
  Eye, 
  Filter,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  UserPlus,
  Sliders,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface AgentDashboardProps {
  currentUser: User;
  agentProfile: AgentProfile;
  onViewReceipt: (receipt: Receipt) => void;
  onRefresh: () => void;
}

type AgentNavView = 
  | 'add_landlord'
  | 'add_apartments'
  | 'add_tenants'
  | 'send_invoice'
  | 'overview'
  | 'apartments_list'
  | 'landlords_list'
  | 'tenants_list'
  | 'invoices_list'
  | 'verification_desk'
  | 'maintenance_tickets';

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  currentUser,
  agentProfile,
  onViewReceipt,
  onRefresh
}) => {
  // Default to overview, or can switch to any of the 4 requested forms
  const [activeView, setActiveView] = useState<AgentNavView>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const metrics = db.getAgentMetrics(currentUser.id);
  const properties = db.getIsolatedProperties(currentUser);
  const units = db.getIsolatedUnits(currentUser);
  const landlords = db.getLandlords().filter(l => l.agentId === agentProfile.id);
  const invoices = db.getIsolatedInvoices(currentUser);
  const payments = db.getIsolatedPayments(currentUser);
  const receipts = db.getIsolatedReceipts(currentUser);
  const complaints = db.getIsolatedComplaints(currentUser);
  const users = db.getUsers();

  // Verification queue for Agent (Pipelines B and C)
  const pendingPayments = payments.filter(
    p => p.payeeId === currentUser.id && p.status === 'pending_verification'
  );

  // Work order update state
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [ticketNotes, setTicketNotes] = useState('');
  const [ticketCost, setTicketCost] = useState(2500);

  // Verification actions
  const handleApprovePayment = async (paymentId: string) => {
    try {
      await db.verifyManualPayment(paymentId, true, `${currentUser.fullName} (Managing Agent)`);
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not verify this payment.');
    }
  };

  const handleDeclinePayment = async (paymentId: string) => {
    const reason = prompt('Enter reason for rejection (e.g. Reference not found on Safaricom statement):');
    if (reason) {
      try {
        await db.verifyManualPayment(paymentId, false, currentUser.fullName, reason);
        onRefresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Could not reject this payment.');
      }
    }
  };

  // Work order resolution
  const handleResolveTicket = async (ticketId: string) => {
    try {
      await db.updateComplaintStatus(ticketId, 'resolved', ticketNotes || 'Repaired and verified by property maintenance officer.', ticketCost);
      setUpdatingTicketId(null);
      setTicketNotes('');
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not update the maintenance request.');
    }
  };

  const occupiedUnitsCount = units.filter(u => u.status === 'occupied').length;
  const occupancyRate = units.length > 0 ? Math.round((occupiedUnitsCount / units.length) * 100) : 0;

  // Sidebar navigation structure
  const actionNavItems = [
    { id: 'add_landlord', label: '1. Add Landlord', icon: UserPlus, description: 'Register property owner' },
    { id: 'add_apartments', label: '2. Add Apartments', icon: Building2, description: 'Create apartment & rooms' },
    { id: 'add_tenants', label: '3. Add Tenants', icon: Users, description: 'Allocate tenant to room' },
    { id: 'send_invoice', label: '4. Send Invoice', icon: Send, description: 'Bill tenant or landlord' },
  ];

  const managementNavItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: Layers },
    { id: 'apartments_list', label: `Apartments & Rooms (${units.length})`, icon: Home },
    { id: 'landlords_list', label: `Landlords Directory (${landlords.length})`, icon: Users },
    { id: 'invoices_list', label: `Invoices & Billing (${invoices.length})`, icon: FileText },
    { id: 'verification_desk', label: `M-Pesa Verification (${pendingPayments.length})`, icon: Smartphone, badge: pendingPayments.length > 0 ? pendingPayments.length : undefined },
    { id: 'maintenance_tickets', label: `Maintenance Orders (${complaints.length})`, icon: Wrench },
  ];

  const handleSelectNav = (view: AgentNavView) => {
    setActiveView(view);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex-1 flex min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ================================================================ */}
      {/* AGENT SIDEBAR (256px Fixed / Responsive) */}
      {/* ================================================================ */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 
        flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Agency Brand Sub-block in Sidebar */}
          <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono font-bold text-emerald-700 tracking-wider truncate">
                MANAGING AGENT
              </div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {agentProfile.agencyName}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Paybill: {agentProfile.paybillNumber}
              </div>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Group 1: Priority Actions (The 4 Requested Nav Items) */}
          <div className="space-y-1">
            <div className="px-2 pb-1.5 text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Agent Action Forms
            </div>
            {actionNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id as AgentNavView)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{item.label}</div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Group 2: Portfolio & Management Views */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="px-2 pb-1.5 text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Management Views
            </div>
            {managementNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id as AgentNavView)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-emerald-500 text-slate-950' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500">
          <div className="flex items-center justify-between font-mono">
            <span>SaaS Tier:</span>
            <span className="font-bold text-slate-800">{agentProfile.subscriptionPlan}</span>
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5">
            Subscription Active (KES 9,500/mo)
          </div>
        </div>
      </aside>

      {/* ================================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ================================================================ */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Mobile Header Toggle */}
        <div className="md:hidden flex items-center justify-between pb-3 border-b border-slate-200">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <Menu className="w-4 h-4" />
            <span>Agent Menu</span>
          </button>
          <span className="text-xs font-mono text-slate-500 font-semibold">
            {activeView.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: ADD LANDLORD FORM (REQUESTED ITEM 1) */}
        {/* ============================================================== */}
        {activeView === 'add_landlord' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-emerald-700 uppercase font-bold">Side Nav Item 1</span>
                <h1 className="text-xl font-bold text-slate-900">Add New Landlord</h1>
              </div>
              <button
                onClick={() => setActiveView('overview')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Back to Overview
              </button>
            </div>
            <AddLandlordForm
              currentUser={currentUser}
              agentProfile={agentProfile}
              onSuccess={() => {
                onRefresh();
                setActiveView('landlords_list');
              }}
              onCancel={() => setActiveView('overview')}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: ADD APARTMENTS FORM (REQUESTED ITEM 2) */}
        {/* ============================================================== */}
        {activeView === 'add_apartments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-emerald-700 uppercase font-bold">Side Nav Item 2</span>
                <h1 className="text-xl font-bold text-slate-900">Add New Apartment & Rooms</h1>
              </div>
              <button
                onClick={() => setActiveView('overview')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Back to Overview
              </button>
            </div>
            <AddApartmentForm
              currentUser={currentUser}
              agentProfile={agentProfile}
              onSuccess={() => {
                onRefresh();
                setActiveView('apartments_list');
              }}
              onCancel={() => setActiveView('overview')}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: ADD TENANTS FORM (REQUESTED ITEM 3) */}
        {/* ============================================================== */}
        {activeView === 'add_tenants' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-emerald-700 uppercase font-bold">Side Nav Item 3</span>
                <h1 className="text-xl font-bold text-slate-900">Add Tenant to Room</h1>
              </div>
              <button
                onClick={() => setActiveView('overview')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Back to Overview
              </button>
            </div>
            <AddTenantForm
              currentUser={currentUser}
              agentProfile={agentProfile}
              onSuccess={() => {
                onRefresh();
                setActiveView('apartments_list');
              }}
              onCancel={() => setActiveView('overview')}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: SEND INVOICE FORM (REQUESTED ITEM 4) */}
        {/* ============================================================== */}
        {activeView === 'send_invoice' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-emerald-700 uppercase font-bold">Side Nav Item 4</span>
                <h1 className="text-xl font-bold text-slate-900">Send Invoice (Tenant or Landlord)</h1>
              </div>
              <button
                onClick={() => setActiveView('overview')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Back to Overview
              </button>
            </div>
            <SendInvoiceForm
              currentUser={currentUser}
              agentProfile={agentProfile}
              onSuccess={() => {
                onRefresh();
                setActiveView('invoices_list');
              }}
              onCancel={() => setActiveView('overview')}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 5: DASHBOARD OVERVIEW */}
        {/* ============================================================== */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Top Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 uppercase tracking-wider font-semibold">
                  <Building2 className="w-4 h-4" />
                  <span>Operations Dashboard</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                  Portfolio Operations & Clearing
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Administer properties, issue itemized bills, and track landlord management fees
                </p>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveView('add_landlord')}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Add Landlord</span>
                </button>
                <button
                  onClick={() => setActiveView('add_apartments')}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Add Apartment</span>
                </button>
                <button
                  onClick={() => setActiveView('send_invoice')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Invoice</span>
                </button>
              </div>
            </div>

            {/* 4 Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Tenant Rent Collected</span>
                  <span className="text-emerald-600 bg-emerald-50 p-1.5 rounded-md">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
                  KES {metrics.rentCollected.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  KES {metrics.rentOutstanding.toLocaleString()} currently outstanding
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Management Fees Earned</span>
                  <span className="text-indigo-600 bg-indigo-50 p-1.5 rounded-md">
                    <Building2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
                  KES {metrics.mgtFeesEarned.toLocaleString()}
                </div>
                <div className="text-[11px] text-indigo-700 font-medium mt-1">
                  Pipeline B (Landlord fee stream)
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Portfolio Occupancy</span>
                  <span className="text-blue-600 bg-blue-50 p-1.5 rounded-md">
                    <Home className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
                  {occupancyRate}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {occupiedUnitsCount} occupied / {units.length} total rooms
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
                  Manual M-Pesa codes to clear
                </div>
              </div>
            </div>

            {/* Split: Managed Properties Showcase & Quick Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">
                    Active Managed Apartments
                  </h3>
                  <button
                    onClick={() => setActiveView('apartments_list')}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    View All {units.length} Rooms →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {properties.map(prop => (
                    <div key={prop.id} className="rounded-lg border border-slate-200 overflow-hidden group hover:border-slate-300 transition-all">
                      <div className="h-32 overflow-hidden relative">
                        <img 
                          src={prop.imageUrl} 
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-2 left-2 text-[10px] font-mono font-semibold bg-slate-900/80 text-white px-2 py-0.5 rounded">
                          {prop.neighborhood}, Nairobi
                        </span>
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">{prop.title}</h4>
                        <p className="text-xs text-slate-500">{prop.estateOrStreet}</p>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-600">{prop.occupiedUnits} / {prop.totalUnits} Rooms Occupied</span>
                          <span className="text-emerald-700 font-bold">{Math.round((prop.occupiedUnits/prop.totalUnits)*100)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paybill Card */}
              <div className="bg-slate-900 text-white rounded-xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase mb-2">
                    <Smartphone className="w-4 h-4" />
                    <span>Agency Safaricom Gateway</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">
                    Apex Direct M-Pesa
                  </h4>
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                    Direct Lipa na M-Pesa clearing into your agency account. Automatic SMS receipts dispatched instantly.
                  </p>

                  <div className="space-y-2 font-mono text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 flex justify-between">
                      <span className="text-slate-400">Business Paybill</span>
                      <span className="font-bold text-white">{agentProfile.paybillNumber}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 flex justify-between">
                      <span className="text-slate-400">Account Prefix</span>
                      <span className="font-bold text-emerald-400">{agentProfile.accountNumberPrefix}-{"[ROOM]"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                  <button
                    onClick={() => setActiveView('send_invoice')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Invoices Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 6: APARTMENTS & ROOMS LIST */}
        {/* ============================================================== */}
        {activeView === 'apartments_list' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Apartments & Room Inventory</h2>
                <p className="text-xs text-slate-500">All registered rental rooms across your managed properties</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('add_apartments')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Apartment</span>
                </button>
                <button
                  onClick={() => setActiveView('add_tenants')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Tenant</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Room / Unit</th>
                      <th className="py-3 px-4 font-semibold">Apartment Name</th>
                      <th className="py-3 px-4 font-semibold">Type</th>
                      <th className="py-3 px-4 font-semibold">Base Rent</th>
                      <th className="py-3 px-4 font-semibold">Water / Trash</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {units.map(unit => {
                      const prop = properties.find(p => p.id === unit.propertyId);
                      return (
                        <tr key={unit.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{unit.unitNumber}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{prop ? prop.title : 'N/A'}</td>
                          <td className="py-3 px-4 text-slate-600">{unit.unitType}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                            KES {unit.baseRent.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            KES {(unit.waterFixedCharge || 0) + (unit.trashCharge || 0)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                              unit.status === 'occupied' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {unit.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {unit.status === 'vacant' ? (
                              <button
                                onClick={() => setActiveView('add_tenants')}
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
                              >
                                Allocate Tenant
                              </button>
                            ) : (
                              <button
                                onClick={() => setActiveView('send_invoice')}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                              >
                                Send Bill
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
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 7: LANDLORDS LIST */}
        {/* ============================================================== */}
        {activeView === 'landlords_list' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Landlords Directory</h2>
                <p className="text-xs text-slate-500">Property owners associated with {agentProfile.agencyName}</p>
              </div>
              <button
                onClick={() => setActiveView('add_landlord')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Landlord</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {landlords.map(landlord => {
                const lUser = users.find(u => u.id === landlord.userId);
                const isOverdue = landlord.feeStatus === 'overdue';
                const ownedProps = properties.filter(p => p.landlordId === landlord.id);

                return (
                  <div key={landlord.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{lUser?.fullName || 'Landlord'}</h4>
                        <p className="text-xs text-slate-500 font-mono">{lUser?.phoneNumber || landlord.mpesaPhone}</p>
                        <p className="text-xs text-slate-500">{lUser?.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                        isOverdue ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Fee: {landlord.feeStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block uppercase">Monthly Fee</span>
                        <span className="font-bold text-slate-900">KES {landlord.managementFeeAmount.toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block uppercase">Apartments Owned</span>
                        <span className="font-bold text-slate-900">{ownedProps.length} Properties</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">
                        Bank: {landlord.bankName}
                      </span>
                      <button
                        onClick={() => setActiveView('send_invoice')}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                      >
                        Send Fee Invoice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 8: INVOICES & STATEMENTS */}
        {/* ============================================================== */}
        {activeView === 'invoices_list' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Invoices & Billing Statements</h2>
                <p className="text-xs text-slate-500">Pipeline B (Landlord management fees) & Pipeline C (Tenant bills)</p>
              </div>
              <button
                onClick={() => setActiveView('send_invoice')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Send Invoice</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Ref</th>
                      <th className="py-3 px-4 font-semibold">Pipeline</th>
                      <th className="py-3 px-4 font-semibold">Recipient</th>
                      <th className="py-3 px-4 font-semibold">Period</th>
                      <th className="py-3 px-4 font-semibold">Amount (KES)</th>
                      <th className="py-3 px-4 font-semibold">Due Date</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoices.map(inv => {
                      const relatedReceipt = receipts.find(r => r.invoiceId === inv.id);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              inv.pipelineType === 'AGENT_MANAGEMENT_FEE' 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                                : inv.pipelineType === 'TENANT_RENT_UTILITY'
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                              {inv.pipelineType === 'AGENT_MANAGEMENT_FEE' ? 'MGT FEE' : inv.pipelineType === 'TENANT_RENT_UTILITY' ? 'TENANT' : 'SAAS'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">{inv.payerName}</td>
                          <td className="py-3 px-4 text-slate-600">{inv.billingPeriod}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                            KES {inv.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{inv.dueDate}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                              inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {relatedReceipt ? (
                              <button
                                onClick={() => onViewReceipt(relatedReceipt)}
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Receipt</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Unpaid</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 9: M-PESA VERIFICATION DESK */}
        {/* ============================================================== */}
        {activeView === 'verification_desk' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">M-Pesa Verification Queue</h2>
                <p className="text-xs text-slate-500">Review manual transaction references submitted by tenants & landlords</p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                {pendingPayments.length} Pending Actions
              </span>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                No pending manual submissions from tenants or landlords. All payments are verified.
              </div>
            ) : (
              <div className="space-y-3.5">
                {pendingPayments.map(pay => (
                  <div key={pay.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{pay.payerName}</span>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          M-PESA: {pay.mpesaReference}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-3">
                        <span>Invoice: <strong className="font-mono text-slate-800">{pay.invoiceNumber}</strong></span>
                        <span>·</span>
                        <span>Phone: <strong className="font-mono text-slate-800">{pay.phoneNumber}</strong></span>
                        <span>·</span>
                        <span>Pipeline: <strong className="uppercase font-mono text-indigo-700">{pay.pipelineType}</strong></span>
                      </div>
                      {pay.notes && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5">
                          Notes: "{pay.notes}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right mr-2">
                        <div className="text-xs text-slate-400 uppercase font-mono">Amount</div>
                        <div className="text-base font-bold font-mono text-slate-900 tabular-nums">
                          KES {pay.amount.toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeclinePayment(pay.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleApprovePayment(pay.id)}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve & Issue Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 10: MAINTENANCE TICKETS */}
        {/* ============================================================== */}
        {activeView === 'maintenance_tickets' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tenant Maintenance Requests</h2>
              <p className="text-xs text-slate-500">Track and dispatch artisans for repairs</p>
            </div>

            <div className="space-y-4">
              {complaints.map(tkt => (
                <div key={tkt.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{tkt.title}</span>
                        <span className="font-mono text-xs font-semibold text-slate-500">#{tkt.ticketNumber}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700">
                          {tkt.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {tkt.tenantName} · {tkt.unitNumber} ({tkt.propertyName})
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded ${
                      tkt.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tkt.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {tkt.description}
                  </p>

                  {tkt.resolutionNotes && (
                    <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900">
                      <strong>Resolution:</strong> {tkt.resolutionNotes} (Cost: KES {tkt.estimatedCost?.toLocaleString()})
                    </div>
                  )}

                  {tkt.status !== 'resolved' && (
                    <div className="pt-2 flex items-center justify-between">
                      {updatingTicketId === tkt.id ? (
                        <div className="w-full flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Resolution notes..."
                            value={ticketNotes}
                            onChange={(e) => setTicketNotes(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-md"
                          />
                          <input
                            type="number"
                            placeholder="Cost KES"
                            value={ticketCost}
                            onChange={(e) => setTicketCost(Number(e.target.value))}
                            className="w-24 px-2 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                          />
                          <button
                            onClick={() => handleResolveTicket(tkt.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-md"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setUpdatingTicketId(null)}
                            className="p-1.5 text-slate-400 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setUpdatingTicketId(tkt.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Dispatch Artisan & Mark Resolved</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
