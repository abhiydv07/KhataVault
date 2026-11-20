import { describe, it, expect } from 'vitest';
import { filterAndSortHistory, computeHistoryMetrics, DayRecordSummary } from '../historyEngine';
import { createEmptyDaySheet } from '../calculatorEngine';

describe('History of Records Engine', () => {
  const dummySheet1 = createEmptyDaySheet('2026-11-10');
  dummySheet1.lenaEntries = [
    {
      id: '1',
      friendName: 'Ramesh',
      rawExpression: '5000',
      evaluatedAmount: 5000,
      countInTotal: true,
      createdAt: 1,
      updatedAt: 1,
    },
  ];

  const dummySheet2 = createEmptyDaySheet('2026-11-11');
  dummySheet2.denaEntries = [
    {
      id: '2',
      friendName: 'Suresh',
      rawExpression: '2000',
      evaluatedAmount: 2000,
      countInTotal: true,
      createdAt: 2,
      updatedAt: 2,
    },
  ];
  dummySheet2.note = 'Special supplier payment';

  const mockRecords: DayRecordSummary[] = [
    {
      date: '2026-11-10',
      sheet: dummySheet1,
      results: {} as any,
      totalLena: 5000,
      totalDena: 0,
      farak: 5000,
      verdict: 'lena',
      partiesCount: 1,
      hasNote: false,
      hasOverdue: false,
      partiesList: [{ name: 'Ramesh', amount: 5000, side: 'lena' }],
      updatedAt: 100,
    },
    {
      date: '2026-11-11',
      sheet: dummySheet2,
      results: {} as any,
      totalLena: 0,
      totalDena: 2000,
      farak: -2000,
      verdict: 'dena',
      partiesCount: 1,
      hasNote: true,
      note: 'Special supplier payment',
      hasOverdue: false,
      partiesList: [{ name: 'Suresh', amount: 2000, side: 'dena' }],
      updatedAt: 200,
    },
  ];

  it('computes overall metrics correctly', () => {
    const metrics = computeHistoryMetrics(mockRecords);
    expect(metrics.totalDays).toBe(2);
    expect(metrics.totalLenaTurnover).toBe(5000);
    expect(metrics.totalDenaTurnover).toBe(2000);
    expect(metrics.totalTurnover).toBe(7000);
    expect(metrics.netHistoricalBalance).toBe(3000);
    expect(metrics.totalDistinctParties).toBe(2);
  });

  it('filters history by party name search query', () => {
    const res = filterAndSortHistory(mockRecords, 'Ramesh', 'all', 'date_desc');
    expect(res).toHaveLength(1);
    expect(res[0].date).toBe('2026-11-10');
  });

  it('filters history by note query', () => {
    const res = filterAndSortHistory(mockRecords, 'supplier', 'all', 'date_desc');
    expect(res).toHaveLength(1);
    expect(res[0].date).toBe('2026-11-11');
  });

  it('filters history by category filter (lena)', () => {
    const res = filterAndSortHistory(mockRecords, '', 'lena', 'date_desc');
    expect(res).toHaveLength(1);
    expect(res[0].verdict).toBe('lena');
  });
});
