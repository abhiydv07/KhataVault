import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { VerdictCard } from './components/VerdictCard';
import { LedgerTable } from './components/LedgerTable';
import { HisaabBlockCard } from './components/HisaabBlockCard';
import { FriendDirectoryModal } from './components/FriendDirectoryModal';
import { ReportsModal } from './components/ReportsModal';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { BillingModal } from './components/BillingModal';
import { LegalModal, LegalTab } from './components/LegalModal';
import { PaywallBanner } from './components/PaywallBanner';
import { UndoToast } from './components/UndoToast';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { CashCounterModal } from './components/CashCounterModal';
import { AppLockModal } from './components/AppLockModal';
import { VoiceEntryModal } from './components/VoiceEntryModal';
import { FirmSwitcherModal } from './components/FirmSwitcherModal';
import { PocketCalculatorModal } from './components/PocketCalculatorModal';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { DayHisaabSheet, LedgerEntry, HisaabBlock, FriendSummary } from './types/hisaab';
import { UserSubscription } from './types/subscription';
import { calculateSheet, createEmptyDaySheet } from './utils/calculatorEngine';
import { evaluateExpression } from './utils/mathParser';
import { storageService } from './utils/storage';
import { firmManager, FirmProfile } from './utils/firmManager';
import { Language, translations } from './utils/i18n';
import { syncManager, SyncState } from './services/syncManager';
import { authService } from './services/supabase';
import { subscriptionService } from './services/subscriptionService';
import { FileText, MessageCircle, Coins, Copy, Mic } from 'lucide-react';

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

  // Subscription State
  const [subscription, setSubscription] = useState<UserSubscription>(() => {
    return subscriptionService.getLocalSubscription(Date.now());
  });

  // Modals & Directory
  const [isDirOpen, setIsDirOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return !localStorage.getItem('onboarding_completed');
  });
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isCashCounterOpen, setIsCashCounterOpen] = useState(false);
  const [isVoiceEntryOpen, setIsVoiceEntryOpen] = useState(false);
  const [isFirmSwitcherOpen, setIsFirmSwitcherOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [activeFirm, setActiveFirm] = useState<FirmProfile>(() => firmManager.getActiveFirm());
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return Boolean(
      localStorage.getItem('khatavault_app_pin') ||
      localStorage.getItem('khatasetu_app_pin') ||
      localStorage.getItem('lekhasetu_app_pin')
    );
  });

  const [friends, setFriends] = useState<FriendSummary[]>([]);

  // Copy from Yesterday feature state
  const [copiedFromYesterday, setCopiedFromYesterday] = useState(false);

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

  // Subscribe to Sync Manager, Auth & Subscription changes
  useEffect(() => {
    const unsubSync = syncManager.subscribe((state) => {
      setSyncState(state);
    });

    const unsubAuth = authService.onAuthStateChange((user) => {
      setUserEmail(user?.email || null);
      subscriptionService.getSubscription(user?.id).then(setSubscription);
    });

    authService.getSession().then(({ user }) => {
      setUserEmail(user?.email || null);
      subscriptionService.getSubscription(user?.id).then(setSubscription);
    });

    const handleSubChange = () => {
      subscriptionService.getSubscription().then(setSubscription);
    };
    window.addEventListener('subscription_change', handleSubChange);

    const handleFirmChange = () => {
      setActiveFirm(firmManager.getActiveFirm());
    };
    window.addEventListener('khatavault_firm_changed', handleFirmChange);
    window.addEventListener('khatasetu_firm_changed', handleFirmChange);

    return () => {
      unsubSync();
      unsubAuth();
      window.removeEventListener('subscription_change', handleSubChange);
      window.removeEventListener('khatavault_firm_changed', handleFirmChange);
      window.removeEventListener('khatasetu_firm_changed', handleFirmChange);
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
  }, [selectedDate, activeFirm]);

  // 3. Auto-save sheet with debounce & cloud sync queue
  const triggerAutoSave = (updatedSheet: DayHisaabSheet) => {
    // If paywall is active (expired trial), do not allow modifying sheets
    if (!subscription.canEdit) {
      setIsBillingOpen(true);
      return;
    }

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

        // Verify subscription status
        subscriptionService.getSubscription().then(setSubscription);

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

  const handleAddVoiceEntry = (name: string, rawAmount: string, type: 'lena' | 'dena') => {
    const now = Date.now();
    const newEntry: LedgerEntry = {
      id: `entry_${now}_${Math.random().toString(36).substring(2, 7)}`,
      friendName: name,
      rawExpression: rawAmount,
      evaluatedAmount: evaluateExpression(rawAmount),
      countInTotal: true,
      upline: type === 'lena' ? undefined : 0,
      rawUplineExpression: type === 'lena' ? undefined : '',
      createdAt: now,
      updatedAt: now,
    };
    if (type === 'lena') {
      handleLenaChange([...sheet.lenaEntries, newEntry]);
    } else {
      handleDenaChange([...sheet.denaEntries, newEntry]);
    }
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

  // 8b. Copy Parties from Yesterday (names only, empty amounts)
  const handleCopyFromYesterday = async () => {
    const yesterday = new Date(selectedDate + 'T00:00:00');
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const prevSheet = await storageService.getDaySheet(yesterdayStr);
    const hasData = prevSheet.lenaEntries.length > 0 || prevSheet.denaEntries.length > 0;
    if (!hasData) {
      alert(lang === 'hi' ? 'कल की कोई एंट्री नहीं मिली।' : 'No entries found for yesterday.');
      return;
    }

    const confirmMsg =
      lang === 'hi'
        ? `कल (${yesterdayStr}) की ${prevSheet.lenaEntries.length + prevSheet.denaEntries.length} पार्टियां कॉपी करें?`
        : `Copy ${prevSheet.lenaEntries.length + prevSheet.denaEntries.length} parties from yesterday (${yesterdayStr})?`;
    if (!window.confirm(confirmMsg)) return;

    const now = Date.now();
    const makeFresh = (e: LedgerEntry): LedgerEntry => ({
      ...e,
      id: `entry_${now}_${Math.random().toString(36).substring(2, 7)}`,
      rawExpression: '',
      evaluatedAmount: 0,
      rawUplineExpression: e.rawUplineExpression !== undefined ? '' : undefined,
      upline: e.upline !== undefined ? 0 : undefined,
      createdAt: now,
      updatedAt: now,
    });

    const next: DayHisaabSheet = {
      ...sheet,
      lenaEntries: prevSheet.lenaEntries.map(makeFresh),
      denaEntries: prevSheet.denaEntries.map(makeFresh),
    };
    setSheet(next);
    triggerAutoSave(next);
    setCopiedFromYesterday(true);
    setTimeout(() => setCopiedFromYesterday(false), 3000);
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
        onOpenReports={() => {
          if (subscription.canViewReports) {
            setIsReportsOpen(true);
          } else {
            setIsBillingOpen(true);
          }
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBilling={() => setIsBillingOpen(true)}
        onLoadSample={handleLoadSample}
        onClearSheet={handleClearSheet}
        saveStatus={saveStatus}
        syncState={syncState}
        subscription={subscription}
        hasPin={Boolean(
          localStorage.getItem('khatavault_app_pin') ||
          localStorage.getItem('khatasetu_app_pin') ||
          localStorage.getItem('lekhasetu_app_pin')
        )}
        onLockApp={() => setIsLocked(true)}
        activeFirmName={activeFirm.name}
        onOpenFirmSwitcher={() => setIsFirmSwitcherOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
      />

      {/* Paywall Banner if trial/subscription is expired */}
      <PaywallBanner
        subscription={subscription}
        onOpenBilling={() => setIsBillingOpen(true)}
        lang={lang}
      />

      {/* Main Workspace - Full-screen fluid enterprise layout */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* Live Farak Verdict Hero Card */}
        <VerdictCard results={calculatedResults} lang={lang} />

        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-bold shadow-inner">
          <button
            onClick={() => setActiveTab('both')}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'both' ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('lena')}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'lena' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.lena} ({sheet.lenaEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('dena')}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'dena' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.dena} ({sheet.denaEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('hisaab')}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'hisaab' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Adjustments
          </button>
        </div>

        {/* Quick Action Bar: WhatsApp Share | Cash Counter | Voice Entry | Copy from Yesterday */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* WhatsApp Share */}
          <button
            onClick={() => setIsWhatsAppOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#25D366] hover:bg-[#20b558] text-white shadow-md shadow-[#25D366]/20 transition transform active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{lang === 'hi' ? 'WhatsApp शेयर' : 'WhatsApp Share'}</span>
          </button>

          {/* Cash Counter */}
          <button
            onClick={() => setIsCashCounterOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition transform active:scale-95"
          >
            <Coins className="w-4 h-4" />
            <span>{lang === 'hi' ? 'कैश नोट गिनती' : 'Cash Denomination Counter'}</span>
          </button>

          {/* Voice Entry */}
          <button
            onClick={() => setIsVoiceEntryOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition transform active:scale-95"
          >
            <Mic className="w-4 h-4" />
            <span>{lang === 'hi' ? 'बोलकर एंट्री जोड़ें' : 'Voice Entry (Hindi/EN)'}</span>
          </button>

          {/* Copy from Yesterday */}
          {sheet.lenaEntries.length === 0 && sheet.denaEntries.length === 0 && subscription.canEdit && (
            <button
              onClick={handleCopyFromYesterday}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md transition transform active:scale-95 ${
                copiedFromYesterday
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Copy className="w-4 h-4" />
              <span>
                {copiedFromYesterday
                  ? (lang === 'hi' ? '✓ कल की पार्टियां कॉपी हो गईं!' : '✓ Parties Copied!')
                  : (lang === 'hi' ? 'कल की पार्टियां कॉपी करें' : 'Clone Parties from Yesterday')}
              </span>
            </button>
          )}
        </div>

        {/* Two-Column Ledger Section - Full Screen Width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          
          {/* Lena Side */}
          <div className={`${activeTab === 'dena' || activeTab === 'hisaab' ? 'hidden md:block' : 'block'}`}>
            <LedgerTable
              type="lena"
              entries={sheet.lenaEntries}
              onChange={handleLenaChange}
              onDeleteRow={handleDeleteRow}
              knownFriendNames={knownFriendNames}
              lang={lang}
              isReadOnly={!subscription.canEdit}
              onOpenBilling={() => setIsBillingOpen(true)}
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
              isReadOnly={!subscription.canEdit}
              onOpenBilling={() => setIsBillingOpen(true)}
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
            isReadOnly={!subscription.canEdit}
            onOpenBilling={() => setIsBillingOpen(true)}
          />
        </div>

        {/* Remarks / Day Notes */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl transition-all duration-300">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2.5">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{t.notes}</span>
          </label>
          <textarea
            value={sheet.note ?? ''}
            onChange={(e) => handleNoteChange(e.target.value)}
            rows={2}
            placeholder={t.notesPlaceholder}
            className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none transition"
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

      {/* Monthly & Yearly Reports Modal */}
      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        currentDate={selectedDate}
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

      {/* Subscription & Billing Modal */}
      <BillingModal
        isOpen={isBillingOpen}
        onClose={() => setIsBillingOpen(false)}
        subscription={subscription}
        userEmail={userEmail}
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

      {/* Legal & Compliance Modal */}
      <LegalModal
        isOpen={Boolean(legalModalTab)}
        onClose={() => setLegalModalTab(null)}
        initialTab={legalModalTab || 'privacy'}
        lang={lang}
      />

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setLegalModalTab('privacy')}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            onClick={() => setLegalModalTab('terms')}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            Terms of Service
          </button>
          <span>•</span>
          <button
            onClick={() => setLegalModalTab('deletion')}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            Data Deletion Instructions
          </button>
          <span>•</span>
          <button
            onClick={() => setLegalModalTab('faq')}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            FAQ & Help Tour
          </button>
          <span>•</span>
          <button
            onClick={() => setIsBillingOpen(true)}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition text-amber-600 dark:text-amber-400 font-bold"
          >
            Subscription Plans
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          KhataVault — 100% Private Commercial Ledger Stored in Your Own Google Drive (appdata)
        </p>
      </footer>

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        results={calculatedResults}
        date={selectedDate}
        lenaEntries={sheet.lenaEntries}
        denaEntries={sheet.denaEntries}
        lang={lang}
        firmName={activeFirm.name}
        friends={friends}
      />

      {/* Cash Denomination Counter Modal */}
      <CashCounterModal
        isOpen={isCashCounterOpen}
        onClose={() => setIsCashCounterOpen(false)}
        avlBalance={calculatedResults.avlBalance}
        lang={lang}
      />

      {/* 4-Digit Screen Lock PIN Modal */}
      <AppLockModal
        isLocked={isLocked}
        onUnlock={() => setIsLocked(false)}
        lang={lang}
      />

      {/* Voice Entry Modal */}
      <VoiceEntryModal
        isOpen={isVoiceEntryOpen}
        onClose={() => setIsVoiceEntryOpen(false)}
        onAddEntry={handleAddVoiceEntry}
        lang={lang}
      />

      {/* Multi-Firm / Book Switcher Modal */}
      <FirmSwitcherModal
        isOpen={isFirmSwitcherOpen}
        onClose={() => setIsFirmSwitcherOpen(false)}
        activeFirm={activeFirm}
        onFirmSelected={(f) => {
          setActiveFirm(f);
          storageService.getDaySheet(selectedDate).then(setSheet);
          storageService.getFriendSummaries().then(setFriends);
        }}
        lang={lang}
      />

      {/* Floating Pocket Calculator */}
      <PocketCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Install PWA Mobile Banner */}
      <PwaInstallBanner lang={lang} />

    </div>
  );
};

export default App;
