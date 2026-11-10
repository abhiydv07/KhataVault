import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  RotateCcw,
  Zap
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

export const BillingModal: React.FC<BillingModalProps> = ({
  isOpen,
  onClose,
  subscription,
  userEmail,
  lang: _lang,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(subscription.planType || 'yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setIsProcessing(true);
    setMessage(null);

    await subscriptionService.startSubscriptionCheckout(
      selectedPlan,
      userEmail || 'customer@example.com',
      (paymentId) => {
        setIsProcessing(false);
        setMessage(`Success! Payment confirmed (${paymentId}). Your subscription is active!`);
      },
      (err) => {
        setIsProcessing(false);
        setMessage(err.message || 'Payment cancelled');
      }
    );
  };

  const handleCancelPlan = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription auto-renewal?')) {
      await subscriptionService.cancelSubscription();
      setMessage('Subscription auto-renewal has been cancelled.');
    }
  };

  const isTrial = subscription.status === 'trial';
  const isActive = subscription.status === 'active';
  const isExpired = subscription.isExpired;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
            <Crown className="w-3.5 h-3.5" />
            Subscription & Billing
          </div>

          <h3 className="text-xl sm:text-2xl font-black">
            KhataVault Pro
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            100% private commercial ledger stored in your own Google Drive.
          </p>

          {/* Current Status Pill */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
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
              <span className="text-xs text-slate-300">
                Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {message && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold">
              {message}
            </div>
          )}

          {isExpired && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-100 space-y-1">
                <strong>Your trial or subscription has expired.</strong>
                <p>
                  You can always <strong>view past sheets and export Excel/PDF statements</strong>, but adding new daily entries and generating new reports requires an active subscription.
                </p>
              </div>
            </div>
          )}

          {/* Plan Selection Cards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Choose Your Plan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Yearly Plan (Best Value) */}
              <div
                onClick={() => setSelectedPlan('yearly')}
                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'yearly'
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Save 30%
                </div>

                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Yearly Plan
                  </h5>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedPlan === 'yearly' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {selectedPlan === 'yearly' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                    ₹ {SUBSCRIPTION_PLANS.yearly.priceINR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500">/year</span>
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                  ₹{Math.round(SUBSCRIPTION_PLANS.yearly.priceINR / 12)}/month equivalent
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Best value for active businesses. Full access for 365 days.
                </p>
              </div>

              {/* Monthly Plan */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'monthly'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Monthly Plan
                  </h5>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedPlan === 'monthly' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {selectedPlan === 'monthly' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                    ₹ {SUBSCRIPTION_PLANS.monthly.priceINR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500">/month</span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Flexible month-to-month plan. Cancel anytime via UPI AutoPay.
                </p>
              </div>

            </div>
          </div>

          {/* Included Features */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Everything Included in KhataVault:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              {SUBSCRIPTION_PLANS[selectedPlan].features.map((feat) => (
                <div key={feat} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Opening Payment...'
                : `Subscribe with Razorpay (₹ ${SUBSCRIPTION_PLANS[selectedPlan].priceINR.toLocaleString('en-IN')}/${selectedPlan === 'yearly' ? 'yr' : 'mo'})`}
            </span>
          </button>

          {/* Cancel Plan Button */}
          {isActive && (
            <div className="pt-2 text-center">
              <button
                onClick={handleCancelPlan}
                className="text-xs text-slate-400 hover:text-rose-600 font-medium"
              >
                Cancel Subscription Auto-renewal
              </button>
            </div>
          )}

          {/* Dev Mode State Simulator */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Test Mode Simulation
            </div>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => subscriptionService.simulateState('trial')}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-semibold hover:bg-slate-200 text-slate-700 dark:text-slate-300"
              >
                Simulate: Active Trial
              </button>
              <button
                onClick={() => subscriptionService.simulateState('expired')}
                className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 rounded-lg font-semibold hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200"
              >
                Simulate: Expired Paywall
              </button>
              <button
                onClick={() => subscriptionService.simulateState('active')}
                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg font-semibold hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200"
              >
                Simulate: Active Paid
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
