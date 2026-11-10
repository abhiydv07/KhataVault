import React from 'react';
import { AlertCircle, Crown, ArrowRight } from 'lucide-react';
import { UserSubscription } from '../types/subscription';
import { Language } from '../utils/i18n';

interface PaywallBannerProps {
  subscription: UserSubscription;
  onOpenBilling: () => void;
  lang: Language;
}

export const PaywallBanner: React.FC<PaywallBannerProps> = ({
  subscription,
  onOpenBilling,
  lang: _lang,
}) => {
  if (!subscription.isExpired) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Subscription Required:</strong> Your 7-day free trial has expired. You can view & export your data anytime. Upgrade to resume adding entries and viewing reports.
          </span>
        </div>

        <button
          onClick={onOpenBilling}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs transition"
        >
          <Crown className="w-3.5 h-3.5 text-amber-600" />
          <span>Upgrade Now (from ₹208/mo)</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
