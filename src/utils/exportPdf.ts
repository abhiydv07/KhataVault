import { PeriodReport } from './reportsEngine';
import { formatIndianCurrency } from './currencyFormatter';

/**
 * Dynamically loads jsPDF and autoTable only when user clicks export.
 * This keeps the main application bundle ultra-lightweight.
 */
export async function exportReportToPdf(report: PeriodReport): Promise<void> {
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
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Commercial Ledger & Daily Settlement Statement', 14, 20);

  // Period on the right
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(report.periodLabel.toUpperCase(), 196, 14, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 196, 20, { align: 'right' });

  // 2. Verdict Callout Box
  const isLena = report.verdict === 'lena';
  const isDena = report.verdict === 'dena';

  if (isLena) {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(16, 185, 129); // emerald-500
  } else if (isDena) {
    doc.setFillColor(254, 242, 242); // rose-50
    doc.setDrawColor(239, 68, 68); // rose-500
  } else {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(100, 116, 139); // slate-500
  }

  doc.setLineWidth(0.5);
  doc.roundedRect(14, 38, 182, 22, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isLena ? 4 : isDena ? 185 : 51, isLena ? 120 : isDena ? 28 : 65, isLena ? 87 : isDena ? 28 : 85);
  doc.text('FINAL VERDICT (NET BALANCE):', 20, 46);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const farakText = `${formatIndianCurrency(Math.abs(report.netFarak), true)} ${
    isLena ? 'LENA (RECEIVABLE)' : isDena ? 'DENA (PAYABLE)' : 'HISAAB BARABAR'
  }`;
  doc.text(farakText, 20, 54);

  // 3. KPI Summary Table
  const kpiData = [
    [
      'Total Lena (Collect)',
      'Total Dena (Pay)',
      'Cash Charge',
      'Kharcha',
      'RTGS / Bank',
      'Days Recorded',
    ],
    [
      formatIndianCurrency(report.totalLena),
      formatIndianCurrency(report.totalDena),
      formatIndianCurrency(report.totalCashCharge),
      formatIndianCurrency(report.totalKharcha),
      formatIndianCurrency(report.totalRtgs),
      `${report.daysCount} Days`,
    ],
  ];

  autoTable(doc, {
    startY: 65,
    head: [kpiData[0]],
    body: [kpiData[1]],
    theme: 'grid',
    styles: {
      fontSize: 8,
      halign: 'center',
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontStyle: 'bold',
      textColor: [15, 23, 42],
    },
  });

  // 4. Daily Breakdown Table
  let currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Daily Ledger Breakdown', 14, currentY);

  const dailyHeaders = ['Date', 'Lena', 'Dena', 'U/L', 'Cash Chg', 'Kharcha', 'Farak', 'Verdict'];
  const dailyRows = report.dayBreakdown.map((d) => [
    d.date,
    formatIndianCurrency(d.totalLena),
    formatIndianCurrency(d.totalDena),
    formatIndianCurrency(d.totalUpline),
    formatIndianCurrency(d.cashCharge),
    formatIndianCurrency(d.kharcha),
    formatIndianCurrency(Math.abs(d.farak)),
    d.verdict.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [dailyHeaders],
    body: dailyRows.length > 0 ? dailyRows : [['No entries recorded in this period', '', '', '', '', '', '', '']],
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
  });

  // 5. Party Balances Table
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Party / Friend Running Balances', 14, currentY);

  const partyHeaders = ['Party / Friend Name', 'Total Lena', 'Total Dena', 'Net Balance', 'Status', 'Entries'];
  const partyRows = report.partySummaries.map((p) => [
    p.name,
    formatIndianCurrency(p.lena),
    formatIndianCurrency(p.dena),
    formatIndianCurrency(Math.abs(p.net)),
    p.net > 0 ? 'LENA' : p.net < 0 ? 'DENA' : 'SETTLED',
    p.count.toString(),
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [partyHeaders],
    body: partyRows.length > 0 ? partyRows : [['No parties recorded in this period', '', '', '', '', '']],
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
  });

  // 6. Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `KhataVault • 100% Private Commercial Ledger • Stored in User Google Drive • Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  // Trigger download
  const filename = `KhataVault_${report.periodKey}_Statement.pdf`;
  doc.save(filename);
}
