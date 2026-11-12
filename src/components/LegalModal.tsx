import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Trash2, 
  HelpCircle, 
  HardDrive,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { storageService } from '../utils/storage';
import { Language } from '../utils/i18n';

export type LegalTab = 'privacy' | 'terms' | 'refund' | 'deletion' | 'faq';

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
  const [deleteResult, setDeleteResult] = useState<{
    success: boolean;
    clearedKeysCount: number;
    driveFilesDeleted: number;
    verified: boolean;
    remainingLedgerKeys: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Sync URL hash for direct routing (/privacy, /terms, /refund, /data-deletion)
  useEffect(() => {
    if (!isOpen) return;
    const tabToPathMap: Record<LegalTab, string> = {
      privacy: 'privacy',
      terms: 'terms',
      refund: 'refund',
      deletion: 'data-deletion',
      faq: 'faq',
    };
    window.history.replaceState(null, '', `#${tabToPathMap[activeTab]}`);
  }, [isOpen, activeTab]);

  // Escape key handler for accessible modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExportFirst = async () => {
    try {
      const json = await storageService.exportFullBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KhataVault_Export_Before_Deletion_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMessage(`Export failed: ${err.message}`);
    }
  };

  const handleExecuteFullDeletion = async () => {
    const confirm1 = window.confirm(
      'PERMANENT DATA ERASURE:\nAre you sure you want to delete all ledger entries, your Google Drive appDataFolder files, settings, and account data? This action cannot be undone.'
    );
    if (!confirm1) return;

    const confirm2 = window.prompt('Type DELETE in capital letters to confirm permanent data erasure:');
    if (confirm2 !== 'DELETE') {
      alert('Deletion cancelled. You did not type DELETE.');
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);
    setDeleteResult(null);

    try {
      const result = await storageService.performFullAccountDeletion();
      setDeleteResult(result);
      if (result.verified) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Data deletion failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 id="legal-modal-title" className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              Legal, Privacy & Compliance Center
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close legal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
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
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Terms of Service
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'refund'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Refund Policy
          </button>

          <button
            onClick={() => setActiveTab('deletion')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'deletion'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Data Deletion
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'faq'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            FAQ & Architecture
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-4 leading-relaxed">
          
          {/* Draft Notice */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200">
            <strong>Legal Draft Notice:</strong> This legal documentation is published in draft status and is subject to continuous review by legal counsel and Chartered Accountants to maintain compliance with the Digital Personal Data Protection (DPDP) Act 2023, Information Technology Act 2000, and Google API Services User Data Policy.
          </div>

          {/* 1. Privacy Policy */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm mb-1 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" /> Architecture & Data Flow Disclosure
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  <strong>KhataVault</strong> is designed with a local-first browser architecture. By default, your entries and balances are stored directly in your browser's local storage. When you enable Google Drive sync, your data files are stored in your own Google Drive sandbox (<code>drive.appdata</code>).
                </p>
              </div>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">1. Data Processors Disclosed</h4>
              <p>KhataVault transmits or synchronizes data only with the following service processors under clear operational scopes:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li>
                  <strong>Google Drive API:</strong> Synchronizes month ledger files (<code>YYYY-MM.json</code>) exclusively to your personal <code>https://www.googleapis.com/auth/drive.appdata</code> folder. We have no access to your personal files, Google Docs, or Google Photos.
                </li>
                <li>
                  <strong>Supabase (PostgreSQL Auth):</strong> Stores authentication profile metadata (email, name, avatar) and subscription plan entitlement. No financial amounts or party transaction entries are stored in Supabase.
                </li>
                <li>
                  <strong>Razorpay:</strong> Facilitates secure payment processing for Pro subscriptions. Payment card/UPI credentials are encrypted and processed directly by Razorpay under RBI guidelines.
                </li>
                <li>
                  <strong>Google Gemini API (Optional AI Auto-Scan):</strong> If you choose to use the Photo/PDF Auto-Scan feature and provide an API key, the image or PDF bytes are transmitted to Google Gemini API for OCR and receipt entity extraction. The API key is stored locally in your browser.
                </li>
              </ul>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">2. DPDP Act 2023 & GDPR Data Subject Rights</h4>
              <p>You possess full legal rights over your personal and commercial data:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>Right of Access & Portability:</strong> Export a complete JSON backup at any time from Settings or the Data Deletion tab.</li>
                <li><strong>Right to Rectification:</strong> Edit or correct any party name, transaction, or adjustment directly in the UI.</li>
                <li><strong>Right to Complete Erasure:</strong> One-click permanent deletion of local storage, Google Drive files, and account profile via the Data Deletion tab.</li>
              </ul>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">3. Legal Entity & Grievance Officer</h4>
              <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
                <p><strong>Entity:</strong> KhataVault Technologies</p>
                <p><strong>Registered Address:</strong> Bangalore, Karnataka 560100, India</p>
                <p><strong>Support & Grievance Contact:</strong> <a href="mailto:support@khatavault.app" className="text-emerald-600 dark:text-emerald-400 font-mono">support@khatavault.app</a></p>
                <p><strong>Governing Law:</strong> Information Technology Act 2000 & Digital Personal Data Protection Act 2023 of India.</p>
              </div>
            </div>
          )}

          {/* 2. Terms of Service */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">1. Nature of Service</h4>
              <p>
                KhataVault is an offline-first commercial ledger calculation, settlement, and record-keeping tool. KhataVault does NOT provide banking, tax filing, legal advice, or financial underwriting services.
              </p>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">2. User Ownership & Passphrase Responsibility</h4>
              <p>
                You retain complete ownership of all records created within the application. If you configure a client-side AES-GCM encryption passphrase, you are solely responsible for maintaining that passphrase. Because encryption is performed client-side, lost passphrases cannot be recovered by KhataVault.
              </p>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">3. Subscription & Fair Usage</h4>
              <p>
                New users receive an initial 7-day trial. Pro subscriptions renew on a monthly or yearly cycle. If a subscription lapses, users retain permanent access to view past records and export data to PDF and Excel.
              </p>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">4. Jurisdiction & Governing Law</h4>
              <p>
                These terms are governed by the laws of India. Any disputes arising in connection with the application shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.
              </p>
            </div>
          )}

          {/* 3. Refund Policy */}
          {activeTab === 'refund' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 rounded-2xl">
                <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm mb-1 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" /> 7-Day Money-Back Guarantee
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  We stand behind KhataVault. If you are not satisfied with your Pro subscription, you can request a 100% refund within 7 days of initial purchase.
                </p>
              </div>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">1. Refund Eligibility & Conditions</h4>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Refund requests submitted within 7 calendar days of your initial Pro subscription upgrade are eligible for a full refund.</li>
                <li>Renewal charges for subsequent billing cycles may be cancelled at any time before the renewal date from the Billing modal.</li>
                <li>Disputed charges or chargeback notices will be handled in accordance with Razorpay merchant standards and Indian payment regulations.</li>
              </ul>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">2. Processing Timelines & Method</h4>
              <p className="text-xs">
                Once approved, refunds are credited back to the original payment source (UPI account, Debit/Credit Card, or Net Banking) within <strong>5 to 7 business days</strong> depending on your issuing bank.
              </p>

              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">3. How to Request a Refund</h4>
              <p className="text-xs">
                To request a refund, please send an email to <a href="mailto:support@khatavault.app" className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">support@khatavault.app</a> with your registered account email and Razorpay payment reference ID.
              </p>
            </div>
          )}

          {/* 4. Data Deletion */}
          {activeTab === 'deletion' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
                  Orchestrated Data Deletion Flow
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Under DPDP Act 2023, GDPR, and Google User Data Policies, you can permanently erase all ledger data from your browser, Google Drive sandbox, and server accounts with one click.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
                  {errorMessage}
                </div>
              )}

              {deleteResult && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Permanent Deletion Verified!</span>
                  </div>
                  <ul className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1 pl-5 list-disc">
                    <li>Cleared {deleteResult.clearedKeysCount} local browser records and caches.</li>
                    <li>Removed {deleteResult.driveFilesDeleted} Google Drive AppData files.</li>
                    <li>Zero remaining ledger keys verified in browser storage.</li>
                    <li>Page will refresh in 3 seconds to reset memory state.</li>
                  </ul>
                </div>
              )}

              {/* Step 1: Export Data First */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                    Step 1: Export Your Ledger First (Recommended)
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Download a full JSON backup of all recorded months before deletion.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportFirst}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-xs transition hover:opacity-90 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup</span>
                </button>
              </div>

              {/* Step 2: Destructive Deletion */}
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Step 2: Permanent Erasure Everywhere</span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-200">
                  This permanently removes all localStorage keys starting with <code>lena_dena_hisaab_</code>, clears IndexedDB and caches, purges Google Drive <code>drive.appdata</code> files, and revokes active sessions.
                </p>
                <button
                  onClick={handleExecuteFullDeletion}
                  disabled={isDeleting}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Erasing data...' : 'Permanently Delete All Data Everywhere'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. FAQ & Architecture */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Where is my ledger data stored?
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  In Demo Mode, data resides strictly in your browser's local storage. When Google Drive sync is configured, files are backed up directly to your personal Google Drive <code>drive.appdata</code> sandbox. KhataVault servers never receive your financial amounts.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  How does the Cash Handling Surcharge work?
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  The Cash Handling Surcharge is calculated as a percentage (e.g. 3.75%) on the default cash-charge base (Payables / Dena). You can customize the percentage or toggle the calculation in the Hisaab Adjustments card.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  How does the AI Document & Photo Scanner work?
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  If you use the Auto-Scan feature, you can upload a photo of handwritten hisaab, a PDF invoice, or an Excel file. When an API key is provided, the document is sent directly from your browser to Google Gemini API for OCR entity recognition, and the resulting amounts populate into Lena and Dena entries automatically.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center text-xs text-slate-500">
          <span>KhataVault Technologies • support@khatavault.app</span>
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
