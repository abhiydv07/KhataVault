import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Trash2, 
  LogOut, 
  ShieldCheck, 
  ExternalLink,
  KeyRound,
  Download,
  Upload
} from 'lucide-react';
import { syncManager, SyncState } from '../services/syncManager';
import { authService } from '../services/supabase';
import { googleDriveService } from '../services/googleDrive';
import { storageService } from '../utils/storage';
import { Language } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: SyncState;
  userEmail?: string | null;
  currentMonth: string;
  lang: Language;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  syncState,
  userEmail,
  currentMonth,
  lang: _lang,
}) => {
  const [passphrase, setPassphrase] = useState<string>(() => syncManager.getPassphrase() || '');
  const [isPassphraseSaved, setIsPassphraseSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState<string>(
    () => localStorage.getItem('khatasetu_app_pin') || localStorage.getItem('lekhasetu_app_pin') || ''
  );
  const [isPinSaved, setIsPinSaved] = useState(false);

  if (!isOpen) return null;

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pinInput.trim();
    if (trimmed === '') {
      localStorage.removeItem('khatasetu_app_pin');
      localStorage.removeItem('lekhasetu_app_pin');
    } else if (/^\d{4}$/.test(trimmed)) {
      localStorage.setItem('khatasetu_app_pin', trimmed);
    } else {
      alert('PIN must be exactly 4 numeric digits.');
      return;
    }
    setIsPinSaved(true);
    setTimeout(() => setIsPinSaved(false), 2000);
  };

  const handleExportBackup = async () => {
    try {
      const jsonStr = await storageService.exportFullBackup();
      const dateStr = new Date().toISOString().split('T')[0];
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KhataSetu_Complete_Backup_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus('Backup downloaded successfully!');
      setTimeout(() => setBackupStatus(null), 3000);
    } catch (err: any) {
      alert('Error creating backup: ' + err.message);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Restoring this backup will merge or overwrite current records for matching dates. Continue?')) {
      e.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const result = await storageService.restoreFullBackup(text);
      setBackupStatus(`Restored ${result.restoredDays} daily sheets across ${result.restoredMonths} months.`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      alert('Failed to restore backup: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  const handleSavePassphrase = (e: React.FormEvent) => {
    e.preventDefault();
    syncManager.setPassphrase(passphrase.trim() === '' ? null : passphrase.trim());
    setIsPassphraseSaved(true);
    setTimeout(() => setIsPassphraseSaved(false), 2000);
  };

  const handleForceSync = async () => {
    await syncManager.queueMonthSync(currentMonth);
  };

  const handlePullFromDrive = async () => {
    const success = await syncManager.pullFromDrive(currentMonth);
    if (success) {
      window.location.reload();
    }
  };

  const handleDeleteAllCloudData = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const { providerToken } = await authService.getSession();
      if (providerToken) {
        await googleDriveService.deleteAllAppData(providerToken);
        alert('All ledger files in Google Drive appDataFolder have been erased.');
      }
    } catch (err: any) {
      alert('Error deleting cloud data: ' + err.message);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                Google Drive & Privacy Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage cloud sync, AES-GCM encryption and data
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Google Account & Sync Status */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Google Drive Account
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                  {userEmail || 'Not Connected (Offline Mode)'}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      syncState.status === 'synced'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : syncState.status === 'syncing'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                        : syncState.status === 'offline'
                        ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {syncState.status === 'synced' ? (
                      <Cloud className="w-3.5 h-3.5" />
                    ) : (
                      <CloudOff className="w-3.5 h-3.5" />
                    )}
                    {syncState.status.toUpperCase()}
                  </span>

                  {syncState.lastSyncedAt && (
                    <span className="text-xs text-slate-500">
                      Last synced: {new Date(syncState.lastSyncedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

              {userEmail ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => authService.signInWithGoogle()}
                  className="text-xs font-bold px-3 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-xs"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Sync Controls */}
            {userEmail && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <button
                  onClick={handleForceSync}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Push to Drive
                </button>

                <button
                  onClick={handlePullFromDrive}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Pull from Drive
                </button>
              </div>
            )}
          </div>

          {/* Optional Client-Side Encryption (AES-GCM Web Crypto) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Optional Passphrase Encryption (AES-GCM)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Encrypts all data in the browser before upload to Google Drive.
                  </p>
                </div>
              </div>
              <div>
                {syncState.isEncrypted ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Lock className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                    <Unlock className="w-3.5 h-3.5" /> Off
                  </span>
                )}
              </div>
            </div>

            {/* Warning callout */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Important Warning:</strong> If you set an encryption passphrase and forget it, your data in Google Drive <strong>cannot be recovered</strong> by anyone. Keep it safe.
              </div>
            </div>

            <form onSubmit={handleSavePassphrase} className="flex gap-2">
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter private passphrase (or leave empty to disable)"
                className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                {isPassphraseSaved ? 'Saved!' : 'Save Passphrase'}
              </button>
            </form>
          </div>

          {/* 4-Digit Quick PIN Screen Lock */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    4-Digit Screen Lock PIN
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Locks the ledger interface to protect private balances when handing phone to others.
                  </p>
                </div>
              </div>
              <div>
                {localStorage.getItem('khatasetu_app_pin') || localStorage.getItem('lekhasetu_app_pin') ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Lock className="w-3.5 h-3.5" /> Enabled
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                    <Unlock className="w-3.5 h-3.5" /> Off
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSavePin} className="flex gap-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="4-digit PIN (e.g. 1234 or empty to disable)"
                className="flex-1 px-3 py-2 text-xs font-medium font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                {isPinSaved ? 'Saved!' : 'Save PIN'}
              </button>
            </form>
          </div>

          {/* Manual Offline Backup & Restore */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Offline Data Backup & Restore
            </h5>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Download your complete accounting database as an offline JSON snapshot file to keep on your computer or restore at any time.
            </p>

            {backupStatus && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                {backupStatus}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Export Full Backup (.json)</span>
              </button>

              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Restore Backup File</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Data Deletion & Privacy Policy */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Data Management & Compliance
            </h5>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <a
                href="#privacy"
                onClick={(e) => { e.preventDefault(); alert("Privacy Policy: KhataSetu stores all ledger records strictly inside your own Google Drive (drive.appdata). We do not store, view, or sell your financial data."); }}
                className="text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-1"
              >
                Privacy Policy <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-300">•</span>
              <a
                href="#terms"
                onClick={(e) => { e.preventDefault(); alert("Terms of Service: Subscription grants access to cloud sync, reports, and priority features."); }}
                className="text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-1"
              >
                Terms of Service <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Permanent Deletion Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDeleteAllCloudData}
                disabled={isDeleting}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  deleteConfirm
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {deleteConfirm
                    ? 'Click again to permanently erase Drive AppData'
                    : 'Erase all ledger files from Google Drive'}
                </span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
