import { MonthHisaabFile } from '../types/hisaab';
import { calculateSheet } from './calculatorEngine';
import { storageService } from './storage';
import { evaluateExpression } from './mathParser';

export interface DaySummary {
  date: string;
  totalLena: number;
  totalDena: number;
  totalUpline: number;
  cashCharge: number;
  kharcha: number;
  farak: number;
  verdict: 'lena' | 'dena' | 'barabar';
}

export interface PartyReportSummary {
  name: string;
  lena: number;
  dena: number;
  net: number; // positive = to collect, negative = to pay
  count: number;
}

export interface PeriodReport {
  periodType: 'month' | 'year';
  periodKey: string; // e.g. "2026-11" or "2026"
  periodLabel: string;
  daysCount: number;
  totalLena: number;
  totalDena: number;
  totalUpline: number;
  totalCashCharge: number;
  totalKharcha: number;
  totalBonus: number;
  totalOldCB: number;
  totalConfirmation: number;
  totalRtgs: number;
  totalCredit: number;
  totalDebit: number;
  netFarak: number;
  verdict: 'lena' | 'dena' | 'barabar';
  dayBreakdown: DaySummary[];
  partySummaries: PartyReportSummary[];
  topDebtors: PartyReportSummary[]; // highest lena (to collect)
  topCreditors: PartyReportSummary[]; // highest dena (to pay)
}

export const reportsEngine = {
  /**
   * Generate report for a single month (e.g. "2026-11")
   */
  async generateMonthlyReport(monthKey: string): Promise<PeriodReport> {
    const monthFile = await storageService.getMonthFile(monthKey);
    return this.buildReportFromMonthFiles([monthFile], 'month', monthKey);
  },

  /**
   * Generate report for a full year (e.g. "2026")
   */
  async generateYearlyReport(yearString: string): Promise<PeriodReport> {
    const allMonths = await storageService.getAllMonths();
    const yearMonths = allMonths.filter((m) => m.startsWith(yearString));

    // If no months recorded in index yet, at least check the current month
    const targetMonths = yearMonths.length > 0 ? yearMonths : [`${yearString}-11`];

    const monthFiles: MonthHisaabFile[] = [];
    for (const m of targetMonths) {
      const file = await storageService.getMonthFile(m);
      monthFiles.push(file);
    }

    return this.buildReportFromMonthFiles(monthFiles, 'year', yearString);
  },

  /**
   * Aggregate month files into a unified report
   */
  buildReportFromMonthFiles(
    files: MonthHisaabFile[],
    periodType: 'month' | 'year',
    periodKey: string
  ): PeriodReport {
    let totalLena = 0;
    let totalDena = 0;
    let totalUpline = 0;
    let totalCashCharge = 0;
    let totalKharcha = 0;
    let totalBonus = 0;
    let totalOldCB = 0;
    let totalConfirmation = 0;
    let totalRtgs = 0;
    let totalCredit = 0;
    let totalDebit = 0;

    const daySummaries: DaySummary[] = [];
    const partyMap: Record<string, { lena: number; dena: number; count: number }> = {};

    for (const file of files) {
      const sortedDates = Object.keys(file.days || {}).sort();

      for (const date of sortedDates) {
        const sheet = file.days[date];
        const res = calculateSheet(sheet);

        totalLena += res.totalLena;
        totalDena += res.totalDena;
        totalUpline += res.totalDenaUpline;
        totalCashCharge += res.cashChargeAmount;
        totalKharcha += res.totalKharcha;
        totalBonus += res.totalBonus;
        totalOldCB += res.totalOldCB;
        totalConfirmation += res.totalConfirmation;
        totalRtgs += res.totalRtgs;
        totalCredit += res.totalCredit;
        totalDebit += res.totalDebit;

        daySummaries.push({
          date,
          totalLena: res.totalLena,
          totalDena: res.totalDena,
          totalUpline: res.totalDenaUpline,
          cashCharge: res.cashChargeAmount,
          kharcha: res.totalKharcha,
          farak: res.farak,
          verdict: res.verdict,
        });

        // Tally parties on Lena side
        for (const entry of sheet.lenaEntries || []) {
          const name = entry.friendName.trim();
          if (!name) continue;
          if (!partyMap[name]) partyMap[name] = { lena: 0, dena: 0, count: 0 };
          if (entry.countInTotal) {
            partyMap[name].lena += evaluateExpression(entry.rawExpression || entry.evaluatedAmount);
          }
          partyMap[name].count++;
        }

        // Tally parties on Dena side
        for (const entry of sheet.denaEntries || []) {
          const name = entry.friendName.trim();
          if (!name) continue;
          if (!partyMap[name]) partyMap[name] = { lena: 0, dena: 0, count: 0 };
          if (entry.countInTotal) {
            partyMap[name].dena += evaluateExpression(entry.rawExpression || entry.evaluatedAmount);
          }
          partyMap[name].count++;
        }
      }
    }

    const netFarak = Math.round((totalCredit - totalDebit) * 100) / 100;
    let verdict: 'lena' | 'dena' | 'barabar' = 'barabar';
    if (netFarak > 0.001) verdict = 'lena';
    else if (netFarak < -0.001) verdict = 'dena';

    const partySummaries: PartyReportSummary[] = Object.entries(partyMap)
      .map(([name, val]) => ({
        name,
        lena: Math.round(val.lena * 100) / 100,
        dena: Math.round(val.dena * 100) / 100,
        net: Math.round((val.lena - val.dena) * 100) / 100,
        count: val.count,
      }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

    const topDebtors = partySummaries
      .filter((p) => p.net > 0)
      .sort((a, b) => b.net - a.net)
      .slice(0, 5);

    const topCreditors = partySummaries
      .filter((p) => p.net < 0)
      .sort((a, b) => a.net - b.net)
      .slice(0, 5);

    const periodLabel =
      periodType === 'month'
        ? formatMonthName(periodKey)
        : `Year ${periodKey}`;

    return {
      periodType,
      periodKey,
      periodLabel,
      daysCount: daySummaries.length,
      totalLena: Math.round(totalLena * 100) / 100,
      totalDena: Math.round(totalDena * 100) / 100,
      totalUpline: Math.round(totalUpline * 100) / 100,
      totalCashCharge: Math.round(totalCashCharge * 100) / 100,
      totalKharcha: Math.round(totalKharcha * 100) / 100,
      totalBonus: Math.round(totalBonus * 100) / 100,
      totalOldCB: Math.round(totalOldCB * 100) / 100,
      totalConfirmation: Math.round(totalConfirmation * 100) / 100,
      totalRtgs: Math.round(totalRtgs * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      totalDebit: Math.round(totalDebit * 100) / 100,
      netFarak,
      verdict,
      dayBreakdown: daySummaries.sort((a, b) => a.date.localeCompare(b.date)),
      partySummaries,
      topDebtors,
      topCreditors,
    };
  },
};

function formatMonthName(monthKey: string): string {
  try {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } catch {
    return monthKey;
  }
}
