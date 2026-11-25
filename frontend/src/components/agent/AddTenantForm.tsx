import React, { useState, useEffect, useMemo } from 'react';
import { User, AgentProfile, LandlordProfile, Property, Unit } from '../../types';
import { db } from '../../services/db';
import { UserPlus, CheckCircle, AlertCircle, Home, Mail, Smartphone, Calendar, DollarSign, KeyRound } from 'lucide-react';

interface AddTenantFormProps {
  currentUser: User;
  agentProfile: AgentProfile;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const AddTenantForm: React.FC<AddTenantFormProps> = ({
  currentUser,
  agentProfile,
  onSuccess,
  onCancel
}) => {
  // Stable memoized database datasets to prevent unnecessary re-evaluations
  const users = useMemo(() => db.getUsers(), []);
  const landlords = useMemo(() => db.getLandlords().filter(l => l.agentId === agentProfile.id), [agentProfile.id]);
  const allProperties = useMemo(() => db.getIsolatedProperties(currentUser), [currentUser.id]);
  const allUnits = useMemo(() => db.getIsolatedUnits(currentUser), [currentUser.id]);

  // Field 1: Landlord selection
  const [selectedLandlordId, setSelectedLandlordId] = useState(landlords[0]?.id || '');
  
  // Field 2: Filtered Apartments
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  // Field 3: Filtered Rooms
  const [filteredRooms, setFilteredRooms] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');

  // Field 4, 5, 6: Tenant Details
  const [tenantFullName, setTenantFullName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');

  // Additional fields: Rent, Deposit, Lease Start (autofilled from selected room)
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [securityDeposit, setSecurityDeposit] = useState<number>(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Selected unit entity from database
  const currentSelectedUnit = useMemo(() => {
    return allUnits.find(u => u.id === selectedUnitId);
  }, [allUnits, selectedUnitId]);

  // When selected landlord changes, filter apartments
  useEffect(() => {
    if (!selectedLandlordId) {
      setFilteredProperties([]);
      setSelectedPropertyId('');
      return;
    }
    const propsForLandlord = allProperties.filter(p => p.landlordId === selectedLandlordId);
    setFilteredProperties(propsForLandlord);
    
    // Preserve property selection if valid for this landlord, otherwise pick the first
    setSelectedPropertyId(currentPropId => {
      if (currentPropId && propsForLandlord.some(p => p.id === currentPropId)) {
        return currentPropId;
      }
      return propsForLandlord[0]?.id || '';
    });
  }, [selectedLandlordId, allProperties]);

  // When selected apartment changes, filter rooms
  useEffect(() => {
    if (!selectedPropertyId) {
      setFilteredRooms([]);
      setSelectedUnitId('');
      return;
    }
    const roomsForProp = allUnits.filter(u => u.propertyId === selectedPropertyId);
    setFilteredRooms(roomsForProp);

    // CRITICAL: Preserve the user's selected room if it belongs to this apartment!
    // Do not reset the user's manual selection on re-render.
    setSelectedUnitId(currentUnitId => {
      if (currentUnitId && roomsForProp.some(u => u.id === currentUnitId)) {
        return currentUnitId;
      }
      // Otherwise default to first vacant room or first available room
      const firstVacant = roomsForProp.find(u => u.status === 'vacant') || roomsForProp[0];
      return firstVacant ? firstVacant.id : '';
    });
  }, [selectedPropertyId, allUnits]);

  // CRITICAL REQUIREMENT: Autofill Agreed Monthly Rent and Deposit Paid directly from the database for the selected room
  useEffect(() => {
    if (!selectedUnitId) {
      setMonthlyRent(0);
      setSecurityDeposit(0);
      return;
    }
    const roomInDb = allUnits.find(u => u.id === selectedUnitId);
    if (roomInDb) {
      setMonthlyRent(roomInDb.baseRent);
      setSecurityDeposit(roomInDb.securityDeposit);
    }
  }, [selectedUnitId, allUnits]);

  // When user clicks and selects ANY room from dropdown, update room and autofill immediately
  const handleUnitSelect = (unitId: string) => {
    setSelectedUnitId(unitId);
    const u = allUnits.find(r => r.id === unitId);
    if (u) {
      setMonthlyRent(u.baseRent);
      setSecurityDeposit(u.securityDeposit);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedLandlordId) {
      setErrorMessage('Please select a landlord.');
      return;
    }
    if (!selectedPropertyId) {
      setErrorMessage('Please select an apartment for this landlord.');
      return;
    }
    if (!selectedUnitId) {
      setErrorMessage('Please select a room/unit to allocate to the tenant.');
      return;
    }
    if (!tenantFullName.trim()) {
      setErrorMessage("Please enter the tenant's full name.");
      return;
    }
    if (!tenantPhone.trim() || tenantPhone.trim().length < 9) {
      setErrorMessage('Please enter a valid phone number (e.g. 0712345678).');
      return;
    }
    if (!tenantEmail.trim() || !tenantEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedUnit = filteredRooms.find(r => r.id === selectedUnitId);

      const result = await db.createTenantAndAssignRoom({
        fullName: tenantFullName,
        email: tenantEmail,
        phoneNumber: tenantPhone,
        landlordId: selectedLandlordId,
        agentId: agentProfile.id,
        propertyId: selectedPropertyId,
        unitId: selectedUnitId,
        monthlyRent: Number(monthlyRent),
        securityDeposit: Number(securityDeposit),
        startDate
      });

      setSuccessMessage(`Tenant "${result.user.fullName}" allocated to ${selectedUnit?.unitNumber || 'selected room'} successfully!`);
      setTenantFullName('');
      setTenantEmail('');
      setTenantPhone('');

      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 max-w-2xl">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Add Tenant to Room
          </h2>
          <p className="text-xs text-slate-500">
            Allocate a room to a new tenant with automated lease creation and WhatsApp onboarding
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Step 1: Cascading Hierarchy (Landlord -> Apartment -> Room) */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
            Room Allocation Hierarchy
          </div>

          {/* Field 1: Landlord's Name (Dropdown of agent's landlords) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              1. Landlord's Name <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedLandlordId}
              onChange={(e) => setSelectedLandlordId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
            >
              {landlords.length === 0 ? (
                <option value="">No landlords registered</option>
              ) : (
                landlords.map(l => {
                  const lUser = users.find(u => u.id === l.userId);
                  return (
                    <option key={l.id} value={l.id}>
                      {lUser?.fullName || 'Landlord'} ({lUser?.phoneNumber || l.mpesaPhone})
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* Field 2: Apartment Name (Dropdown of apartments of that landlord) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              2. Apartment Name <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              required
              disabled={filteredProperties.length === 0}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white disabled:bg-slate-100 disabled:text-slate-400"
            >
              {filteredProperties.length === 0 ? (
                <option value="">No apartments found for selected landlord</option>
              ) : (
                filteredProperties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.neighborhood} ({p.occupiedUnits}/{p.totalUnits} Occupied)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Field 3: Room Number (Dropdown of rooms of that apartment) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-800">
                3. Room Number <span className="text-red-500">*</span>
              </label>
              {currentSelectedUnit && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Room Data Loaded
                </span>
              )}
            </div>
            <select
              value={selectedUnitId}
              onChange={(e) => handleUnitSelect(e.target.value)}
              required
              disabled={filteredRooms.length === 0}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white disabled:bg-slate-100 disabled:text-slate-400 font-mono"
            >
              {filteredRooms.length === 0 ? (
                <option value="">No rooms available in this apartment</option>
              ) : (
                filteredRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.unitNumber} ({r.unitType}) — KES {r.baseRent.toLocaleString()}/mo [{r.status.toUpperCase()}]
                  </option>
                ))
              )}
            </select>
            
            {/* Room Tariff & Properties Card fetched from Database */}
            {currentSelectedUnit && (
              <div className="mt-2 p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200/80 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-emerald-950">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                    Unit {currentSelectedUnit.unitNumber} ({currentSelectedUnit.unitType}) Tariff in Database:
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                    currentSelectedUnit.status === 'vacant' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {currentSelectedUnit.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-0.5">
                  <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                    <span className="text-slate-500 text-[10px] block">Standard Rent:</span>
                    <span className="font-mono font-bold text-emerald-700">KES {currentSelectedUnit.baseRent.toLocaleString()}</span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                    <span className="text-slate-500 text-[10px] block">Standard Deposit:</span>
                    <span className="font-mono font-bold text-slate-800">KES {currentSelectedUnit.securityDeposit.toLocaleString()}</span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                    <span className="text-slate-500 text-[10px] block">Fixed Utilities:</span>
                    <span className="font-mono text-slate-700">KES {((currentSelectedUnit.waterFixedCharge || 0) + (currentSelectedUnit.trashCharge || 0)).toLocaleString()}</span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                    <span className="text-slate-500 text-[10px] block">Room Features:</span>
                    <span className="text-slate-700 truncate block font-medium" title={currentSelectedUnit.roomProperties?.join(', ') || 'Standard'}>
                      {currentSelectedUnit.roomProperties?.slice(0, 2).join(', ') || 'Standard room'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-[11px] text-slate-500 mt-1">
              Selecting a room automatically queries the database and populates Agreed Monthly Rent and Deposit Paid below.
            </p>
          </div>
        </div>

        {/* Step 2: Tenant Information */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
            Tenant Information
          </div>

          {/* Field 4: Tenant Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Tenant's Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Dennis Kiprop Koech"
              value={tenantFullName}
              onChange={(e) => setTenantFullName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Field 5: Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="e.g. dennis.kiprop@gmail.com"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Field 6: Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Phone Number (Safaricom M-Pesa) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="e.g. 0712345678"
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Lease Details: Monthly Rent, Deposit, Start Date (Autofilled from Room Number) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 text-xs font-semibold">
                  Agreed Monthly Rent (KES) <span className="text-red-500">*</span>
                </label>
                {currentSelectedUnit && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Autofilled
                  </span>
                )}
              </div>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                required
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-emerald-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {currentSelectedUnit ? `Pulled from Room ${currentSelectedUnit.unitNumber} database base rent.` : 'Autofilled on room selection.'}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 text-xs font-semibold">
                  Deposit Paid (KES) <span className="text-red-500">*</span>
                </label>
                {currentSelectedUnit && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Autofilled
                  </span>
                )}
              </div>
              <input
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                required
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-emerald-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {currentSelectedUnit ? `Pulled from Room ${currentSelectedUnit.unitNumber} database security deposit.` : 'Autofilled on room selection.'}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 text-xs font-semibold">
                  Lease Start Date <span className="text-red-500">*</span>
                </label>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Effective date of occupancy
              </p>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
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
            disabled={isSubmitting || !selectedUnitId}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isSubmitting ? 'Allocating Room...' : 'Allocate Room & Save Tenant'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
