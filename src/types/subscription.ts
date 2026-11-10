export type PlanType = 'monthly' | 'yearly';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'expired' | 'canceled';

export interface PlanConfig {
  id: PlanType;
  name: string;
  priceINR: number;
  interval: 'month' | 'year';
  tag?: string;
  description: string;
  features: string[];
}

export interface SubscriptionInvoice {
  id: string;
  date: string;
  amount: number;
  plan: PlanType;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

export interface UserSubscription {
  status: SubscriptionStatus;
  planType: PlanType;
  trialEndsAt: number; // timestamp
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  isExpired: boolean;
  daysRemaining: number;
  canEdit: boolean;
  canViewReports: boolean;
  canExport: boolean;
  invoices: SubscriptionInvoice[];
}

// Configurable subscription pricing: easily modified here or via VITE_MONTHLY_PRICE_INR / VITE_YEARLY_PRICE_INR
const monthlyPrice = Number(import.meta.env.VITE_MONTHLY_PRICE_INR) || 299;
const yearlyPrice = Number(import.meta.env.VITE_YEARLY_PRICE_INR) || 2499;

export const SUBSCRIPTION_PLANS: Record<PlanType, PlanConfig> = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    priceINR: monthlyPrice,
    interval: 'month',
    description: 'Billed monthly. Cancel anytime.',
    features: [
      'Unlimited daily ledger entries (Lena & Dena)',
      'Google Drive appdata sync (100% private)',
      'Monthly & Yearly Reports with trend charts',
      'Instant Excel & PDF statements',
      'Passphrase AES-GCM encryption',
      'UPI AutoPay & Credit/Debit cards',
    ],
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Plan',
    priceINR: yearlyPrice,
    interval: 'year',
    tag: 'Save ~30% (Best Value)',
    description: `Billed annually (₹${Math.round(yearlyPrice / 12)}/month equivalent).`,
    features: [
      'Everything in Monthly Plan',
      `Save ₹${monthlyPrice * 12 - yearlyPrice} every year`,
      'Priority customer support on WhatsApp',
      'Early access to new features & exports',
    ],
  },
};
