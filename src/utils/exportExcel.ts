import { PeriodReport } from './reportsEngine';

/**
 * Dynamically loads SheetJS (xlsx) only when user clicks export.
 * This keeps the main application bundle ultra-lightweight.
 */
export async function exportReportToExcel(report: PeriodReport): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const summaryData = [
    ['KHATAVAULT - COMMERCIAL FINANCIAL REPORT'],
    ['Report Period', report.periodLabel],
    ['Report Type', report.periodType.toUpperCase()],
    ['Generated On', new Date().toLocaleString('en-IN')],
    [],
    ['KEY PERFORMANCE INDICATORS', 'AMOUNT (INR)'],
    ['Total Lena (Receivables)', report.totalLena],
    ['Total Dena (Payables)', report.totalDena],
    ['Total Dena Upline (U/L)', report.totalUpline],
    ['Total Cash Charge Paid', report.totalCashCharge],
    ['Total Kharcha (Expenses)', report.totalKharcha],
    ['Total Bonus', report.totalBonus],
    ['Total Old CB Carried', report.totalOldCB],
    ['Total Confirmation', report.totalConfirmation],
    ['Total RTGS (Bank Transfers)', report.totalRtgs],
    [],
    ['FINAL VERDICT', report.verdict.toUpperCase()],
    ['NET FARAK (BALANCE)', report.netFarak],
    ['Verdict Note', report.verdict === 'lena' ? 'You will collect money' : report.verdict === 'dena' ? 'You have to pay money' : 'Account is Settled'],
    ['Days Recorded in Period', report.daysCount],
    ['Parties Involved', report.partySummaries.length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // 2. Daily Breakdown Sheet
  const dailyHeaders = [
    'Date',
    'Total Lena',
    'Total Dena',
    'Upline (U/L)',
    'Cash Charge',
    'Kharcha',
    'Net Farak',
    'Verdict',
  ];

  const dailyRows = report.dayBreakdown.map((d) => [
    d.date,
    d.totalLena,
    d.totalDena,
    d.totalUpline,
    d.cashCharge,
    d.kharcha,
    d.farak,
    d.verdict.toUpperCase(),
  ]);

  const wsDaily = XLSX.utils.aoa_to_sheet([dailyHeaders, ...dailyRows]);
  XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Ledger');

  // 3. Party Balances Sheet
  const partyHeaders = [
    'Party / Friend Name',
    'Total Lena (Collected)',
    'Total Dena (Given)',
    'Net Balance',
    'Status',
    'Entries Count',
  ];

  const partyRows = report.partySummaries.map((p) => [
    p.name,
    p.lena,
    p.dena,
    p.net,
    p.net > 0 ? 'LENA (Collect)' : p.net < 0 ? 'DENA (Pay)' : 'SETTLED',
    p.count,
  ]);

  const wsParties = XLSX.utils.aoa_to_sheet([partyHeaders, ...partyRows]);
  XLSX.utils.book_append_sheet(wb, wsParties, 'Party Balances');

  // Generate & trigger download
  const filename = `KhataVault_${report.periodKey}_Report.xlsx`;
  XLSX.writeFile(wb, filename);
}
