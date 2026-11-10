import React, { useState } from 'react';
import { 
  X, 
  MessageCircle, 
  Share2, 
  Users, 
  Copy, 
  Check, 
  Phone, 
  Send, 
  FileText, 
  Smartphone
} from 'lucide-react';
import { CalculatedResults, LedgerEntry, FriendSummary } from '../types/hisaab';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import { Language } from '../utils/i18n';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: CalculatedResults;
  date: string;
  lenaEntries: LedgerEntry[];
  denaEntries: LedgerEntry[];
  lang: Language;
  firmName?: string;
  friends?: FriendSummary[];
}

function formatDate(dateStr: string, isHi: boolean): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

/**
 * Robust WhatsApp Trigger function
 * - Handles both Mobile and Desktop
 * - Supports targeted Phone Number or Contact Picker
 * - Uses synthetic anchor click to bypass popup blockers
 */
function openWhatsApp(text: string, rawPhone?: string): void {
  const cleanPhone = rawPhone ? rawPhone.replace(/[^0-9]/g, '') : '';
  const formattedPhone = cleanPhone
    ? cleanPhone.length === 10
      ? `91${cleanPhone}`
      : cleanPhone
    : '';

  const encoded = encodeURIComponent(text);
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  let targetUrl = '';
  if (formattedPhone) {
    // Direct chat with specific phone number
    targetUrl = isMobile
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`
      : `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`;
  } else {
    // Open WhatsApp with text to pick contact
    targetUrl = isMobile
      ? `whatsapp://send?text=${encoded}`
      : `https://web.whatsapp.com/send?text=${encoded}`;
  }

  // Create temporary anchor to bypass popup blockers
  const link = document.createElement('a');
  link.href = targetUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 200);

  // Fallback for mobile if whatsapp:// URI isn't handled
  if (isMobile && !formattedPhone) {
    setTimeout(() => {
      const fallback = `https://api.whatsapp.com/send?text=${encoded}`;
      window.open(fallback, '_blank', 'noopener,noreferrer');
    }, 600);
  }
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  results,
  date,
  lenaEntries,
  denaEntries,
  lang,
  firmName = 'Main Firm',
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'parties'>('summary');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customPhone, setCustomPhone] = useState<string>('');
  const [partyPhones, setPartyPhones] = useState<Record<string, string>>(() => {
    const saved: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      [...lenaEntries, ...denaEntries].forEach((e) => {
        if (e.friendName) {
          const stored = localStorage.getItem(`khatavault_phone_${e.friendName.trim().toLowerCase()}`);
          if (stored) saved[e.friendName] = stored;
        }
      });
    }
    return saved;
  });

  if (!isOpen) return null;

  const isHi = lang === 'hi';
  const dateLabel = formatDate(date, isHi);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Native Web Share API if supported
  const handleNativeShare = async (text: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
        });
      } catch {
        // User cancelled or failed, ignore
      }
    } else {
      openWhatsApp(text, customPhone);
    }
  };

  const handlePartyPhoneChange = (name: string, phone: string) => {
    const updated = { ...partyPhones, [name]: phone };
    setPartyPhones(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`khatavault_phone_${name.trim().toLowerCase()}`, phone);
    }
  };

  // ---- 1. Daily Summary Message ----
  const verdictLabel =
    results.verdict === 'lena'
      ? isHi ? '🟢 *लेना है (SURPLUS TO COLLECT)*' : '🟢 *LENA (RECEIVABLE TO COLLECT)*'
      : results.verdict === 'dena'
      ? isHi ? '🔴 *देना है (DEFICIT TO PAY)*' : '🔴 *DENA (PAYABLE TO SETTLE)*'
      : isHi ? '✅ *हिसाब बराबर (SETTLED)*' : '✅ *SETTLED / BARABAR*';

  const summaryMsg = isHi
    ? `📊 *आज का हिसाब — ${dateLabel}*\n` +
      `🏛️ *फर्म:* ${firmName}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🟢 कुल लेना (Credit)  : ₹${formatIndianCurrency(results.totalLena)}\n` +
      `🔴 कुल देना (Debit)   : ₹${formatIndianCurrency(results.totalDena)}\n` +
      `💸 कैश चार्ज (${results.cashChargeBaseAmount ? ((results.cashChargeAmount / results.cashChargeBaseAmount) * 100).toFixed(1) : '3'}%) : ₹${formatIndianCurrency(results.cashChargeAmount)}\n` +
      `⚖️ *शुद्ध फ़र्क : ₹${formatIndianCurrency(Math.abs(results.farak))}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${verdictLabel}\n\n` +
      `_🔒 KhataVault (खाता वॉल्ट) — 100% प्राइवेट खाता_`
    : `📊 *Daily Hisaab Summary — ${dateLabel}*\n` +
      `🏛️ *Firm:* ${firmName}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🟢 Total Receivables (Credit): ₹${formatIndianCurrency(results.totalLena)}\n` +
      `🔴 Total Payables (Debit)    : ₹${formatIndianCurrency(results.totalDena)}\n` +
      `💸 Cash Surcharge            : ₹${formatIndianCurrency(results.cashChargeAmount)}\n` +
      `⚖️ *Net Settlement Farak     : ₹${formatIndianCurrency(Math.abs(results.farak))}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${verdictLabel}\n\n` +
      `_🔒 KhataVault — 100% Encrypted Commercial Suite_`;

  // ---- 2. Detailed Line-by-Line Breakdown Message ----
  const activeLena = lenaEntries.filter((e) => e.friendName.trim() && e.countInTotal && (e.evaluatedAmount !== 0 || e.rawExpression.trim() !== ''));
  const activeDena = denaEntries.filter((e) => e.friendName.trim() && e.countInTotal && (e.evaluatedAmount !== 0 || e.rawExpression.trim() !== ''));

  let detailedMsg = isHi
    ? `📋 *विस्तृत रोज़नामचा विवरण — ${dateLabel}*\n🏛️ *फर्म:* ${firmName}\n━━━━━━━━━━━━━━━━━━━━\n\n`
    : `📋 *Detailed Daily Statement — ${dateLabel}*\n🏛️ *Firm:* ${firmName}\n━━━━━━━━━━━━━━━━━━━━\n\n`;

  detailedMsg += isHi ? `🟢 *लेना पक्ष (RECEIVABLES):*\n` : `🟢 *RECEIVABLES (LENA):*\n`;
  if (activeLena.length === 0) {
    detailedMsg += isHi ? `  (कोई एंट्री नहीं)\n` : `  (No entries)\n`;
  } else {
    activeLena.forEach((e, idx) => {
      detailedMsg += `${idx + 1}. *${e.friendName}*: ₹${formatIndianCurrency(e.evaluatedAmount || 0)}\n`;
    });
  }
  detailedMsg += `*उप-योग (Subtotal): ₹${formatIndianCurrency(results.totalLena)}*\n\n`;

  detailedMsg += isHi ? `🔴 *देना पक्ष (PAYABLES):*\n` : `🔴 *PAYABLES (DENA):*\n`;
  if (activeDena.length === 0) {
    detailedMsg += isHi ? `  (कोई एंट्री नहीं)\n` : `  (No entries)\n`;
  } else {
    activeDena.forEach((e, idx) => {
      const ulText = e.upline ? ` (U/L: ₹${formatIndianCurrency(e.upline)})` : '';
      detailedMsg += `${idx + 1}. *${e.friendName}*: ₹${formatIndianCurrency(e.evaluatedAmount || 0)}${ulText}\n`;
    });
  }
  detailedMsg += `*उप-योग (Subtotal): ₹${formatIndianCurrency(results.totalDena)}*\n\n`;
  detailedMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
  detailedMsg += `💸 *कैश चार्ज / Surcharge:* ₹${formatIndianCurrency(results.cashChargeAmount)}\n`;
  detailedMsg += `⚖️ *शुद्ध हिसाब (Net Position): ₹${formatIndianCurrency(Math.abs(results.farak))}*\n`;
  detailedMsg += `${verdictLabel}\n\n`;
  detailedMsg += `_— KhataVault (खाता वॉल्ट)_`;

  // ---- 3. Per-Party Reminder Generator ----
  const partyReminderMsg = (name: string, amount: number, side: 'lena' | 'dena') => {
    const sign = side === 'lena' ? (isHi ? 'लेना बाकी' : 'receivable') : (isHi ? 'देना बाकी' : 'payable');
    const upiId = (
      typeof window !== 'undefined'
        ? localStorage.getItem('khatavault_upi_id') || localStorage.getItem('khatasetu_upi_id')
        : ''
    )?.trim();
    let upiSection = '';

    if (upiId && side === 'lena') {
      const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(firmName)}&am=${Math.abs(amount)}&cu=INR`;
      upiSection = isHi
        ? `\n\n📲 *तुरंत UPI से भुगतान करें (Google Pay / PhonePe / Paytm):*\n${upiLink}`
        : `\n\n📲 *Pay directly via UPI (Google Pay / PhonePe / Paytm):*\n${upiLink}`;
    }

    return isHi
      ? `नमस्ते *${name}* जी 🙏\n\n` +
        `*${firmName}* के खाते के अनुसार आज (${dateLabel}) का आपका हिसाब:\n` +
        `*₹${formatIndianCurrency(Math.abs(amount))} ${sign} है।*${upiSection}\n\n` +
        `कृपया हिसाब देखकर पुष्टि करें। धन्यवाद!\n` +
        `_— ${firmName} (KhataVault)_`
      : `Namaste *${name}* Ji 🙏\n\n` +
        `As per books of *${firmName}* for today (${dateLabel}):\n` +
        `*₹${formatIndianCurrency(Math.abs(amount))} (${side === 'lena' ? 'You owe us / Receivable' : 'We owe you / Payable'})*${upiSection}\n\n` +
        `Please verify and confirm. Thank you!\n` +
        `_— ${firmName} (KhataVault)_`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white relative border-b border-emerald-900/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#25D366] rounded-2xl flex items-center justify-center shadow-lg shadow-[#25D366]/30 text-white">
              <MessageCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">
                  {isHi ? 'WhatsApp शेयर एवं हिसाब' : 'WhatsApp Share & Statements'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Direct Share
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {dateLabel} • {firmName}
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="mt-4 flex gap-1.5 bg-slate-900/80 p-1 rounded-2xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isHi ? 'दैनिक सारांश' : 'Daily Summary'}</span>
            </button>

            <button
              onClick={() => setActiveTab('detailed')}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'detailed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isHi ? 'पूरी पार्टी लिस्ट' : 'Full Breakdown'}</span>
            </button>

            <button
              onClick={() => setActiveTab('parties')}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'parties'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {isHi ? 'पार्टी रिमाइंडर' : 'Party Reminders'} ({activeLena.length + activeDena.length})
              </span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">

          {/* Phone Number Input (Optional direct target) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {isHi ? 'मोबाइल नंबर पर सीधे भेजें (वैकल्पिक)' : 'Direct WhatsApp Number (Optional)'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isHi ? 'खाली छोड़ने पर संपर्क चुनने का विकल्प खुलेगा' : 'Leave empty to pick contact inside WhatsApp'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">+91</span>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-36 px-2.5 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* TAB 1: DAILY SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-3.5">
              <div className="relative">
                <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-inner max-h-60 overflow-y-auto">
                  {summaryMsg}
                </pre>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* 1. Send via WhatsApp */}
                <button
                  type="button"
                  onClick={() => openWhatsApp(summaryMsg, customPhone)}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20b558] text-white font-bold rounded-2xl transition text-xs shadow-md shadow-[#25D366]/20 transform active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{isHi ? 'WhatsApp पर भेजें' : 'Send on WhatsApp'}</span>
                </button>

                {/* 2. Copy Message */}
                <button
                  type="button"
                  onClick={() => handleCopy(summaryMsg, 'summary')}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold rounded-2xl transition text-xs border border-slate-200 dark:border-slate-700 transform active:scale-95"
                >
                  {copiedKey === 'summary' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span className="text-emerald-600 font-black">{isHi ? 'कॉपी हो गया!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>{isHi ? 'मैसेज कॉपी करें' : 'Copy Message'}</span>
                    </>
                  )}
                </button>

                {/* 3. System Share */}
                <button
                  type="button"
                  onClick={() => handleNativeShare(summaryMsg, `KhataVault Summary - ${dateLabel}`)}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold rounded-2xl transition text-xs border border-indigo-200 dark:border-indigo-800 transform active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{isHi ? 'अन्य ऐप्स पर शेयर' : 'System Share Sheet'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED FULL BREAKDOWN */}
          {activeTab === 'detailed' && (
            <div className="space-y-3.5">
              <div className="relative">
                <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-inner max-h-64 overflow-y-auto">
                  {detailedMsg}
                </pre>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => openWhatsApp(detailedMsg, customPhone)}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20b558] text-white font-bold rounded-2xl transition text-xs shadow-md shadow-[#25D366]/20 transform active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{isHi ? 'WhatsApp पर भेजें' : 'Send on WhatsApp'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(detailedMsg, 'detailed')}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold rounded-2xl transition text-xs border border-slate-200 dark:border-slate-700 transform active:scale-95"
                >
                  {copiedKey === 'detailed' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span className="text-emerald-600 font-black">{isHi ? 'कॉपी हो गया!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>{isHi ? 'लिस्ट कॉपी करें' : 'Copy Breakdown'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNativeShare(detailedMsg, `KhataVault Statement - ${dateLabel}`)}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold rounded-2xl transition text-xs border border-indigo-200 dark:border-indigo-800 transform active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{isHi ? 'अन्य ऐप्स पर शेयर' : 'System Share Sheet'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PER-PARTY REMINDERS */}
          {activeTab === 'parties' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{isHi ? 'प्रत्येक पार्टी को अलग रिमाइंडर भेजें:' : 'Send personalized balance reminder per counterparty:'}</span>
                <span className="font-bold">{activeLena.length + activeDena.length} {isHi ? 'पार्टियां' : 'Parties'}</span>
              </div>

              {activeLena.length === 0 && activeDena.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  {isHi ? 'आज की कोई सक्रिय पार्टी नहीं है।' : 'No active parties found for today.'}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  
                  {/* Lena Entries */}
                  {activeLena.map((entry) => {
                    const msg = partyReminderMsg(entry.friendName, entry.evaluatedAmount, 'lena');
                    const phone = partyPhones[entry.friendName] || '';

                    return (
                      <div
                        key={entry.id}
                        className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {entry.friendName}
                            </span>
                            <span className="ml-2 text-xs font-mono font-black text-emerald-700 dark:text-emerald-400">
                              🟢 {isHi ? 'लेना' : 'Lena'}: ₹{formatIndianCurrency(Math.abs(entry.evaluatedAmount))}
                            </span>
                          </div>
                        </div>

                        {/* Phone Input + Send Button Row */}
                        <div className="flex items-center gap-2">
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="Party mobile (e.g. 9876543210)"
                            value={phone}
                            onChange={(e) => handlePartyPhoneChange(entry.friendName, e.target.value.replace(/[^0-9]/g, ''))}
                            className="flex-1 px-2.5 py-1.5 text-xs font-mono font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />

                          <button
                            type="button"
                            onClick={() => openWhatsApp(msg, phone)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#25D366] hover:bg-[#20b558] text-white text-xs font-bold rounded-xl transition shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isHi ? 'भेजें' : 'Send'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopy(msg, entry.id)}
                            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                            title="Copy text"
                          >
                            {copiedKey === entry.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Dena Entries */}
                  {activeDena.map((entry) => {
                    const msg = partyReminderMsg(entry.friendName, entry.evaluatedAmount, 'dena');
                    const phone = partyPhones[entry.friendName] || '';

                    return (
                      <div
                        key={entry.id}
                        className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {entry.friendName}
                            </span>
                            <span className="ml-2 text-xs font-mono font-black text-rose-700 dark:text-rose-400">
                              🔴 {isHi ? 'देना' : 'Dena'}: ₹{formatIndianCurrency(Math.abs(entry.evaluatedAmount))}
                            </span>
                          </div>
                        </div>

                        {/* Phone Input + Send Button Row */}
                        <div className="flex items-center gap-2">
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="Party mobile (e.g. 9876543210)"
                            value={phone}
                            onChange={(e) => handlePartyPhoneChange(entry.friendName, e.target.value.replace(/[^0-9]/g, ''))}
                            className="flex-1 px-2.5 py-1.5 text-xs font-mono font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                          />

                          <button
                            type="button"
                            onClick={() => openWhatsApp(msg, phone)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#25D366] hover:bg-[#20b558] text-white text-xs font-bold rounded-xl transition shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isHi ? 'भेजें' : 'Send'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopy(msg, entry.id)}
                            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                            title="Copy text"
                          >
                            {copiedKey === entry.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
