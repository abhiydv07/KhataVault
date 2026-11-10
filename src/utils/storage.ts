import { DayHisaabSheet, MonthHisaabFile, FriendSummary } from '../types/hisaab';
import { createEmptyDaySheet } from './calculatorEngine';
import { evaluateExpression } from './mathParser';

function getStoragePrefix(): string {
  if (typeof window === 'undefined') return 'lena_dena_hisaab_';
  const activeId =
    localStorage.getItem('khatavault_active_firm_id') ||
    localStorage.getItem('khatasetu_active_firm_id') ||
    'default';
  return activeId === 'default' ? 'lena_dena_hisaab_' : `lena_dena_hisaab_${activeId}_`;
}

function getMonthIndexKey(): string {
  return `${getStoragePrefix()}all_months`;
}

/**
 * Storage manager that stores hisaab sheets month-by-month as JSON (e.g. 2026-11.json).
 * This structure mirrors the Google Drive appDataFolder format for 1:1 sync.
 */
export const storageService = {
  /**
   * Get all recorded month keys (e.g., ["2026-10", "2026-11"])
   */
  async getAllMonths(): Promise<string[]> {
    try {
      const raw = localStorage.getItem(getMonthIndexKey());
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list.sort().reverse() : [];
    } catch {
      return [];
    }
  },

  /**
   * Register a month in the month index
   */
  async registerMonth(monthKey: string): Promise<void> {
    const months = await this.getAllMonths();
    if (!months.includes(monthKey)) {
      months.push(monthKey);
      localStorage.setItem(getMonthIndexKey(), JSON.stringify(months));
    }
  },

  /**
   * Get full Month file (e.g., 2026-11.json)
   */
  async getMonthFile(monthKey: string): Promise<MonthHisaabFile> {
    try {
      const key = `${getStoragePrefix()}month_${monthKey}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading month file:', err);
    }

    return {
      month: monthKey,
      days: {},
      version: 1
    };
  },

  /**
   * Save full Month file
   */
  async saveMonthFile(file: MonthHisaabFile): Promise<void> {
    try {
      const key = `${getStoragePrefix()}month_${file.month}`;
      localStorage.setItem(key, JSON.stringify(file));
      await this.registerMonth(file.month);
    } catch (err) {
      console.error('Error saving month file:', err);
      throw err;
    }
  },

  /**
   * Get day sheet by date (YYYY-MM-DD)
   */
  async getDaySheet(dateString: string): Promise<DayHisaabSheet> {
    const monthKey = dateString.substring(0, 7); // e.g. "2026-11"
    const monthFile = await this.getMonthFile(monthKey);

    if (monthFile.days[dateString]) {
      return monthFile.days[dateString];
    }

    // Return a fresh sheet for this date
    return createEmptyDaySheet(dateString);
  },

  /**
   * Save a single day sheet into its month's file
   */
  async saveDaySheet(sheet: DayHisaabSheet): Promise<void> {
    const monthKey = sheet.date.substring(0, 7);
    const monthFile = await this.getMonthFile(monthKey);

    sheet.updatedAt = Date.now();
    monthFile.days[sheet.date] = sheet;
    monthFile.version = (monthFile.version || 0) + 1;

    await this.saveMonthFile(monthFile);
  },

  /**
   * Get all friend summaries and balances across all months
   */
  async getFriendSummaries(): Promise<FriendSummary[]> {
    const months = await this.getAllMonths();
    const friendMap: Record<string, {
      totalLena: number;
      totalDena: number;
      lastDate: string;
      count: number;
    }> = {};

    for (const m of months) {
      const monthFile = await this.getMonthFile(m);
      for (const [date, sheet] of Object.entries(monthFile.days)) {
        // Lena side
        for (const entry of sheet.lenaEntries) {
          const name = entry.friendName.trim();
          if (!name) continue;
          if (!friendMap[name]) {
            friendMap[name] = { totalLena: 0, totalDena: 0, lastDate: date, count: 0 };
          }
          if (entry.countInTotal) {
            const amt = evaluateExpression(entry.rawExpression || entry.evaluatedAmount);
            friendMap[name].totalLena += amt;
          }
          friendMap[name].count++;
          if (date > friendMap[name].lastDate) {
            friendMap[name].lastDate = date;
          }
        }

        // Dena side
        for (const entry of sheet.denaEntries) {
          const name = entry.friendName.trim();
          if (!name) continue;
          if (!friendMap[name]) {
            friendMap[name] = { totalLena: 0, totalDena: 0, lastDate: date, count: 0 };
          }
          if (entry.countInTotal) {
            const amt = evaluateExpression(entry.rawExpression || entry.evaluatedAmount);
            friendMap[name].totalDena += amt;
          }
          friendMap[name].count++;
          if (date > friendMap[name].lastDate) {
            friendMap[name].lastDate = date;
          }
        }
      }
    }

    return Object.entries(friendMap).map(([name, data]) => ({
      name,
      totalLena: Math.round(data.totalLena * 100) / 100,
      totalDena: Math.round(data.totalDena * 100) / 100,
      netBalance: Math.round((data.totalLena - data.totalDena) * 100) / 100,
      lastTransactionDate: data.lastDate,
      transactionCount: data.count,
    })).sort((a, b) => b.transactionCount - a.transactionCount);
  },

  /**
   * Load Realistic Sample Data for testing & onboarding
   */
  async loadSampleSheet(targetDate?: string): Promise<DayHisaabSheet> {
    const date = targetDate || new Date().toISOString().split('T')[0];
    const now = Date.now();

    const sampleSheet: DayHisaabSheet = {
      id: date,
      date: date,
      lenaEntries: [
        {
          id: 'sample-l1',
          friendName: 'Ramesh Traders (Surat)',
          rawExpression: '1570+3135',
          evaluatedAmount: 4705,
          countInTotal: true,
          createdAt: now - 3600000,
          updatedAt: now - 3600000
        },
        {
          id: 'sample-l2',
          friendName: 'Vikas Sharma (Delhi)',
          rawExpression: '25000',
          evaluatedAmount: 25000,
          countInTotal: true,
          createdAt: now - 3000000,
          updatedAt: now - 3000000
        },
        {
          id: 'sample-l3',
          friendName: 'Surat Office (Cash In)',
          rawExpression: '120000+15000-5000',
          evaluatedAmount: 130000,
          countInTotal: true,
          createdAt: now - 2400000,
          updatedAt: now - 2400000
        },
        {
          id: 'sample-l4',
          friendName: 'Anil Ji (Cheque on Hold)',
          rawExpression: '15000',
          evaluatedAmount: 15000,
          countInTotal: false, // Not counted in total
          createdAt: now - 1800000,
          updatedAt: now - 1800000
        }
      ],
      denaEntries: [
        {
          id: 'sample-d1',
          friendName: 'Shree Shyam Agency',
          rawExpression: '45000',
          evaluatedAmount: 45000,
          countInTotal: true,
          upline: 500,
          rawUplineExpression: '500',
          createdAt: now - 3500000,
          updatedAt: now - 3500000
        },
        {
          id: 'sample-d2',
          friendName: 'Pooja Garments',
          rawExpression: '18500+2300',
          evaluatedAmount: 20800,
          countInTotal: true,
          upline: -200,
          rawUplineExpression: '-200',
          createdAt: now - 2800000,
          updatedAt: now - 2800000
        },
        {
          id: 'sample-d3',
          friendName: 'Deepak Cloth House',
          rawExpression: '62000',
          evaluatedAmount: 62000,
          countInTotal: true,
          upline: 0,
          rawUplineExpression: '0',
          createdAt: now - 2000000,
          updatedAt: now - 2000000
        }
      ],
      hisaabBlock: {
        cashChargePercent: 3.0,
        cashChargeBase: 'dena',
        oldCB: 15400,
        rawOldCBExpression: '15400',
        bonus: 2500,
        rawBonusExpression: '2500',
        kharcha: 1250,
        rawKharchaExpression: '1250',
        confirmation: 5000,
        rawConfirmationExpression: '5000',
        rtgs: 25000,
        rawRtgsExpression: '25000',
        customItems: [
          {
            id: 'sample-c1',
            label: 'Hamali & Cartage (कुली भाड़ा)',
            amount: 450,
            rawExpression: '450',
            type: 'subtract'
          }
        ]
      },
      note: 'Normal settlement day. Anil Ji cheque is pending clearance tomorrow.',
      createdAt: now,
      updatedAt: now
    };

    await this.saveDaySheet(sampleSheet);
    return sampleSheet;
  },

  /**
   * Export complete offline backup containing all recorded months
   */
  async exportFullBackup(): Promise<string> {
    const months = await this.getAllMonths();
    const backup: {
      appName: string;
      version: number;
      exportedAt: string;
      months: Record<string, MonthHisaabFile>;
    } = {
      appName: 'KhataVault',
      version: 1,
      exportedAt: new Date().toISOString(),
      months: {}
    };

    for (const m of months) {
      backup.months[m] = await this.getMonthFile(m);
    }

    return JSON.stringify(backup, null, 2);
  },

  /**
   * Restore offline backup from JSON string
   */
  async restoreFullBackup(jsonString: string): Promise<{ restoredMonths: number; restoredDays: number }> {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object' || !data.months) {
      throw new Error('Invalid backup file format: missing months container.');
    }

    let dayCount = 0;
    const monthKeys = Object.keys(data.months);

    for (const m of monthKeys) {
      const monthFile: MonthHisaabFile = data.months[m];
      if (monthFile && monthFile.days) {
        await this.saveMonthFile(monthFile);
        dayCount += Object.keys(monthFile.days).length;
      }
    }

    return { restoredMonths: monthKeys.length, restoredDays: dayCount };
  }
};

