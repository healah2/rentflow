import React, { useState } from 'react';
import { Invoice, Payment, Receipt } from '../../types';
import { db } from '../../services/db';
import { 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Send, 
  Clock, 
  FileText,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

interface MpesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onPaymentSuccess: (receipt: Receipt) => void;
  onManualSubmitted: (payment: Payment) => void;
}

export const MpesaModal: React.FC<MpesaModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
  onManualSubmitted
}) => {
  const [activeTab, setActiveTab] = useState<'stk' | 'manual'>('stk');
  const [phoneNumber, setPhoneNumber] = useState('0712345678');
  const [manualCode, setManualCode] = useState('');
  const [notes, setNotes] = useState('');
  
  // STK Push state simulation
  const [stkStep, setStkStep] = useState<'idle' | 'prompting' | 'pin_dialog' | 'processing' | 'done'>('idle');
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !invoice) return null;

  const getPaybillDetails = () => {
    if (invoice.pipelineType === 'PLATFORM_SUBSCRIPTION') {
      return {
        paybill: '522522',
        account: `RF-${invoice.payerId.slice(-4).toUpperCase()}`,
        businessName: 'RentFlow Cloud Platform'
      };
    }
    if (invoice.pipelineType === 'AGENT_MANAGEMENT_FEE') {
      return {
        paybill: '714920',
        account: `MGT-${invoice.payerId.slice(-4).toUpperCase()}`,
        businessName: invoice.payeeName
      };
    }
    return {
      paybill: '714920',
      account: `APX-${invoice.unitId ? invoice.unitId.slice(-4).toUpperCase() : 'RENT'}`,
      businessName: invoice.payeeName
    };
  };

  const handleStartStkPush = () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      setErrorMessage('Please enter a valid Safaricom phone number (e.g. 0712345678)');
      return;
    }
    setErrorMessage('');
    setStkStep('prompting');

    // Simulate network delay to Safaricom Daraja STK Push trigger
    setTimeout(() => {
      setStkStep('pin_dialog');
    }, 1000);
  };

  const handleConfirmStkPin = () => {
    setStkStep('processing');
    setTimeout(async () => {
      try {
        const { receipt } = await db.processMpesaStkPayment(invoice.id, phoneNumber);
        setStkStep('done');
        setTimeout(() => {
          onPaymentSuccess(receipt);
          onClose();
          resetState();
        }, 800);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Payment processing failed');
        setStkStep('idle');
      }
    }, 1200);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode || manualCode.trim().length < 8) {
      setErrorMessage('Please enter a valid 10-character M-Pesa transaction reference (e.g. QHK9283JD8)');
      return;
    }
    try {
      const payment = await db.submitManualMpesaPayment(invoice.id, manualCode, phoneNumber, notes);
      onManualSubmitted(payment);
      onClose();
      resetState();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed');
    }
  };

  const resetState = () => {
    setStkStep('idle');
    setPinInput('');
    setManualCode('');
    setNotes('');
    setErrorMessage('');
  };

  const paybillInfo = getPaybillDetails();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 transition-all relative">
        <button 
          onClick={() => { onClose(); resetState(); }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Safaricom M-Pesa Checkout
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Invoice #{invoice.invoiceNumber} · {invoice.billingPeriod}
            </p>
          </div>
        </div>

        {/* Amount Banner */}
        <div className="my-4 p-4 rounded-lg bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">Total Amount Payable</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
              KES {invoice.amount.toLocaleString()}
            </div>
          </div>
          <div className="text-right text-xs text-slate-300">
            <div className="font-semibold text-white">{paybillInfo.businessName}</div>
            <div className="font-mono text-[11px] text-slate-400">Paybill: {paybillInfo.paybill}</div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-4">
          <button
            type="button"
            onClick={() => { setActiveTab('stk'); resetState(); }}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'stk'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>M-Pesa STK Push (Instant)</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('manual'); resetState(); }}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Manual M-Pesa Code</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: STK PUSH */}
        {activeTab === 'stk' && (
          <div>
            {stkStep === 'idle' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Safaricom M-Pesa Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0712345678 or 254712345678"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <div className="absolute right-3 top-2.5 text-[11px] font-mono text-emerald-600 font-semibold">
                      Safaricom Daraja
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    A prompt will be sent immediately to your phone to authorize with your 4-digit M-Pesa PIN.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Instant Automated Settlement
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    No manual verification needed. Your receipt and entitlements will be issued in seconds.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartStkPush}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send STK Push Prompt (KES {invoice.amount.toLocaleString()})</span>
                </button>
              </div>
            )}

            {stkStep === 'prompting' && (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin mx-auto" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Connecting to Safaricom Daraja API...
                </h4>
                <p className="text-xs text-slate-500">
                  Dispatching STK Push prompt to {phoneNumber}
                </p>
              </div>
            )}

            {stkStep === 'pin_dialog' && (
              <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-emerald-400">SAFARICOM SIM TOOLKIT</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Incoming Push</span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-lg text-xs font-mono space-y-1.5 border border-slate-700">
                  <p className="text-slate-200">
                    Do you want to pay <strong className="text-emerald-400">KES {invoice.amount.toLocaleString()}</strong> to <strong className="text-white">{paybillInfo.businessName}</strong>?
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Paybill: {paybillInfo.paybill} · Acc: {paybillInfo.account}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-300 font-mono mb-1">
                    Enter M-Pesa 4-Digit PIN
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="••••"
                      autoFocus
                      className="w-full px-3 py-2 text-center text-lg tracking-[0.5em] font-mono bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setPinInput('1234')}
                      className="px-2.5 py-2 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 shrink-0"
                      title="Quick fill test PIN"
                    >
                      Autofill 1234
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStkStep('idle')}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmStkPin}
                    disabled={pinInput.length < 4}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-mono transition-colors flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Authorize PIN</span>
                  </button>
                </div>
              </div>
            )}

            {stkStep === 'processing' && (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin mx-auto" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Processing M-Pesa Callback...
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Confirming transaction reference with Safaricom Daraja
                </p>
              </div>
            )}

            {stkStep === 'done' && (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Payment Confirmed!
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Issuing official receipt and updating system records...
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANUAL TRANSACTION REFERENCE */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                How to pay manually:
              </div>
              <ol className="list-decimal pl-4 space-y-0.5 text-slate-600 text-[11px]">
                <li>Go to M-Pesa &gt; Lipa na M-Pesa &gt; Paybill</li>
                <li>Enter Business No: <strong className="font-mono text-slate-900">{paybillInfo.paybill}</strong></li>
                <li>Account No: <strong className="font-mono text-slate-900">{paybillInfo.account}</strong></li>
                <li>Enter Amount: <strong className="font-mono text-slate-900">KES {invoice.amount.toLocaleString()}</strong></li>
                <li>Enter your PIN and complete payment.</li>
              </ol>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                M-Pesa Transaction Code
              </label>
              <input
                type="text"
                maxLength={12}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="e.g. QHK9283JD8"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Enter the 10-character code from your Safaricom SMS message.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sender Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0712345678"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional Notes / Reference
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid via Equity agent till"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Manual submissions require verification by {invoice.pipelineType === 'PLATFORM_SUBSCRIPTION' ? 'the System Administrator' : 'the Managing Agent'} before access is granted.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Submit for Verification</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
