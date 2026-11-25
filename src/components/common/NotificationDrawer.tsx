import React, { useState } from 'react';
import { NotificationLog } from '../../types';
import { 
  X, 
  MessageSquare, 
  Mail, 
  CheckCheck, 
  Clock, 
  Send
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationLog[];
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications
}) => {
  const [activeChannel, setActiveChannel] = useState<'all' | 'whatsapp' | 'email'>('all');

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter(n => {
    if (activeChannel === 'all') return true;
    return n.channel === activeChannel;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                WhatsApp & Email Dispatch Logs
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Real-time automated tenancy notifications
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Filters */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => setActiveChannel('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              activeChannel === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Logs ({notifications.length})
          </button>
          <button
            onClick={() => setActiveChannel('whatsapp')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeChannel === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp API</span>
          </button>
          <button
            onClick={() => setActiveChannel('email')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeChannel === 'email'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-100/60">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No dispatched messages yet. Perform an action like issuing an invoice, paying with M-Pesa, or submitting a ticket.
            </div>
          ) : (
            filteredNotifs.map(notif => {
              const isWhatsApp = notif.channel === 'whatsapp';
              return (
                <div 
                  key={notif.id}
                  className={`rounded-xl p-3.5 shadow-xs border text-xs transition-all ${
                    isWhatsApp 
                      ? 'bg-emerald-50/90 border-emerald-200 text-slate-800' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-black/5">
                    <div className="flex items-center gap-1.5 font-semibold">
                      {isWhatsApp ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          WhatsApp Business API
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                          <Mail className="w-3.5 h-3.5 text-indigo-600" />
                          Email Delivery
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="mt-2 font-semibold text-slate-900">
                    {notif.title}
                  </div>

                  <p className="mt-1 text-slate-700 leading-relaxed text-[11px] whitespace-pre-wrap">
                    {notif.body}
                  </p>

                  <div className="mt-2.5 pt-1.5 border-t border-black/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>To: {notif.recipientName} ({notif.recipientContact})</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      DELIVERED
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 bg-white text-[11px] text-slate-500 flex items-center justify-between">
          <span>Provider: Meta Cloud API / SendGrid</span>
          <span className="font-mono text-emerald-700 font-semibold">SLA: 99.98%</span>
        </div>
      </div>
    </div>
  );
};
