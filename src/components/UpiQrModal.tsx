import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, ExternalLink, Download, AlertCircle, Edit3 } from 'lucide-react';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import { Language } from '../utils/i18n';
import { generateUpiQrDataUrl, buildUpiUri, getSavedMerchantUpi, saveMerchantUpi } from '../utils/upi';

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyName?: string;
  amount: number;
  lang: Language;
  firmName?: string;
}

export const UpiQrModal: React.FC<UpiQrModalProps> = ({
  isOpen,
  onClose,
  partyName,
  amount,
  lang,
  firmName = 'KhataVault Merchant',
}) => {
  const [upiId, setUpiId] = useState<string>(() => getSavedMerchantUpi());
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);

  const isHi = lang === 'hi';

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedMerchantUpi();
      setUpiId(saved);
      setIsEditingUpi(!saved);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !upiId.trim()) {
      setQrDataUrl(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    generateUpiQrDataUrl({
      vpa: upiId.trim(),
      payeeName: firmName,
      amount: Math.abs(amount),
      transactionNote: partyName ? `Hisaab: ${partyName}` : 'Hisaab Settlement',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate UPI QR:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, upiId, amount, partyName, firmName]);

  if (!isOpen) return null;

  const upiUri = upiId.trim()
    ? buildUpiUri({
        vpa: upiId.trim(),
        payeeName: firmName,
        amount: Math.abs(amount),
        transactionNote: partyName ? `Hisaab: ${partyName}` : 'Hisaab Settlement',
      })
    : '';

  const handleCopyLink = () => {
    if (!upiUri) return;
    navigator.clipboard.writeText(upiUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveUpi = (newVpa: string) => {
    saveMerchantUpi(newVpa);
    setUpiId(newVpa.trim());
    setIsEditingUpi(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upi-qr-title"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 id="upi-qr-title" className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                {isHi ? 'तत्काल UPI क्यूआर कोड' : 'Instant UPI Payment QR'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {partyName ? `${partyName}` : firmName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col items-center space-y-4">
          {/* Amount Badge */}
          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {isHi ? 'भुगतान योग्य राशि' : 'Amount to Collect'}
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              ₹ {formatIndianCurrency(Math.abs(amount), true)}
            </div>
          </div>

          {/* VPA Configuration Bar */}
          {isEditingUpi ? (
            <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {isHi ? 'अपना व्यापारी UPI ID दर्ज करें:' : 'Enter your Merchant UPI ID:'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="merchant@icici or 9876543210@paytm"
                  defaultValue={upiId}
                  id="upi_modal_input"
                  className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('upi_modal_input') as HTMLInputElement;
                    if (input) handleSaveUpi(input.value);
                  }}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="truncate">
                <span className="text-slate-400 text-[10px] block">UPI ID:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{upiId}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingUpi(true)}
                className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold text-[11px]"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
          )}

          {/* QR Code Container */}
          {!upiId.trim() ? (
            <div className="w-56 h-56 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500" />
              <p className="text-xs font-semibold">Enter your UPI ID above to generate the payment QR code.</p>
            </div>
          ) : loading || !qrDataUrl ? (
            <div className="w-56 h-56 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-pulse">
              <span className="text-xs font-mono text-slate-400">Generating QR...</span>
            </div>
          ) : (
            <div className="relative p-3 bg-white rounded-2xl shadow-md border border-slate-200">
              <img
                src={qrDataUrl}
                alt="UPI Payment QR Code"
                className="w-52 h-52 object-contain rounded-lg"
              />
              <div className="text-[10px] font-bold text-slate-500 text-center mt-1">
                Scan with any UPI App (GPay / PhonePe / Paytm)
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {upiUri && (
            <div className="w-full grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy UPI Link'}</span>
              </button>

              <a
                href={upiUri}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in App</span>
              </a>
            </div>
          )}

          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`KhataVault_UPI_${partyName || 'Payment'}.png`}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 underline pt-1"
            >
              <Download className="w-3 h-3" /> Download QR Code Image
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
