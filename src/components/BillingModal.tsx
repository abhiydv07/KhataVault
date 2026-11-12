import React, { useState, useEffect } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Info
} from 'lucide-react';
import { UserSubscription, PlanType, SUBSCRIPTION_PLANS } from '../types/subscription';
import { subscriptionService } from '../services/subscriptionService';
import { appConfig } from '../services/config';
import { Language } from '../utils/i18n';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: UserSubscription;
  userEmail?: string | null;
  lang: Language;
}

export const BillingModal: React.FC<BillingModalProps> = ({
  isOpen,
  onClose,
  subscription,
  userEmail,
  lang: _lang,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(subscription.planType || 'yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successPaymentId, setSuccessPaymentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPrice = SUBSCRIPTION_PLANS[selectedPlan].priceINR;
  const isTrial = subscription.status === 'trial';
  const isActive = subscription.status === 'active';

  // Razorpay Gateway Handler
  const handleRazorpayCheckout = async () => {
    if (appConfig.isDemo) {
      setErrorMessage('Online payments are disabled in Demo Mode. Data stays in your browser.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    await subscriptionService.startSubscriptionCheckout(
      selectedPlan,
      userEmail || 'customer@khatavault.app',
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
      setIsProcessing(true);
      await subscriptionService.cancelSubscription();
      setIsProcessing(false);
      setErrorMessage('Subscription auto-renewal has been cancelled.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Close"
            aria-label="Close billing modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Crown className="w-3.5 h-3.5" />
              KhataVault Subscription
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" /> Encrypted Vault
            </span>
          </div>

          <h3 id="billing-modal-title" className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {isActive ? 'Manage Your Subscription' : 'Upgrade to KhataVault Pro'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Local-first commercial ledger suite. Zero financial data stored on public databases.
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
                  <Clock className="w-3.5 h-3.5 text-blue-300" /> Free Trial ({subscription.daysRemaining} days remaining)
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

          {/* Demo Mode Notice */}
          {appConfig.isDemo && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Demo Mode Notice</strong>
                <span>
                  Payments are disabled in Demo Mode. All core features (ledger calculation, reports preview, Excel/PDF export) can be evaluated locally without charge.
                </span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
              {errorMessage}
            </div>
          )}

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
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : isActive ? (
            /* Active Plan Management View */
            <div className="space-y-6">
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      KhataVault Pro ({subscription.planType === 'yearly' ? 'Yearly' : 'Monthly'})
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Active and fully unlocked
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block font-medium">Renewal Date</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {subscription.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')
                        : 'Lifetime / Manual'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block font-medium">Billing Amount</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹ {subscription.planType === 'yearly' ? '2,499 / yr' : '299 / mo'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleCancelPlan}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    {isProcessing ? 'Cancelling...' : 'Cancel Auto-Renewal'}
                  </button>
                </div>
              </div>

              {/* Included Features */}
              <div className="bg-slate-100/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2.5">
                  Your Pro Entitlements:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {SUBSCRIPTION_PLANS[subscription.planType].features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[3]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Plan Selection & Checkout */
            <div className="space-y-6">
              {/* Plan Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Monthly Plan */}
                <div
                  onClick={() => setSelectedPlan('monthly')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition relative ${
                    selectedPlan === 'monthly'
                      ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Monthly Plan</h4>
                      <p className="text-xs text-slate-500">Flexible monthly billing</p>
                    </div>
                    <span className="font-black text-lg text-slate-900 dark:text-white">
                      ₹ 299<span className="text-xs font-normal text-slate-400">/mo</span>
                    </span>
                  </div>
                </div>

                {/* Yearly Plan (Best Value) */}
                <div
                  onClick={() => setSelectedPlan('yearly')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition relative ${
                    selectedPlan === 'yearly'
                      ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="absolute -top-2.5 right-4 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-xs">
                    Save 30%
                  </span>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Yearly Plan</h4>
                      <p className="text-xs text-slate-500">Billed annually (Best Value)</p>
                    </div>
                    <span className="font-black text-lg text-slate-900 dark:text-white">
                      ₹ 2,499<span className="text-xs font-normal text-slate-400">/yr</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Action */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Total Amount Due</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    ₹ {currentPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRazorpayCheckout}
                  disabled={isProcessing || appConfig.isDemo}
                  className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition ${
                    appConfig.isDemo
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                  }`}
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  <span>
                    {appConfig.isDemo
                      ? 'Checkout Disabled in Demo'
                      : isProcessing
                      ? 'Opening Razorpay...'
                      : `Proceed to Pay ₹ ${currentPrice.toLocaleString('en-IN')}`}
                  </span>
                </button>
              </div>

              {/* What's Included */}
              <div className="bg-slate-100/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2.5">
                  Included with Pro:
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
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
