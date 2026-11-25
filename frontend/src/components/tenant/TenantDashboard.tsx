import React, { useState } from 'react';
import { 
  User, 
  Invoice, 
  Receipt, 
  MaintenanceComplaint, 
  Property, 
  Unit, 
  Lease 
} from '../../types';
import { db } from '../../services/db';
import { 
  Home, 
  Smartphone, 
  FileText, 
  Wrench, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  Plus, 
  Send, 
  Download,
  Calendar,
  Layers,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

interface TenantDashboardProps {
  currentUser: User;
  onPayMpesa: (invoice: Invoice) => void;
  onViewReceipt: (receipt: Receipt) => void;
  onRefresh: () => void;
}

type TenantNavView = 
  | 'overview'
  | 'bills'
  | 'receipts'
  | 'maintenance';

export const TenantDashboard: React.FC<TenantDashboardProps> = ({
  currentUser,
  onPayMpesa,
  onViewReceipt,
  onRefresh
}) => {
  const [activeView, setActiveView] = useState<TenantNavView>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSubmitComplaintOpen, setIsSubmitComplaintOpen] = useState(false);

  // New ticket state
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintCategory, setComplaintCategory] = useState<MaintenanceComplaint['category']>('plumbing');
  const [complaintUrgency, setComplaintUrgency] = useState<MaintenanceComplaint['urgency']>('medium');
  const [complaintDesc, setComplaintDesc] = useState('');

  const invoices = db.getIsolatedInvoices(currentUser);
  const receipts = db.getIsolatedReceipts(currentUser);
  const complaints = db.getIsolatedComplaints(currentUser);
  const properties = db.getIsolatedProperties(currentUser);
  const units = db.getIsolatedUnits(currentUser);
  const leases = db.getLeases().filter(l => l.tenantId === currentUser.tenantId);

  const currentUnit = units[0];
  const currentProperty = properties[0];
  const currentLease = leases[0];

  const unpaidInvoices = invoices.filter(i => i.status !== 'paid');
  const currentBill = unpaidInvoices[0] || invoices[0];

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTitle || !complaintDesc) return;

    try {
      await db.createComplaint({
        unitId: currentUnit ? currentUnit.id : 'unit-default',
        unitNumber: currentUnit ? currentUnit.unitNumber : 'Apartment 4B',
        propertyId: currentProperty ? currentProperty.id : 'prop-default',
        propertyName: currentProperty ? currentProperty.title : 'Kilimani Rise',
        tenantId: currentUser.tenantId || currentUser.id,
        tenantName: currentUser.fullName,
        agentId: currentUser.agentId || 'agent-apex',
        landlordId: currentUser.landlordId || 'landlord-mwangi',
        title: complaintTitle,
        category: complaintCategory,
        urgency: complaintUrgency,
        description: complaintDesc,
      });

      setIsSubmitComplaintOpen(false);
      setComplaintTitle('');
      setComplaintDesc('');
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not submit the maintenance request.');
    }
  };

  const navItems = [
    { id: 'overview', label: 'My Residence', icon: Home },
    { id: 'bills', label: `Invoices & Pay Bills (${invoices.length})`, icon: FileText, badge: unpaidInvoices.length > 0 ? `${unpaidInvoices.length} Due` : undefined },
    { id: 'receipts', label: `Payment Receipts (${receipts.length})`, icon: CheckCircle },
    { id: 'maintenance', label: `Maintenance Requests (${complaints.length})`, icon: Wrench },
  ];

  const handleSelectNav = (view: TenantNavView) => {
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
      {/* TENANT SIDEBAR */}
      {/* ================================================================ */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 
        flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-cyan-700 tracking-wider">
                TENANT PORTAL
              </div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {currentUser.fullName}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                {currentUnit?.unitNumber || 'Unit 4B'} · {currentProperty?.neighborhood || 'Nairobi'}
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
              Tenant Menu
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id as TenantNavView)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-cyan-600'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 space-y-1 font-mono">
          <div>Agent: Apex Properties</div>
          <div>M-Pesa Paybill: 714920</div>
        </div>
      </aside>

      {/* ================================================================ */}
      {/* TENANT CONTENT */}
      {/* ================================================================ */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="md:hidden flex items-center justify-between pb-3 border-b border-slate-200">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <Menu className="w-4 h-4" />
            <span>Tenant Menu</span>
          </button>
          <span className="text-xs font-mono text-cyan-700 font-semibold">
            {activeView.toUpperCase()}
          </span>
        </div>

        {/* VIEW 1: OVERVIEW & RESIDENCE */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-700 uppercase tracking-wider font-semibold">
                  <Home className="w-4 h-4" />
                  <span>Tenant Self-Service</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                  Welcome back, {currentUser.fullName}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentUnit ? currentUnit.unitNumber : 'Apartment 4B'} · {currentProperty ? currentProperty.title : 'Kilimani Rise'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg font-semibold">
                  Lease Active: {currentLease ? new Date(currentLease.endDate).toLocaleDateString() : 'Dec 31, 2026'}
                </span>
              </div>
            </div>

            {/* Current Bill Banner */}
            {currentBill && currentBill.status !== 'paid' ? (
              <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
                    <Clock className="w-4 h-4" />
                    <span>Current Outstanding Bill · Due {currentBill.dueDate}</span>
                  </div>
                  <div className="text-3xl font-bold font-mono text-white tabular-nums">
                    KES {currentBill.amount.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-300">
                    Covers {currentBill.billingPeriod} rent, metered water, trash sanitation, and parking bay.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <button
                    onClick={() => onPayMpesa(currentBill)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-lg shadow-sm transition-all flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4 text-slate-950" />
                    <span>Pay with M-Pesa</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-3 text-emerald-900 text-xs">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="block text-sm">All Bills Up to Date!</strong>
                  Your monthly rental and utility statements have been fully settled.
                </div>
              </div>
            )}

            {/* Split: Itemized Breakdown & Quick Shortcuts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    Current Statement Items
                  </h3>
                  <button
                    onClick={() => setActiveView('bills')}
                    className="text-xs font-semibold text-cyan-700 hover:text-cyan-800"
                  >
                    All Invoices →
                  </button>
                </div>

                {currentBill ? (
                  <div className="divide-y divide-slate-100">
                    {currentBill.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-900">{item.title}</div>
                          <div className="text-[11px] text-slate-500 capitalize">{item.chargeType}</div>
                        </div>
                        <div className="font-mono font-bold text-slate-900">
                          KES {item.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 text-sm">Tenant Quick Actions</h4>
                <button
                  onClick={() => setIsSubmitComplaintOpen(true)}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4 text-slate-600" />
                  <span>Report Maintenance Issue</span>
                </button>
                <button
                  onClick={() => setActiveView('receipts')}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>View Official Receipts</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: BILLS */}
        {activeView === 'bills' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">My Rental & Utility Invoices</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Invoice Ref</th>
                    <th className="py-3 px-4 font-semibold">Billing Period</th>
                    <th className="py-3 px-4 font-semibold">Due Date</th>
                    <th className="py-3 px-4 font-semibold">Amount (KES)</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-700">{inv.billingPeriod}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{inv.dueDate}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">KES {inv.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {inv.status !== 'paid' ? (
                          <button
                            onClick={() => onPayMpesa(inv)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                          >
                            Pay M-Pesa
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-mono text-xs font-semibold">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: RECEIPTS */}
        {activeView === 'receipts' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Official Payment Receipts</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Receipt Number</th>
                    <th className="py-3 px-4 font-semibold">M-Pesa Reference</th>
                    <th className="py-3 px-4 font-semibold">Date Issued</th>
                    <th className="py-3 px-4 font-semibold">Amount Paid</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipts.map(rec => (
                    <tr key={rec.id}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{rec.receiptNumber}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">{rec.mpesaReference}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{new Date(rec.issuedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">KES {rec.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onViewReceipt(rec)}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 4: MAINTENANCE */}
        {activeView === 'maintenance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Maintenance & Complaints</h2>
                <p className="text-xs text-slate-500">Report issues directly to your managing agent</p>
              </div>
              <button
                onClick={() => setIsSubmitComplaintOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Report Issue</span>
              </button>
            </div>

            <div className="space-y-3.5">
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
                        Submitted {new Date(tkt.createdAt).toLocaleDateString()} · Urgency: {tkt.urgency.toUpperCase()}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded ${
                      tkt.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tkt.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{tkt.description}</p>
                  {tkt.resolutionNotes && (
                    <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-lg border border-emerald-200">
                      <strong>Artisan Feedback:</strong> {tkt.resolutionNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: SUBMIT COMPLAINT */}
        {isSubmitComplaintOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1">Report Maintenance Issue</h3>
              <p className="text-xs text-slate-500 mb-4">Managing agent Sarah Wanjiku will be notified via WhatsApp</p>

              <form onSubmit={handleCreateComplaint} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Issue Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Master bedroom toilet flush valve stuck"
                    value={complaintTitle}
                    onChange={(e) => setComplaintTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Category</label>
                    <select
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="structural">Structural</option>
                      <option value="noise">Noise / Disturbance</option>
                      <option value="security">Security</option>
                      <option value="appliance">Appliance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Urgency Level</label>
                    <select
                      value={complaintUrgency}
                      onChange={(e) => setComplaintUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="low">Low (Routine)</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Detailed Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details to assist the repair artisan..."
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsSubmitComplaintOpen(false)}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-slate-900 text-white font-semibold rounded-lg"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
