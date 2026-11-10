import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Language } from '../utils/i18n';

interface PwaInstallBannerProps {
  lang: Language;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ lang }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isHi = lang === 'hi';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already dismissed this session
    if (sessionStorage.getItem('khatasetu_pwa_dismissed')) {
      return;
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('khatasetu_pwa_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in slide-in-from-bottom">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-md">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold truncate">
            {isHi ? 'KhataSetu ऐप इंस्टॉल करें' : 'Install KhataSetu App'}
          </h4>
          <p className="text-[11px] text-slate-300 truncate">
            {isHi ? 'बिना इंटरनेट तेज़ काम करेगा' : 'Works 100% offline on your home screen'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleInstall}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isHi ? 'इंस्टॉल' : 'Install'}</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
