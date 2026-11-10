import React, { useState } from 'react';
import { Lock, Delete, ShieldAlert } from 'lucide-react';
import { Language } from '../utils/i18n';

interface AppLockModalProps {
  isLocked: boolean;
  onUnlock: () => void;
  lang: Language;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({ isLocked, onUnlock, lang }) => {
  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);

  if (!isLocked) return null;

  const isHi = lang === 'hi';
  const savedPin = localStorage.getItem('khatasetu_app_pin') || localStorage.getItem('lekhasetu_app_pin');

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setHasError(false);

    if (next.length === 4) {
      if (savedPin && next === savedPin) {
        onUnlock();
        setPin('');
      } else {
        setHasError(true);
        setTimeout(() => {
          setPin('');
          setHasError(false);
        }, 700);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setHasError(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-4 select-none">
      <div className="max-w-xs w-full flex flex-col items-center space-y-6 text-center">
        
        {/* Icon & Title */}
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-950/50">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isHi ? 'सुरक्षा पिन दर्ज करें' : 'Enter Security PIN'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isHi ? 'खाता विवरण सुरक्षित है' : 'Your ledger is locked'}
          </p>
        </div>

        {/* 4-digit PIN Dots */}
        <div className={`flex items-center gap-4 py-2 ${hasError ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const filled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  hasError
                    ? 'bg-rose-500 scale-110 shadow-lg shadow-rose-500/50'
                    : filled
                    ? 'bg-indigo-400 scale-110 shadow-md shadow-indigo-500/40'
                    : 'bg-slate-700 border border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {hasError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isHi ? 'गलत पिन, पुनः प्रयास करें' : 'Incorrect PIN. Try again.'}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleDigit(n)}
              className="w-16 h-16 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-white text-2xl font-bold font-mono flex items-center justify-center transition border border-slate-700/60 shadow-md"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="w-16 h-16 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-white text-2xl font-bold font-mono flex items-center justify-center transition border border-slate-700/60 shadow-md"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Delete last digit"
            className="w-16 h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700/40 shadow-sm"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

      </div>
    </div>
  );
};

