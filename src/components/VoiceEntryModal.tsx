import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Language } from '../utils/i18n';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import { audioService } from '../utils/audioService';

interface VoiceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (name: string, rawAmount: string, type: 'lena' | 'dena') => void;
  lang: Language;
}

export const VoiceEntryModal: React.FC<VoiceEntryModalProps> = ({
  isOpen,
  onClose,
  onAddEntry,
  lang,
}) => {
  const isHi = lang === 'hi';
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedName, setParsedName] = useState('');
  const [parsedAmount, setParsedAmount] = useState('');
  const [parsedType, setParsedType] = useState<'lena' | 'dena'>('lena');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const parseVoiceInput = (text: string) => {
    if (!text.trim()) return;

    // Detect Lena vs Dena
    const lower = text.toLowerCase();
    let type: 'lena' | 'dena' = 'lena';
    if (
      lower.includes('देना') ||
      lower.includes('dena') ||
      lower.includes('debit') ||
      lower.includes('पे') ||
      lower.includes('pay') ||
      lower.includes('दिया')
    ) {
      type = 'dena';
    } else if (
      lower.includes('लेना') ||
      lower.includes('lena') ||
      lower.includes('credit') ||
      lower.includes('जमा') ||
      lower.includes('लिया')
    ) {
      type = 'lena';
    }

    // Extract numbers (including expressions like 500+200)
    // Convert Devanagari numerals to standard digits if any
    const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    let normalized = text;
    devanagariDigits.forEach((d, idx) => {
      normalized = normalized.split(d).join(String(idx));
    });

    const numberMatch = normalized.match(/(\d+[\d+*\-/.]*)/);
    const extractedAmount = numberMatch ? numberMatch[0] : '';

    // Remove keywords & numbers to get the party name
    let cleanName = normalized
      .replace(extractedAmount, '')
      .replace(/\b(लेना|देना|lena|dena|rupaye|rupees|rs|ka|ki|ke|se|ko|credit|debit|hisaab|jama|jod|add)\b/gi, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .trim();

    if (cleanName) {
      // Capitalize first letter
      cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      setParsedName(cleanName);
    }
    if (extractedAmount) {
      setParsedAmount(extractedAmount);
    }
    setParsedType(type);
  };

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isHi ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
        parseVoiceInput(currentText);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedAmount.trim()) {
      alert(isHi ? 'कृपया धनराशि दर्ज करें' : 'Please specify an amount');
      return;
    }
    const name = parsedName.trim() || (isHi ? 'नकद ग्राहक' : 'Cash Counter');
    onAddEntry(name, parsedAmount.trim(), parsedType);
    audioService.playEntryAdded();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {isHi ? 'वॉयस बोलकर एंट्री जोड़ें' : 'Voice Ledger Entry'}
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHi ? 'उदाहरण: "रमेश 5000 लेना"' : 'e.g. "Ramesh 5000 Lena"'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!isSupported ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                Voice recognition is not supported in this browser. Please use Chrome, Edge, or mobile Safari.
              </div>
            </div>
          ) : (
            <>
              {/* Mic Action Hero */}
              <div className="flex flex-col items-center justify-center py-4">
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition shadow-xl ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/40 ring-8 ring-rose-500/20'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95'
                  }`}
                  aria-label="Toggle Microphone"
                >
                  {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-3">
                  {isListening
                    ? (isHi ? '🎙️ सुन रहे हैं... बोलिए' : '🎙️ Listening... speak now')
                    : (isHi ? 'माइक पर टैप करके बोलें' : 'Tap microphone to speak')}
                </p>
              </div>

              {/* Transcript Display */}
              {transcript && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 font-sans">
                    Heard:
                  </span>
                  "{transcript}"
                </div>
              )}

              {/* Parsed Result Card */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isHi ? 'पहचानी गई प्रविष्टि (Parsed Entry)' : 'Parsed Entry Preview'}
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      {isHi ? 'पक्षकार / पार्टी' : 'Party Name'}
                    </label>
                    <input
                      type="text"
                      value={parsedName}
                      onChange={(e) => setParsedName(e.target.value)}
                      placeholder={isHi ? 'नाम बोलें...' : 'Party Name...'}
                      className="w-full px-2.5 py-1.5 font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      {isHi ? 'धनराशि' : 'Amount'}
                    </label>
                    <input
                      type="text"
                      value={parsedAmount}
                      onChange={(e) => setParsedAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-2.5 py-1.5 font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Ledger Side Switcher */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setParsedType('lena')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      parsedType === 'lena'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    🟢 {isHi ? 'प्राप्य (Lena / जमा)' : 'Receivable (Lena)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setParsedType('dena')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      parsedType === 'dena'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    🔴 {isHi ? 'देय (Dena / नामे)' : 'Payable (Dena)'}
                  </button>
                </div>
              </div>

              {/* Confirm / Insert Button */}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!parsedAmount.trim()}
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isHi ? 'बहीखाते में जोड़ें (Add to Ledger)' : 'Add to Ledger'}
                  {parsedAmount ? ` — ₹${formatIndianCurrency(Number(parsedAmount) || 0)}` : ''}
                </span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

