import React from 'react';
import { RotateCcw, X } from 'lucide-react';
import { LedgerEntry } from '../types/hisaab';
import { Language, translations } from '../utils/i18n';

interface UndoToastProps {
  deletedItem: {
    entry: LedgerEntry;
    index: number;
    type: 'lena' | 'dena';
  } | null;
  onUndo: () => void;
  onDismiss: () => void;
  lang: Language;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  deletedItem,
  onUndo,
  onDismiss,
  lang,
}) => {
  if (!deletedItem) return null;
  const t = translations[lang];

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
      <div className="flex-1 text-xs">
        <span className="font-semibold block text-slate-200">
          {deletedItem.entry.friendName || 'Entry'} deleted
        </span>
        <span className="text-slate-400">
          {deletedItem.type === 'lena' ? t.lena : t.dena} list
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onUndo}
          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.undo}</span>
        </button>

        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

