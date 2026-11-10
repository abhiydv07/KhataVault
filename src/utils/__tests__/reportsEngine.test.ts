import { describe, it, expect } from 'vitest';
import { reportsEngine } from '../reportsEngine';
import { MonthHisaabFile } from '../../types/hisaab';

describe('Reports Engine Aggregations', () => {
  it('accurately aggregates monthly days, party balances, and cash charges', () => {
    const mockMonthFile: MonthHisaabFile = {
      month: '2026-11',
      version: 1,
      days: {
        '2026-11-01': {
          id: '2026-11-01',
          date: '2026-11-01',
          lenaEntries: [
            {
              id: 'l1',
              friendName: 'Ramesh',
              rawExpression: '10000',
              evaluatedAmount: 10000,
              countInTotal: true,
              createdAt: 0,
              updatedAt: 0,
            },
            {
              id: 'l2',
              friendName: 'Vikas',
              rawExpression: '20000',
              evaluatedAmount: 20000,
              countInTotal: true,
              createdAt: 0,
              updatedAt: 0,
            },
          ],
          denaEntries: [
            {
              id: 'd1',
              friendName: 'Shyam',
              rawExpression: '15000',
              evaluatedAmount: 15000,
              countInTotal: true,
              createdAt: 0,
              updatedAt: 0,
            },
          ],
          hisaabBlock: {
            cashChargePercent: 3.0,
            cashChargeBase: 'dena',
            oldCB: 0,
            bonus: 0,
            kharcha: 500,
            confirmation: 0,
            rtgs: 0,
            customItems: [],
          },
          createdAt: 0,
          updatedAt: 0,
        },
        '2026-11-02': {
          id: '2026-11-02',
          date: '2026-11-02',
          lenaEntries: [
            {
              id: 'l3',
              friendName: 'Ramesh',
              rawExpression: '5000',
              evaluatedAmount: 5000,
              countInTotal: true,
              createdAt: 0,
              updatedAt: 0,
            },
          ],
          denaEntries: [
            {
              id: 'd2',
              friendName: 'Vikas',
              rawExpression: '8000',
              evaluatedAmount: 8000,
              countInTotal: true,
              createdAt: 0,
              updatedAt: 0,
            },
          ],
          hisaabBlock: {
            cashChargePercent: 3.0,
            cashChargeBase: 'dena',
            oldCB: 0,
            bonus: 0,
            kharcha: 300,
            confirmation: 0,
            rtgs: 0,
            customItems: [],
          },
          createdAt: 0,
          updatedAt: 0,
        },
      },
    };

    const report = reportsEngine.buildReportFromMonthFiles([mockMonthFile], 'month', '2026-11');

    // Total Lena = (10000 + 20000) + 5000 = 35000
    expect(report.totalLena).toBe(35000);

    // Total Dena = 15000 + 8000 = 23000
    expect(report.totalDena).toBe(23000);

    // Total Kharcha = 500 + 300 = 800
    expect(report.totalKharcha).toBe(800);

    // Cash charges: Day 1 (3% of 15000 = 450) + Day 2 (3% of 8000 = 240) = 690
    expect(report.totalCashCharge).toBe(690);

    // Party calculations:
    // Ramesh: Lena 10000 + 5000 = 15000, Dena 0 => Net +15000
    // Vikas: Lena 20000, Dena 8000 => Net +12000
    // Shyam: Lena 0, Dena 15000 => Net -15000
    const ramesh = report.partySummaries.find((p) => p.name === 'Ramesh');
    expect(ramesh).toBeDefined();
    expect(ramesh?.net).toBe(15000);

    const vikas = report.partySummaries.find((p) => p.name === 'Vikas');
    expect(vikas).toBeDefined();
    expect(vikas?.net).toBe(12000);

    const shyam = report.partySummaries.find((p) => p.name === 'Shyam');
    expect(shyam).toBeDefined();
    expect(shyam?.net).toBe(-15000);

    // Top Debtors: Ramesh and Vikas (positive balance)
    expect(report.topDebtors.map((p) => p.name)).toContain('Ramesh');
    expect(report.topDebtors.map((p) => p.name)).toContain('Vikas');

    // Top Creditors: Shyam (negative balance)
    expect(report.topCreditors.map((p) => p.name)).toContain('Shyam');
  });
});
