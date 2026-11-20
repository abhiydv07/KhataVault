import { DayHisaabSheet, CalculatedResults } from '../types/hisaab';
import { storageService } from './storage';
import { calculateSheet } from './calculatorEngine';
import { evaluateExpression } from './mathParser';

export interface DayRecordSummary {
  date: string;
  sheet: DayHisaabSheet;
  results: CalculatedResults;
  totalLena: number;
  totalDena: number;
  farak: number;
  verdict: 'lena' | 'dena' | 'barabar';
  partiesCount: number;
  hasNote: boolean;
  hasOverdue: boolean;
  note?: string;
  partiesList: { name: string; amount: number; side: 'lena' | 'dena' }[];
  updatedAt: number;
}

export interface HistoryOverallMetrics {
  totalDays: number;
  totalLenaTurnover: number;
  totalDenaTurnover: number;
  totalTurnover: number;
  netHistoricalBalance: number;
  totalDistinctParties: number;
  overdueDaysCount: number;
}

export type HistoryFilter = 'all' | 'lena' | 'dena' | 'notes' | 'overdue';
export type HistorySort = 'date_desc' | 'date_asc' | 'volume_desc';

/**
 * Fetch and index all recorded daily sheets across all stored months.
 */
export async function getAllRecordedDays(): Promise<DayRecordSummary[]> {
  const months = await storageService.getAllMonths();
  const summaries: DayRecordSummary[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  for (const m of months) {
    const file = await storageService.getMonthFile(m);
    for (const [date, sheet] of Object.entries(file.days)) {
      // Exclude completely blank sheets
      const hasLena = sheet.lenaEntries && sheet.lenaEntries.length > 0;
      const hasDena = sheet.denaEntries && sheet.denaEntries.length > 0;
      const hasNote = Boolean(sheet.note && sheet.note.trim() !== '');

      if (!hasLena && !hasDena && !hasNote) {
        continue;
      }

      const results = calculateSheet(sheet);

      // Extract parties preview
      const partiesList: { name: string; amount: number; side: 'lena' | 'dena' }[] = [];
      let hasOverdue = false;

      for (const e of sheet.lenaEntries || []) {
        if (!e.friendName) continue;
        const amt = e.evaluatedAmount || evaluateExpression(e.rawExpression);
        partiesList.push({ name: e.friendName.trim(), amount: amt, side: 'lena' });
        if (e.dueDate && e.dueDate < todayStr && amt > 0) {
          hasOverdue = true;
        }
      }

      for (const e of sheet.denaEntries || []) {
        if (!e.friendName) continue;
        const amt = e.evaluatedAmount || evaluateExpression(e.rawExpression);
        partiesList.push({ name: e.friendName.trim(), amount: amt, side: 'dena' });
      }

      summaries.push({
        date,
        sheet,
        results,
        totalLena: results.totalLena,
        totalDena: results.totalDena,
        farak: results.farak,
        verdict: results.verdict,
        partiesCount: partiesList.length,
        hasNote,
        hasOverdue,
        note: sheet.note,
        partiesList,
        updatedAt: sheet.updatedAt || 0,
      });
    }
  }

  // Sort newest first by default
  summaries.sort((a, b) => b.date.localeCompare(a.date));
  return summaries;
}

/**
 * Aggregate high-level statistics across all recorded history.
 */
export function computeHistoryMetrics(records: DayRecordSummary[]): HistoryOverallMetrics {
  let totalLenaTurnover = 0;
  let totalDenaTurnover = 0;
  const distinctParties = new Set<string>();
  let overdueDaysCount = 0;

  for (const r of records) {
    totalLenaTurnover += r.totalLena;
    totalDenaTurnover += r.totalDena;
    if (r.hasOverdue) overdueDaysCount++;
    for (const p of r.partiesList) {
      distinctParties.add(p.name.toLowerCase());
    }
  }

  return {
    totalDays: records.length,
    totalLenaTurnover,
    totalDenaTurnover,
    totalTurnover: totalLenaTurnover + totalDenaTurnover,
    netHistoricalBalance: totalLenaTurnover - totalDenaTurnover,
    totalDistinctParties: distinctParties.size,
    overdueDaysCount,
  };
}

/**
 * Search and filter history records.
 */
export function filterAndSortHistory(
  records: DayRecordSummary[],
  query: string,
  filter: HistoryFilter,
  sort: HistorySort
): DayRecordSummary[] {
  const cleanQuery = query.trim().toLowerCase();

  const filtered = records.filter((r) => {
    // 1. Text Search matching Date, Party names, or Note
    if (cleanQuery) {
      const dateMatch = r.date.toLowerCase().includes(cleanQuery);
      const noteMatch = r.note ? r.note.toLowerCase().includes(cleanQuery) : false;
      const partyMatch = r.partiesList.some((p) => p.name.toLowerCase().includes(cleanQuery));

      if (!dateMatch && !noteMatch && !partyMatch) {
        return false;
      }
    }

    // 2. Category Filters
    if (filter === 'lena' && r.verdict !== 'lena') return false;
    if (filter === 'dena' && r.verdict !== 'dena') return false;
    if (filter === 'notes' && !r.hasNote) return false;
    if (filter === 'overdue' && !r.hasOverdue) return false;

    return true;
  });

  // 3. Sorting
  return filtered.sort((a, b) => {
    if (sort === 'date_asc') {
      return a.date.localeCompare(b.date);
    }
    if (sort === 'volume_desc') {
      const volA = a.totalLena + a.totalDena;
      const volB = b.totalLena + b.totalDena;
      return volB - volA;
    }
    // date_desc
    return b.date.localeCompare(a.date);
  });
}
