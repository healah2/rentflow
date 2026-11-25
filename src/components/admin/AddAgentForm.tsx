import React, { useState } from 'react';
import { User, AgentProfile } from '../../types';
import { db } from '../../services/db';
import { 
  UserPlus, 
  CheckCircle, 
  AlertCircle, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  DollarSign, 
  ShieldCheck, 
  KeyRound, 
  Sparkles, 
  ArrowRight,
  Send
} from 'lucide-react';

interface AddAgentFormProps {
  currentUser: User;
  onSuccess: (newAgentUser?: User) => void;
  onCancel?: () => void;
}

export const AddAgentForm: React.FC<AddAgentFormProps> = ({
  currentUser,
  onSuccess,
  onCancel
}) => {
  // Agent Details
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [officeLocation, setOfficeLocation] = useState('Westlands, Nairobi');
  const [paybillNumber, setPaybillNumber] = useState('247247');

  // Agent Fee (Paid to System Admin)
  const [subscriptionPlan, setSubscriptionPlan] = useState<'Starter' | 'Professional' | 'Enterprise'>('Professional');
  const [monthlyFee, setMonthlyFee] = useState<number>(15000);
  const [initialStatus, setInitialStatus] = useState<'active' | 'pending_payment'>('active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{
    user: User;
    profile: AgentProfile;
  } | null>(null);

  // Auto-fill preset fee when tier changes if fee matches defaults
  const handleTierChange = (tier: 'Starter' | 'Professional' | 'Enterprise') => {
    setSubscriptionPlan(tier);
    if (tier === 'Starter') setMonthlyFee(8000);
    else if (tier === 'Professional') setMonthlyFee(15000);
    else if (tier === 'Enterprise') setMonthlyFee(25000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage("Please enter the agent's full name.");
      return;
    }
    if (!agencyName.trim()) {
      setErrorMessage('Please enter the agency / company name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address for login.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 9) {
      setErrorMessage('Please enter a valid phone number (e.g. 0712345678) which will serve as their login password.');
      return;
    }
    if (Number(monthlyFee) <= 0) {
      setErrorMessage('Please enter a valid monthly platform subscription fee.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await db.createAgent({
        fullName: fullName.trim(),
        agencyName: agencyName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        officeLocation: officeLocation.trim(),
        subscriptionPlan,
        monthlySubscriptionFee: Number(monthlyFee),
        initialStatus,
        paybillNumber: paybillNumber.trim()
      });

      setSuccessData({
        user: result.user,
        profile: result.profile
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Add New Managing Agent
          </h2>
          <p className="text-xs text-slate-500">
            Register an agency to the SaaS platform, define their platform fee, and provision their login credentials
          </p>
        </div>
      </div>

      {/* Success View */}
      {successData ? (
        <div className="mt-6 p-6 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Agent "{successData.profile.agencyName}" Successfully Registered!</span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            The agent profile and SaaS monthly subscription invoice have been created in the database. 
            A welcome dispatch with login details has been sent to their WhatsApp/SMS.
          </p>

          <div className="p-4 bg-white rounded-lg border border-emerald-200 space-y-2 text-xs">
            <div className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] font-mono">
              Generated Credentials for Universal Login:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-500 block text-[11px]">Login Email Address:</span>
                <span className="font-mono font-bold text-slate-900">{successData.user.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Password (Registered Phone):</span>
                <span className="font-mono font-bold text-slate-900">{successData.user.phoneNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Agreed Monthly Platform Fee:</span>
                <span className="font-mono font-bold text-emerald-700">KES {successData.profile.monthlySubscriptionFee.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Subscription Status:</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  successData.profile.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {successData.profile.subscriptionStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setSuccessData(null);
                setFullName('');
                setAgencyName('');
                setEmail('');
                setPhoneNumber('');
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Add Another Agent
            </button>
            <button
              type="button"
              onClick={() => onSuccess(successData.user)}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>View in Subscriptions Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Form View */
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Agent Identification & Contact */}
          <div className="space-y-3.5">
            <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              <span>1. Agent Contact & Business Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Agent Full Name (Primary Contact) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paul Otieno"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Agency / Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Otieno Premier Real Estate Ltd"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Email Address (Login Username) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="e.g. paul.otieno@apexproperties.co.ke"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Used by the agent to log into the RentFlow system</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Phone Number (Safaricom M-Pesa / Login Password) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    placeholder="e.g. 0722123456"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Serves as the agent's default login password & M-Pesa push recipient
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Office Location / City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Delta Corner, Westlands, Nairobi"
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Agency M-Pesa Paybill / Till Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 247247"
                  value={paybillNumber}
                  onChange={(e) => setPaybillNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Agent Fee to System Admin */}
          <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-4">
            <div className="text-xs font-semibold text-purple-900 uppercase tracking-wider font-mono flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-purple-700" />
                2. Agent SaaS Platform Fee (Payable to System Admin)
              </span>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                Pipeline A: Agent $\rightarrow$ SaaS Platform
              </span>
            </div>

            {/* Plan Tier Selector */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { tier: 'Starter' as const, fee: 8000, desc: 'Up to 25 Units' },
                { tier: 'Professional' as const, fee: 15000, desc: 'Up to 100 Units' },
                { tier: 'Enterprise' as const, fee: 25000, desc: 'Unlimited Units' }
              ].map(plan => (
                <div
                  key={plan.tier}
                  onClick={() => handleTierChange(plan.tier)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    subscriptionPlan === plan.tier 
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs' 
                      : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <div className="font-bold text-xs">{plan.tier}</div>
                  <div className={`font-mono text-xs font-semibold mt-1 ${subscriptionPlan === plan.tier ? 'text-purple-100' : 'text-purple-700'}`}>
                    KES {plan.fee.toLocaleString()}/mo
                  </div>
                  <div className={`text-[10px] mt-0.5 ${subscriptionPlan === plan.tier ? 'text-purple-200' : 'text-slate-500'}`}>
                    {plan.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly Fee and Initial Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Agreed Monthly Subscription Fee (KES) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-500">KES</span>
                  <input
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(Number(e.target.value))}
                    required
                    min={1000}
                    step={500}
                    className="w-full pl-12 pr-3 py-2 text-xs border border-purple-300 rounded-lg font-mono font-bold text-purple-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Amount billed monthly by System Admin to this agent
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Initial Subscription Entitlement <span className="text-red-500">*</span>
                </label>
                <select
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-purple-300 rounded-lg bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Active (Immediate 30-Day Access Granted)</option>
                  <option value="pending_payment">Pending Payment (Enforce Agent Paywall until Paid)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {initialStatus === 'active' 
                    ? 'Receipt generated and platform dashboard unlocked immediately.'
                    : 'Holds agent at paywall until they pay KES ' + monthlyFee.toLocaleString() + ' via M-Pesa.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Credentials & Access Preview */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start gap-3">
            <KeyRound className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-800">Universal Login Credentials Preview:</span>
              <p className="text-[11px] text-slate-600">
                Agent will be able to log in at the single login screen using:
                <br />
                <strong>Email:</strong> <span className="font-mono">{email || '[entered email]'}</span>
                <br />
                <strong>Password:</strong> <span className="font-mono">{phoneNumber || '[entered phone number]'}</span>
              </p>
            </div>
          </div>

          {/* Form Actions */}
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
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering Agent...' : 'Register Agent & Issue SaaS Contract'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
