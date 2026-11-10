import React from 'react';
import { Plus, Trash2, CheckSquare, Square, Calculator, Lock } from 'lucide-react';
import { LedgerEntry } from '../types/hisaab';
import { evaluateExpression } from '../utils/mathParser';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import { Language, translations } from '../utils/i18n';
import { audioService } from '../utils/audioService';

interface LedgerTableProps {
  type: 'lena' | 'dena';
  entries: LedgerEntry[];
  onChange: (entries: LedgerEntry[]) => void;
  onDeleteRow: (entry: LedgerEntry, index: number, type: 'lena' | 'dena') => void;
  knownFriendNames: string[];
  lang: Language;
  isReadOnly?: boolean;
  onOpenBilling?: () => void;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  type,
  entries,
  onChange,
  onDeleteRow,
  knownFriendNames,
  lang,
  isReadOnly = false,
  onOpenBilling,
}) => {
  const t = translations[lang];
  const isLena = type === 'lena';

  // Add new row
  const handleAddRow = () => {
    const newEntry: LedgerEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      friendName: '',
      rawExpression: '',
      evaluatedAmount: 0,
      countInTotal: true,
      upline: isLena ? undefined : 0,
      rawUplineExpression: isLena ? undefined : '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onChange([...entries, newEntry]);
    audioService.playEntryAdded();
  };

  // Update a specific row field
  const handleFieldChange = (
    index: number,
    field: keyof LedgerEntry,
    value: string | number | boolean
  ) => {
    const updated = [...entries];
    const current = { ...updated[index] };

    if (field === 'rawExpression') {
      const raw = String(value);
      current.rawExpression = raw;
      current.evaluatedAmount = evaluateExpression(raw);
    } else if (field === 'rawUplineExpression') {
      const raw = String(value);
      current.rawUplineExpression = raw;
      current.upline = evaluateExpression(raw);
    } else if (field === 'countInTotal') {
      current.countInTotal = Boolean(value);
    } else if (field === 'friendName') {
      current.friendName = String(value);
    }

    current.updatedAt = Date.now();
    updated[index] = current;
    onChange(updated);
  };

  // Remove a row
  const handleRemove = (index: number) => {
    const target = entries[index];
    onDeleteRow(target, index, type);
    const updated = entries.filter((_, i) => i !== index);
    onChange(updated);
    audioService.playDelete();
  };

  // Calculate side subtotal
  const subtotal = entries.reduce((acc, curr) => {
    if (!curr.countInTotal) return acc;
    return acc + (curr.evaluatedAmount || evaluateExpression(curr.rawExpression));
  }, 0);

  const uplineSubtotal = isLena
    ? 0
    : entries.reduce((acc, curr) => {
        if (!curr.countInTotal) return acc;
        return acc + (curr.upline || evaluateExpression(curr.rawUplineExpression));
      }, 0);

  return (
    <div
      className={`rounded-3xl border shadow-xl transition-all duration-300 overflow-hidden ${
        isLena
          ? 'bg-white dark:bg-slate-900 border-emerald-500/30 dark:border-emerald-500/20 shadow-emerald-950/10'
          : 'bg-white dark:bg-slate-900 border-rose-500/30 dark:border-rose-500/20 shadow-rose-950/10'
      }`}
    >
      {/* Top accent glow line */}
      <div
        className={`h-1.5 w-full ${
          isLena
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
            : 'bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600'
        }`}
      />

      {/* Header bar */}
      <div
        className={`px-5 py-4 border-b flex items-center justify-between ${
          isLena
            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-100'
            : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/70 dark:border-rose-800/40 text-rose-950 dark:text-rose-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-3.5 h-3.5 rounded-full shadow-xs ${
              isLena ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          <h3 className="font-black text-base sm:text-lg tracking-tight">
            {isLena ? t.lenaSide : t.denaSide}
          </h3>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700">
            {entries.length} {entries.length === 1 ? 'Party' : 'Parties'}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold opacity-75 uppercase tracking-wider block">
            {t.subtotal}
          </span>
          <span className="font-black font-mono text-base sm:text-xl">
            {formatIndianCurrency(subtotal, true)}
          </span>
        </div>
      </div>

      {/* Datalist for Party auto-complete */}
      <datalist id={`friend-suggestions-${type}`}>
        {knownFriendNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {/* Rows Container */}
      <div className="p-3 sm:p-5 space-y-3 max-h-[520px] overflow-y-auto">
        {entries.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <Calculator className="w-10 h-10 mx-auto opacity-30 stroke-[1.5]" />
            <p className="text-xs sm:text-sm font-semibold">{t.noEntriesYet}</p>
            <p className="text-xs opacity-75">Click "{t.addRow}" below or use Voice Entry to add counterparties.</p>
          </div>
        ) : (
          entries.map((entry, index) => {
            const evaluated = entry.evaluatedAmount || evaluateExpression(entry.rawExpression);
            const uplineEval = isLena
              ? 0
              : entry.upline ?? evaluateExpression(entry.rawUplineExpression);

            return (
              <div
                key={entry.id}
                className={`group relative rounded-2xl p-3 sm:p-3.5 border transition-all duration-150 ${
                  entry.countInTotal
                    ? 'bg-slate-50/70 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 shadow-xs'
                    : 'bg-slate-100/60 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  {/* Count in total Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleFieldChange(index, 'countInTotal', !entry.countInTotal)}
                    className="mt-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                    title={t.countInTotal}
                    aria-label={t.countInTotal}
                  >
                    {entry.countInTotal ? (
                      <CheckSquare className={`w-5 h-5 ${isLena ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  {/* Main Inputs Grid */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
                    
                    {/* Friend Name with suggestions */}
                    <div className={isLena ? 'sm:col-span-6' : 'sm:col-span-5'}>
                      <input
                        type="text"
                        list={`friend-suggestions-${type}`}
                        value={entry.friendName}
                        onChange={(e) => handleFieldChange(index, 'friendName', e.target.value)}
                        placeholder={t.friendName}
                        className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                      />
                    </div>

                    {/* Amount Expression Input (accepts e.g. 1570+3135) */}
                    <div className={isLena ? 'sm:col-span-6' : 'sm:col-span-4'}>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="text"
                          value={entry.rawExpression}
                          onChange={(e) => handleFieldChange(index, 'rawExpression', e.target.value)}
                          placeholder="1570+3135"
                          className="w-full px-3 py-2 text-xs sm:text-sm font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                        />
                        {/* Live evaluated preview badge if formula */}
                        {entry.rawExpression.trim() !== '' && (
                          <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-1 px-1 flex justify-between">
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">= {formatIndianCurrency(evaluated, true)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upline field for Dena side */}
                    {!isLena && (
                      <div className="sm:col-span-3">
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="text"
                            value={entry.rawUplineExpression ?? ''}
                            onChange={(e) => handleFieldChange(index, 'rawUplineExpression', e.target.value)}
                            placeholder="U/L (500 or -200)"
                            className="w-full px-3 py-2 text-xs sm:text-sm font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition"
                          />
                          {entry.rawUplineExpression && entry.rawUplineExpression.trim() !== '' && (
                            <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-1 px-1">
                              U/L: {formatIndianCurrency(uplineEval, true)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-2 mt-1 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition opacity-80 group-hover:opacity-100"
                    title="Delete row"
                    aria-label="Delete row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Row Button & Bottom summary */}
      <div className="p-3.5 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col sm:flex-row items-center justify-between gap-3">
        {isReadOnly ? (
          <button
            type="button"
            onClick={onOpenBilling}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition"
          >
            <Lock className="w-4 h-4" />
            <span>Trial Expired — Upgrade to Add Rows</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAddRow}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition transform active:scale-95 ${
              isLena
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t.addRow}</span>
          </button>
        )}

        {!isLena && uplineSubtotal !== 0 && (
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Total Upline (U/L): <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatIndianCurrency(uplineSubtotal, true)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
