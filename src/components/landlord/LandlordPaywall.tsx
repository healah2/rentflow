import React from 'react';
import { LandlordProfile, Invoice, User } from '../../types';
import { 
  Lock, 
  Smartphone, 
  AlertTriangle, 
  ShieldCheck, 
  Building2, 
  ArrowRight,
  Clock
} from 'lucide-react';

interface LandlordPaywallProps {
  currentUser: User;
  landlordProfile: LandlordProfile;
  managementFeeInvoice?: Invoice;
  onPayMpesa: (invoice: Invoice) => void;
}

export const LandlordPaywall: React.FC<LandlordPaywallProps> = ({
  currentUser,
  landlordProfile,
  managementFeeInvoice,
  onPayMpesa
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Alert Banner */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 mb-8 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-amber-900">
              Landlord Portal Restricted — Management Fee Overdue
            </h2>
            <span className="text-[11px] font-mono uppercase bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded">
              Status: OVERDUE
            </span>
          </div>
          <p className="text-xs text-amber-800 mt-1">
            Your monthly property management administration fee is overdue. Real-time net yield analytics and direct tenant communications are paused.
          </p>
          <div className="mt-2 text-[11px] text-amber-700 font-medium">
            <strong>Managing Agent Continuity:</strong> Your managing agent continues day-to-day on-site management, rent collection, and maintenance handling uninterrupted.
          </div>
        </div>
      </div>

      {/* Payment Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monthly Management Fee
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Invoice #{managementFeeInvoice ? managementFeeInvoice.invoiceNumber : 'INV-MGT-OVERDUE'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              Due: {managementFeeInvoice ? managementFeeInvoice.dueDate : 'Overdue'}
            </span>
          </div>

          <div>
            <div className="text-xs text-slate-500">Amount Due to Managing Agent</div>
            <div className="text-3xl font-bold font-mono text-slate-900 tabular-nums mt-0.5">
              KES {landlordProfile.managementFeeAmount.toLocaleString()}
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Pay directly to your managing agent via instant M-Pesa STK Push or enter your transaction reference after paying to their Paybill/Till number.
          </p>

          <div className="pt-2">
            {managementFeeInvoice ? (
              <button
                onClick={() => onPayMpesa(managementFeeInvoice)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Pay Management Fee via M-Pesa</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2.5 px-4 bg-slate-300 text-slate-600 font-semibold text-sm rounded-lg cursor-not-allowed"
              >
                No active invoice found
              </button>
            )}
          </div>
        </div>

        {/* Isolation Note & Info */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col justify-between text-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Isolated Financial Relationship</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              RentFlow strictly enforces that landlord management fee transactions are quarantined from tenant rent and platform subscription revenue.
            </p>
            <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono space-y-1 text-[11px] text-slate-700">
              <div>Managing Agent: Apex Property Management</div>
              <div>Agent Paybill: 714920</div>
              <div>Account: MGT-{currentUser.id.slice(-4).toUpperCase()}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500">
            Once payment is confirmed by your managing agent, access will unlock automatically.
          </div>
        </div>
      </div>
    </div>
  );
};
