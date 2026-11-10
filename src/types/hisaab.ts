export interface LedgerEntry {
  id: string;
  friendName: string;
  rawExpression: string;
  evaluatedAmount: number;
  countInTotal: boolean;
  upline?: number; // only relevant for Dena side (can be positive or negative)
  rawUplineExpression?: string;
  createdAt: number;
  updatedAt: number;
}

export type CashChargeBase = 'dena' | 'lena' | 'net' | 'avl_balance';

export interface CustomHisaabItem {
  id: string;
  label: string;
  amount: number;
  rawExpression?: string;
  type: 'add' | 'subtract'; // add increases Lena/credit, subtract increases Dena/debit
}

export interface HisaabBlock {
  cashChargePercent: number; // default 3.0, step 0.25
  cashChargeBase: CashChargeBase; // what amount cash charge applies on (default: 'dena')
  oldCB: number; // Old Closing Balance (can be positive or negative)
  rawOldCBExpression?: string;
  bonus: number;
  rawBonusExpression?: string;
  kharcha: number; // Expenses
  rawKharchaExpression?: string;
  confirmation: number;
  rawConfirmationExpression?: string;
  rtgs: number;
  rawRtgsExpression?: string;
  customItems: CustomHisaabItem[];
}

export interface DayHisaabSheet {
  id: string; // e.g. "2026-11-10"
  date: string; // YYYY-MM-DD
  lenaEntries: LedgerEntry[];
  denaEntries: LedgerEntry[];
  hisaabBlock: HisaabBlock;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MonthHisaabFile {
  month: string; // YYYY-MM
  days: Record<string, DayHisaabSheet>; // date -> DayHisaabSheet
  version: number;
  lastSyncedAt?: number;
  checksum?: string;
}

export interface CalculatedResults {
  totalLena: number;
  totalDena: number;
  totalDenaUpline: number;
  avlBalance: number; // auto = totalLena
  cashChargeAmount: number;
  cashChargeBaseAmount: number;
  totalKharcha: number;
  totalBonus: number;
  totalOldCB: number;
  totalConfirmation: number;
  totalRtgs: number;
  customAdditions: number;
  customSubtractions: number;
  totalCredit: number; // Total on Lena / Inflow side
  totalDebit: number; // Total on Dena / Outflow side
  farak: number; // net difference: totalCredit - totalDebit
  verdict: 'lena' | 'dena' | 'barabar';
}

export interface FriendSummary {
  name: string;
  totalLena: number;
  totalDena: number;
  netBalance: number; // positive = to collect, negative = to give
  lastTransactionDate: string;
  transactionCount: number;
}

