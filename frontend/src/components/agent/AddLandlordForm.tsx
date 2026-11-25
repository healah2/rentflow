import React, { useState } from 'react';
import { User, AgentProfile } from '../../types';
import { db } from '../../services/db';
import { UserPlus, CheckCircle, Smartphone, Mail, User as UserIcon, Building2, AlertCircle } from 'lucide-react';

interface AddLandlordFormProps {
  currentUser: User;
  agentProfile: AgentProfile;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const AddLandlordForm: React.FC<AddLandlordFormProps> = ({
  currentUser,
  agentProfile,
  onSuccess,
  onCancel
}) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [monthlyFeeAmount, setMonthlyFeeAmount] = useState(agentProfile.defaultManagementFee || 3500);
  const [bankName, setBankName] = useState('Equity Bank Kenya');
  const [bankAccount, setBankAccount] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage("Please enter the landlord's full name.");
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 9) {
      setErrorMessage('Please enter a valid phone number (e.g. 0712345678 or +254712345678).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await db.createLandlord({
        fullName,
        phoneNumber,
        email,
        agentId: agentProfile.id,
        monthlyFeeAmount: Number(monthlyFeeAmount),
        bankName: bankName || 'Equity Bank Kenya',
        bankAccount: bankAccount || `0180${Math.floor(100000000 + Math.random() * 900000000)}`,
      });

      setSuccessMessage(`Landlord "${result.user.fullName}" added successfully! Dedicated portal and credentials initialized.`);
      setFullName('');
      setPhoneNumber('');
      setEmail('');
      setBankAccount('');
      
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add landlord');
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
            Add Landlord
          </h2>
          <p className="text-xs text-slate-500">
            Register a new property owner under {agentProfile.agencyName}
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">{successMessage}</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              An automated WhatsApp welcome message has been dispatched to the landlord's phone.
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

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Field 1: Landlord's Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Landlord's Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="e.g. Peter Njuguna Kariuki"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Field 2: Phone Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Phone Number (M-Pesa Enabled) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="tel"
              placeholder="e.g. 0712345678 or +254712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Used for automated M-Pesa management fee requests and WhatsApp payment notifications.
          </p>
        </div>

        {/* Field 3: Email Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="email"
              placeholder="e.g. peter.njuguna@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Optional Secondary Configuration */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>Management Fee & Payout Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1">Monthly Fee (KES)</label>
              <input
                type="number"
                value={monthlyFeeAmount}
                onChange={(e) => setMonthlyFeeAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Disbursal Bank</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
              >
                <option value="Equity Bank Kenya">Equity Bank Kenya</option>
                <option value="KCB Bank">KCB Bank</option>
                <option value="Co-operative Bank">Co-operative Bank</option>
                <option value="NCBA Bank">NCBA Bank</option>
                <option value="Standard Chartered">Standard Chartered</option>
                <option value="Absa Bank Kenya">Absa Bank Kenya</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">Bank Account Number</label>
              <input
                type="text"
                placeholder="e.g. 0180293847291"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 flex items-center justify-end gap-3">
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
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isSubmitting ? 'Registering Landlord...' : 'Save Landlord'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
