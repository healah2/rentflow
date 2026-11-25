import React, { useState } from 'react';
import { AgentProfile, Invoice, User } from '../../types';
import { 
  Lock, 
  Smartphone, 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  CreditCard, 
  LifeBuoy, 
  UserCheck, 
  FileText,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface AgentPaywallProps {
  currentUser: User;
  agentProfile: AgentProfile;
  subscriptionInvoice?: Invoice;
  onPayMpesa: (invoice: Invoice) => void;
}

export const AgentPaywall: React.FC<AgentPaywallProps> = ({
  currentUser,
  agentProfile,
  subscriptionInvoice,
  onPayMpesa
}) => {
  const [activeTab, setActiveTab] = useState<'subscription' | 'account' | 'support'>('subscription');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Paywall Alert Banner */}
      <div className="rounded-xl bg-red-50 border border-red-200 p-5 mb-8 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-red-900">
              Operational Dashboard Restricted — SaaS Subscription {agentProfile.subscriptionStatus === 'expired' ? 'Expired' : 'Unpaid'}
            </h2>
            <span className="text-[11px] font-mono uppercase bg-red-200 text-red-800 font-bold px-2 py-0.5 rounded">
              Status: {agentProfile.subscriptionStatus.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-red-700 mt-1">
            Access to property operations, tenant invoicing, and management fee collections is paused until your monthly SaaS subscription is settled.
          </p>
          <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              <strong>Zero Data Loss Guarantee:</strong> All {agentProfile.managedPropertiesCount} properties, landlords, leases, and financial ledgers remain preserved and untouched.
            </span>
          </p>
        </div>
      </div>

      {/* Permitted Sub-Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'subscription'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Subscription & Payment</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'account'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Agency Profile & Account</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'support'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Billing Support & Help</span>
        </button>
      </div>

      {/* TAB 1: Subscription & Payment */}
      {activeTab === 'subscription' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Invoice Card */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {agentProfile.subscriptionPlan} SaaS Plan Renewal
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Invoice #{subscriptionInvoice ? subscriptionInvoice.invoiceNumber : 'INV-SUB-PENDING'}
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                Payment Required
              </span>
            </div>

            <div className="py-6 border-b border-slate-200 space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-slate-500">Subscription Amount</div>
                  <div className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
                    KES {agentProfile.monthlySubscriptionFee.toLocaleString()}
                    <span className="text-xs font-normal text-slate-500"> / month</span>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono">
                  <div>Billing Period: 30 Days</div>
                  <div>Grace Expiry: Immediate</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
                <div className="font-semibold text-slate-900">Included in your {agentProfile.subscriptionPlan} Plan:</div>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                  <li>Unlimited rental properties, units, and tenant lease management</li>
                  <li>Safaricom M-Pesa STK Push direct rent collection to your agency till/paybill</li>
                  <li>WhatsApp Business Platform automated rent notifications & receipts</li>
                  <li>Landlord monthly management fee billing & ledger reconciliations</li>
                  <li>Maintenance and work order tracking module</li>
                </ul>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Payment channels supported: <strong className="text-slate-800">M-Pesa STK Push</strong> or <strong className="text-slate-800">Manual Code</strong>.
              </div>
              {subscriptionInvoice ? (
                <button
                  onClick={() => onPayMpesa(subscriptionInvoice)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center gap-2 shrink-0"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Pay Now (KES {agentProfile.monthlySubscriptionFee.toLocaleString()})</span>
                </button>
              ) : (
                <button
                  disabled
                  className="px-6 py-2.5 bg-slate-300 text-slate-600 font-semibold text-sm rounded-lg shrink-0 cursor-not-allowed"
                >
                  Invoice Generating...
                </button>
              )}
            </div>
          </div>

          {/* Quick Paybill Instructions */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
                <Smartphone className="w-4 h-4" />
                <span>RentFlow SaaS Paybill</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-4">
                Manual Remittance Info
              </h4>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <div className="text-slate-400 text-[10px] uppercase">Lipa na M-Pesa Paybill</div>
                  <div className="text-lg font-bold text-white">522522</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <div className="text-slate-400 text-[10px] uppercase">Account Number</div>
                  <div className="text-base font-bold text-emerald-400">RF-APEX-SUB</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <div className="text-slate-400 text-[10px] uppercase">Exact Amount</div>
                  <div className="text-base font-bold text-white">KES {agentProfile.monthlySubscriptionFee.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-6 pt-4 border-t border-slate-800 leading-relaxed">
              Upon remittance, submit your M-Pesa transaction reference using the Pay button to notify the platform administrator for instant verification.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: Agency Profile & Account */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Agency Account Profile
          </h3>
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-500 block mb-1">Agency Name</label>
                <div className="font-semibold text-slate-800 text-sm">{agentProfile.agencyName}</div>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Primary Email</label>
                <div className="font-semibold text-slate-800 text-sm">{currentUser.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-500 block mb-1">M-Pesa Disbursal Phone</label>
                <div className="font-mono text-slate-800">{currentUser.phoneNumber}</div>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Agency Paybill / Till Number</label>
                <div className="font-mono text-slate-800">{agentProfile.paybillNumber}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-slate-600">
              Agency registered on RentFlow since {new Date(currentUser.createdAt).toLocaleDateString()}.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Support */}
      {activeTab === 'support' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-4 text-xs">
          <h3 className="text-base font-bold text-slate-900">
            RentFlow Billing & Enterprise Support
          </h3>
          <p className="text-slate-600">
            Need assistance renewing or upgrading your SaaS subscription? Our Nairobi-based enterprise team is on standby 24/7.
          </p>
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2 text-emerald-900 font-mono">
            <div>WhatsApp Desk: +254 700 112 233</div>
            <div>Billing Inquiries: billing@rentflow.co.ke</div>
            <div>Office: The Promenade, 4th Floor, General Mathenge Road, Westlands, Nairobi</div>
          </div>
        </div>
      )}
    </div>
  );
};
