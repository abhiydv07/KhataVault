import React from 'react';
import { Plus, Trash2, CheckSquare, Square, Calculator, Lock } from 'lucide-react';
import { LedgerEntry } from '../types/hisaab';
import { evaluateExpression } from '../utils/mathParser';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import { Language, translations } from '../utils/i18n';

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
      className={`rounded-2xl border shadow-sm transition-colors overflow-hidden ${
        isLena
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60'
          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/60'
      }`}
    >
      {/* Header bar */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between ${
          isLena
            ? 'bg-emerald-100/70 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
            : 'bg-rose-100/70 dark:bg-rose-900/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              isLena ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          <h3 className="font-bold text-base sm:text-lg">
            {isLena ? t.lenaSide : t.denaSide}
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-800/80 shadow-xs">
            {entries.length}
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs opacity-75 block">{t.subtotal}</span>
          <span className="font-bold font-mono text-base sm:text-lg">
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
      <div className="p-3 sm:p-4 space-y-2.5 max-h-[500px] overflow-y-auto">
        {entries.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
            <Calculator className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>{t.noEntriesYet}</p>
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
                className={`group relative rounded-xl p-2.5 sm:p-3 border transition-all ${
                  entry.countInTotal
                    ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 shadow-sm'
                    : 'bg-slate-100/70 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* Count in total Checkbox (Large Touch Target) */}
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
                        className="w-full px-2.5 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                          className="w-full px-2.5 py-1.5 text-sm font-semibold font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                        {/* Live evaluated preview badge if formula */}
                        {entry.rawExpression.trim() !== '' && (
                          <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5 px-1 flex justify-between">
                            <span>= {formatIndianCurrency(evaluated, true)}</span>
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
                            placeholder="U/L (e.g. 500 or -200)"
                            className="w-full px-2.5 py-1.5 text-sm font-semibold font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                          />
                          {entry.rawUplineExpression && entry.rawUplineExpression.trim() !== '' && (
                            <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5 px-1">
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
                    className="p-1.5 mt-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
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
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-2">
        {isReadOnly ? (
          <button
            type="button"
            onClick={onOpenBilling}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition"
          >
            <Lock className="w-4 h-4" />
            <span>Trial Expired — Upgrade to Add Rows</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAddRow}
            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition ${
              isLena
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{t.addRow}</span>
          </button>
        )}

        {!isLena && uplineSubtotal !== 0 && (
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Total U/L: <span className="font-mono font-bold">{formatIndianCurrency(uplineSubtotal, true)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
