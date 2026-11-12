import { UserSubscription, PlanType, SubscriptionStatus } from '../types/subscription';
import { supabase, isSupabaseConfigured } from './supabase';
import { appConfig } from './config';

// Global declaration for Razorpay checkout window object
declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const subscriptionService = {
  /**
   * Fetch current subscription details for user
   */
  async getSubscription(userId?: string): Promise<UserSubscription> {
    const now = Date.now();

    if (isSupabaseConfigured && supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (data && !error) {
          return this.parseSubscriptionRecord(data, now);
        }
      } catch (err) {
        console.error('Error fetching subscription from Supabase:', err);
      }
    }

    // Demo Mode: Safe evaluation state (local 7-day trial, never fake paid subscription)
    return this.getDemoSubscription(now);
  },

  /**
   * Parse Supabase row into UserSubscription
   */
  parseSubscriptionRecord(record: any, now: number): UserSubscription {
    const trialEndsAt = record.trial_ends_at ? new Date(record.trial_ends_at).getTime() : now;
    const currentPeriodEnd = record.current_period_end ? new Date(record.current_period_end).getTime() : undefined;
    const currentPeriodStart = record.current_period_start ? new Date(record.current_period_start).getTime() : undefined;
    const planType: PlanType = record.plan_type || 'monthly';

    return this.computeAccessRules({
      status: record.status || 'trial',
      planType,
      trialEndsAt,
      currentPeriodStart,
      currentPeriodEnd,
      razorpaySubscriptionId: record.razorpay_subscription_id,
      razorpayCustomerId: record.razorpay_customer_id,
      invoices: [],
    }, now);
  },

  /**
   * Compute paywall access rules based on subscription record and timestamps
   */
  computeAccessRules(sub: Partial<UserSubscription>, now: number): UserSubscription {
    const trialEndsAt = sub.trialEndsAt || (now + 7 * 86400000);
    const planType: PlanType = sub.planType || 'monthly';
    let status: SubscriptionStatus = sub.status || 'trial';
    let isExpired = false;
    let daysRemaining = 0;

    if (status === 'trial') {
      if (now > trialEndsAt) {
        status = 'expired';
        isExpired = true;
        daysRemaining = 0;
      } else {
        daysRemaining = Math.max(1, Math.ceil((trialEndsAt - now) / 86400000));
      }
    } else if (status === 'active') {
      const periodEnd = sub.currentPeriodEnd || (now + 30 * 86400000);
      if (now > periodEnd) {
        status = 'past_due';
        isExpired = true;
        daysRemaining = 0;
      } else {
        daysRemaining = Math.max(0, Math.ceil((periodEnd - now) / 86400000));
      }
    } else {
      isExpired = true;
      daysRemaining = 0;
    }

    return {
      status,
      planType,
      trialEndsAt,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      razorpaySubscriptionId: sub.razorpaySubscriptionId,
      razorpayCustomerId: sub.razorpayCustomerId,
      isExpired,
      daysRemaining,
      canEdit: !isExpired,
      canViewReports: !isExpired,
      canExport: true,
      invoices: sub.invoices || [],
    };
  },

  /**
   * Get safe Demo Mode trial state (in-browser evaluation only)
   */
  getDemoSubscription(now: number): UserSubscription {
    const trialKey = 'khatavault_demo_trial_start';
    let startTimestamp = Number(localStorage.getItem(trialKey));
    if (!startTimestamp || isNaN(startTimestamp)) {
      startTimestamp = now;
      localStorage.setItem(trialKey, String(now));
    }

    const trialDurationMs = 7 * 24 * 60 * 60 * 1000;
    const trialEndsAt = startTimestamp + trialDurationMs;
    const isExpired = now > trialEndsAt;
    const daysRemaining = isExpired ? 0 : Math.max(1, Math.ceil((trialEndsAt - now) / 86400000));

    return {
      status: isExpired ? 'expired' : 'trial',
      planType: 'monthly',
      trialEndsAt,
      isExpired,
      daysRemaining,
      canEdit: !isExpired,
      canViewReports: !isExpired,
      canExport: true,
      invoices: [],
    };
  },

  /**
   * Alias for local initial subscription in demo/evaluation mode
   */
  getLocalSubscription(now: number): UserSubscription {
    return this.getDemoSubscription(now);
  },

  /**
   * Load Razorpay checkout script
   */
  async loadRazorpayScript(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (window.Razorpay) return true;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  /**
   * Initiate Razorpay Subscription / Payment
   * Strict validation: rejects in demo mode or when key is missing.
   */
  async startSubscriptionCheckout(
    plan: PlanType,
    userEmail: string,
    onSuccess: (paymentId: string) => void,
    onFailure: (err: any) => void
  ): Promise<void> {
    if (appConfig.isDemo || !appConfig.isRealPaymentsAvailable) {
      onFailure(
        new Error(
          'Online payment checkout is disabled in Demo Mode. To accept real payments, please configure VITE_RAZORPAY_KEY_ID in production.'
        )
      );
      return;
    }

    const isLoaded = await this.loadRazorpayScript();
    if (!isLoaded || !window.Razorpay) {
      onFailure(new Error('Failed to load Razorpay payment SDK'));
      return;
    }

    const amount = plan === 'yearly' ? 249900 : 29900; // in paise

    const options = {
      key: appConfig.razorpayKeyId,
      amount: amount,
      currency: 'INR',
      name: 'KhataVault',
      description: `${plan === 'yearly' ? 'Yearly Pro Plan' : 'Monthly Pro Plan'} Subscription`,
      prefill: {
        email: userEmail,
      },
      theme: {
        color: '#0f172a',
      },
      handler: (response: any) => {
        onSuccess(response.razorpay_payment_id);
      },
      modal: {
        ondismiss: () => {
          onFailure(new Error('Payment checkout cancelled'));
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      onFailure(err);
    }
  },

  /**
   * Cancel subscription auto-renewal
   */
  async cancelSubscription(userId?: string): Promise<{ error: Error | null }> {
    if (isSupabaseConfigured && supabase && userId) {
      try {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        window.dispatchEvent(new Event('subscription_change'));
        return { error };
      } catch (err: any) {
        return { error: err };
      }
    }

    window.dispatchEvent(new Event('subscription_change'));
    return { error: null };
  },
};
