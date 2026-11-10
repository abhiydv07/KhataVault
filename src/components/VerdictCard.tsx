import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Scale, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Percent, 
  Layers 
} from 'lucide-react';
import { CalculatedResults } from '../types/hisaab';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import { Language, translations } from '../utils/i18n';

interface VerdictCardProps {
  results: CalculatedResults;
  lang: Language;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ results, lang }) => {
  const t = translations[lang];
  const { verdict, farak, totalCredit, totalDebit, totalLena, totalDena, cashChargeAmount } = results;

  const isLena = verdict === 'lena';
  const isDena = verdict === 'dena';

  // Ratio calculation
  const totalFlow = totalCredit + totalDebit;
  const creditPercent = totalFlow > 0 ? Math.round((totalCredit / totalFlow) * 100) : 50;

  return (
    <div className="w-full">
      {/* Master Fintech Hero Banner */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 shadow-2xl border transition-all duration-300 ${
          isLena
            ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white border-emerald-500/40 shadow-emerald-950/40'
            : isDena
            ? 'bg-gradient-to-br from-rose-950 via-slate-900 to-red-950 text-white border-rose-500/40 shadow-rose-950/40'
            : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700 shadow-slate-900/40'
        }`}
      >
        {/* Glow Spheres */}
        <div
          className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${
            isLena ? 'bg-emerald-400' : isDena ? 'bg-rose-400' : 'bg-cyan-400'
          }`}
        />
        <div
          className={`absolute -left-16 -bottom-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-15 ${
            isLena ? 'bg-teal-400' : isDena ? 'bg-red-400' : 'bg-slate-500'
          }`}
        />

        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase backdrop-blur-md shadow-xs ${
                  isLena
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : isDena
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                    : 'bg-slate-700/60 text-slate-200 border border-slate-600/60'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                {t.farak}
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {isLena ? t.farakVerdictLena : isDena ? t.farakVerdictDena : t.farakVerdictBarabar}
              </span>
            </div>

            {/* Huge Net Settlement Value */}
            <div className="mt-3 flex items-baseline gap-3 flex-wrap">
              <span className="text-4xl sm:text-6xl font-black tracking-tight font-mono text-white drop-shadow-md">
                {formatIndianCurrency(Math.abs(farak), true, true)}
              </span>
              <span
                className={`text-lg sm:text-2xl font-black uppercase tracking-wider px-3 py-1 rounded-2xl shadow-inner ${
                  isLena
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                    : isDena
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {isLena
                  ? lang === 'hi' ? 'लेना है' : 'LENA (SURPLUS)'
                  : isDena
                  ? lang === 'hi' ? 'देना है' : 'DENA (DEFICIT)'
                  : lang === 'hi' ? 'बराबर' : 'BARABAR'}
              </span>
            </div>
          </div>

          {/* Large Visual Icon Status */}
          <div className="flex items-center gap-3">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center backdrop-blur-xl shadow-lg border ${
                isLena
                  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                  : isDena
                  ? 'bg-rose-500/20 border-rose-400/30 text-rose-300'
                  : 'bg-slate-700/40 border-slate-600/40 text-slate-200'
              }`}
            >
              {isLena ? (
                <TrendingUp className="w-8 h-8 sm:w-9 sm:h-9" />
              ) : isDena ? (
                <TrendingDown className="w-8 h-8 sm:w-9 sm:h-9" />
              ) : (
                <CheckCircle className="w-8 h-8 sm:w-9 sm:h-9" />
              )}
            </div>
          </div>
        </div>

        {/* 4 Metric Hub Cards */}
        <div className="mt-6 pt-5 border-t border-white/10 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
            
            {/* 1. Total Receivables (Lena) */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/10 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between text-emerald-300 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  {t.lena}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
                  Credit
                </span>
              </div>
              <div className="font-black text-white text-base sm:text-xl font-mono mt-0.5">
                {formatIndianCurrency(totalLena, true)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Gross receivables to collect
              </div>
            </div>

            {/* 2. Total Payables (Dena) */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/10 hover:border-rose-500/40 transition">
              <div className="flex items-center justify-between text-rose-300 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <ArrowDownLeft className="w-4 h-4 text-rose-400" />
                  {t.dena}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200">
                  Debit
                </span>
              </div>
              <div className="font-black text-white text-base sm:text-xl font-mono mt-0.5">
                {formatIndianCurrency(totalDena, true)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Gross payables to settle
              </div>
            </div>

            {/* 3. Cash Handling Surcharge */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/10 hover:border-amber-500/40 transition">
              <div className="flex items-center justify-between text-amber-300 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-amber-400" />
                  {t.cashCharge}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 font-mono">
                  {results.cashChargeBaseAmount ? ((cashChargeAmount / results.cashChargeBaseAmount) * 100).toFixed(2) : '3.0'}%
                </span>
              </div>
              <div className="font-black text-white text-base sm:text-xl font-mono mt-0.5">
                {formatIndianCurrency(cashChargeAmount, true)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Operational handling surcharge
              </div>
            </div>

            {/* 4. Settlement Ratio & Flow Comparison */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/10 hover:border-indigo-500/40 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-indigo-300 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    Credit vs Debit
                  </span>
                  <span className="text-[10px] font-mono text-slate-300">
                    {creditPercent}% In
                  </span>
                </div>
                {/* Visual Ratio Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex mt-1.5">
                  <div
                    style={{ width: `${creditPercent}%` }}
                    className="h-full bg-emerald-500 transition-all duration-500"
                    title={`Credit: ${creditPercent}%`}
                  />
                  <div
                    style={{ width: `${100 - creditPercent}%` }}
                    className="h-full bg-rose-500 transition-all duration-500"
                    title={`Debit: ${100 - creditPercent}%`}
                  />
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-300 mt-2 flex justify-between">
                <span>In: {formatIndianCurrency(totalCredit)}</span>
                <span>Out: {formatIndianCurrency(totalDebit)}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
