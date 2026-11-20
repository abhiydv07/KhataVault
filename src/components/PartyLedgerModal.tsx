import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  QrCode, 
  Percent, 
  Send, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Calculator,
  Download
} from 'lucide-react';
import { Language } from '../utils/i18n';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import { getPartyTransactions, PartyStatementData, exportPartyStatementPdf } from '../utils/exportPartyPdf';
import { UpiQrModal } from './UpiQrModal';

interface PartyLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyName: string;
  lang: Language;
  firmName?: string;
}

export const PartyLedgerModal: React.FC<PartyLedgerModalProps> = ({
  isOpen,
  onClose,
  partyName,
  lang,
  firmName = 'KhataVault Merchant',
}) => {
  const [data, setData] = useState<PartyStatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInterestCalc, setShowInterestCalc] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedInterest, setCopiedInterest] = useState(false);

  // Interest calculator states
  const [monthlyRate, setMonthlyRate] = useState<number>(2.0); // 2% per month (standard sakda)
  const [customDays, setCustomDays] = useState<number>(30);
  const [principalOverride, setPrincipalOverride] = useState<string>('');

  const isHi = lang === 'hi';

  useEffect(() => {
    if (!isOpen || !partyName) return;
    setLoading(true);
    getPartyTransactions(partyName)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load party transactions:', err);
        setLoading(false);
      });
  }, [isOpen, partyName]);

  if (!isOpen) return null;

  const netBalance = data?.netBalance ?? 0;
  const isToCollect = netBalance > 0;
  const isToPay = netBalance < 0;

  // Interest calculations
  const effectivePrincipal = principalOverride ? parseFloat(principalOverride) || 0 : Math.max(0, netBalance);
  // Interest = Principal * (monthlyRate / 100) * (days / 30)
  const interestAmount = Math.round(((effectivePrincipal * (monthlyRate / 100) * (customDays / 30)) * 100)) / 100;
  const totalWithInterest = effectivePrincipal + interestAmount;

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportPartyStatementPdf(partyName);
    } catch (err: any) {
      alert('Could not generate PDF: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const interestSummaryText = isHi
    ? `📊 *ब्याज हिसाब — ${partyName}*\n` +
      `🏛️ *फर्म:* ${firmName}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 मूल रकम (Principal): ₹${formatIndianCurrency(effectivePrincipal)}\n` +
      `📈 मासिक दर (Monthly Rate): ${monthlyRate}% प्रति माह (₹${monthlyRate} सैकड़ा)\n` +
      `⏳ दिन (Period): ${customDays} दिन\n` +
      `💵 ब्याज रकम (Interest): ₹${formatIndianCurrency(interestAmount)}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🤝 *कुल देय राशि : ₹${formatIndianCurrency(totalWithInterest)}*\n\n` +
      `_— ${firmName} (KhataVault)_`
    : `📊 *Interest Statement — ${partyName}*\n` +
      `🏛️ *Firm:* ${firmName}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 Principal Amount: ₹${formatIndianCurrency(effectivePrincipal)}\n` +
      `📈 Interest Rate: ${monthlyRate}% / month\n` +
      `⏳ Period: ${customDays} days\n` +
      `💵 Accrued Interest: ₹${formatIndianCurrency(interestAmount)}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🤝 *Total Outstanding : ₹${formatIndianCurrency(totalWithInterest)}*\n\n` +
      `_— ${firmName} (KhataVault)_`;

  const handleCopyInterest = () => {
    navigator.clipboard.writeText(interestSummaryText);
    setCopiedInterest(true);
    setTimeout(() => setCopiedInterest(false), 2000);
  };

  const handleSendInterestWhatsApp = () => {
    const encoded = encodeURIComponent(interestSummaryText);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="party-ledger-title"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {isHi ? 'पार्टी खाता बही' : 'Counterparty Ledger'}
              </span>
              <span className="text-xs text-slate-400 font-medium">• {firmName}</span>
            </div>
            <h2 id="party-ledger-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {partyName}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-xs"
              title="Download PDF Statement"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {isToCollect && (
              <button
                onClick={() => setShowQrModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs"
                title="Generate UPI Payment QR"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">UPI QR</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Balance Hero Card */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
              {isHi ? 'शुद्ध बकाया स्थिति (Net Outstanding)' : 'Net Outstanding Balance'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono ${
                  isToCollect
                    ? 'text-emerald-400'
                    : isToPay
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                ₹ {formatIndianCurrency(Math.abs(netBalance), true)}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10">
                {isToCollect ? 'LENA (लेना बाकी)' : isToPay ? 'DENA (देना बाकी)' : 'BARABAR (बराबर)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono font-bold">
            <div className="bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-emerald-300">
              <span className="block text-[10px] text-slate-400">Total Lena (Cr)</span>
              ₹ {formatIndianCurrency(data?.totalLena ?? 0)}
            </div>
            <div className="bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-xl text-rose-300">
              <span className="block text-[10px] text-slate-400">Total Dena (Dr)</span>
              ₹ {formatIndianCurrency(data?.totalDena ?? 0)}
            </div>
          </div>
        </div>

        {/* Collapsible Commercial Interest Calculator */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20">
          <button
            type="button"
            onClick={() => setShowInterestCalc(!showInterestCalc)}
            className="w-full px-5 py-2.5 flex items-center justify-between text-left text-xs font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition"
          >
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{isHi ? 'व्यावसायिक ब्याज कैलकुलेटर (सैकड़ा हिसाब)' : 'Commercial Interest Calculator (Mandi / Monthly %)'}</span>
            </div>
            {showInterestCalc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showInterestCalc && (
            <div className="p-4 sm:p-5 border-t border-amber-200/60 dark:border-amber-800/50 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    {isHi ? 'मूल रकम (Principal ₹):' : 'Principal Amount (₹):'}
                  </label>
                  <input
                    type="number"
                    value={principalOverride || (effectivePrincipal ? String(effectivePrincipal) : '')}
                    onChange={(e) => setPrincipalOverride(e.target.value)}
                    placeholder={String(effectivePrincipal)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    {isHi ? 'मासिक ब्याज दर (% प्रति माह):' : 'Monthly Rate (% / Month):'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.25"
                      value={monthlyRate}
                      onChange={(e) => setMonthlyRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                    />
                    <span className="font-semibold text-slate-500 whitespace-nowrap">₹ सैकड़ा</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    {isHi ? 'अवधि (दिन):' : 'Duration (Days):'}
                  </label>
                  <input
                    type="number"
                    value={customDays}
                    onChange={(e) => setCustomDays(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Calculated Results Pill */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-amber-300 dark:border-amber-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Accrued Interest ({customDays} days @ {monthlyRate}%/mo)</span>
                  <div className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                    + ₹ {formatIndianCurrency(interestAmount, true)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Grand Total (Principal + Interest)</span>
                  <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                    = ₹ {formatIndianCurrency(totalWithInterest, true)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyInterest}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition flex items-center gap-1"
                  >
                    {copiedInterest ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedInterest ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendInterestWhatsApp}
                    className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20b558] text-white rounded-xl font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ledger Transaction History Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs font-mono animate-pulse">
              Loading ledger transactions...
            </div>
          ) : !data || data.transactions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Calculator className="w-8 h-8 mx-auto opacity-30 stroke-[1.5]" />
              <p className="text-xs font-semibold">No recorded entries found for {partyName}.</p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Particulars / Expression</th>
                    <th className="p-3 text-right">Lena (Dr)</th>
                    <th className="p-3 text-right">Dena (Cr)</th>
                    <th className="p-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {data.transactions.map((tx, idx) => {
                    const isLena = tx.type === 'lena';
                    const bal = tx.runningBalance;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              isLena
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {isLena ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {isLena ? 'Lena' : 'Dena'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {tx.rawExpression || String(tx.amount)}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {isLena ? formatIndianCurrency(tx.amount) : '—'}
                        </td>
                        <td className="p-3 text-right font-bold text-rose-600 dark:text-rose-400">
                          {!isLena ? formatIndianCurrency(tx.amount) : '—'}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                          ₹ {formatIndianCurrency(Math.abs(bal))}
                          <span className="text-[10px] ml-1 font-sans text-slate-400">
                            {bal > 0 ? 'Dr' : bal < 0 ? 'Cr' : 'Nill'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            Close
          </button>
        </div>

        {/* UPI QR Modal if opened */}
        {showQrModal && (
          <UpiQrModal
            isOpen={true}
            onClose={() => setShowQrModal(false)}
            partyName={partyName}
            amount={netBalance}
            lang={lang}
            firmName={firmName}
          />
        )}
      </div>
    </div>
  );
};
