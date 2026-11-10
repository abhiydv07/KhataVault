import { UserSubscription, PlanType, SubscriptionStatus } from '../types/subscription';
import { supabase, isSupabaseConfigured } from './supabase';

const MOCK_SUB_KEY = 'hisaab_subscription_mock_state';

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

    // Fallback/Local State for development & demo
    return this.getLocalSubscription(now);
  },

  /**
   * Parse Supabase row into UserSubscription
   */
  parseSubscriptionRecord(record: any, now: number): UserSubscription {
    const trialEndsAt = new Date(record.trial_ends_at).getTime();
    const currentPeriodEnd = record.current_period_end ? new Date(record.current_period_end).getTime() : undefined;
    const planType: PlanType = record.plan_type || 'monthly';

    let status: SubscriptionStatus = record.status;
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
    } else if (status === 'active' && currentPeriodEnd) {
      if (now > currentPeriodEnd) {
        status = 'past_due';
        isExpired = true;
        daysRemaining = 0;
      } else {
        daysRemaining = Math.max(0, Math.ceil((currentPeriodEnd - now) / 86400000));
      }
    } else if (status === 'canceled' || status === 'past_due') {
      isExpired = true;
    }

    return {
      status,
      planType,
      trialEndsAt,
      currentPeriodEnd,
      razorpaySubscriptionId: record.razorpay_subscription_id,
      razorpayCustomerId: record.razorpay_customer_id,
      isExpired,
      daysRemaining,
      canEdit: !isExpired,
      canViewReports: !isExpired,
      canExport: true, // Always allowed to view and export
      invoices: [],
    };
  },

  /**
   * Get simulated local subscription state
   */
  getLocalSubscription(now: number): UserSubscription {
    const raw = localStorage.getItem(MOCK_SUB_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return this.computeAccessRules(parsed, now);
      } catch {
        // fallback
      }
    }

    // Default: 7-day free trial starting today
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const initial: UserSubscription = {
      status: 'trial',
      planType: 'monthly',
      trialEndsAt: now + sevenDaysMs,
      isExpired: false,
      daysRemaining: 7,
      canEdit: true,
      canViewReports: true,
      canExport: true,
      invoices: [],
    };

    localStorage.setItem(MOCK_SUB_KEY, JSON.stringify(initial));
    return initial;
  },

  /**
   * Compute paywall access rules based on current timestamps
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
    }

    return {
      status,
      planType,
      trialEndsAt,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      razorpaySubscriptionId: sub.razorpaySubscriptionId,
      isExpired,
      daysRemaining,
      canEdit: !isExpired,
      canViewReports: !isExpired,
      canExport: true, // Always allowed
      invoices: sub.invoices || [],
    };
  },

  /**
   * Load Razorpay checkout script
   */
  async loadRazorpayScript(): Promise<boolean> {
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
   * Activate subscription with specific payment method (UPI, QR, Net Banking, Card, Razorpay)
   */
  async activateWithMethod(
    plan: PlanType,
    method: 'upi' | 'qr' | 'netbanking' | 'card' | 'razorpay',
    referenceId?: string
  ): Promise<UserSubscription> {
    const now = Date.now();
    const durationMs = plan === 'yearly' ? 365 * 86400000 : 30 * 86400000;
    const paymentId = referenceId || `pay_${method}_${Date.now()}`;

    const updated: UserSubscription = {
      status: 'active',
      planType: plan,
      trialEndsAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: now + durationMs,
      razorpaySubscriptionId: paymentId,
      isExpired: false,
      daysRemaining: plan === 'yearly' ? 365 : 30,
      canEdit: true,
      canViewReports: true,
      canExport: true,
      invoices: [
        {
          id: paymentId,
          date: new Date().toISOString().split('T')[0],
          amount: plan === 'yearly' ? 2499 : 299,
          plan,
          status: 'paid',
        },
      ],
    };

    localStorage.setItem(MOCK_SUB_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('subscription_change'));
    return updated;
  },

  /**
   * Initiate Razorpay Subscription / Payment
   */
  async startSubscriptionCheckout(
    plan: PlanType,
    userEmail: string,
    onSuccess: (paymentId: string) => void,
    onFailure: (err: any) => void
  ): Promise<void> {
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const isMock = keyId.includes('placeholder') || !keyId;

    if (isMock) {
      // Simulate Razorpay successful checkout in demo mode
      setTimeout(() => {
        const now = Date.now();
        const durationMs = plan === 'yearly' ? 365 * 86400000 : 30 * 86400000;
        const updated: UserSubscription = {
          status: 'active',
          planType: plan,
          trialEndsAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: now + durationMs,
          razorpaySubscriptionId: `sub_sim_${Date.now()}`,
          isExpired: false,
          daysRemaining: plan === 'yearly' ? 365 : 30,
          canEdit: true,
          canViewReports: true,
          canExport: true,
          invoices: [
            {
              id: `inv_${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              amount: plan === 'yearly' ? 2499 : 299,
              plan,
              status: 'paid',
            },
          ],
        };
        localStorage.setItem(MOCK_SUB_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('subscription_change'));
        onSuccess(`pay_sim_${Date.now()}`);
      }, 800);
      return;
    }

    const isLoaded = await this.loadRazorpayScript();
    if (!isLoaded || !window.Razorpay) {
      onFailure(new Error('Failed to load Razorpay checkout SDK'));
      return;
    }

    const amount = plan === 'yearly' ? 249900 : 29900; // in paise

    const options = {
      key: keyId,
      amount: amount,
      currency: 'INR',
      name: 'KhataVault',
      description: `${plan === 'yearly' ? 'Yearly Plan (Discounted)' : 'Monthly Plan'} Subscription`,
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

    const rzp = new window.Razorpay(options);
    rzp.open();
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<void> {
    const raw = localStorage.getItem(MOCK_SUB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.status = 'canceled';
      localStorage.setItem(MOCK_SUB_KEY, JSON.stringify(parsed));
      window.dispatchEvent(new Event('subscription_change'));
    }
  },

  /**
   * Dev helper: switch subscription simulation (trial / expired / active)
   */
  simulateState(state: 'trial' | 'expired' | 'active'): UserSubscription {
    const now = Date.now();
    let updated: UserSubscription;

    if (state === 'expired') {
      updated = {
        status: 'expired',
        planType: 'monthly',
        trialEndsAt: now - 86400000,
        isExpired: true,
        daysRemaining: 0,
        canEdit: false,
        canViewReports: false,
        canExport: true,
        invoices: [],
      };
    } else if (state === 'active') {
      updated = {
        status: 'active',
        planType: 'yearly',
        trialEndsAt: now - 86400000,
        currentPeriodStart: now,
        currentPeriodEnd: now + 365 * 86400000,
        isExpired: false,
        daysRemaining: 365,
        canEdit: true,
        canViewReports: true,
        canExport: true,
        invoices: [
          {
            id: 'inv_demo_1',
            date: new Date().toISOString().split('T')[0],
            amount: 2499,
            plan: 'yearly',
            status: 'paid',
          },
        ],
      };
    } else {
      updated = {
        status: 'trial',
        planType: 'monthly',
        trialEndsAt: now + 5 * 86400000,
        isExpired: false,
        daysRemaining: 5,
        canEdit: true,
        canViewReports: true,
        canExport: true,
        invoices: [],
      };
    }

    localStorage.setItem(MOCK_SUB_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('subscription_change'));
    return updated;
  },
};

