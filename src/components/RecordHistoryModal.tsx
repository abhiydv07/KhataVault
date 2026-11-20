import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  Search, 
  Calendar, 
  ArrowRight, 
  AlertCircle, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  ArrowUpDown
} from 'lucide-react';
import { Language } from '../utils/i18n';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import { 
  getAllRecordedDays, 
  computeHistoryMetrics, 
  filterAndSortHistory, 
  DayRecordSummary, 
  HistoryFilter, 
  HistorySort 
} from '../utils/historyEngine';

interface RecordHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  lang: Language;
  firmName?: string;
}

export const RecordHistoryModal: React.FC<RecordHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  lang,
  firmName = 'Main Firm',
}) => {
  const [records, setRecords] = useState<DayRecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>('all');
  const [activeSort, setActiveSort] = useState<HistorySort>('date_desc');

  const isHi = lang === 'hi';

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getAllRecordedDays()
      .then((res) => {
        setRecords(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load history records:', err);
        setLoading(false);
      });
  }, [isOpen]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const metrics = computeHistoryMetrics(records);
  const filteredRecords = filterAndSortHistory(records, searchQuery, activeFilter, activeSort);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleOpenDay = (date: string) => {
    onSelectDate(date);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <History className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="history-modal-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isHi ? 'बहीखाता रिकॉर्ड इतिहास (दैनिकी डायरी)' : 'Record History & Daily Diary'}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {firmName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {records.length} {isHi ? 'दिनों का हिसाब रिकॉर्ड सुरक्षित है' : 'recorded daily sheets in your account'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High-Level Overview Metrics */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {isHi ? 'कुल दर्ज दिन' : 'Total Days'}
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono mt-0.5">
              {metrics.totalDays}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {isHi ? 'कुल कारोबार (Turnover)' : 'Total Turnover'}
            </span>
            <div className="text-base sm:text-xl font-black font-mono text-cyan-300 mt-0.5">
              ₹ {formatIndianCurrency(metrics.totalTurnover, true)}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {isHi ? 'कुल लेना (Inflow)' : 'Total Lena (Inflow)'}
            </span>
            <div className="text-base sm:text-xl font-black font-mono text-emerald-400 mt-0.5">
              ₹ {formatIndianCurrency(metrics.totalLenaTurnover, true)}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {isHi ? 'कुल देना (Outflow)' : 'Total Dena (Outflow)'}
            </span>
            <div className="text-base sm:text-xl font-black font-mono text-rose-400 mt-0.5">
              ₹ {formatIndianCurrency(metrics.totalDenaTurnover, true)}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isHi ? 'तारीख, पार्टी का नाम (उदा. रमेश), या नोट खोजें...' : 'Search dates, party names (e.g. Ramesh), or notes...'}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value as HistorySort)}
                className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="date_desc">{isHi ? 'नवीनतम पहले (Newest)' : 'Newest First'}</option>
                <option value="date_asc">{isHi ? 'पुराने पहले (Oldest)' : 'Oldest First'}</option>
                <option value="volume_desc">{isHi ? 'उच्चतम रकम (High Volume)' : 'Highest Turnover'}</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-xl transition ${
                activeFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {isHi ? 'सभी' : 'All'} ({records.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('lena')}
              className={`px-3 py-1 rounded-xl transition flex items-center gap-1 ${
                activeFilter === 'lena'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>{isHi ? 'लेना सरप्लस' : 'Lena Surplus'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('dena')}
              className={`px-3 py-1 rounded-xl transition flex items-center gap-1 ${
                activeFilter === 'dena'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              <span>{isHi ? 'देना घाटा' : 'Dena Deficit'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('notes')}
              className={`px-3 py-1 rounded-xl transition flex items-center gap-1 ${
                activeFilter === 'notes'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>{isHi ? 'नोट वाले दिन' : 'With Notes'}</span>
            </button>

            {metrics.overdueDaysCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('overdue')}
                className={`px-3 py-1 rounded-xl transition flex items-center gap-1 ${
                  activeFilter === 'overdue'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                <span>{isHi ? 'अतिदेय (Overdue)' : 'Overdue'} ({metrics.overdueDaysCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* List of Historical Daily Sheets */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs font-mono animate-pulse">
              Loading record history...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <History className="w-10 h-10 mx-auto opacity-30 stroke-[1.5]" />
              <p className="text-xs sm:text-sm font-semibold">
                {searchQuery ? `No history records matching "${searchQuery}".` : 'No past daily sheets recorded yet.'}
              </p>
              <p className="text-xs opacity-75">
                Every daily hisaab sheet you create is automatically indexed and preserved here.
              </p>
            </div>
          ) : (
            filteredRecords.map((item) => {
              const isLena = item.verdict === 'lena';
              const isDena = item.verdict === 'dena';

              return (
                <div
                  key={item.date}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-800/80 shadow-xs hover:shadow-md transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  {/* Left Column: Date, Parties, and Notes */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 font-black text-sm sm:text-base text-slate-900 dark:text-white">
                        <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>{formatDateDisplay(item.date)}</span>
                      </div>
                      <span className="font-mono text-xs text-slate-400">({item.date})</span>

                      {item.hasOverdue && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" /> Overdue
                        </span>
                      )}
                    </div>

                    {/* Note if present */}
                    {item.note && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-800 inline-block">
                        📝 {item.note}
                      </p>
                    )}

                    {/* Parties Preview Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.partiesCount} {item.partiesCount === 1 ? 'party' : 'parties'}:
                      </span>
                      {item.partiesList.slice(0, 5).map((p, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setSearchQuery(p.name)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition ${
                            p.side === 'lena'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                          }`}
                          title={`Click to filter by ${p.name}`}
                        >
                          {p.name} (₹{formatIndianCurrency(p.amount)})
                        </button>
                      ))}
                      {item.partiesList.length > 5 && (
                        <span className="text-[10px] font-bold text-slate-400">
                          +{item.partiesList.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Turnover Breakdown */}
                  <div className="flex items-center gap-4 text-xs font-mono font-bold py-1 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Total Lena</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ₹ {formatIndianCurrency(item.totalLena)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Total Dena</span>
                      <span className="text-rose-600 dark:text-rose-400">
                        ₹ {formatIndianCurrency(item.totalDena)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-sans">Net Farak</span>
                      <div
                        className={`text-sm sm:text-base font-black ${
                          isLena
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isDena
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        ₹ {formatIndianCurrency(Math.abs(item.farak), true)}
                        <span className="text-[10px] ml-1 font-sans">
                          {isLena ? 'LENA' : isDena ? 'DENA' : 'BARABAR'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action: Open This Day */}
                  <div className="flex items-center justify-end gap-2 pt-1 md:pt-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDay(item.date)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition group-hover:scale-105"
                      title={isHi ? 'यह दिन कार्यक्षेत्र में खोलें' : 'Open this day in workspace'}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isHi ? 'यह दिन खोलें' : 'Open Sheet'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
          <span>
            {isHi ? 'किसी भी दिन पर क्लिक करके तुरंत विवरण देखें एवं संपादित करें।' : 'Click "Open Sheet" on any date to load and inspect that day.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
