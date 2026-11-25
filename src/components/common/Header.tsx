import React from 'react';
import { User } from '../../types';
import { 
  Building2, 
  Bell, 
  Code2, 
  RefreshCw, 
  LogOut
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onOpenNotifications: () => void;
  onOpenDjangoCode: () => void;
  onResetData: () => void;
  onLogout?: () => void;
  unreadNotifsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenNotifications,
  onOpenDjangoCode,
  onResetData,
  onLogout,
  unreadNotifsCount
}) => {
  const getRoleBadgeStyle = (role: User['role']) => {
    switch (role) {
      case 'ADMIN':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'AGENT':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'LANDLORD':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'TENANT':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Strict 1-line text) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
            RentFlow
          </span>
          <span className="hidden sm:inline-block text-xs font-mono text-slate-400 border-l border-slate-200 pl-2.5">
            KES SaaS Engine
          </span>
        </div>

        {/* Zone 2: Navigation / Quick Actions (Single-line) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button 
            onClick={onOpenDjangoCode}
            className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0"
            title="Inspect Django DRF Backend Code"
          >
            <Code2 className="w-4 h-4 text-indigo-600" />
            <span>Django & DRF Spec</span>
          </button>

          <button 
            onClick={onResetData}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap shrink-0 text-xs"
            title="Reset database to initial seed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo DB</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Persona Profile & Notifications */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notifications Trigger */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="View WhatsApp & Email Dispatch Log"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white font-mono text-[10px] font-semibold rounded-full flex items-center justify-center">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Current User Active Pill / Switcher Button */}
          <div className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200">
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.fullName}
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <div className="hidden sm:block text-xs leading-tight">
              <div className="font-semibold text-slate-800 truncate max-w-[130px]">
                {currentUser.fullName}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                {currentUser.role}
              </div>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${getRoleBadgeStyle(currentUser.role)}`}>
              {currentUser.role}
            </span>
          </div>

          {/* Log Out Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
              title="Sign out of RentFlow to Universal Login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
