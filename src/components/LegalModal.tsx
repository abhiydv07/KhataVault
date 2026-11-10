import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Trash2, 
  HelpCircle, 
  HardDrive
} from 'lucide-react';
import { googleDriveService } from '../services/googleDrive';
import { authService } from '../services/supabase';
import { Language } from '../utils/i18n';

export type LegalTab = 'privacy' | 'terms' | 'deletion' | 'faq';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
  lang: Language;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
  lang: _lang,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeleteDriveData = async () => {
    if (!window.confirm('Are you sure you want to delete all hisaab ledger files from your Google Drive appDataFolder? This cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setDeleteStatus(null);
    try {
      const { providerToken } = await authService.getSession();
      if (!providerToken) {
        throw new Error('Please sign in with Google first.');
      }
      await googleDriveService.deleteAllAppData(providerToken);
      setDeleteStatus('Success: All hisaab data files have been permanently deleted from Google Drive.');
    } catch (err: any) {
      setDeleteStatus(`Error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              Legal, Privacy & FAQ Center
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Privacy Policy
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Terms of Service
          </button>

          <button
            onClick={() => setActiveTab('deletion')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'deletion'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Data Deletion
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'faq'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            FAQ & Guide
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-4 leading-relaxed">
          
          {/* 1. Privacy Policy */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm mb-1 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" /> Strict Zero-Server Financial Storage Policy
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  <strong>Lena Dena Hisaab</strong> NEVER stores your financial records, friend names, amounts, or calculations on our servers or databases. All hisaab data is stored directly in <strong>your own Google Drive</strong> in the isolated <code>drive.appdata</code> folder.
                </p>
              </div>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">1. Information We Collect</h4>
              <p>
                When you use Lena Dena Hisaab, we collect only the minimal metadata necessary to authenticate your account and manage your subscription:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Google Account Email, Name, and Profile Photo (for authentication via Supabase Auth).</li>
                <li>Subscription Status (e.g., Trial active, Monthly plan, Yearly plan) and Razorpay transaction IDs.</li>
              </ul>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">2. Google Drive Permissions (drive.appdata)</h4>
              <p>
                We request strictly the <code>https://www.googleapis.com/auth/drive.appdata</code> scope. This is a secure, sandbox scope:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>We CANNOT read, list, view, or modify your personal Google Drive files, Google Docs, photos, or sheets.</li>
                <li>Only JSON files created specifically by Lena Dena Hisaab (e.g. <code>2026-11.json</code>) reside in this isolated folder.</li>
                <li>Other third-party apps cannot access your hisaab files in this folder.</li>
              </ul>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">3. Optional Client-Side Encryption</h4>
              <p>
                You may set an AES-GCM passphrase in Settings. All your hisaab data is encrypted directly inside your browser before upload to Google Drive.
              </p>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">4. Third-Party Services</h4>
              <p>
                We partner with Supabase (for user authentication) and Razorpay (for processing subscription payments). Neither provider receives your financial hisaab numbers.
              </p>
            </div>
          )}

          {/* 2. Terms of Service */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">1. Nature of Service</h4>
              <p>
                Lena Dena Hisaab is a productivity calculation and ledger tool designed to help small business owners and individuals track peer receivables (Lena) and payables (Dena). It does not provide banking, financial advisory, or tax filing services.
              </p>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">2. Subscription & Trial</h4>
              <p>
                New accounts receive a 7-day free trial. Following the trial, a paid Monthly or Yearly subscription is required to add new daily entries and generate reports. Expired users retain permanent access to view past days and export their data to Excel and PDF.
              </p>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">3. Data Ownership & Responsibility</h4>
              <p>
                You retain 100% ownership of your data stored in your Google Drive. If you choose to enable passphrase encryption, you are solely responsible for remembering your passphrase.
              </p>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">4. Cancellations & Refunds</h4>
              <p>
                You can cancel your subscription renewal at any time from the Billing page. Subscriptions remain active until the end of the current billing cycle.
              </p>
            </div>
          )}

          {/* 3. Data Deletion */}
          {activeTab === 'deletion' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
                  How to Delete Your Data
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Under Google's User Data Policy and privacy regulations, you have full control over your records. You can delete your ledger data directly below:
                </p>
              </div>

              {deleteStatus && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs">
                  {deleteStatus}
                </div>
              )}

              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  Instant Self-Serve Cloud Data Erasure
                </h5>
                <p className="text-xs text-rose-700 dark:text-rose-200">
                  Clicking the button below sends an authenticated command to Google Drive API to erase all files stored in the <code>drive.appdata</code> folder for this app.
                </p>
                <button
                  onClick={handleDeleteDriveData}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Erasing files...' : 'Erase All Drive AppData Files Now'}</span>
                </button>
              </div>

              <div>
                <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Manual Account Deletion Request
                </h5>
                <p className="text-xs text-slate-500 mt-1">
                  To completely delete your Supabase authentication profile and subscription account record, email support at <code>privacy@lenadenahisaab.com</code> with your Google account email.
                </p>
              </div>
            </div>
          )}

          {/* 4. FAQ & Guide */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  What is Lena and Dena?
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  <strong>Lena (लेना)</strong> represents receivables — money that parties owe to you. <strong>Dena (देना)</strong> represents payables — money that you owe to parties.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  What is Farak (फ़र्क)?
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  <strong>Farak</strong> is the net daily balance. If it is Green (Lena), you have a net surplus to collect. If it is Red (Dena), you have a net deficit to pay.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Can I type arithmetic expressions in amount fields?
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Yes! You can type <code>1570+3135</code>, <code>25000-500</code>, or <code>12000*2</code>. The calculator evaluates them live.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Does it work offline?
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Yes, Lena Dena Hisaab works 100% offline. All entries are saved locally and automatically sync to your Google Drive when internet reconnects.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
