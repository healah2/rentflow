import React from 'react';
import { User } from '../../types';
import { 
  ShieldCheck, 
  Briefcase, 
  Home, 
  User as UserIcon, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Lock,
  ArrowRight
} from 'lucide-react';

interface RoleSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onSelectUser: (userId: string) => void;
  onGoToLogin?: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onSelectUser,
  onGoToLogin
}) => {
  if (!isOpen) return null;

  const personas = [
    {
      id: 'user-admin',
      label: 'System Administrator',
      subtext: 'Platform Owner · SaaS ARR/MRR · Verifies Agent Subscriptions',
      icon: ShieldCheck,
      iconColor: 'text-purple-600 bg-purple-50',
      badge: 'Platform Superuser',
      badgeColor: 'bg-purple-100 text-purple-800',
      testFeature: 'Review & approve agent manual payments, monitor global KES revenue'
    },
    {
      id: 'user-agent-active',
      label: 'Sarah Wanjiku (Active Agent)',
      subtext: 'Apex Property Management · Subscribed · Full Dashboard Access',
      icon: Briefcase,
      iconColor: 'text-emerald-600 bg-emerald-50',
      badge: 'Active Subscription',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      testFeature: 'Manage properties, issue itemized tenant invoices, verify M-Pesa codes'
    },
    {
      id: 'user-agent-expired',
      label: 'David Ochieng (Expired Agent)',
      subtext: 'Rift Real Estate · Subscription Expired · Restricted Access',
      icon: Lock,
      iconColor: 'text-red-600 bg-red-50',
      badge: 'Paywall Demo',
      badgeColor: 'bg-red-100 text-red-800 font-semibold',
      testFeature: 'Test the strict Agent Subscription Paywall & M-Pesa reactivation flow'
    },
    {
      id: 'user-landlord-active',
      label: 'James Mwangi (Active Landlord)',
      subtext: 'Property Owner · Kilimani Rise · Management Fee Paid Up',
      icon: Home,
      iconColor: 'text-blue-600 bg-blue-50',
      badge: 'Fee Paid',
      badgeColor: 'bg-blue-100 text-blue-800',
      testFeature: 'Inspect gross rental collections, agent fee deductions, and net yield'
    },
    {
      id: 'user-landlord-overdue',
      label: 'Beatrice Mutua (Overdue Landlord)',
      subtext: 'Property Owner · The Zenith Westlands · Management Fee Overdue',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 bg-amber-50',
      badge: 'Fee Paywall Demo',
      badgeColor: 'bg-amber-100 text-amber-800 font-semibold',
      testFeature: 'Test Landlord Management Fee Paywall (agent still administers units)'
    },
    {
      id: 'user-tenant-1',
      label: 'Brian Otieno (Tenant)',
      subtext: 'Apartment 4B, Kilimani Rise · Outstanding Rent & Utilities',
      icon: UserIcon,
      iconColor: 'text-cyan-600 bg-cyan-50',
      badge: 'Tenant Portal',
      badgeColor: 'bg-cyan-100 text-cyan-800',
      testFeature: 'Interactive M-Pesa STK Push payment, receipt generation & complaints'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 transition-all">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Role-Based Access Demo Switcher
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any role to test strict access control, isolated payment streams, and paywalls
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {personas.map(persona => {
            const isCurrent = currentUser.id === persona.id;
            const Icon = persona.icon;

            return (
              <button
                key={persona.id}
                onClick={() => {
                  onSelectUser(persona.id);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-start justify-between gap-4 ${
                  isCurrent 
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg ${persona.iconColor} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {persona.label}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${persona.badgeColor}`}>
                        {persona.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {persona.subtext}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span>{persona.testFeature}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pt-1">
                  {isCurrent ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-md border border-emerald-300 shadow-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Active
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-500 hover:text-slate-800">
                      Switch →
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
            <p>
              <strong className="text-slate-800">3-Pipeline Financial Isolation:</strong> Agent subscriptions, Landlord management fees, and Tenant rent/utilities are segregated into separate database tables and never mixed in reports.
            </p>
          </div>
          {onGoToLogin && (
            <button
              onClick={() => {
                onClose();
                onGoToLogin();
              }}
              className="shrink-0 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              Universal Login Form →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
