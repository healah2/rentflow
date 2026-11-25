import React, { useState, useEffect } from 'react';
import { User, AgentProfile, LandlordProfile, Property, Unit, Lease, ChargeType, InvoiceItem } from '../../types';
import { db } from '../../services/db';
import { Send, CheckCircle, AlertCircle, FileText, User as UserIcon, Building2, Home, DollarSign, Calendar, Layers } from 'lucide-react';

interface SendInvoiceFormProps {
  currentUser: User;
  agentProfile: AgentProfile;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const SendInvoiceForm: React.FC<SendInvoiceFormProps> = ({
  currentUser,
  agentProfile,
  onSuccess,
  onCancel
}) => {
  const users = db.getUsers();
  const landlords = db.getLandlords().filter(l => l.agentId === agentProfile.id);
  const properties = db.getIsolatedProperties(currentUser);
  const units = db.getIsolatedUnits(currentUser);
  const leases = db.getLeases().filter(l => l.agentId === agentProfile.id);

  // Filter tenants belonging to this agent
  const tenants = users.filter(u => u.role === 'TENANT' && (u.agentId === agentProfile.id || units.some(unit => unit.currentTenantId === u.tenantId)));

  // Field 1: Recipient Type (Dropdown: Landlord or Tenant)
  const [recipientType, setRecipientType] = useState<'landlord' | 'tenant'>('tenant');

  // --- STATE FOR LANDLORD MODE ---
  const [selectedLandlordId, setSelectedLandlordId] = useState(landlords[0]?.id || '');
  const [landlordApartmentId, setLandlordApartmentId] = useState('');
  const [landlordFeeAmount, setLandlordFeeAmount] = useState<number>(3500);
  const [landlordMonth, setLandlordMonth] = useState('December 2026');
  const [landlordDueDate, setLandlordDueDate] = useState('2026-12-05');

  // --- STATE FOR TENANT MODE ---
  const [selectedTenantId, setSelectedTenantId] = useState(tenants[0]?.id || '');
  const [tenantApartmentId, setTenantApartmentId] = useState('');
  const [tenantUnitId, setTenantUnitId] = useState('');
  const [tenantMonth, setTenantMonth] = useState('December 2026');
  const [tenantDueDate, setTenantDueDate] = useState('2026-12-05');

  // Bills checkboxes & amounts for tenant
  const [billRentActive, setBillRentActive] = useState(true);
  const [billRentAmount, setBillRentAmount] = useState(45000);

  const [billWaterActive, setBillWaterActive] = useState(true);
  const [billWaterAmount, setBillWaterAmount] = useState(1800);

  const [billElecActive, setBillElecActive] = useState(false);
  const [billElecAmount, setBillElecAmount] = useState(1200);

  const [billTrashActive, setBillTrashActive] = useState(true);
  const [billTrashAmount, setBillTrashAmount] = useState(500);

  const [billParkingActive, setBillParkingActive] = useState(false);
  const [billParkingAmount, setBillParkingAmount] = useState(1500);

  const [billMaintenanceActive, setBillMaintenanceActive] = useState(false);
  const [billMaintenanceAmount, setBillMaintenanceAmount] = useState(2000);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // When Landlord is selected, automatically pick their properties & fee
  useEffect(() => {
    if (!selectedLandlordId) return;
    const lProfile = landlords.find(l => l.id === selectedLandlordId);
    if (lProfile) {
      setLandlordFeeAmount(lProfile.managementFeeAmount || 3500);
      const landlordProps = properties.filter(p => p.landlordId === selectedLandlordId);
      if (landlordProps.length > 0) {
        setLandlordApartmentId(landlordProps[0].id);
      } else {
        setLandlordApartmentId('');
      }
    }
  }, [selectedLandlordId, properties, landlords]);

  // When Tenant is selected, automatically pick their apartment, room, and rent
  useEffect(() => {
    if (!selectedTenantId) return;
    const tenantUser = users.find(u => u.id === selectedTenantId);
    if (!tenantUser) return;

    // Find unit occupied by this tenant
    const tenantUnit = units.find(u => u.currentTenantId === tenantUser.tenantId || u.currentTenantId === tenantUser.id);
    if (tenantUnit) {
      setTenantApartmentId(tenantUnit.propertyId);
      setTenantUnitId(tenantUnit.id);
      setBillRentAmount(tenantUnit.baseRent);
      if (tenantUnit.waterFixedCharge) setBillWaterAmount(tenantUnit.waterFixedCharge);
      if (tenantUnit.trashCharge) setBillTrashAmount(tenantUnit.trashCharge);
    } else {
      // Check lease
      const tenantLease = leases.find(l => l.tenantId === tenantUser.tenantId || l.tenantId === tenantUser.id);
      if (tenantLease) {
        setTenantApartmentId(tenantLease.propertyId);
        setTenantUnitId(tenantLease.unitId);
        setBillRentAmount(tenantLease.monthlyRent);
      }
    }
  }, [selectedTenantId, units, leases, users]);

  // Calculate total tenant bills sum
  const calculateTenantTotal = () => {
    let sum = 0;
    if (billRentActive) sum += Number(billRentAmount) || 0;
    if (billWaterActive) sum += Number(billWaterAmount) || 0;
    if (billElecActive) sum += Number(billElecAmount) || 0;
    if (billTrashActive) sum += Number(billTrashAmount) || 0;
    if (billParkingActive) sum += Number(billParkingAmount) || 0;
    if (billMaintenanceActive) sum += Number(billMaintenanceAmount) || 0;
    return sum;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    setIsSubmitting(true);
    try {
      if (recipientType === 'landlord') {
        // --- SEND INVOICE TO LANDLORD (Pipeline B: Management Fee) ---
        const lProfile = landlords.find(l => l.id === selectedLandlordId);
        if (!lProfile) throw new Error('Landlord profile not found');
        const lUser = users.find(u => u.id === lProfile.userId);
        const prop = properties.find(p => p.id === landlordApartmentId);

        const invNumber = `INV-MGT-2026-${Math.floor(100 + Math.random() * 900)}`;

        const createdInvoice = await db.createInvoice({
          invoiceNumber: invNumber,
          pipelineType: 'AGENT_MANAGEMENT_FEE',
          payerId: lProfile.userId,
          payerName: lUser ? lUser.fullName : 'Landlord Partner',
          payerRole: 'LANDLORD',
          payeeId: currentUser.id,
          payeeName: agentProfile.agencyName,
          amount: Number(landlordFeeAmount),
          dueDate: landlordDueDate,
          billingPeriod: landlordMonth,
          status: 'unpaid',
          propertyId: landlordApartmentId || undefined,
          items: [
            {
              id: `item-mgt-${Date.now()}`,
              chargeType: 'maintenance',
              title: `Monthly Property Management Fee - ${prop ? prop.title : 'Managed Property'}`,
              amount: Number(landlordFeeAmount)
            }
          ]
        });

        setSuccessMessage(`Management Fee Invoice ${createdInvoice.invoiceNumber} (KES ${createdInvoice.amount.toLocaleString()}) sent to Landlord ${lUser?.fullName}!`);
      } else {
        // --- SEND INVOICE TO TENANT (Pipeline C: Rent & Utilities) ---
        const tenantUser = users.find(u => u.id === selectedTenantId);
        if (!tenantUser) throw new Error('Tenant user not found');
        const unit = units.find(u => u.id === tenantUnitId);
        const prop = properties.find(p => p.id === tenantApartmentId);

        const items: InvoiceItem[] = [];
        if (billRentActive) {
          items.push({ id: `item-rent-${Date.now()}`, chargeType: 'rent', title: `Monthly Rent - ${unit?.unitNumber || 'Unit'}`, amount: Number(billRentAmount) });
        }
        if (billWaterActive) {
          items.push({ id: `item-water-${Date.now()}`, chargeType: 'water', title: 'Water Consumption & Metered Tariff', amount: Number(billWaterAmount) });
        }
        if (billElecActive) {
          items.push({ id: `item-elec-${Date.now()}`, chargeType: 'electricity', title: 'Common Area Power & Inverter Backup', amount: Number(billElecAmount) });
        }
        if (billTrashActive) {
          items.push({ id: `item-trash-${Date.now()}`, chargeType: 'trash', title: 'Refuse & Sanitation Collection', amount: Number(billTrashAmount) });
        }
        if (billParkingActive) {
          items.push({ id: `item-park-${Date.now()}`, chargeType: 'parking', title: 'Allocated Parking Bay Access', amount: Number(billParkingAmount) });
        }
        if (billMaintenanceActive) {
          items.push({ id: `item-maint-${Date.now()}`, chargeType: 'maintenance', title: 'Minor Repairs & Service Charge', amount: Number(billMaintenanceAmount) });
        }

        if (items.length === 0) {
          throw new Error('Please select at least one bill item to invoice the tenant.');
        }

        const totalAmount = items.reduce((acc, curr) => acc + curr.amount, 0);
        const invNumber = `INV-TNT-2026-${Math.floor(100 + Math.random() * 900)}`;

        const createdInvoice = await db.createInvoice({
          invoiceNumber: invNumber,
          pipelineType: 'TENANT_RENT_UTILITY',
          payerId: tenantUser.id,
          payerName: tenantUser.fullName,
          payerRole: 'TENANT',
          payeeId: currentUser.id,
          payeeName: agentProfile.agencyName,
          amount: totalAmount,
          dueDate: tenantDueDate,
          billingPeriod: tenantMonth,
          status: 'unpaid',
          propertyId: tenantApartmentId || undefined,
          unitId: tenantUnitId || undefined,
          items
        });

        setSuccessMessage(`Tenant Invoice ${createdInvoice.invoiceNumber} (KES ${createdInvoice.amount.toLocaleString()}) dispatched to ${tenantUser.fullName} for ${unit?.unitNumber || 'assigned room'}!`);
      }

      setTimeout(() => {
        onSuccess();
      }, 1400);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to dispatch invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 max-w-3xl">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <Send className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Send Invoice
          </h2>
          <p className="text-xs text-slate-500">
            Dispatch billing statements to either a Tenant (Rent & Utilities) or a Landlord (Management Fee)
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">{successMessage}</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              WhatsApp and SMS billing alert dispatched automatically with direct M-Pesa Paybill payment links.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* FIELD 1: RECIPIENT TYPE SELECTOR DROPDOWN */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
            Field 1: Select Invoice Recipient Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setRecipientType('tenant'); setSuccessMessage(''); setErrorMessage(''); }}
              className={`py-3 px-4 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                recipientType === 'tenant'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Tenant (Rent & Utilities)</span>
            </button>

            <button
              type="button"
              onClick={() => { setRecipientType('landlord'); setSuccessMessage(''); setErrorMessage(''); }}
              className={`py-3 px-4 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                recipientType === 'landlord'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Landlord (Management Fee)</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            {recipientType === 'tenant'
              ? 'Form is configured for Tenant Rent, Water, Electricity, Trash & Parking collection.'
              : 'Form is configured for Landlord Monthly Property Management Fee collection.'}
          </p>
        </div>

        {/* ============================================================== */}
        {/* CASE A: LANDLORD INVOICE (Management Fee) */}
        {/* ============================================================== */}
        {recipientType === 'landlord' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-4">
              <div className="text-xs font-semibold text-blue-900 font-mono uppercase">
                Landlord Invoice Details
              </div>

              {/* Landlord Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Select Landlord <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedLandlordId}
                  onChange={(e) => setSelectedLandlordId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                >
                  {landlords.map(l => {
                    const lUser = users.find(u => u.id === l.userId);
                    return (
                      <option key={l.id} value={l.id}>
                        {lUser?.fullName} · Agreed Fee: KES {l.managementFeeAmount.toLocaleString()} ({l.mpesaPhone})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Apartment Name (Automatically picked for landlord) */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Apartment Name (Managed Property) <span className="text-red-500">*</span>
                </label>
                <select
                  value={landlordApartmentId}
                  onChange={(e) => setLandlordApartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {properties.filter(p => p.landlordId === selectedLandlordId).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} · {p.neighborhood} ({p.totalUnits} Units)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Automatically populated based on the apartments registered to this landlord.
                </p>
              </div>

              {/* Month of Payment & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Month of Payment <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={landlordMonth}
                    onChange={(e) => setLandlordMonth(e.target.value)}
                    required
                    placeholder="e.g. December 2026"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={landlordDueDate}
                    onChange={(e) => setLandlordDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              {/* Management Fee Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Monthly Management Fee (KES) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={landlordFeeAmount}
                  onChange={(e) => setLandlordFeeAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-sm font-mono font-bold text-slate-900 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CASE B: TENANT INVOICE (Rent & Utilities) */}
        {/* ============================================================== */}
        {recipientType === 'tenant' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
              <div className="text-xs font-semibold text-slate-800 font-mono uppercase">
                Tenant & Residence Details
              </div>

              {/* 1. Tenant selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Select Tenant Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Apartment Name (Dropdown related to selected tenant) */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Apartment Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={tenantApartmentId}
                  onChange={(e) => setTenantApartmentId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} · {p.neighborhood}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Automatically set to the apartment of the selected tenant.
                </p>
              </div>

              {/* 3. Room Number (Dropdown related to apartment of selected tenant) */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Room Number <span className="text-red-500">*</span>
                </label>
                <select
                  value={tenantUnitId}
                  onChange={(e) => setTenantUnitId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono font-bold"
                >
                  {units
                    .filter(u => !tenantApartmentId || u.propertyId === tenantApartmentId)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.unitNumber} ({u.unitType}) — Base Rent KES {u.baseRent.toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>

              {/* 4. Month Invoice is Being Requested / Sent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Month Invoice Requested For <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tenantMonth}
                    onChange={(e) => setTenantMonth(e.target.value)}
                    required
                    placeholder="e.g. December 2026"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Payment Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={tenantDueDate}
                    onChange={(e) => setTenantDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 5. Bills Being Asked For (Dropdown / Multi-Charge Items) */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    5. Select Bills Being Asked For
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Include itemized charges in the tenant's monthly statement
                  </p>
                </div>
                <div className="text-right font-mono font-bold text-emerald-700 text-sm">
                  Total: KES {calculateTenantTotal().toLocaleString()}
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {/* Rent Bill */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billRentActive}
                      onChange={(e) => setBillRentActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span>Monthly Rent Charge</span>
                  </label>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <span className="text-slate-400">KES</span>
                    <input
                      type="number"
                      disabled={!billRentActive}
                      value={billRentAmount}
                      onChange={(e) => setBillRentAmount(Number(e.target.value))}
                      className="w-28 px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold text-slate-900 disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Water Bill */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billWaterActive}
                      onChange={(e) => setBillWaterActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span>Water Utility (Metered Reading / Fixed)</span>
                  </label>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <span className="text-slate-400">KES</span>
                    <input
                      type="number"
                      disabled={!billWaterActive}
                      value={billWaterAmount}
                      onChange={(e) => setBillWaterAmount(Number(e.target.value))}
                      className="w-28 px-2 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Electricity Bill */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billElecActive}
                      onChange={(e) => setBillElecActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span>Electricity / Backup Inverter Service</span>
                  </label>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <span className="text-slate-400">KES</span>
                    <input
                      type="number"
                      disabled={!billElecActive}
                      value={billElecAmount}
                      onChange={(e) => setBillElecAmount(Number(e.target.value))}
                      className="w-28 px-2 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Trash Bill */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billTrashActive}
                      onChange={(e) => setBillTrashActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span>Refuse & Trash Sanitation Collection</span>
                  </label>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <span className="text-slate-400">KES</span>
                    <input
                      type="number"
                      disabled={!billTrashActive}
                      value={billTrashAmount}
                      onChange={(e) => setBillTrashAmount(Number(e.target.value))}
                      className="w-28 px-2 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Parking Bill */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billParkingActive}
                      onChange={(e) => setBillParkingActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span>Basement / Covered Parking Bay</span>
                  </label>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <span className="text-slate-400">KES</span>
                    <input
                      type="number"
                      disabled={!billParkingActive}
                      value={billParkingAmount}
                      onChange={(e) => setBillParkingAmount(Number(e.target.value))}
                      className="w-28 px-2 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Maintenance Bill */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billMaintenanceActive}
                      onChange={(e) => setBillMaintenanceActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span>Maintenance / Repair Recharge</span>
                  </label>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <span className="text-slate-400">KES</span>
                    <input
                      type="number"
                      disabled={!billMaintenanceActive}
                      value={billMaintenanceAmount}
                      onChange={(e) => setBillMaintenanceAmount(Number(e.target.value))}
                      className="w-28 px-2 py-1 text-xs border border-slate-300 rounded font-mono text-slate-900 disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Dispatching Invoice...'
                : recipientType === 'landlord'
                ? `Send Management Fee Invoice (KES ${landlordFeeAmount.toLocaleString()})`
                : `Send Tenant Invoice (KES ${calculateTenantTotal().toLocaleString()})`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
