import React from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon, 
  Users, 
  BarChart3,
  Crown,
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Languages,
  Cloud,
  RefreshCw,
  Lock,
  Settings,
  Building2,
  Calculator as CalcIcon,
  HardDrive,
  AlertCircle,
  History
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { SyncState } from '../services/syncManager';
import { UserSubscription } from '../types/subscription';
import { appConfig } from '../services/config';

interface HeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  lang: Language;
  onToggleLang: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenDirectory: () => void;
  onOpenReports: () => void;
  onOpenSettings: () => void;
  onOpenBilling: () => void;
  onLoadSample: () => void;
  onClearSheet: () => void;
  saveStatus: 'saved' | 'saving';
  syncState: SyncState;
  subscription: UserSubscription;
  onLockApp?: () => void;
  hasPin?: boolean;
  activeFirmName?: string;
  onOpenFirmSwitcher?: () => void;
  onOpenCalculator?: () => void;
  onOpenHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  onDateChange,
  lang,
  onToggleLang,
  isDark,
  onToggleDark,
  onOpenDirectory,
  onOpenReports,
  onOpenSettings,
  onOpenBilling,
  onLoadSample,
  onClearSheet,
  saveStatus,
  syncState,
  subscription,
  onLockApp,
  hasPin,
  activeFirmName,
  onOpenFirmSwitcher,
  onOpenCalculator,
  onOpenHistory,
}) => {
  const t = translations[lang];

  // Helper for previous/next date
  const changeDateByDays = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const setToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors">
      <div className="w-full max-w-[1720px] mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Brand & Active Firm */}
          <div className="flex items-center justify-between w-full lg:w-auto min-w-0">
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white font-black text-lg sm:text-xl shrink-0">
                ₹
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                    {t.appName}
                  </h1>
                  {activeFirmName && onOpenFirmSwitcher && (
                    <button
                      type="button"
                      onClick={onOpenFirmSwitcher}
                      className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 transition border border-purple-200 dark:border-purple-800 shrink-0"
                      title="Switch Firm / Book"
                      aria-label={`Active firm: ${activeFirmName}. Click to switch firm.`}
                    >
                      <Building2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span className="max-w-[75px] sm:max-w-[110px] truncate">{activeFirmName}</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                  {t.appSubtitle}
                </p>
              </div>
            </div>

            {/* Cloud Sync Status Badge (Mobile only) */}
            <div className="flex items-center gap-1 lg:hidden shrink-0">
              <button
                onClick={onOpenSettings}
                aria-label="Storage and Sync Status"
                className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                {appConfig.isDemo ? (
                  <>
                    <HardDrive className="w-3 h-3 text-amber-500" />
                    <span>Local</span>
                  </>
                ) : syncState.status === 'syncing' ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                    <span>Syncing</span>
                  </>
                ) : syncState.status === 'synced' ? (
                  <>
                    <Cloud className="w-3 h-3 text-emerald-500" />
                    <span>Synced</span>
                  </>
                ) : syncState.status === 'error' ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-rose-500" />
                    <span>Error</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-3 h-3 text-slate-400" />
                    <span>Local</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center justify-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl w-full sm:w-auto shadow-inner border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 transition"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-1.5 sm:px-2">
              <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && onDateChange(e.target.value)}
                className="bg-transparent font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                aria-label="Select Ledger Date"
              />
            </div>

            <button
              onClick={() => changeDateByDays(1)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 transition"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                onClick={setToday}
                className="ml-1 text-xs font-bold px-2 py-0.5 sm:py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition"
                aria-label="Jump to Today"
              >
                {t.today}
              </button>
            )}
          </div>

          {/* Right Action Hub */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full lg:w-auto justify-end overflow-x-auto pb-0.5 lg:pb-0">
            
            {/* Sync Pill (Desktop) */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {saveStatus === 'saving' ? (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Clock className="w-3 h-3 animate-spin" /> {t.saveStatusSaving}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> {t.saveStatusSaved}
                  </span>
                )}
              </span>

              <button
                onClick={onOpenSettings}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                  appConfig.isDemo
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                    : syncState.status === 'synced'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : syncState.status === 'syncing'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    : syncState.status === 'error'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
                title={appConfig.isDemo ? 'Demo Mode — Stored locally in browser' : 'Google Drive Sandbox Sync'}
                aria-label="Cloud sync settings"
              >
                {appConfig.isDemo ? (
                  <>
                    <HardDrive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Demo (Local Browser)</span>
                  </>
                ) : syncState.status === 'syncing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span>Drive Syncing...</span>
                  </>
                ) : syncState.status === 'synced' ? (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Drive Synced</span>
                  </>
                ) : syncState.status === 'error' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sync Error</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span>Local Only</span>
                  </>
                )}
                {syncState.isEncrypted && (
                  <Lock className="w-3 h-3 text-indigo-500 ml-0.5" />
                )}
              </button>
            </div>

            {/* Friend Directory */}
            <button
              onClick={onOpenDirectory}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition shrink-0"
              title={t.friendDirectory}
              aria-label="Open Party Directory"
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">{t.friendDirectory}</span>
            </button>

            {/* Financial Statements */}
            <button
              onClick={onOpenReports}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition shrink-0"
              title={t.reports}
              aria-label="Open Financial Statements and Reports"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">{t.reports}</span>
            </button>

            {/* Record History */}
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition shrink-0"
                title={lang === 'hi' ? 'बहीखाता रिकॉर्ड इतिहास' : 'Record History & Day Books'}
                aria-label="Open Record History"
              >
                <History className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">{lang === 'hi' ? 'इतिहास' : 'History'}</span>
              </button>
            )}

            {/* Pro / Subscription Upgrade */}
            <button
              onClick={onOpenBilling}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-black rounded-xl border transition shadow-xs shrink-0 ${
                subscription.isExpired
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700 animate-pulse'
                  : subscription.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700'
                  : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
              }`}
              title="Subscription & Billing"
              aria-label="Subscription and billing"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {subscription.isExpired ? 'Upgrade' : subscription.status === 'active' ? 'Pro' : 'Trial'}
              </span>
            </button>

            {/* Compact Tool Buttons Group */}
            <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800 shrink-0">
              {/* Load Sample Ledger */}
              <button
                onClick={onLoadSample}
                className="p-1.5 sm:px-2 sm:py-1.5 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1"
                title={t.loadSampleData}
                aria-label={t.loadSampleData}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden 2xl:inline">{t.loadSampleData}</span>
              </button>

              {/* Clear Sheet */}
              <button
                onClick={onClearSheet}
                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition border border-transparent hover:border-rose-200"
                title={t.clearDaySheet}
                aria-label={t.clearDaySheet}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Language Toggle */}
              <button
                onClick={onToggleLang}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                title={t.languageToggle}
                aria-label={t.languageToggle}
              >
                <Languages className="w-3.5 h-3.5 text-indigo-500" />
                <span>{lang === 'en' ? 'हिन्दी' : 'EN'}</span>
              </button>

              {/* Pocket Calculator */}
              {onOpenCalculator && (
                <button
                  onClick={onOpenCalculator}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                  title="Pocket Calculator"
                  aria-label="Pocket Calculator"
                >
                  <CalcIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </button>
              )}

              {/* Screen Lock */}
              {hasPin && onLockApp && (
                <button
                  onClick={onLockApp}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                  title="Lock Screen"
                  aria-label="Lock Screen"
                >
                  <Lock className="w-4 h-4 text-indigo-500" />
                </button>
              )}

              {/* Settings */}
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                title="Settings & Privacy"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>

              {/* Dark/Light mode */}
              <button
                onClick={onToggleDark}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                title={isDark ? t.themeLight : t.themeDark}
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
