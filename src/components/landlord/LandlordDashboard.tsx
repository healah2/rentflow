import React, { useState } from 'react';
import { User, LandlordProfile, Invoice, Receipt, Property, Unit } from '../../types';
import { db } from '../../services/db';
import { 
  Home, 
  DollarSign, 
  Building2, 
  TrendingUp, 
  CreditCard, 
  Smartphone, 
  CheckCircle, 
  Clock, 
  Eye, 
  FileText,
  ShieldCheck,
  Calendar,
  Layers,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

interface LandlordDashboardProps {
  currentUser: User;
  landlordProfile: LandlordProfile;
  onPayMpesa: (invoice: Invoice) => void;
  onViewReceipt: (receipt: Receipt) => void;
  onRefresh: () => void;
}

type LandlordNavView = 
  | 'overview'
  | 'properties'
  | 'tenant_rent'
  | 'management_fees';

export const LandlordDashboard: React.FC<LandlordDashboardProps> = ({
  currentUser,
  landlordProfile,
  onPayMpesa,
  onViewReceipt,
  onRefresh
}) => {
  const [activeView, setActiveView] = useState<LandlordNavView>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const metrics = db.getLandlordMetrics(currentUser.id);
  const properties = db.getIsolatedProperties(currentUser);
  const units = db.getIsolatedUnits(currentUser);
  const invoices = db.getIsolatedInvoices(currentUser);
  const receipts = db.getIsolatedReceipts(currentUser);

  // Landlord's own management fee invoices (Pipeline B)
  const mgtInvoices = invoices.filter(i => i.pipelineType === 'AGENT_MANAGEMENT_FEE');
  // Tenant rent invoices on landlord's properties (Pipeline C)
  const tenantInvoices = invoices.filter(i => i.pipelineType === 'TENANT_RENT_UTILITY');

  const occupiedUnits = units.filter(u => u.status === 'occupied').length;
  const occupancyRate = units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0;

  const navItems = [
    { id: 'overview', label: 'Portfolio Overview', icon: Layers },
    { id: 'properties', label: `My Apartments (${properties.length})`, icon: Building2 },
    { id: 'tenant_rent', label: `Tenant Rent Ledger (${tenantInvoices.length})`, icon: FileText },
    { id: 'management_fees', label: `Agency Fee Invoices (${mgtInvoices.length})`, icon: CreditCard },
  ];

  const handleSelectNav = (view: LandlordNavView) => {
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
      {/* LANDLORD SIDEBAR */}
      {/* ================================================================ */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 
        flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-blue-700 tracking-wider">
                PROPERTY OWNER
              </div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {currentUser.fullName}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Agent: Apex Properties
              </div>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="px-2 pb-1.5 text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Landlord Menu
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id as LandlordNavView)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 space-y-1 font-mono">
          <div>Disbursal: {landlordProfile.bankName}</div>
          <div className="text-[10px] text-emerald-700 font-bold">
            Fee Paid Thru {new Date(landlordProfile.feeExpiry).toLocaleDateString()}
          </div>
        </div>
      </aside>

      {/* ================================================================ */}
      {/* LANDLORD CONTENT */}
      {/* ================================================================ */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="md:hidden flex items-center justify-between pb-3 border-b border-slate-200">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <Menu className="w-4 h-4" />
            <span>Landlord Menu</span>
          </button>
          <span className="text-xs font-mono text-blue-700 font-semibold">
            OWNER PORTAL
          </span>
        </div>

        {/* VIEW 1: OVERVIEW */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-blue-700 uppercase tracking-wider font-semibold">
                  <Home className="w-4 h-4" />
                  <span>Property Owner Portfolio</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                  Net Rental Yield & Disbursements
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated rent collection ledger and net disbursals from Apex Property Management
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold">
                  Fee Status: Active ({new Date(landlordProfile.feeExpiry).toLocaleDateString()})
                </span>
              </div>
            </div>

            {/* 4 Payout & Yield KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Gross Tenant Rent</span>
                  <span className="text-emerald-600 bg-emerald-50 p-1.5 rounded-md">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
                  KES {metrics.grossRentCollected.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Collected by managing agent
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Agent Management Fee</span>
                  <span className="text-indigo-600 bg-indigo-50 p-1.5 rounded-md">
                    <Building2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
                  KES {metrics.mgtFeesDeducted.toLocaleString()}
                </div>
                <div className="text-[11px] text-indigo-700 font-medium mt-1">
                  Monthly estate oversight fee
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Net Landlord Payout</span>
                  <span className="text-blue-600 bg-blue-50 p-1.5 rounded-md">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-700 mt-2 tabular-nums">
                  KES {metrics.netPayout.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Payable to {landlordProfile.bankName}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Portfolio Occupancy</span>
                  <span className="text-purple-600 bg-purple-50 p-1.5 rounded-md">
                    <Home className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
                  {occupancyRate}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {occupiedUnits} occupied / {units.length} total units
                </div>
              </div>
            </div>

            {/* Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Owned Real Estate Properties
                </h3>
                <div className="space-y-3">
                  {properties.map(prop => (
                    <div key={prop.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                      <img 
                        src={prop.imageUrl} 
                        alt={prop.title}
                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">{prop.title}</h4>
                        <p className="text-xs text-slate-500">{prop.estateOrStreet}, {prop.neighborhood}</p>
                        <div className="mt-1 text-xs font-mono text-emerald-700 font-semibold">
                          {prop.occupiedUnits} of {prop.totalUnits} Rooms Occupied
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Tenant Rent Status
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Tenant</th>
                        <th className="py-2 px-3 font-semibold">Period</th>
                        <th className="py-2 px-3 font-semibold">Amount</th>
                        <th className="py-2 px-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tenantInvoices.map(inv => (
                        <tr key={inv.id}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{inv.payerName}</td>
                          <td className="py-2 px-3 text-slate-600">{inv.billingPeriod}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">KES {inv.amount.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right">
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                              inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: PROPERTIES */}
        {activeView === 'properties' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">My Apartments & Rooms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map(prop => (
                <div key={prop.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <img src={prop.imageUrl} alt={prop.title} className="w-full h-40 object-cover" />
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-slate-900 text-base">{prop.title}</h3>
                    <p className="text-xs text-slate-500">{prop.estateOrStreet}, {prop.neighborhood}</p>
                    <div className="pt-2 flex justify-between text-xs font-mono">
                      <span>Total Rooms: {prop.totalUnits}</span>
                      <span className="text-emerald-700 font-bold">{prop.occupiedUnits} Occupied</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: TENANT RENT */}
        {activeView === 'tenant_rent' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Tenant Rent Collections Ledger</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Ref</th>
                    <th className="py-3 px-4 font-semibold">Tenant</th>
                    <th className="py-3 px-4 font-semibold">Period</th>
                    <th className="py-3 px-4 font-semibold">Amount (KES)</th>
                    <th className="py-3 px-4 font-semibold">Due Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tenantInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{inv.payerName}</td>
                      <td className="py-3 px-4 text-slate-600">{inv.billingPeriod}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">KES {inv.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{inv.dueDate}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 4: MANAGEMENT FEES */}
        {activeView === 'management_fees' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Agency Management Fee Billing History (Pipeline B)</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Invoice Ref</th>
                    <th className="py-3 px-4 font-semibold">Managing Agent</th>
                    <th className="py-3 px-4 font-semibold">Period</th>
                    <th className="py-3 px-4 font-semibold">Fee Amount</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {mgtInvoices.map(inv => {
                    const relatedReceipt = receipts.find(r => r.invoiceId === inv.id);
                    return (
                      <tr key={inv.id}>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 text-slate-700">{inv.payeeName}</td>
                        <td className="py-3 px-4 text-slate-600">{inv.billingPeriod}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">KES {inv.amount.toLocaleString()}</td>
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
                            <button
                              onClick={() => onPayMpesa(inv)}
                              className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs"
                            >
                              Pay M-Pesa
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
      </div>
    </div>
  );
};
