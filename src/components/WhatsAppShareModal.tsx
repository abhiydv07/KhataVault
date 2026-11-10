import React from 'react';
import { X, MessageCircle, Share2, Users } from 'lucide-react';
import { CalculatedResults, LedgerEntry } from '../types/hisaab';
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
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function openWhatsApp(text: string): void {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  results,
  date,
  lenaEntries,
  denaEntries,
  lang,
}) => {
  if (!isOpen) return null;

  const dateLabel = formatDate(date);
  const isHi = lang === 'hi';

  // ---- Daily Summary Message ----
  const verdictLabel =
    results.verdict === 'lena'
      ? isHi ? '🟢 *लेना है*' : '🟢 *LENA (Collect)*'
      : results.verdict === 'dena'
      ? isHi ? '🔴 *देना है*' : '🔴 *DENA (Pay)*'
      : isHi ? '✅ *हिसाब बराबर*' : '✅ *SETTLED*';

  const summaryMsg = isHi
    ? `📊 *आज का हिसाब — ${dateLabel}*\n\n` +
      `🟢 कुल लेना  : ₹${formatIndianCurrency(results.totalLena)}\n` +
      `🔴 कुल देना  : ₹${formatIndianCurrency(results.totalDena)}\n` +
      `💸 कैश चार्ज : ₹${formatIndianCurrency(results.cashChargeAmount)}\n` +
      `⚖️ *शुद्ध फ़र्क : ₹${formatIndianCurrency(Math.abs(results.farak))}*\n\n` +
      `${verdictLabel}\n\n` +
      `_— KhataSetu (खातासेतु) App_`
    : `📊 *Today's Hisaab — ${dateLabel}*\n\n` +
      `🟢 Total Lena  : ₹${formatIndianCurrency(results.totalLena)}\n` +
      `🔴 Total Dena  : ₹${formatIndianCurrency(results.totalDena)}\n` +
      `💸 Cash Charge : ₹${formatIndianCurrency(results.cashChargeAmount)}\n` +
      `⚖️ *Net Farak : ₹${formatIndianCurrency(Math.abs(results.farak))}*\n\n` +
      `${verdictLabel}\n\n` +
      `_— KhataSetu App_`;

  // ---- Party rows that have a name & a non-zero amount ----
  const activeLena = lenaEntries.filter((e) => e.friendName.trim() && e.countInTotal && e.evaluatedAmount !== 0);
  const activeDena = denaEntries.filter((e) => e.friendName.trim() && e.countInTotal && e.evaluatedAmount !== 0);

  const partyReminderMsg = (name: string, amount: number, side: 'lena' | 'dena') => {
    const sign = side === 'lena' ? (isHi ? 'लेना' : 'receivable') : (isHi ? 'देना' : 'payable');
    const upiId = (typeof window !== 'undefined' ? localStorage.getItem('khatasetu_upi_id') : '')?.trim();
    let upiSection = '';

    if (upiId && side === 'lena') {
      const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('KhataSetu Settlement')}&am=${Math.abs(amount)}&cu=INR`;
      upiSection = isHi
        ? `\n\n📲 *तुरंत UPI से भुगतान करें (GPay / PhonePe / Paytm):*\n${upiLink}`
        : `\n\n📲 *Pay directly via UPI (GPay / PhonePe / Paytm):*\n${upiLink}`;
    }

    return isHi
      ? `नमस्ते *${name}* जी 🙏\n\nआपका आज का खाता शेष:\n*₹${formatIndianCurrency(Math.abs(amount))} ${sign} है।*${upiSection}\n\n_— KhataSetu (खातासेतु) App_`
      : `Namaste *${name}* Ji 🙏\n\nYour current account balance:\n*₹${formatIndianCurrency(Math.abs(amount))} (${side === 'lena' ? 'You owe us' : 'We owe you'})*${upiSection}\n\n_— KhataSetu App_`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-green-50 dark:bg-green-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center shadow-md">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                {isHi ? 'WhatsApp शेयर करें' : 'Share on WhatsApp'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{dateLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">

          {/* Daily Summary Share */}
          <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50/60 dark:bg-green-950/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-green-200 dark:border-green-800 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-green-700 dark:text-green-400" />
              <span className="font-bold text-sm text-green-900 dark:text-green-100">
                {isHi ? 'आज का सारांश शेयर करें' : 'Share Daily Summary'}
              </span>
            </div>
            <div className="p-4">
              <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                {summaryMsg}
              </pre>
              <button
                onClick={() => openWhatsApp(summaryMsg)}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20b558] text-white font-bold rounded-xl transition text-sm shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                {isHi ? 'WhatsApp पर भेजें' : 'Send on WhatsApp'}
              </button>
            </div>
          </div>

          {/* Per-Party Reminders */}
          {(activeLena.length > 0 || activeDena.length > 0) && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                  {isHi ? 'पार्टी वाइज़ रिमाइंडर' : 'Per-Party Reminders'}
                </span>
              </div>
              <div className="p-3 space-y-2">
                {activeLena.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{entry.friendName}</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                        🟢 {isHi ? 'लेना' : 'Lena'}: ₹{formatIndianCurrency(Math.abs(entry.evaluatedAmount))}
                      </p>
                    </div>
                    <button
                      onClick={() => openWhatsApp(partyReminderMsg(entry.friendName, entry.evaluatedAmount, 'lena'))}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20b558] text-white text-xs font-bold rounded-lg transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {isHi ? 'भेजें' : 'Send'}
                    </button>
                  </div>
                ))}
                {activeDena.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{entry.friendName}</p>
                      <p className="text-xs text-rose-700 dark:text-rose-400 font-mono font-bold">
                        🔴 {isHi ? 'देना' : 'Dena'}: ₹{formatIndianCurrency(Math.abs(entry.evaluatedAmount))}
                      </p>
                    </div>
                    <button
                      onClick={() => openWhatsApp(partyReminderMsg(entry.friendName, entry.evaluatedAmount, 'dena'))}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20b558] text-white text-xs font-bold rounded-lg transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {isHi ? 'भेजें' : 'Send'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

