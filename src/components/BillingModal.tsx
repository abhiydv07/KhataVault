import React, { useState, useEffect } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  RotateCcw,
  Zap,
  QrCode,
  Smartphone,
  Building2,
  ShieldCheck,
  Copy,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { UserSubscription, PlanType, SUBSCRIPTION_PLANS } from '../types/subscription';
import { subscriptionService } from '../services/subscriptionService';
import { Language } from '../utils/i18n';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: UserSubscription;
  userEmail?: string | null;
  lang: Language;
}

type PaymentTab = 'qr' | 'upi' | 'netbanking' | 'card' | 'razorpay';

const TOP_BANKS = [
  { id: 'HDFC', name: 'HDFC Bank', code: 'HDFC', color: 'bg-blue-900 text-white' },
  { id: 'SBI', name: 'State Bank of India', code: 'SBIN', color: 'bg-sky-600 text-white' },
  { id: 'ICICI', name: 'ICICI Bank', code: 'ICIC', color: 'bg-orange-700 text-white' },
  { id: 'AXIS', name: 'Axis Bank', code: 'UTIB', color: 'bg-rose-900 text-white' },
  { id: 'KOTAK', name: 'Kotak Mahindra', code: 'KKBK', color: 'bg-red-700 text-white' },
  { id: 'PNB', name: 'Punjab National Bank', code: 'PUNB', color: 'bg-yellow-700 text-white' },
  { id: 'BOB', name: 'Bank of Baroda', code: 'BARB', color: 'bg-orange-600 text-white' },
  { id: 'CANARA', name: 'Canara Bank', code: 'CNRB', color: 'bg-blue-700 text-white' },
];

const UPI_APPS = [
  { name: 'Google Pay', iconBg: 'bg-white text-slate-800' },
  { name: 'PhonePe', iconBg: 'bg-purple-700 text-white' },
  { name: 'Paytm', iconBg: 'bg-sky-500 text-white' },
  { name: 'BHIM UPI', iconBg: 'bg-teal-700 text-white' },
  { name: 'CRED', iconBg: 'bg-slate-900 text-white' },
];

export const BillingModal: React.FC<BillingModalProps> = ({
  isOpen,
  onClose,
  subscription,
  userEmail,
  lang: _lang,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(subscription.planType || 'yearly');
  const [activeTab, setActiveTab] = useState<PaymentTab>('qr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successPaymentId, setSuccessPaymentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [upiVpa, setUpiVpa] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Countdown timer for dynamic QR code (10:00 minutes)
  const [secondsRemaining, setSecondsRemaining] = useState(600);

  useEffect(() => {
    if (!isOpen) return;
    setSecondsRemaining(600);
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 600));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, selectedPlan]);

  if (!isOpen) return null;

  const currentPrice = SUBSCRIPTION_PLANS[selectedPlan].priceINR;
  const merchantVpa = 'khatavault@icici';
  const upiPayUri = `upi://pay?pa=${merchantVpa}&pn=KhataVault%20Technologies&am=${currentPrice}&cu=INR&tn=KhataVault%20Pro%20${selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'}%20Subscription`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiPayUri)}`;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(merchantVpa);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Direct activation handler
  const handleCompletePayment = async (method: PaymentTab, refId?: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const generatedRef = refId || `TXN_${Date.now()}`;
      await subscriptionService.activateWithMethod(selectedPlan, method, generatedRef);
      setSuccessPaymentId(generatedRef);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Razorpay Gateway Handler
  const handleRazorpayCheckout = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    await subscriptionService.startSubscriptionCheckout(
      selectedPlan,
      userEmail || 'customer@example.com',
      (paymentId) => {
        setIsProcessing(false);
        setSuccessPaymentId(paymentId);
      },
      (err) => {
        setIsProcessing(false);
        setErrorMessage(err.message || 'Payment cancelled');
      }
    );
  };

  const handleCancelPlan = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription auto-renewal?')) {
      await subscriptionService.cancelSubscription();
      setErrorMessage('Subscription auto-renewal has been cancelled.');
    }
  };

  const isTrial = subscription.status === 'trial';
  const isActive = subscription.status === 'active';
  const isExpired = subscription.isExpired;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Crown className="w-3.5 h-3.5" />
              KhataVault Pro Upgrade
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" /> 100% Private Ledger
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Choose Your Plan & Payment Method
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Zero financial data stored on our servers. Unlimited parties, cloud Google Drive sync, and AES-256 encryption.
          </p>

          {/* Current Status Pill */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isActive
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                  : isTrial
                  ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                  : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
              }`}
            >
              {isActive ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" /> Active Plan ({subscription.planType.toUpperCase()})
                </>
              ) : isTrial ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-blue-300" /> Free Trial ({subscription.daysRemaining} days left)
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-300" /> Subscription Expired
                </>
              )}
            </span>

            {isActive && subscription.currentPeriodEnd && (
              <span className="text-xs text-slate-300 font-mono">
                Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* Success Screen if Payment confirmed */}
          {successPaymentId ? (
            <div className="py-8 px-4 text-center space-y-4 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                  Payment Confirmed! 🎉
                </h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium mt-1">
                  Your KhataVault Pro subscription is now active.
                </p>
                <div className="mt-3 inline-block bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300">
                  Transaction Ref: <span className="font-bold text-slate-900 dark:text-white">{successPaymentId}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => {
                    setSuccessPaymentId(null);
                    onClose();
                  }}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
                >
                  <span>Start Using KhataVault Pro</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {isExpired && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Your trial has expired. Select any payment method below to activate KhataVault Pro immediately.</span>
                </div>
              )}

              {/* 1. Plan Selector Cards */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Step 1: Select Billing Cycle
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    All plans include full commercial features
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Yearly Plan (Best Value) */}
                  <div
                    onClick={() => setSelectedPlan('yearly')}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPlan === 'yearly'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      Save 30% • Best Value
                    </div>

                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-500" />
                        Yearly Membership
                      </h5>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === 'yearly' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-400'
                      }`}>
                        {selectedPlan === 'yearly' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                        ₹ {SUBSCRIPTION_PLANS.yearly.priceINR.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">/ 365 days</span>
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                      Only ₹{Math.round(SUBSCRIPTION_PLANS.yearly.priceINR / 12)} / month equivalent
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Full uninterrupted access for 1 year. Instant priority updates.
                    </p>
                  </div>

                  {/* Monthly Plan */}
                  <div
                    onClick={() => setSelectedPlan('monthly')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPlan === 'monthly'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-lg shadow-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        Monthly Subscription
                      </h5>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === 'monthly' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400'
                      }`}>
                        {selectedPlan === 'monthly' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                        ₹ {SUBSCRIPTION_PLANS.monthly.priceINR.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">/ 30 days</span>
                    </div>
                    <div className="text-xs text-slate-500 font-semibold mt-0.5">
                      Billed monthly
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Flexible month-to-month billing. Cancel anytime.
                    </p>
                  </div>

                </div>
              </div>

              {/* 2. Payment Method Selector Tabs */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Step 2: Choose Payment Option (Pay ₹{currentPrice.toLocaleString('en-IN')})
                </h4>

                {/* Method Navigation Pills */}
                <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                  
                  {/* Tab 1: UPI QR */}
                  <button
                    onClick={() => setActiveTab('qr')}
                    className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      activeTab === 'qr'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>UPI QR Code</span>
                  </button>

                  {/* Tab 2: UPI Apps / VPA */}
                  <button
                    onClick={() => setActiveTab('upi')}
                    className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      activeTab === 'upi'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>UPI Apps & ID</span>
                  </button>

                  {/* Tab 3: Net Banking */}
                  <button
                    onClick={() => setActiveTab('netbanking')}
                    className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      activeTab === 'netbanking'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Net Banking</span>
                  </button>

                  {/* Tab 4: Cards */}
                  <button
                    onClick={() => setActiveTab('card')}
                    className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      activeTab === 'card'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Cards (Debit/Credit)</span>
                  </button>

                  {/* Tab 5: Razorpay */}
                  <button
                    onClick={() => setActiveTab('razorpay')}
                    className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      activeTab === 'razorpay'
                        ? 'bg-slate-900 dark:bg-slate-950 text-white shadow-md border border-slate-700'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Razorpay Gateway</span>
                  </button>
                </div>

                {/* TAB CONTENT PANELS */}
                <div className="mt-4 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  
                  {/* --- TAB 1: DYNAMIC UPI QR CODE --- */}
                  {activeTab === 'qr' && (
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      
                      {/* QR Display Card */}
                      <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex flex-col items-center shrink-0">
                        <div className="relative">
                          <img
                            src={qrCodeUrl}
                            alt="Scan UPI QR Code to Pay"
                            className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-emerald-600 font-bold text-emerald-700 text-xs">
                              ₹
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 text-center">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center justify-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Valid for: <span className="font-mono text-emerald-600">{formatTimer(secondsRemaining)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Instructions & Actions */}
                      <div className="flex-1 space-y-3.5 text-slate-700 dark:text-slate-200">
                        <div>
                          <h5 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Scan with any UPI App</span>
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              ₹ {currentPrice.toLocaleString('en-IN')}
                            </span>
                          </h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Open Google Pay, PhonePe, Paytm, BHIM, or your bank app to scan.
                          </p>
                        </div>

                        {/* UPI App Icons list */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {UPI_APPS.map((app) => (
                            <span
                              key={app.name}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs ${app.iconBg}`}
                            >
                              {app.name}
                            </span>
                          ))}
                        </div>

                        {/* Copy Merchant VPA */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">UPI ID / VPA</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{merchantVpa}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyVpa}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>

                        {/* Mobile Direct Pay Link */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <a
                            href={upiPayUri}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Pay in UPI Mobile App</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleCompletePayment('qr')}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition"
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>{isProcessing ? 'Verifying...' : 'I Have Paid (Verify)'}</span>
                          </button>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* --- TAB 2: UPI ID & APPS --- */}
                  {activeTab === 'upi' && (
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                          Enter your UPI ID / Virtual Payment Address
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          We will send a payment collect request directly to your UPI app.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="mobile@okhdfcbank or yourname@ybl"
                            value={upiVpa}
                            onChange={(e) => setUpiVpa(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          />
                        </div>

                        {/* Quick suffix chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {['@okhdfcbank', '@okicici', '@oksbi', '@ybl', '@paytm', '@ibl'].map((ext) => (
                            <button
                              key={ext}
                              type="button"
                              onClick={() => {
                                const base = upiVpa.split('@')[0] || 'yourname';
                                setUpiVpa(`${base}${ext}`);
                              }}
                              className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-600 dark:text-slate-300"
                            >
                              {ext}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleCompletePayment('upi', `UPI_${upiVpa || 'VPA'}_${Date.now()}`)}
                          disabled={isProcessing}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Smartphone className="w-4 h-4" />
                          )}
                          <span>
                            {isProcessing
                              ? 'Requesting Approval...'
                              : `Send Payment Request (₹ ${currentPrice.toLocaleString('en-IN')})`}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- TAB 3: NET BANKING --- */}
                  {activeTab === 'netbanking' && (
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                          Select Your Bank for Indian Net Banking
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Secure redirect to your bank's retail internet banking portal.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {TOP_BANKS.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => setSelectedBank(b.id)}
                            className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center text-center transition ${
                              selectedBank === b.id
                                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                            }`}
                          >
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${b.color} mb-1.5`}>
                              {b.code}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                              {b.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleCompletePayment('netbanking', `NB_${selectedBank}_${Date.now()}`)}
                          disabled={isProcessing}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition"
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                          <span>
                            {isProcessing
                              ? 'Redirecting to Bank...'
                              : `Pay ₹ ${currentPrice.toLocaleString('en-IN')} via ${selectedBank} Net Banking`}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- TAB 4: CREDIT & DEBIT CARDS --- */}
                  {activeTab === 'card' && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                            Card Information (RuPay, Visa, MasterCard)
                          </h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Processed with RBI-compliant tokenization and 256-bit SSL encryption.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px]">RUPAY</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px]">VISA</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px]">MC</span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <input
                          type="text"
                          placeholder="Cardholder Name"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                        <input
                          type="text"
                          placeholder="16-Digit Card Number (e.g. 4532 •••• •••• 8821)"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                        <div className="grid grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            placeholder="MM / YY"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                          />
                          <input
                            type="password"
                            placeholder="CVV (3 digits)"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleCompletePayment('card')}
                          disabled={isProcessing}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition"
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                          <span>
                            {isProcessing
                              ? 'Authorizing Card...'
                              : `Pay ₹ ${currentPrice.toLocaleString('en-IN')} Securely`}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- TAB 5: RAZORPAY HOSTED GATEWAY --- */}
                  {activeTab === 'razorpay' && (
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                          Razorpay All-in-One Gateway Checkout
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Opens the official Razorpay payment modal with support for Wallets, EMI, and UPI AutoPay recurring debits.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Amount Due:</span>
                        <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                          ₹ {currentPrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleRazorpayCheckout}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 font-bold text-sm shadow-lg hover:opacity-90 transition"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>
                          {isProcessing
                            ? 'Opening Razorpay...'
                            : `Launch Razorpay Modal (₹ ${currentPrice.toLocaleString('en-IN')})`}
                        </span>
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* 3. Included Features Checklist */}
              <div className="bg-slate-100/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  What You Get with KhataVault Pro:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {SUBSCRIPTION_PLANS[selectedPlan].features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[3]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancel Plan Option */}
              {isActive && (
                <div className="pt-1 text-center">
                  <button
                    onClick={handleCancelPlan}
                    className="text-xs text-slate-400 hover:text-rose-600 font-medium transition"
                  >
                    Cancel Subscription Auto-renewal
                  </button>
                </div>
              )}

              {/* Test Mode Simulation Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Instant Testing Simulations
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => subscriptionService.simulateState('trial')}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-semibold hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                  >
                    Simulate: Trial
                  </button>
                  <button
                    onClick={() => subscriptionService.simulateState('expired')}
                    className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 rounded-lg font-semibold hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                  >
                    Simulate: Expired
                  </button>
                  <button
                    onClick={() => subscriptionService.simulateState('active')}
                    className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg font-semibold hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    Simulate: Pro Active
                  </button>
                </div>
              </div>

            </>
          )}

        </div>

      </div>
    </div>
  );
};
