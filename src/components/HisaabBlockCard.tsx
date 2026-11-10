import React from 'react';
import { Percent, Plus, Minus, PlusCircle, Trash2, Layers } from 'lucide-react';
import { HisaabBlock, CashChargeBase, CustomHisaabItem } from '../types/hisaab';
import { evaluateExpression } from '../utils/mathParser';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import { Language, translations } from '../utils/i18n';

interface HisaabBlockCardProps {
  hisaab: HisaabBlock;
  avlBalance: number;
  cashChargeAmount: number;
  onChange: (updated: HisaabBlock) => void;
  lang: Language;
}

export const HisaabBlockCard: React.FC<HisaabBlockCardProps> = ({
  hisaab,
  avlBalance,
  cashChargeAmount,
  onChange,
  lang,
}) => {
  const t = translations[lang];

  // Helper to update individual field
  const updateField = (field: keyof HisaabBlock, value: any) => {
    onChange({
      ...hisaab,
      [field]: value,
    });
  };

  // Stepper for Cash charge percent (0.25 steps)
  const adjustPercent = (delta: number) => {
    const current = hisaab.cashChargePercent ?? 3.0;
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    updateField('cashChargePercent', next);
  };

  // Add custom item
  const handleAddCustomItem = () => {
    const newItem: CustomHisaabItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: '',
      amount: 0,
      rawExpression: '',
      type: 'subtract', // default to deduction
    };
    const currentItems = Array.isArray(hisaab.customItems) ? hisaab.customItems : [];
    updateField('customItems', [...currentItems, newItem]);
  };

  // Update custom item
  const handleUpdateCustomItem = (index: number, updates: Partial<CustomHisaabItem>) => {
    const list = [...(hisaab.customItems || [])];
    list[index] = { ...list[index], ...updates };
    if (updates.rawExpression !== undefined) {
      list[index].amount = evaluateExpression(updates.rawExpression);
    }
    updateField('customItems', list);
  };

  // Remove custom item
  const handleRemoveCustomItem = (index: number) => {
    const list = (hisaab.customItems || []).filter((_, i) => i !== index);
    updateField('customItems', list);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      {/* Title */}
      <div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
            Hisaab Adjustments & Charges
          </h3>
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Auto Calculation
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Cash Charge Control */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/70 dark:border-slate-700/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-500" />
                {t.cashCharge}
              </label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t.cashChargeBase}:
                </span>
                <select
                  value={hisaab.cashChargeBase || 'dena'}
                  onChange={(e) => updateField('cashChargeBase', e.target.value as CashChargeBase)}
                  className="text-xs font-semibold px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="dena">Dena Total (देना)</option>
                  <option value="lena">Lena Total (लेना)</option>
                  <option value="net">Net Difference (|Lena - Dena|)</option>
                  <option value="avl_balance">Avl. Balance</option>
                </select>
              </div>
            </div>

            {/* Stepper (+/- 0.25) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => adjustPercent(-0.25)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition font-bold"
                  title="Decrease 0.25%"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="px-3 text-center min-w-[70px]">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                    {(hisaab.cashChargePercent ?? 3.0).toFixed(2)}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => adjustPercent(0.25)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition font-bold"
                  title="Increase 0.25%"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Calculated charge amount preview */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-1.5 text-right min-w-[100px]">
                <div className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-300">
                  Charge
                </div>
                <div className="font-mono font-bold text-sm text-amber-900 dark:text-amber-100">
                  {formatIndianCurrency(cashChargeAmount, true)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid for Old CB, Bonus, Avl Balance, Kharcha, Confirmation, RTGS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {/* Avl. Balance (Auto = Lena total) */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {t.avlBalance}
              </label>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                Auto
              </span>
            </div>
            <div className="mt-1 font-mono font-bold text-lg text-emerald-700 dark:text-emerald-300">
              {formatIndianCurrency(avlBalance, true)}
            </div>
          </div>

          {/* Old CB (Old Balance) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {t.oldCB}
              </label>
              <span className="text-[10px] text-slate-400">(+ or -)</span>
            </div>
            <input
              type="text"
              inputMode="text"
              value={hisaab.rawOldCBExpression ?? hisaab.oldCB ?? ''}
              onChange={(e) => {
                updateField('rawOldCBExpression', e.target.value);
                updateField('oldCB', evaluateExpression(e.target.value));
              }}
              placeholder="e.g. 15400 or -5000"
              className="mt-1 w-full px-2.5 py-1 text-sm font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Bonus */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t.bonus}
            </label>
            <input
              type="text"
              inputMode="text"
              value={hisaab.rawBonusExpression ?? hisaab.bonus ?? ''}
              onChange={(e) => {
                updateField('rawBonusExpression', e.target.value);
                updateField('bonus', evaluateExpression(e.target.value));
              }}
              placeholder="e.g. 2500"
              className="mt-1 w-full px-2.5 py-1 text-sm font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Kharcha (Daily Expenses) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t.kharcha}
            </label>
            <input
              type="text"
              inputMode="text"
              value={hisaab.rawKharchaExpression ?? hisaab.kharcha ?? ''}
              onChange={(e) => {
                updateField('rawKharchaExpression', e.target.value);
                updateField('kharcha', evaluateExpression(e.target.value));
              }}
              placeholder="e.g. 1250+500"
              className="mt-1 w-full px-2.5 py-1 text-sm font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Confirmation */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t.confirmation}
            </label>
            <input
              type="text"
              inputMode="text"
              value={hisaab.rawConfirmationExpression ?? hisaab.confirmation ?? ''}
              onChange={(e) => {
                updateField('rawConfirmationExpression', e.target.value);
                updateField('confirmation', evaluateExpression(e.target.value));
              }}
              placeholder="e.g. 5000"
              className="mt-1 w-full px-2.5 py-1 text-sm font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* RTGS (Bank Wire) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t.rtgs}
            </label>
            <input
              type="text"
              inputMode="text"
              value={hisaab.rawRtgsExpression ?? hisaab.rtgs ?? ''}
              onChange={(e) => {
                updateField('rawRtgsExpression', e.target.value);
                updateField('rtgs', evaluateExpression(e.target.value));
              }}
              placeholder="e.g. 25000"
              className="mt-1 w-full px-2.5 py-1 text-sm font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

        </div>

        {/* Custom Items Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t.customItems}
            </span>
            <button
              type="button"
              onClick={handleAddCustomItem}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {t.addCustomItem}
            </button>
          </div>

          {Array.isArray(hisaab.customItems) && hisaab.customItems.length > 0 && (
            <div className="space-y-2">
              {hisaab.customItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  {/* Type toggle: + (Add to Lena) vs - (Subtract / Add to Dena) */}
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateCustomItem(idx, {
                        type: item.type === 'add' ? 'subtract' : 'add',
                      })
                    }
                    className={`px-2 py-1 text-xs font-bold rounded-lg border transition ${
                      item.type === 'add'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {item.type === 'add' ? '+ (Lena)' : '- (Dena)'}
                  </button>

                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleUpdateCustomItem(idx, { label: e.target.value })}
                    placeholder={t.itemTitle}
                    className="flex-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />

                  <input
                    type="text"
                    value={item.rawExpression ?? item.amount ?? ''}
                    onChange={(e) =>
                      handleUpdateCustomItem(idx, { rawExpression: e.target.value })
                    }
                    placeholder="Amount"
                    className="w-24 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none text-right"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveCustomItem(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
