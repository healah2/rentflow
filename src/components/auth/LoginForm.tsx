import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { db } from '../../services/db';
import { 
  Building2, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle, 
  KeyRound
} from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ user: User; roleLabel: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const authResult = await db.authenticateUser(email, password);

      if (!authResult.success || !authResult.user) {
        setErrorMessage(authResult.error || 'Authentication failed. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      const roleLabels: Record<UserRole, string> = {
        ADMIN: 'System Administrator',
        AGENT: 'Managing Agent',
        LANDLORD: 'Property Landlord',
        TENANT: 'Resident Tenant'
      };

      setSuccessInfo({
        user: authResult.user,
        roleLabel: roleLabels[authResult.user.role]
      });

      // Instantly open the dashboard
      onLoginSuccess(authResult.user);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Wordmark & Introduction */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in to RentFlow
          </h1>
          <p className="mt-1.5 text-xs text-slate-600">
            Multi-Tenant SaaS Rental Management System · Kenya
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600">
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sign in with your Django account credentials</span>
          </div>
        </div>

        {/* Single Universal Login Card */}
        <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successInfo && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Access Granted: </span>
                <span>Opening {successInfo.roleLabel} Dashboard for {successInfo.user.fullName}...</span>
              </div>
            </div>
          )}

          {/* THE SINGLE UNIVERSAL LOGIN FORM */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Field 1: Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Email or Django Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Your Django username or account email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  Password <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Boundaries & Role Routing Explanation */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              RentFlow searches the database and automatically routes you to your authorized dashboard (System Admin, Agent, Landlord, or Tenant).
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs text-xs text-slate-600">
        <p className="font-semibold text-slate-800">System administrator access</p>
        <p className="mt-1">
          Sign in with the username and password for a Django superuser created with <code>python manage.py createsuperuser</code>.
          Other roles use accounts provisioned by the system.
        </p>
        </div>
      </div>
    </div>
  );
};
