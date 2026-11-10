import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle, Scale, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
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

  return (
    <div className="w-full">
      {/* Hero Banner */}
      <div
        className={`relative overflow-hidden rounded-2xl p-4 sm:p-6 shadow-lg border transition-all duration-300 ${
          isLena
            ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white border-emerald-500 shadow-emerald-500/10'
            : isDena
            ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 text-white border-rose-500 shadow-rose-500/10'
            : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white border-slate-600 shadow-slate-500/10'
        }`}
      >
        {/* Subtle decorative background circle */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-white/20 backdrop-blur-sm">
                <Scale className="w-3.5 h-3.5" />
                {t.farak}
              </span>
              <span className="text-xs font-medium text-white/80">
                {isLena ? t.farakVerdictLena : isDena ? t.farakVerdictDena : t.farakVerdictBarabar}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-sm font-mono">
                {formatIndianCurrency(Math.abs(farak), true, true)}
              </h2>
              <span className="text-lg sm:text-2xl font-bold uppercase tracking-wider text-white/90">
                {isLena ? (lang === 'hi' ? 'लेना है' : 'LENA') : isDena ? (lang === 'hi' ? 'देना है' : 'DENA') : (lang === 'hi' ? 'बराबर' : 'BARABAR')}
              </span>
            </div>
          </div>

          {/* Large Visual Icon Status */}
          <div className="flex items-center gap-3">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner ${
                isLena
                  ? 'bg-emerald-500/30 border border-emerald-300/40'
                  : isDena
                  ? 'bg-rose-500/30 border border-rose-300/40'
                  : 'bg-slate-600/40 border border-slate-400/30'
              }`}
            >
              {isLena ? (
                <TrendingUp className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-100" />
              ) : isDena ? (
                <TrendingDown className="w-8 h-8 sm:w-9 sm:h-9 text-rose-100" />
              ) : (
                <CheckCircle className="w-8 h-8 sm:w-9 sm:h-9 text-slate-200" />
              )}
            </div>
          </div>
        </div>

        {/* Live Balance comparison bar */}
        <div className="mt-5 pt-4 border-t border-white/15">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
            
            {/* Total Lena */}
            <div className="bg-black/15 backdrop-blur-sm rounded-xl p-2.5">
              <div className="flex items-center gap-1 text-emerald-200 text-xs font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{t.lena}</span>
              </div>
              <div className="font-bold text-white text-base sm:text-lg mt-0.5 font-mono">
                {formatIndianCurrency(totalLena, true)}
              </div>
            </div>

            {/* Total Dena */}
            <div className="bg-black/15 backdrop-blur-sm rounded-xl p-2.5">
              <div className="flex items-center gap-1 text-rose-200 text-xs font-semibold">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>{t.dena}</span>
              </div>
              <div className="font-bold text-white text-base sm:text-lg mt-0.5 font-mono">
                {formatIndianCurrency(totalDena, true)}
              </div>
            </div>

            {/* Cash Charge */}
            <div className="bg-black/15 backdrop-blur-sm rounded-xl p-2.5">
              <div className="text-white/70 text-xs font-semibold">
                {t.cashCharge} ({results.cashChargeBaseAmount ? ((cashChargeAmount / results.cashChargeBaseAmount) * 100).toFixed(2) : '3'}%)
              </div>
              <div className="font-bold text-white text-base sm:text-lg mt-0.5 font-mono">
                {formatIndianCurrency(cashChargeAmount, true)}
              </div>
            </div>

            {/* Net Totals (Credit vs Debit) */}
            <div className="bg-black/15 backdrop-blur-sm rounded-xl p-2.5">
              <div className="text-white/70 text-xs font-semibold">
                Credit vs Debit
              </div>
              <div className="font-medium text-white text-xs mt-1 truncate">
                In: {formatIndianCurrency(totalCredit)} | Out: {formatIndianCurrency(totalDebit)}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

