import React, { useState, useMemo } from 'react';
import { X, Coins, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import { Language } from '../utils/i18n';

interface CashCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  avlBalance: number; // The Avl. Balance (Lena total) from calculated results
  lang: Language;
}

type DenomKey = '500' | '200' | '100' | '50' | '20' | '10' | '5' | 'coins';

const DENOMS: { key: DenomKey; label: string; labelHi: string; value: number; emoji: string }[] = [
  { key: '500',   label: '₹500 Notes',   labelHi: '₹500 के नोट',   value: 500,  emoji: '🟢' },
  { key: '200',   label: '₹200 Notes',   labelHi: '₹200 के नोट',   value: 200,  emoji: '🟡' },
  { key: '100',   label: '₹100 Notes',   labelHi: '₹100 के नोट',   value: 100,  emoji: '🟣' },
  { key: '50',    label: '₹50 Notes',    labelHi: '₹50 के नोट',    value: 50,   emoji: '🔵' },
  { key: '20',    label: '₹20 Notes',    labelHi: '₹20 के नोट',    value: 20,   emoji: '🟠' },
  { key: '10',    label: '₹10 Notes',    labelHi: '₹10 के नोट',    value: 10,   emoji: '🔴' },
  { key: '5',     label: '₹5 Notes',     labelHi: '₹5 के नोट',     value: 5,    emoji: '⚪' },
  { key: 'coins', label: 'Coins (₹1-2)', labelHi: 'सिक्के (₹1-2)', value: 1,    emoji: '🪙' },
];

export const CashCounterModal: React.FC<CashCounterModalProps> = ({
  isOpen,
  onClose,
  avlBalance,
  lang,
}) => {
  const isHi = lang === 'hi';

  const [counts, setCounts] = useState<Record<DenomKey, string>>({
    '500': '', '200': '', '100': '', '50': '', '20': '', '10': '', '5': '', 'coins': '',
  });

  const totalCash = useMemo(() => {
    return DENOMS.reduce((acc, d) => {
      const n = parseInt(counts[d.key] || '0', 10);
      return acc + (isNaN(n) ? 0 : n * d.value);
    }, 0);
  }, [counts]);

  const diff = totalCash - avlBalance;
  const isMatched = Math.abs(diff) < 1;
  const isOver = diff > 0;

  const handleChange = (key: DenomKey, val: string) => {
    // Allow only non-negative integers
    if (val === '' || /^\d+$/.test(val)) {
      setCounts((prev) => ({ ...prev, [key]: val }));
    }
  };

  const handleReset = () => {
    setCounts({ '500': '', '200': '', '100': '', '50': '', '20': '', '10': '', '5': '', 'coins': '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                {isHi ? 'रोकड़ / नोट गिनती' : 'Cash Denomination Counter'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHi ? 'नोट गिनकर हिसाब मिलाएं' : 'Count notes and verify balance'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Denomination Grid */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5">
          <div className="space-y-2.5">
            {DENOMS.map((d) => {
              const count = parseInt(counts[d.key] || '0', 10);
              const subtotal = isNaN(count) ? 0 : count * d.value;
              return (
                <div
                  key={d.key}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                >
                  {/* Denomination label */}
                  <div className="w-28 shrink-0">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {d.emoji} {isHi ? d.labelHi : d.label}
                    </span>
                  </div>

                  {/* × symbol */}
                  <span className="text-slate-400 font-bold text-base">×</span>

                  {/* Count input */}
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    value={counts[d.key]}
                    onChange={(e) => handleChange(d.key, e.target.value)}
                    placeholder="0"
                    className="w-20 px-2.5 py-1.5 text-sm font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-center"
                  />

                  {/* = subtotal */}
                  <span className="text-slate-400 font-bold">=</span>
                  <div className="flex-1 text-right">
                    <span className="text-sm font-mono font-bold text-amber-700 dark:text-amber-400">
                      {subtotal > 0 ? `₹${formatIndianCurrency(subtotal)}` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="mt-4 w-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition py-2"
          >
            {isHi ? '↺ सब खाली करें' : '↺ Reset All'}
          </button>
        </div>

        {/* Sticky Footer: Totals & Verdict */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-3 bg-white dark:bg-slate-900">
          {/* Total cash counted */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {isHi ? '📦 कुल नोट गिनती' : '📦 Total Cash Counted'}
            </span>
            <span className="font-black font-mono text-lg text-amber-700 dark:text-amber-400">
              ₹{formatIndianCurrency(totalCash)}
            </span>
          </div>

          {/* Expected (Avl. Balance) */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {isHi ? '📋 उपलब्ध बैलेंस (लेना)' : '📋 Avl. Balance (Lena)'}
            </span>
            <span className="font-bold font-mono text-base text-emerald-700 dark:text-emerald-400">
              ₹{formatIndianCurrency(avlBalance)}
            </span>
          </div>

          {/* Verdict */}
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
              isMatched
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
            }`}
          >
            {isMatched ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <div>
              {isMatched ? (
                <p className="font-black text-emerald-800 dark:text-emerald-200 text-sm">
                  {isHi ? '✓ हिसाब मिल गया!' : '✓ Cash matches perfectly!'}
                </p>
              ) : (
                <>
                  <p className="font-black text-amber-800 dark:text-amber-200 text-sm">
                    {isHi
                      ? `${isOver ? '⬆️ ज़्यादा' : '⬇️ कम'} — फ़र्क: ₹${formatIndianCurrency(Math.abs(diff))}`
                      : `${isOver ? '⬆️ Cash Over' : '⬇️ Cash Short'} — Diff: ₹${formatIndianCurrency(Math.abs(diff))}`}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    {isHi ? 'फिर से गिनें या हिसाब जांचें' : 'Recount or verify the ledger entries'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

