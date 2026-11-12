import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../storage';
import { formatPluralDays, formatPluralEntries, formatLocalizedDate } from '../i18n';

// In-memory localStorage polyfill for Node test environment
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

(globalThis as any).localStorage = storageMock;
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true,
    localStorage: storageMock,
  };
} else {
  (globalThis as any).window.localStorage = storageMock;
}

describe('Storage Service - Orchestrated Data Deletion', () => {
  beforeEach(() => {
    storageMock.clear();
  });

  it('permanently deletes all ledger keys, settings, and flags and verifies zero remaining', async () => {
    // 1. Seed realistic ledger keys and flags
    storageMock.setItem('lena_dena_hisaab_all_months', JSON.stringify(['2026-11']));
    storageMock.setItem('lena_dena_hisaab_month_2026-11', JSON.stringify({ month: '2026-11', days: {} }));
    storageMock.setItem('khatavault_app_pin', '1234');
    storageMock.setItem('khatavault_gemini_key', 'AIzaSyFakeKey123');
    storageMock.setItem('onboarding_completed', 'true');
    storageMock.setItem('theme', 'dark');
    storageMock.setItem('lang', 'hi');

    expect(storageMock.getItem('lena_dena_hisaab_all_months')).toBeTruthy();
    expect(storageMock.getItem('khatavault_gemini_key')).toBe('AIzaSyFakeKey123');

    // 2. Perform orchestrated full account deletion
    const result = await storageService.performFullAccountDeletion();

    // 3. Verify assertions
    expect(result.success).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.remainingLedgerKeys).toEqual([]);
    expect(storageMock.getItem('lena_dena_hisaab_all_months')).toBeNull();
    expect(storageMock.getItem('khatavault_gemini_key')).toBeNull();
    expect(storageMock.getItem('onboarding_completed')).toBeNull();
    expect(storageMock.getItem('khatavault_app_pin')).toBeNull();
  });
});

describe('i18n Pluralization and Date Formatting', () => {
  it('formats plural days correctly in English and Hindi', () => {
    expect(formatPluralDays(1, 'en')).toBe('1 day');
    expect(formatPluralDays(2, 'en')).toBe('2 days');
    expect(formatPluralDays(7, 'en')).toBe('7 days');
    expect(formatPluralDays(1, 'hi')).toBe('1 दिन');
    expect(formatPluralDays(5, 'hi')).toBe('5 दिन');
  });

  it('formats plural entries correctly in English and Hindi', () => {
    expect(formatPluralEntries(1, 'en')).toBe('1 entry');
    expect(formatPluralEntries(2, 'en')).toBe('2 entries');
    expect(formatPluralEntries(10, 'en')).toBe('10 entries');
    expect(formatPluralEntries(1, 'hi')).toBe('1 प्रविष्टि');
    expect(formatPluralEntries(4, 'hi')).toBe('4 प्रविष्टियां');
  });

  it('formats dates consistently using localized formatter', () => {
    const formattedEn = formatLocalizedDate('2026-11-10', 'en');
    expect(formattedEn).toBeTruthy();
    expect(formattedEn).toContain('2026');
  });
});
