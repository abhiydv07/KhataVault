import { DayHisaabSheet, CalculatedResults, LedgerEntry, HisaabBlock } from '../types/hisaab';
import { evaluateExpression } from './mathParser';

/**
 * Calculates live hisaab figures for a day's sheet.
 */
export function calculateSheet(sheet: DayHisaabSheet): CalculatedResults {
  // 1. Calculate Lena total (only entries where countInTotal === true)
  const totalLena = calculateEntriesTotal(sheet.lenaEntries);

  // 2. Calculate Dena total and Dena Upline total
  const { totalAmount: totalDena, totalUpline: totalDenaUpline } = calculateDenaTotals(sheet.denaEntries);

  // 3. Avl. Balance is auto-calculated = Lena total
  const avlBalance = totalLena;

  // 4. Cash charge calculation
  const hisaab = sheet.hisaabBlock;
  const cashChargePercent = hisaab.cashChargePercent ?? 3.0;

  let cashChargeBaseAmount = 0;
  switch (hisaab.cashChargeBase) {
    case 'dena':
      cashChargeBaseAmount = totalDena;
      break;
    case 'lena':
      cashChargeBaseAmount = totalLena;
      break;
    case 'net':
      cashChargeBaseAmount = Math.abs(totalLena - totalDena);
      break;
    case 'avl_balance':
    default:
      cashChargeBaseAmount = avlBalance;
      break;
  }

  const cashChargeAmount = Math.round(((cashChargePercent / 100) * cashChargeBaseAmount) * 100) / 100;

  // 5. Hisaab Block Items
  const oldCB = evaluateExpression(hisaab.rawOldCBExpression ?? hisaab.oldCB);
  const bonus = evaluateExpression(hisaab.rawBonusExpression ?? hisaab.bonus);
  const kharcha = evaluateExpression(hisaab.rawKharchaExpression ?? hisaab.kharcha);
  const confirmation = evaluateExpression(hisaab.rawConfirmationExpression ?? hisaab.confirmation);
  const rtgs = evaluateExpression(hisaab.rawRtgsExpression ?? hisaab.rtgs);

  // 6. Custom items
  let customAdditions = 0;
  let customSubtractions = 0;

  if (Array.isArray(hisaab.customItems)) {
    for (const item of hisaab.customItems) {
      const val = evaluateExpression(item.rawExpression ?? item.amount);
      if (item.type === 'add') {
        customAdditions += val;
      } else {
        customSubtractions += val;
      }
    }
  }

  // 7. Aggregate Credit (Lena / Inflow) and Debit (Dena / Outflow) sides
  // Lena side: Total Lena + Bonus + positive Old CB + custom additions
  const totalCredit =
    totalLena +
    bonus +
    (oldCB > 0 ? oldCB : 0) +
    customAdditions;

  // Dena side: Total Dena + Total Upline + Kharcha + Confirmation + RTGS + Cash Charge + negative Old CB + custom subtractions
  const totalDebit =
    totalDena +
    totalDenaUpline +
    kharcha +
    confirmation +
    rtgs +
    cashChargeAmount +
    (oldCB < 0 ? Math.abs(oldCB) : 0) +
    customSubtractions;

  // 8. Farak (Difference) = Credit - Debit
  // If positive: Lena (Receivable)
  // If negative: Dena (Payable)
  // If 0: Barabar (Settled)
  const farak = Math.round((totalCredit - totalDebit) * 100) / 100;

  let verdict: 'lena' | 'dena' | 'barabar' = 'barabar';
  if (farak > 0.001) {
    verdict = 'lena';
  } else if (farak < -0.001) {
    verdict = 'dena';
  }

  return {
    totalLena,
    totalDena,
    totalDenaUpline,
    avlBalance,
    cashChargeAmount,
    cashChargeBaseAmount,
    totalKharcha: kharcha,
    totalBonus: bonus,
    totalOldCB: oldCB,
    totalConfirmation: confirmation,
    totalRtgs: rtgs,
    customAdditions,
    customSubtractions,
    totalCredit,
    totalDebit,
    farak,
    verdict
  };
}

export function calculateEntriesTotal(entries: LedgerEntry[]): number {
  if (!Array.isArray(entries)) return 0;
  let sum = 0;
  for (const entry of entries) {
    if (entry.countInTotal) {
      const val = evaluateExpression(entry.rawExpression || entry.evaluatedAmount);
      sum += val;
    }
  }
  return Math.round(sum * 100) / 100;
}

export function calculateDenaTotals(entries: LedgerEntry[]): { totalAmount: number; totalUpline: number } {
  if (!Array.isArray(entries)) return { totalAmount: 0, totalUpline: 0 };
  let totalAmount = 0;
  let totalUpline = 0;

  for (const entry of entries) {
    if (entry.countInTotal) {
      const val = evaluateExpression(entry.rawExpression || entry.evaluatedAmount);
      totalAmount += val;

      if (entry.upline !== undefined || entry.rawUplineExpression !== undefined) {
        const uplineVal = evaluateExpression(entry.rawUplineExpression ?? entry.upline);
        totalUpline += uplineVal;
      }
    }
  }

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalUpline: Math.round(totalUpline * 100) / 100
  };
}

export function createEmptyDaySheet(dateString?: string): DayHisaabSheet {
  const today = dateString || new Date().toISOString().split('T')[0];
  const now = Date.now();

  const defaultHisaabBlock: HisaabBlock = {
    cashChargePercent: 3.0,
    cashChargeBase: 'dena',
    oldCB: 0,
    bonus: 0,
    kharcha: 0,
    confirmation: 0,
    rtgs: 0,
    customItems: []
  };

  return {
    id: today,
    date: today,
    lenaEntries: [],
    denaEntries: [],
    hisaabBlock: defaultHisaabBlock,
    note: '',
    createdAt: now,
    updatedAt: now
  };
}

