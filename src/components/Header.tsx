import React from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon, 
  Users, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Languages,
  Cloud,
  CloudOff,
  RefreshCw,
  Lock,
  Settings
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { SyncState } from '../services/syncManager';

interface HeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  lang: Language;
  onToggleLang: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenDirectory: () => void;
  onOpenSettings: () => void;
  onLoadSample: () => void;
  onClearSheet: () => void;
  saveStatus: 'saved' | 'saving';
  syncState: SyncState;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  onDateChange,
  lang,
  onToggleLang,
  isDark,
  onToggleDark,
  onOpenDirectory,
  onOpenSettings,
  onLoadSample,
  onClearSheet,
  saveStatus,
  syncState,
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
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Brand & Sync Status */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center shadow-md text-white font-black text-xl">
                ₹
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  {t.appName}
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Drive Sync
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  {t.appSubtitle}
                </p>
              </div>
            </div>

            {/* Cloud Sync Status Badge (Mobile) */}
            <div className="flex items-center gap-1 sm:hidden">
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                {syncState.status === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                ) : syncState.status === 'synced' ? (
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{syncState.status}</span>
              </button>
            </div>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto shadow-inner">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 transition"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-2">
              <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && onDateChange(e.target.value)}
                className="bg-transparent font-semibold text-sm text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => changeDateByDays(1)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 transition"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                onClick={setToday}
                className="ml-1 text-xs font-semibold px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
              >
                {t.today}
              </button>
            )}
          </div>

          {/* Quick Actions & Preferences */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end overflow-x-auto pb-1 sm:pb-0">
            {/* Cloud Sync Status Pill (Desktop) */}
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition ${
                  syncState.status === 'synced'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : syncState.status === 'syncing'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
                title="Google Drive Sync Status"
              >
                {syncState.status === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                ) : syncState.status === 'synced' ? (
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Drive: {syncState.status}</span>
                {syncState.isEncrypted && (
                  <span title="AES-GCM Encrypted">
                    <Lock className="w-3 h-3 text-indigo-500 ml-0.5" />
                  </span>
                )}
              </button>
            </div>

            {/* Friend Directory */}
            <button
              onClick={onOpenDirectory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title={t.friendDirectory}
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden md:inline">{t.friendDirectory}</span>
            </button>

            {/* Load Sample Data */}
            <button
              onClick={onLoadSample}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition"
              title={t.loadSampleData}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{t.loadSampleData}</span>
            </button>

            {/* Clear Sheet */}
            <button
              onClick={onClearSheet}
              className="p-1.5 text-xs font-semibold rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
              title={t.clearDaySheet}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Language Toggle */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title={t.languageToggle}
            >
              <Languages className="w-3.5 h-3.5 text-indigo-500" />
              <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Settings & Drive Sync Modal */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title="Settings & Privacy"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDark}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title={isDark ? t.themeLight : t.themeDark}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
