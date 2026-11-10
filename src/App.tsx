import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { VerdictCard } from './components/VerdictCard';
import { LedgerTable } from './components/LedgerTable';
import { HisaabBlockCard } from './components/HisaabBlockCard';
import { FriendDirectoryModal } from './components/FriendDirectoryModal';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { UndoToast } from './components/UndoToast';
import { DayHisaabSheet, LedgerEntry, HisaabBlock, FriendSummary } from './types/hisaab';
import { calculateSheet, createEmptyDaySheet } from './utils/calculatorEngine';
import { storageService } from './utils/storage';
import { Language, translations } from './utils/i18n';
import { syncManager, SyncState } from './services/syncManager';
import { authService } from './services/supabase';
import { FileText } from 'lucide-react';

export const App: React.FC = () => {
  // 1. Core State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [sheet, setSheet] = useState<DayHisaabSheet>(() => {
    return createEmptyDaySheet(selectedDate);
  });

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [activeTab, setActiveTab] = useState<'both' | 'lena' | 'dena' | 'hisaab'>('both');
  
  // Theme & Language
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) || 'hi';
  });

  // Cloud Sync & Auth State
  const [syncState, setSyncState] = useState<SyncState>(() => syncManager.getState());
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Modals & Directory
  const [isDirOpen, setIsDirOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return !localStorage.getItem('onboarding_completed');
  });

  const [friends, setFriends] = useState<FriendSummary[]>([]);

  // Undo System for deleted rows
  const [deletedItem, setDeletedItem] = useState<{
    entry: LedgerEntry;
    index: number;
    type: 'lena' | 'dena';
  } | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync dark class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Subscribe to Sync Manager and Auth
  useEffect(() => {
    const unsubSync = syncManager.subscribe((state) => {
      setSyncState(state);
    });

    const unsubAuth = authService.onAuthStateChange((user) => {
      setUserEmail(user?.email || null);
    });

    authService.getSession().then(({ user }) => {
      setUserEmail(user?.email || null);
    });

    return () => {
      unsubSync();
      unsubAuth();
    };
  }, []);

  // Sync language
  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  // 2. Load Sheet on Date change
  useEffect(() => {
    let isMounted = true;
    storageService.getDaySheet(selectedDate).then((loaded) => {
      if (isMounted) {
        setSheet(loaded);
        setSaveStatus('saved');
      }
    });

    // Refresh friends list for suggestions
    storageService.getFriendSummaries().then((list) => {
      if (isMounted) setFriends(list);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // 3. Auto-save sheet with debounce & cloud sync queue
  const triggerAutoSave = (updatedSheet: DayHisaabSheet) => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await storageService.saveDaySheet(updatedSheet);
        setSaveStatus('saved');
        
        // Queue this month for Google Drive synchronization
        const monthKey = updatedSheet.date.substring(0, 7);
        syncManager.queueMonthSync(monthKey);

        // Refresh friends in background
        const updatedFriends = await storageService.getFriendSummaries();
        setFriends(updatedFriends);
      } catch (err) {
        console.error('Failed to auto-save sheet:', err);
      }
    }, 400);
  };

  // 4. Update handlers
  const handleLenaChange = (entries: LedgerEntry[]) => {
    const next = { ...sheet, lenaEntries: entries };
    setSheet(next);
    triggerAutoSave(next);
  };

  const handleDenaChange = (entries: LedgerEntry[]) => {
    const next = { ...sheet, denaEntries: entries };
    setSheet(next);
    triggerAutoSave(next);
  };

  const handleHisaabBlockChange = (hisaab: HisaabBlock) => {
    const next = { ...sheet, hisaabBlock: hisaab };
    setSheet(next);
    triggerAutoSave(next);
  };

  const handleNoteChange = (note: string) => {
    const next = { ...sheet, note };
    setSheet(next);
    triggerAutoSave(next);
  };

  // 5. Undo Row Deletion
  const handleDeleteRow = (entry: LedgerEntry, index: number, type: 'lena' | 'dena') => {
    setDeletedItem({ entry, index, type });
  };

  const handleUndo = () => {
    if (!deletedItem) return;

    if (deletedItem.type === 'lena') {
      const copy = [...sheet.lenaEntries];
      copy.splice(deletedItem.index, 0, deletedItem.entry);
      handleLenaChange(copy);
    } else {
      const copy = [...sheet.denaEntries];
      copy.splice(deletedItem.index, 0, deletedItem.entry);
      handleDenaChange(copy);
    }

    setDeletedItem(null);
  };

  // 6. Load Sample Sheet Fixture
  const handleLoadSample = async () => {
    const sample = await storageService.loadSampleSheet(selectedDate);
    setSheet(sample);
    setSaveStatus('saved');
    const monthKey = selectedDate.substring(0, 7);
    syncManager.queueMonthSync(monthKey);
    const updatedFriends = await storageService.getFriendSummaries();
    setFriends(updatedFriends);
  };

  // 7. Clear Day Sheet
  const handleClearSheet = async () => {
    const t = translations[lang];
    if (window.confirm(t.confirmClear)) {
      const empty = createEmptyDaySheet(selectedDate);
      setSheet(empty);
      await storageService.saveDaySheet(empty);
      setSaveStatus('saved');
      const monthKey = selectedDate.substring(0, 7);
      syncManager.queueMonthSync(monthKey);
    }
  };

  // 8. Calculations
  const calculatedResults = useMemo(() => {
    return calculateSheet(sheet);
  }, [sheet]);

  // Extract friend names for autocomplete
  const knownFriendNames = useMemo(() => {
    return friends.map((f) => f.name);
  }, [friends]);

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Sticky Header */}
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        lang={lang}
        onToggleLang={toggleLang}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onOpenDirectory={() => setIsDirOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLoadSample={handleLoadSample}
        onClearSheet={handleClearSheet}
        saveStatus={saveStatus}
        syncState={syncState}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-6">
        
        {/* Live Farak Verdict Hero Card */}
        <VerdictCard results={calculatedResults} lang={lang} />

        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('both')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === 'both' ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('lena')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === 'lena' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.lena} ({sheet.lenaEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('dena')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === 'dena' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.dena} ({sheet.denaEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('hisaab')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === 'hisaab' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Adjustments
          </button>
        </div>

        {/* Two-Column Ledger Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Lena Side */}
          <div className={`${activeTab === 'dena' || activeTab === 'hisaab' ? 'hidden md:block' : 'block'}`}>
            <LedgerTable
              type="lena"
              entries={sheet.lenaEntries}
              onChange={handleLenaChange}
              onDeleteRow={handleDeleteRow}
              knownFriendNames={knownFriendNames}
              lang={lang}
            />
          </div>

          {/* Dena Side */}
          <div className={`${activeTab === 'lena' || activeTab === 'hisaab' ? 'hidden md:block' : 'block'}`}>
            <LedgerTable
              type="dena"
              entries={sheet.denaEntries}
              onChange={handleDenaChange}
              onDeleteRow={handleDeleteRow}
              knownFriendNames={knownFriendNames}
              lang={lang}
            />
          </div>

        </div>

        {/* Hisaab Adjustments Block */}
        <div className={`${activeTab === 'lena' || activeTab === 'dena' ? 'hidden md:block' : 'block'}`}>
          <HisaabBlockCard
            hisaab={sheet.hisaabBlock}
            avlBalance={calculatedResults.avlBalance}
            cashChargeAmount={calculatedResults.cashChargeAmount}
            onChange={handleHisaabBlockChange}
            lang={lang}
          />
        </div>

        {/* Remarks / Day Notes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            {t.notes}
          </label>
          <textarea
            value={sheet.note ?? ''}
            onChange={(e) => handleNoteChange(e.target.value)}
            rows={2}
            placeholder={t.notesPlaceholder}
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
          />
        </div>

      </main>

      {/* Friend Directory Modal */}
      <FriendDirectoryModal
        isOpen={isDirOpen}
        onClose={() => setIsDirOpen(false)}
        friends={friends}
        lang={lang}
      />

      {/* Google Drive & Privacy Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        syncState={syncState}
        userEmail={userEmail}
        currentMonth={selectedDate.substring(0, 7)}
        lang={lang}
      />

      {/* 3-Step Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onLoadSample={handleLoadSample}
        userEmail={userEmail}
        hasDriveAccess={syncState.hasGoogleDrive}
        lang={lang}
      />

      {/* Undo Toast */}
      <UndoToast
        deletedItem={deletedItem}
        onUndo={handleUndo}
        onDismiss={() => setDeletedItem(null)}
        lang={lang}
      />

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-400">
        <p>Lena Dena Hisaab — Google Drive (appdata) Private Ledger Calculator</p>
      </footer>
    </div>
  );
};

export default App;
