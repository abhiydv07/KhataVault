import React, { useState, useEffect } from 'react';
import { 
  X, 
  BarChart3, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  Scale, 
  Users, 
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Percent
} from 'lucide-react';
import { reportsEngine, PeriodReport } from '../utils/reportsEngine';
import { exportReportToExcel } from '../utils/exportExcel';
import { exportReportToPdf } from '../utils/exportPdf';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import { storageService } from '../utils/storage';
import { Language, translations } from '../utils/i18n';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  lang: Language;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  lang,
}) => {
  const [reportType, setReportType] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => currentDate.substring(0, 7));
  const [selectedYear, setSelectedYear] = useState<string>(() => currentDate.substring(0, 4));
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [partySearch, setPartySearch] = useState('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const t = translations[lang];

  useEffect(() => {
    storageService.getAllMonths().then((months) => {
      setAvailableMonths(months);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    if (reportType === 'month') {
      reportsEngine.generateMonthlyReport(selectedMonth).then((res) => {
        setReport(res);
        setIsLoading(false);
      });
    } else {
      reportsEngine.generateYearlyReport(selectedYear).then((res) => {
        setReport(res);
        setIsLoading(false);
      });
    }
  }, [isOpen, reportType, selectedMonth, selectedYear]);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    if (report) exportReportToExcel(report);
  };

  const handleExportPdf = () => {
    if (report) exportReportToPdf(report);
  };

  const filteredParties = report
    ? report.partySummaries.filter((p) =>
        p.name.toLowerCase().includes(partySearch.toLowerCase())
      )
    : [];

  // Max value for visual SVG chart scaling
  const maxDayValue = report
    ? Math.max(
        ...report.dayBreakdown.map((d) => Math.max(d.totalLena, d.totalDena)),
        1000
      )
    : 1000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {t.reports} — {report ? report.periodLabel : 'Loading...'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly & Yearly statements with Excel/PDF export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Period Type Toggle */}
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setReportType('month')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  reportType === 'month'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.monthlyReport}
              </button>
              <button
                onClick={() => setReportType('year')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  reportType === 'year'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.yearlyReport}
              </button>
            </div>

            {/* Period Selector */}
            {reportType === 'month' ? (
              <div>
                <input
                  type="month"
                  list="available-months"
                  value={selectedMonth}
                  onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                />
                <datalist id="available-months">
                  {availableMonths.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            ) : (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {isLoading || !report ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Generating financial statement...
            </div>
          ) : (
            <>
              {/* Top Action Bar: Export Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-md">
                <div>
                  <h4 className="font-bold text-sm sm:text-base">
                    Statement Ready: {report.periodLabel}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {report.daysCount} days recorded • {report.partySummaries.length} parties involved
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleExportExcel}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{t.exportExcel}</span>
                  </button>

                  <button
                    onClick={handleExportPdf}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t.exportPdf}</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Total Lena */}
                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5">
                  <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Total {t.lena}</span>
                  </div>
                  <div className="font-mono font-black text-lg sm:text-xl text-emerald-700 dark:text-emerald-200 mt-1">
                    {formatIndianCurrency(report.totalLena, true)}
                  </div>
                </div>

                {/* Total Dena */}
                <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-3.5">
                  <div className="flex items-center gap-1 text-rose-800 dark:text-rose-300 text-xs font-bold">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Total {t.dena}</span>
                  </div>
                  <div className="font-mono font-black text-lg sm:text-xl text-rose-700 dark:text-rose-200 mt-1">
                    {formatIndianCurrency(report.totalDena, true)}
                  </div>
                </div>

                {/* Net Farak */}
                <div className={`border rounded-2xl p-3.5 ${
                  report.verdict === 'lena'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-100'
                    : report.verdict === 'dena'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-900 dark:text-rose-100'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-800 dark:text-slate-100'
                }`}>
                  <div className="flex items-center gap-1 text-xs font-bold">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Net {t.farak}</span>
                  </div>
                  <div className="font-mono font-black text-lg sm:text-xl mt-1">
                    {formatIndianCurrency(Math.abs(report.netFarak), true)}
                    <span className="text-xs ml-1 font-sans uppercase">
                      {report.verdict === 'lena' ? 'Lena' : report.verdict === 'dena' ? 'Dena' : 'Barabar'}
                    </span>
                  </div>
                </div>

                {/* Cash Charge & Kharcha */}
                <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5">
                  <div className="flex items-center gap-1 text-amber-800 dark:text-amber-300 text-xs font-bold">
                    <Percent className="w-3.5 h-3.5" />
                    <span>Charges & Kharcha</span>
                  </div>
                  <div className="font-mono font-bold text-sm text-amber-900 dark:text-amber-100 mt-1">
                    Chg: {formatIndianCurrency(report.totalCashCharge, true)}
                  </div>
                  <div className="font-mono text-xs text-amber-700 dark:text-amber-300">
                    Exp: {formatIndianCurrency(report.totalKharcha, true)}
                  </div>
                </div>

              </div>

              {/* Visual Daily Trend Chart */}
              {report.dayBreakdown.length > 0 && (
                <div className="bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Daily Turnover & Flow (Lena vs Dena)
                    </h4>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Lena
                      </span>
                      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Dena
                      </span>
                    </div>
                  </div>

                  {/* SVG Bar Chart */}
                  <div className="h-44 w-full flex items-end gap-1.5 sm:gap-3 overflow-x-auto pt-4 pb-1">
                    {report.dayBreakdown.map((d) => {
                      const lenaHeight = Math.max(4, Math.round((d.totalLena / maxDayValue) * 120));
                      const denaHeight = Math.max(4, Math.round((d.totalDena / maxDayValue) * 120));
                      const dayLabel = d.date.substring(8); // '10' from '2026-11-10'

                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center min-w-[28px] group relative">
                          {/* Tooltip */}
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 bg-slate-950 text-white text-[10px] p-1.5 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg transition">
                            <div className="font-bold">{d.date}</div>
                            <div>L: {formatIndianCurrency(d.totalLena)} | D: {formatIndianCurrency(d.totalDena)}</div>
                          </div>

                          {/* Dual Bars */}
                          <div className="flex items-end gap-0.5 w-full justify-center">
                            <div
                              style={{ height: `${lenaHeight}px` }}
                              className="w-2.5 sm:w-3.5 bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition-all"
                            />
                            <div
                              style={{ height: `${denaHeight}px` }}
                              className="w-2.5 sm:w-3.5 bg-rose-500 hover:bg-rose-600 rounded-t-sm transition-all"
                            />
                          </div>

                          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                            {dayLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top Debtors & Creditors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Top Debtors (Whom to collect from) */}
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-2.5">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    Top Parties to Collect From (Lena)
                  </h4>
                  {report.topDebtors.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">No outstanding receivables.</p>
                  ) : (
                    <div className="space-y-2">
                      {report.topDebtors.map((p) => (
                        <div key={p.name} className="flex items-center justify-between text-xs py-1 border-b border-emerald-100 dark:border-emerald-900/40">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatIndianCurrency(p.net, true)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Creditors (Whom you owe) */}
                <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/60 rounded-2xl p-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5 mb-2.5">
                    <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                    Top Parties You Owe To (Dena)
                  </h4>
                  {report.topCreditors.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">No outstanding payables.</p>
                  ) : (
                    <div className="space-y-2">
                      {report.topCreditors.map((p) => (
                        <div key={p.name} className="flex items-center justify-between text-xs py-1 border-b border-rose-100 dark:border-rose-900/40">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            {formatIndianCurrency(Math.abs(p.net), true)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Full Party Breakdown Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    All Party Ledger Balances ({report.partySummaries.length})
                  </h4>
                  
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={partySearch}
                      onChange={(e) => setPartySearch(e.target.value)}
                      placeholder="Filter party name..."
                      className="w-full pl-8 pr-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Party Name</th>
                        <th className="py-2 px-3 text-right">Lena (Collected)</th>
                        <th className="py-2 px-3 text-right">Dena (Given)</th>
                        <th className="py-2 px-3 text-right">Net Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredParties.map((p) => {
                        const isCollect = p.net > 0;
                        const isPay = p.net < 0;

                        return (
                          <tr key={p.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">{p.name}</td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                              {formatIndianCurrency(p.lena)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                              {formatIndianCurrency(p.dena)}
                            </td>
                            <td className={`py-2 px-3 text-right font-mono font-bold ${
                              isCollect ? 'text-emerald-600 dark:text-emerald-400' : isPay ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'
                            }`}>
                              {formatIndianCurrency(Math.abs(p.net), true)}
                              <span className="text-[10px] ml-1 font-sans">
                                {isCollect ? '(Lena)' : isPay ? '(Dena)' : ''}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            Close Reports
          </button>
        </div>

      </div>
    </div>
  );
};
