import { describe, it, expect } from 'vitest';
import { subscriptionService } from '../subscriptionService';

describe('Subscription & Paywall Engine', () => {
  const now = 1731234567000; // fixed timestamp

  it('allows full edit and reports during active 7-day trial', () => {
    const trialSub = {
      status: 'trial' as const,
      planType: 'monthly' as const,
      trialEndsAt: now + 5 * 86400000, // 5 days in future
    };

    const rules = subscriptionService.computeAccessRules(trialSub, now);
    expect(rules.isExpired).toBe(false);
    expect(rules.daysRemaining).toBe(5);
    expect(rules.canEdit).toBe(true);
    expect(rules.canViewReports).toBe(true);
    expect(rules.canExport).toBe(true);
  });

  it('restricts edit and reports when trial is expired, but still allows export', () => {
    const expiredTrial = {
      status: 'trial' as const,
      planType: 'monthly' as const,
      trialEndsAt: now - 86400000, // 1 day in past
    };

    const rules = subscriptionService.computeAccessRules(expiredTrial, now);
    expect(rules.isExpired).toBe(true);
    expect(rules.status).toBe('expired');
    expect(rules.daysRemaining).toBe(0);
    // PAYWALL RULES:
    expect(rules.canEdit).toBe(false);
    expect(rules.canViewReports).toBe(false);
    expect(rules.canExport).toBe(true); // Expired users can always view & export
  });

  it('grants full access for active paid subscriptions', () => {
    const activeSub = {
      status: 'active' as const,
      planType: 'yearly' as const,
      currentPeriodEnd: now + 300 * 86400000,
    };

    const rules = subscriptionService.computeAccessRules(activeSub, now);
    expect(rules.isExpired).toBe(false);
    expect(rules.canEdit).toBe(true);
    expect(rules.canViewReports).toBe(true);
    expect(rules.canExport).toBe(true);
  });
});
