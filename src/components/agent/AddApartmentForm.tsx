import React, { useState, useEffect } from 'react';
import { User, AgentProfile, LandlordProfile, Unit } from '../../types';
import { db } from '../../services/db';
import { 
  Building2, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Home, 
  CheckSquare, 
  Sparkles, 
  Layers, 
  Sliders, 
  User as UserIcon, 
  Trash2, 
  Check, 
  Tag, 
  ChevronDown, 
  ChevronUp,
  DollarSign,
  Smartphone
} from 'lucide-react';

interface AddApartmentFormProps {
  currentUser: User;
  agentProfile: AgentProfile;
  onSuccess: () => void;
  onCancel?: () => void;
}

const AVAILABLE_ROOM_PROPERTIES = [
  'Ensuite Bathroom',
  'Private Balcony',
  'Master Ensuite',
  'Prepaid Token Meter (KPLC)',
  'Instant Water Heater',
  'Kitchen Cabinets & Granite',
  'Built-in Wardrobes',
  'Dedicated Parking Bay',
  'High-speed WiFi Access',
  'Fully Furnished'
];

interface RoomDraft {
  unitNumber: string;
  unitType: Unit['unitType'];
  baseRent: number;
  securityDeposit: number;
  waterFixedCharge: number;
  trashCharge: number;
  parkingCharge: number;
  properties: string[];
  // Tenant allocation
  tenantMode: 'vacant' | 'existing' | 'new';
  tenantId?: string;
  newTenantName?: string;
  newTenantPhone?: string;
  newTenantEmail?: string;
  isExpanded?: boolean;
}

export const AddApartmentForm: React.FC<AddApartmentFormProps> = ({
  currentUser,
  agentProfile,
  onSuccess,
  onCancel
}) => {
  const landlords = db.getLandlords().filter(l => l.agentId === agentProfile.id);
  const users = db.getUsers();
  const existingTenants = users.filter(u => u.role === 'TENANT');

  const [selectedLandlordId, setSelectedLandlordId] = useState(landlords[0]?.id || '');
  const [apartmentName, setApartmentName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('Kilimani');
  const [numberOfRooms, setNumberOfRooms] = useState(4);

  // Global default room fee values
  const [defaultRent, setDefaultRent] = useState(38000);
  const [defaultDeposit, setDefaultDeposit] = useState(38000);
  const [defaultWaterCharge, setDefaultWaterCharge] = useState(1500);
  const [defaultTrashCharge, setDefaultTrashCharge] = useState(500);
  const [defaultParkingCharge, setDefaultParkingCharge] = useState(0);

  // Apartment Building Properties / Amenities
  const availableApartmentProperties = [
    'Borehole Water & High Capacity Reservoirs',
    '24/7 CCTV & Uniformed Guards',
    'Automatic Backup Diesel Generator',
    'High Speed Elevators',
    'Fibre Internet Ready (Safaricom/Zuku)',
    'Solar Water Heating System',
    'Dedicated Basement / Paved Parking',
    'Perimeter Electric Fence',
    'Rooftop Terrace / Clothes Drying Yard'
  ];

  const [selectedApartmentProps, setSelectedApartmentProps] = useState<string[]>([
    'Borehole Water & High Capacity Reservoirs',
    '24/7 CCTV & Uniformed Guards',
    'Fibre Internet Ready (Safaricom/Zuku)',
    'Dedicated Basement / Paved Parking'
  ]);

  // Generated room drafts
  const [rooms, setRooms] = useState<RoomDraft[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Initial room generation
  useEffect(() => {
    const generated: RoomDraft[] = [];
    const count = Math.max(1, Math.min(48, Number(numberOfRooms) || 4));

    for (let i = 1; i <= count; i++) {
      const floor = Math.ceil(i / 4);
      const letter = String.fromCharCode(65 + ((i - 1) % 4));
      const roomNum = `Unit ${floor}${letter}`;

      generated.push({
        unitNumber: roomNum,
        unitType: i % 2 === 0 ? '2-Bedroom' : '1-Bedroom',
        baseRent: defaultRent + (i > 4 ? 3000 : 0),
        securityDeposit: defaultDeposit + (i > 4 ? 3000 : 0),
        waterFixedCharge: defaultWaterCharge,
        trashCharge: defaultTrashCharge,
        parkingCharge: defaultParkingCharge,
        properties: ['Ensuite Bathroom', 'Private Balcony', 'Prepaid Token Meter (KPLC)'],
        tenantMode: 'vacant',
        tenantId: '',
        newTenantName: '',
        newTenantPhone: '',
        newTenantEmail: '',
        isExpanded: false
      });
    }
    setRooms(generated);
  }, [numberOfRooms]);

  // Bulk apply defaults to all rooms
  const handleApplyDefaultsToAll = () => {
    setRooms(prev =>
      prev.map(r => ({
        ...r,
        baseRent: defaultRent,
        securityDeposit: defaultDeposit,
        waterFixedCharge: defaultWaterCharge,
        trashCharge: defaultTrashCharge,
        parkingCharge: defaultParkingCharge
      }))
    );
  };

  const handleRoomChange = (index: number, field: keyof RoomDraft, value: any) => {
    setRooms(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleToggleRoomProperty = (roomIndex: number, propertyName: string) => {
    setRooms(prev => {
      const updated = [...prev];
      const currentProps = updated[roomIndex].properties || [];
      if (currentProps.includes(propertyName)) {
        updated[roomIndex].properties = currentProps.filter(p => p !== propertyName);
      } else {
        updated[roomIndex].properties = [...currentProps, propertyName];
      }
      return updated;
    });
  };

  const handleAddExtraRoom = () => {
    const newIdx = rooms.length + 1;
    const floor = Math.ceil(newIdx / 4);
    const letter = String.fromCharCode(65 + ((newIdx - 1) % 4));
    setRooms(prev => [
      ...prev,
      {
        unitNumber: `Unit ${floor}${letter}`,
        unitType: '2-Bedroom',
        baseRent: defaultRent,
        securityDeposit: defaultDeposit,
        waterFixedCharge: defaultWaterCharge,
        trashCharge: defaultTrashCharge,
        parkingCharge: defaultParkingCharge,
        properties: ['Ensuite Bathroom', 'Private Balcony'],
        tenantMode: 'vacant',
        tenantId: '',
        newTenantName: '',
        newTenantPhone: '',
        newTenantEmail: '',
        isExpanded: true
      }
    ]);
  };

  const handleRemoveRoom = (index: number) => {
    if (rooms.length <= 1) return;
    setRooms(prev => prev.filter((_, idx) => idx !== index));
  };

  const toggleApartmentProperty = (prop: string) => {
    setSelectedApartmentProps(prev =>
      prev.includes(prop) ? prev.filter(p => p !== prop) : [...prev, prop]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedLandlordId) {
      setErrorMessage('Please select a landlord. If none exist, use "Add Landlord" first.');
      return;
    }
    if (!apartmentName.trim()) {
      setErrorMessage('Please enter the apartment name.');
      return;
    }
    if (rooms.length < 1) {
      setErrorMessage('Apartment must have at least 1 room.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdProp = await db.createApartmentWithRooms({
        landlordId: selectedLandlordId,
        agentId: agentProfile.id,
        title: apartmentName.trim(),
        neighborhood: neighborhood || 'Nairobi',
        street: streetAddress || 'Estate Access Road',
        roomsCount: rooms.length,
        roomConfigs: rooms.map(r => {
          let tenantIdToPass: string | undefined = undefined;
          let newTenantToPass: { fullName: string; phoneNumber: string; email: string } | undefined = undefined;

          if (r.tenantMode === 'existing' && r.tenantId) {
            tenantIdToPass = r.tenantId;
          } else if (r.tenantMode === 'new' && r.newTenantName?.trim()) {
            newTenantToPass = {
              fullName: r.newTenantName.trim(),
              phoneNumber: r.newTenantPhone?.trim() || '+254700000000',
              email: r.newTenantEmail?.trim() || `${r.newTenantName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`
            };
          }

          return {
            unitNumber: r.unitNumber,
            unitType: r.unitType,
            baseRent: Number(r.baseRent) || 0,
            securityDeposit: Number(r.securityDeposit) || 0,
            waterFixedCharge: Number(r.waterFixedCharge) || 0,
            trashCharge: Number(r.trashCharge) || 0,
            parkingCharge: Number(r.parkingCharge) || 0,
            roomProperties: r.properties,
            tenantId: tenantIdToPass,
            newTenant: newTenantToPass
          };
        }),
        amenities: selectedApartmentProps,
        imageUrl: '/src/assets/images/property_kilimani_apartments_1792560785757.jpg'
      });

      const assignedCount = rooms.filter(r => r.tenantMode === 'existing' || (r.tenantMode === 'new' && r.newTenantName?.trim())).length;
      setSuccessMessage(`Apartment "${createdProp.title}" created with ${rooms.length} configured rooms (${assignedCount} occupied by tenants)!`);
      setApartmentName('');
      setStreetAddress('');

      setTimeout(() => {
        onSuccess();
      }, 1400);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save apartment and rooms');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 max-w-5xl">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Add Apartment & Room Inventory
          </h2>
          <p className="text-xs text-slate-500">
            Configure apartment amenities, individual room properties, all utility fees, and optional tenant allocations
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

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* ============================================================== */}
        {/* SECTION 1: APARTMENT BASICS */}
        {/* ============================================================== */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
            1. Apartment & Landlord Assignment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Landlord's Name <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedLandlordId}
                onChange={(e) => setSelectedLandlordId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {landlords.length === 0 ? (
                  <option value="">No landlords found — please add a landlord first</option>
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

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Apartment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Kilimani Rise Suites, Zenith Westlands, Parkview"
                value={apartmentName}
                onChange={(e) => setApartmentName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Initial Number of Rooms <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={48}
                value={numberOfRooms}
                onChange={(e) => setNumberOfRooms(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Neighborhood / Area
              </label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Kilimani">Kilimani, Nairobi</option>
                <option value="Westlands">Westlands, Nairobi</option>
                <option value="Kileleshwa">Kileleshwa, Nairobi</option>
                <option value="Parklands">Parklands, Nairobi</option>
                <option value="Lavington">Lavington, Nairobi</option>
                <option value="South C">South C, Nairobi</option>
                <option value="Thika Road">Thika Road / Roysambu</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Street / Estate Road
              </label>
              <input
                type="text"
                placeholder="e.g. Argwings Kodhek Rd"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 2: APARTMENT BUILDING AMENITIES */}
        {/* ============================================================== */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
                2. Apartment Building Amenities & Shared Facilities
              </h3>
              <p className="text-[11px] text-slate-500">
                Building-wide infrastructure shared by all tenant rooms
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              {selectedApartmentProps.length} Selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {availableApartmentProperties.map((prop, idx) => {
              const isSelected = selectedApartmentProps.includes(prop);
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => toggleApartmentProperty(prop)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all flex items-start gap-2 ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center text-[10px] ${
                    isSelected ? 'bg-emerald-600 text-white font-bold' : 'border border-slate-300'
                  }`}>
                    {isSelected ? '✓' : ''}
                  </span>
                  <span className="text-[11px] leading-snug">{prop}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 3: APARTMENT ROOMS, INDIVIDUAL ROOM PROPERTIES & ALL FEES & TENANTS */}
        {/* ============================================================== */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>3. Apartment Rooms & Individual Room Properties</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Edit individual fees (rent, deposit, water, trash, parking), configure room properties, and assign tenants directly per room
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddExtraRoom}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Extra Room</span>
              </button>
            </div>
          </div>

          {/* Quick Default Fee Template Bar with Bulk Apply */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Default Fee Templates (Batch Apply to All Rooms)</span>
              </span>
              <button
                type="button"
                onClick={handleApplyDefaultsToAll}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline"
              >
                Apply These Fees to All {rooms.length} Rooms
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-mono block">Base Rent (KES)</label>
                <input
                  type="number"
                  value={defaultRent}
                  onChange={(e) => setDefaultRent(Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono font-semibold bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-mono block">Deposit (KES)</label>
                <input
                  type="number"
                  value={defaultDeposit}
                  onChange={(e) => setDefaultDeposit(Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-mono block">Water Fee (KES)</label>
                <input
                  type="number"
                  value={defaultWaterCharge}
                  onChange={(e) => setDefaultWaterCharge(Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-mono block">Trash Fee (KES)</label>
                <input
                  type="number"
                  value={defaultTrashCharge}
                  onChange={(e) => setDefaultTrashCharge(Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-mono block">Parking (KES)</label>
                <input
                  type="number"
                  value={defaultParkingCharge}
                  onChange={(e) => setDefaultParkingCharge(Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                />
              </div>
            </div>
          </div>

          {/* Individual Room Cards / Rows */}
          <div className="space-y-3">
            {rooms.map((room, idx) => {
              const totalMonthlyDue = Number(room.baseRent) + Number(room.waterFixedCharge) + Number(room.trashCharge) + Number(room.parkingCharge);

              return (
                <div 
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3.5 hover:border-slate-300 transition-all"
                >
                  {/* Room Row Header: Room Number, Type, Tenant Status, Total Due, Remove */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">
                        {idx + 1}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={room.unitNumber}
                          onChange={(e) => handleRoomChange(idx, 'unitNumber', e.target.value)}
                          className="w-24 px-2.5 py-1 text-xs border border-slate-300 rounded font-mono font-bold text-slate-900"
                          placeholder="e.g. Unit 1A"
                        />

                        <select
                          value={room.unitType}
                          onChange={(e) => handleRoomChange(idx, 'unitType', e.target.value)}
                          className="px-2.5 py-1 text-xs border border-slate-300 rounded text-slate-800 font-medium"
                        >
                          <option value="Studio">Studio</option>
                          <option value="1-Bedroom">1-Bedroom</option>
                          <option value="2-Bedroom">2-Bedroom</option>
                          <option value="3-Bedroom">3-Bedroom</option>
                          <option value="Commercial Penthouse">Penthouse</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {/* Total Monthly Due for this room */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Monthly Due</span>
                        <span className="font-mono font-bold text-emerald-700 text-sm tabular-nums">
                          KES {totalMonthlyDue.toLocaleString()}
                        </span>
                      </div>

                      {/* Remove Room Button */}
                      {rooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRoom(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                          title="Remove this room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Room Fees Grid (Editable just like Rent and Deposit) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Monthly Rent (KES) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={room.baseRent}
                        onChange={(e) => handleRoomChange(idx, 'baseRent', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono font-bold text-slate-900 tabular-nums focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Security Deposit (KES) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={room.securityDeposit}
                        onChange={(e) => handleRoomChange(idx, 'securityDeposit', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono text-slate-800 tabular-nums focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Water Fee (KES)
                      </label>
                      <input
                        type="number"
                        value={room.waterFixedCharge}
                        onChange={(e) => handleRoomChange(idx, 'waterFixedCharge', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono text-slate-800 tabular-nums focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Trash Fee (KES)
                      </label>
                      <input
                        type="number"
                        value={room.trashCharge}
                        onChange={(e) => handleRoomChange(idx, 'trashCharge', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono text-slate-800 tabular-nums focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Parking Bay Fee (KES)
                      </label>
                      <input
                        type="number"
                        value={room.parkingCharge}
                        onChange={(e) => handleRoomChange(idx, 'parkingCharge', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono text-slate-800 tabular-nums focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Individual Room Properties / Amenities Selector */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span>Room Properties & Features:</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {room.properties.length} Active Features
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_ROOM_PROPERTIES.map((propName, pIdx) => {
                        const hasProp = room.properties.includes(propName);
                        return (
                          <button
                            type="button"
                            key={pIdx}
                            onClick={() => handleToggleRoomProperty(idx, propName)}
                            className={`px-2 py-0.5 text-[11px] rounded-md transition-all font-medium flex items-center gap-1 ${
                              hasProp
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                            }`}
                          >
                            <span>{hasProp ? '✓' : '+'}</span>
                            <span>{propName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tenant Assignment Section per room */}
                  <div className="pt-2.5 border-t border-slate-100 bg-slate-50/70 p-3 rounded-lg space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800">
                          Tenant Assignment for {room.unitNumber}:
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`tenant_mode_${idx}`}
                            checked={room.tenantMode === 'vacant'}
                            onChange={() => handleRoomChange(idx, 'tenantMode', 'vacant')}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-slate-700 font-medium">Vacant</span>
                        </label>

                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`tenant_mode_${idx}`}
                            checked={room.tenantMode === 'existing'}
                            onChange={() => handleRoomChange(idx, 'tenantMode', 'existing')}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-slate-700 font-medium">Existing Tenant</span>
                        </label>

                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`tenant_mode_${idx}`}
                            checked={room.tenantMode === 'new'}
                            onChange={() => handleRoomChange(idx, 'tenantMode', 'new')}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-slate-700 font-medium">+ New Tenant</span>
                        </label>
                      </div>
                    </div>

                    {/* If existing tenant selected */}
                    {room.tenantMode === 'existing' && (
                      <div className="pt-1">
                        <select
                          value={room.tenantId || ''}
                          onChange={(e) => handleRoomChange(idx, 'tenantId', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                        >
                          <option value="">Select registered tenant...</option>
                          {existingTenants.map(t => (
                            <option key={t.tenantId || t.id} value={t.tenantId || t.id}>
                              {t.fullName} ({t.phoneNumber})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* If new tenant selected */}
                    {room.tenantMode === 'new' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <div>
                          <input
                            type="text"
                            placeholder="Tenant Full Name"
                            value={room.newTenantName || ''}
                            onChange={(e) => handleRoomChange(idx, 'newTenantName', e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div>
                          <input
                            type="tel"
                            placeholder="Phone Number (e.g. 0712345678)"
                            value={room.newTenantPhone || ''}
                            onChange={(e) => handleRoomChange(idx, 'newTenantPhone', e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                          />
                        </div>
                        <div>
                          <input
                            type="email"
                            placeholder="Email Address (optional)"
                            value={room.newTenantEmail || ''}
                            onChange={(e) => handleRoomChange(idx, 'newTenantEmail', e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
            disabled={isSubmitting || landlords.length === 0}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Saving Apartment & Inventory...'
                : `Save Apartment (${rooms.length} Rooms Configured)`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
