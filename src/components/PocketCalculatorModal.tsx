import React, { useState } from 'react';
import { X, Calculator, Copy, Check, Delete } from 'lucide-react';
import { evaluateExpression } from '../utils/mathParser';
import { formatIndianCurrency } from '../utils/currencyFormatter';

interface PocketCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PocketCalculatorModal: React.FC<PocketCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [expr, setExpr] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const result = expr.trim() ? evaluateExpression(expr) : 0;

  const handlePress = (val: string) => {
    setExpr((prev) => prev + val);
  };

  const handleClear = () => {
    setExpr('');
  };

  const handleDelete = () => {
    setExpr((prev) => prev.slice(0, -1));
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(String(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 text-white w-full sm:max-w-xs rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
              Pocket Calculator
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display */}
        <div className="p-4 bg-slate-950 text-right space-y-1">
          <div className="text-xs font-mono text-slate-400 min-h-[1rem] truncate">
            {expr || '0'}
          </div>
          <div className="text-3xl font-black font-mono text-white tracking-tight">
            {formatIndianCurrency(result, false)}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-3 grid grid-cols-4 gap-2 bg-slate-900 text-sm font-bold font-mono">
          <button
            type="button"
            onClick={handleClear}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 active:scale-95 transition"
          >
            C
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center active:scale-95 transition"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handlePress('%')}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 active:scale-95 transition"
          >
            %
          </button>
          <button
            type="button"
            onClick={() => handlePress('/')}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 transition"
          >
            ÷
          </button>

          {['7', '8', '9'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handlePress(n)}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handlePress('*')}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 transition"
          >
            ×
          </button>

          {['4', '5', '6'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handlePress(n)}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handlePress('-')}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 transition"
          >
            -
          </button>

          {['1', '2', '3'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handlePress(n)}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handlePress('+')}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 transition"
          >
            +
          </button>

          <button
            type="button"
            onClick={() => handlePress('0')}
            className="col-span-2 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handlePress('.')}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center active:scale-95 transition"
            title="Copy Result"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
};

