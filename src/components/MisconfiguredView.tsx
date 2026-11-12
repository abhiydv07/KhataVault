import React from 'react';
import { AlertTriangle, KeyRound, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';
import { appConfig } from '../services/config';

interface MisconfiguredViewProps {
  onContinueInDemo: () => void;
}

export const MisconfiguredView: React.FC<MisconfiguredViewProps> = ({ onContinueInDemo }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Production Configuration Required
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              KhataVault is in strict <code className="text-amber-400">production</code> mode, but required credentials are missing.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-amber-400" />
            Missing Environment Variables:
          </h2>
          <ul className="space-y-1.5 text-xs font-mono">
            {appConfig.missingConfig.map((v) => (
              <li key={v} className="flex items-center gap-2 text-rose-400 bg-rose-950/30 px-3 py-1.5 rounded-xl border border-rose-900/40">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
          <p>
            To activate real Supabase authentication, Google Drive sandbox sync, and Razorpay billing:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open your Vercel Project Dashboard (<a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline inline-flex items-center gap-0.5">vercel.com <ExternalLink className="w-3 h-3" /></a>).</li>
            <li>Go to <strong>Settings → Environment Variables</strong>.</li>
            <li>Add the variables above for <strong>Production</strong> and <strong>Preview</strong>.</li>
            <li>Trigger a Redeploy of your deployment.</li>
          </ol>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onContinueInDemo}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Switch to Safe Demo Mode (Local Storage)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

