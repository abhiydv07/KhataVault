import { storageService } from './storage';
import { formatIndianCurrency } from './currencyFormatter';
import { evaluateExpression } from './mathParser';

export interface PartyTransaction {
  date: string;
  type: 'lena' | 'dena';
  rawExpression: string;
  amount: number;
  runningBalance: number;
}

export interface PartyStatementData {
  partyName: string;
  totalLena: number;
  totalDena: number;
  netBalance: number;
  transactions: PartyTransaction[];
}

/**
 * Fetch all historical transactions for a single counterparty across all recorded months.
 */
export async function getPartyTransactions(partyName: string): Promise<PartyStatementData> {
  const months = await storageService.getAllMonths();
  const rawList: { date: string; type: 'lena' | 'dena'; rawExpression: string; amount: number }[] = [];
  const targetLower = partyName.trim().toLowerCase();

  for (const m of months) {
    const file = await storageService.getMonthFile(m);
    for (const [date, sheet] of Object.entries(file.days)) {
      // Lena entries
      for (const entry of sheet.lenaEntries) {
        if (entry.friendName.trim().toLowerCase() === targetLower && entry.countInTotal) {
          const amt = entry.evaluatedAmount || evaluateExpression(entry.rawExpression);
          rawList.push({
            date,
            type: 'lena',
            rawExpression: entry.rawExpression || String(amt),
            amount: amt,
          });
        }
      }
      // Dena entries
      for (const entry of sheet.denaEntries) {
        if (entry.friendName.trim().toLowerCase() === targetLower && entry.countInTotal) {
          const amt = entry.evaluatedAmount || evaluateExpression(entry.rawExpression);
          rawList.push({
            date,
            type: 'dena',
            rawExpression: entry.rawExpression || String(amt),
            amount: amt,
          });
        }
      }
    }
  }

  // Sort chronologically ascending
  rawList.sort((a, b) => a.date.localeCompare(b.date));

  let running = 0;
  let totalLena = 0;
  let totalDena = 0;

  const transactions: PartyTransaction[] = rawList.map((item) => {
    if (item.type === 'lena') {
      totalLena += item.amount;
      running += item.amount;
    } else {
      totalDena += item.amount;
      running -= item.amount;
    }
    return {
      ...item,
      runningBalance: running,
    };
  });

  return {
    partyName,
    totalLena,
    totalDena,
    netBalance: running,
    transactions,
  };
}

/**
 * Generate a formal Statement of Account PDF for a single party.
 * Uses dynamic import for jsPDF to keep main bundle ultra-lightweight.
 */
export async function exportPartyStatementPdf(partyName: string): Promise<void> {
  const data = await getPartyTransactions(partyName);
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('KHATAVAULT', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Statement of Account (खाता विवरण)', 14, 21);

  // Date on the right
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 196, 14, { align: 'right' });

  // 2. Counterparty Details Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 38, 182, 24, 3, 3, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('COUNTERPARTY / ACCOUNT NAME:', 20, 46);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(data.partyName, 20, 54);

  // Net Status Summary Pill
  const isNetLena = data.netBalance > 0;
  const isSettled = Math.abs(data.netBalance) < 1;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  if (isSettled) {
    doc.setTextColor(16, 185, 129);
    doc.text('ACCOUNT FULLY SETTLED (BARABAR)', 190, 52, { align: 'right' });
  } else if (isNetLena) {
    doc.setTextColor(16, 185, 129);
    doc.text(`NET RECEIVABLE: Rs. ${formatIndianCurrency(data.netBalance)}`, 190, 52, { align: 'right' });
  } else {
    doc.setTextColor(239, 68, 68);
    doc.text(`NET PAYABLE: Rs. ${formatIndianCurrency(Math.abs(data.netBalance))}`, 190, 52, { align: 'right' });
  }

  // 3. Transactions Table
  const tableHeaders = ['Date', 'Transaction Type', 'Particulars', 'Credit (Lena)', 'Debit (Dena)', 'Balance'];
  const tableRows = data.transactions.map((tx) => [
    tx.date,
    tx.type === 'lena' ? 'Receivable (Lena)' : 'Payable (Dena)',
    tx.rawExpression,
    tx.type === 'lena' ? formatIndianCurrency(tx.amount) : '—',
    tx.type === 'dena' ? formatIndianCurrency(tx.amount) : '—',
    formatIndianCurrency(tx.runningBalance),
  ]);

  autoTable(doc, {
    startY: 68,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 32 },
      2: { cellWidth: 40 },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer & Signature line
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  if (finalY < 250) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Signatory & Seal:', 14, finalY + 22);
    doc.line(14, finalY + 36, 75, finalY + 36);
  }

  // Page Numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `KhataVault • 100% Private Ledger • Stored in User Google Drive • Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  // Save PDF
  const safeName = data.partyName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`KhataVault_Statement_${safeName}.pdf`);
}

