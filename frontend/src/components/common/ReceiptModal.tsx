import React from 'react';
import { Receipt } from '../../types';
import { 
  CheckCircle, 
  Printer, 
  X, 
  Building2, 
  ShieldCheck, 
  QrCode
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt
}) => {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPipelineLabel = () => {
    switch (receipt.pipelineType) {
      case 'PLATFORM_SUBSCRIPTION':
        return 'SaaS Platform Subscription Payment';
      case 'AGENT_MANAGEMENT_FEE':
        return 'Landlord Property Management Fee';
      case 'TENANT_RENT_UTILITY':
        return 'Tenant Rental & Utilities Remittance';
      default:
        return 'Payment Receipt';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 transition-all relative print:p-0 print:border-none print:shadow-none">
        
        {/* Controls - Hidden during print */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Verified Digital Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="mt-4 p-6 bg-slate-50/50 rounded-xl border border-slate-200 print:bg-white print:border-none print:p-0">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-300">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">RentFlow</h2>
                <p className="text-[10px] text-slate-500 font-mono">Verified Kenyan Real Estate Clearing</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block text-xs font-mono font-bold text-slate-900">
                {receipt.receiptNumber}
              </span>
              <p className="text-[11px] text-slate-500">
                Date: {new Date(receipt.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Subheader Classification */}
          <div className="py-3 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Category:</span>
            <span className="font-semibold text-slate-900">{getPipelineLabel()}</span>
          </div>

          {/* Payer and Payee Info */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Paid By (Payer)</span>
              <div className="font-semibold text-slate-900">{receipt.payerName}</div>
              <div className="font-mono text-slate-500">{receipt.payerPhone}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Paid To (Payee)</span>
              <div className="font-semibold text-slate-900">{receipt.payeeName}</div>
              <div className="font-mono text-slate-500">Invoice Ref: {receipt.invoiceNumber}</div>
            </div>
          </div>

          {/* Itemized Breakdown */}
          <div className="py-4 border-b border-slate-200">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-2">Itemized Breakdown</span>
            <div className="space-y-2">
              {receipt.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{item.title}</span>
                  <span className="font-mono font-medium tabular-nums text-slate-900">
                    KES {item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total & M-Pesa Transaction ID */}
          <div className="pt-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">M-Pesa Reference</div>
              <div className="text-sm font-mono font-bold text-emerald-700">
                {receipt.mpesaReference}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-mono text-slate-400">Total Paid in Full</div>
              <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                KES {receipt.amount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Verification Stamp & QR Code */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">STATUS: CLEARED & STAMPED</span>
            </div>
            <div className="text-right truncate max-w-[200px]">
              HASH: {receipt.verificationCode}
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500 no-print">
          This is an official computer-generated receipt issued pursuant to the Kenya Tenancy Laws.
        </div>
      </div>
    </div>
  );
};
