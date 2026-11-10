import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Camera, 
  FileText, 
  Sparkles, 
  Upload, 
  RefreshCw, 
  AlertCircle, 
  ArrowLeftRight, 
  Trash2, 
  Plus, 
  Key, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';
import { 
  ExtractedLedgerData, 
  ScannedEntry, 
  parseExcelOrCsv, 
  parseDocumentWithAi 
} from '../utils/documentScanner';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import { Language } from '../utils/i18n';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (data: ExtractedLedgerData, mode: 'merge' | 'replace') => void;
  lang: Language;
}

export const SmartImportModal: React.FC<SmartImportModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
  lang,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedLedgerData | null>(null);

  // Gemini API key for photo & PDF AI scanning
  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      (import.meta.env.VITE_GEMINI_API_KEY as string) ||
      localStorage.getItem('khatavault_gemini_key') ||
      ''
    );
  });
  const [showKeyInput, setShowKeyInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isHi = lang === 'hi';

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setExtractedData(null);
      setErrorMessage(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    localStorage.setItem('khatavault_gemini_key', trimmed);
    setShowKeyInput(false);
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setExtractedData(null);

    // If image, create thumbnail preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const name = selectedFile.name.toLowerCase();
      const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv');

      if (isExcel) {
        const result = await parseExcelOrCsv(selectedFile);
        if (result.lena.length === 0 && result.dena.length === 0) {
          throw new Error('No valid financial transactions could be found in this Excel sheet.');
        }
        setExtractedData(result);
      } else {
        // Photo or PDF - requires Gemini Vision
        const currentKey = apiKey.trim();
        if (!currentKey) {
          setShowKeyInput(true);
          throw new Error('Please enter your free Google Gemini API Key to scan photos and PDFs with AI.');
        }

        const result = await parseDocumentWithAi(selectedFile, currentKey);
        if (result.lena.length === 0 && result.dena.length === 0) {
          throw new Error('AI could not identify any counterparties or amounts. Please try a clearer photo or an Excel file.');
        }
        setExtractedData(result);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process document');
    } finally {
      setIsProcessing(false);
    }
  };

  // Editable actions for Extracted Data
  const handleUpdateEntry = (
    side: 'lena' | 'dena',
    index: number,
    field: keyof ScannedEntry,
    value: any
  ) => {
    if (!extractedData) return;
    const list = [...extractedData[side]];
    list[index] = { ...list[index], [field]: value };
    setExtractedData({ ...extractedData, [side]: list });
  };

  const handleSwitchSide = (fromSide: 'lena' | 'dena', index: number) => {
    if (!extractedData) return;
    const target = extractedData[fromSide][index];
    const newFromList = extractedData[fromSide].filter((_, i) => i !== index);
    const toSide = fromSide === 'lena' ? 'dena' : 'lena';
    const newToList = [...extractedData[toSide], target];

    setExtractedData({
      ...extractedData,
      [fromSide]: newFromList,
      [toSide]: newToList,
    });
  };

  const handleDeleteEntry = (side: 'lena' | 'dena', index: number) => {
    if (!extractedData) return;
    const updated = extractedData[side].filter((_, i) => i !== index);
    setExtractedData({ ...extractedData, [side]: updated });
  };

  const handleAddNewEntry = (side: 'lena' | 'dena') => {
    if (!extractedData) return;
    const newEntry: ScannedEntry = {
      friendName: '',
      rawExpression: '',
      amount: 0,
    };
    setExtractedData({
      ...extractedData,
      [side]: [...extractedData[side], newEntry],
    });
  };

  // Calculations on extracted preview
  const totalLenaScanned = extractedData?.lena.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  const totalDenaScanned = extractedData?.dena.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  const netScanned = totalLenaScanned - totalDenaScanned;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white relative border-b border-purple-900/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              {isHi ? 'AI दस्तावेज़ एवं फ़ोटो स्कैनर' : 'AI Smart Document & Ledger Scanner'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" /> Auto Attribute Fetch
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white">
            {isHi ? 'फ़ोटो, PDF या Excel से स्वतः बहीखाता भरें' : 'Auto-Extract & Fill Attributes from Photo, PDF or Excel'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            {isHi
              ? 'कागज़ी बहीखाते की फ़ोटो लें या बिल/Excel अपलोड करें — KhataVault स्वतः नाम, रकम और लेना/देना पहचान कर भर देगा।'
              : 'Upload a photo of your paper bahi-khata notebook, PDF statement, or Excel spreadsheet to auto-populate the ledger.'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* VIEW A: UPLOAD & PROCESS FILE */}
          {!extractedData && (
            <div className="space-y-4">
              
              {/* Dropzone Container */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelected(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
                  selectedFile
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-purple-500 hover:bg-purple-50/20 dark:hover:bg-purple-950/20'
                }`}
              >
                {/* Hidden Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files && e.target.files[0] && handleFileSelected(e.target.files[0])}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files && e.target.files[0] && handleFileSelected(e.target.files[0])}
                />

                {selectedFile ? (
                  <div className="space-y-3">
                    {previewUrl ? (
                      <div className="relative inline-block">
                        <img
                          src={previewUrl}
                          alt="Uploaded Document"
                          className="max-h-48 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 object-contain mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                          className="absolute -top-2 -right-2 p-1.5 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-sm">
                        {selectedFile.name.endsWith('.pdf') ? (
                          <FileText className="w-8 h-8" />
                        ) : (
                          <FileSpreadsheet className="w-8 h-8" />
                        )}
                      </div>
                    )}

                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-emerald-500" />
                        <span>{selectedFile.name}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <div className="flex justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                      >
                        Change File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-black text-base text-slate-800 dark:text-slate-100">
                        {isHi ? 'फ़ोटो खींचें या फ़ाइल चुनें' : 'Snap a Photo or Select Document'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        Drag and drop your file here, or choose one of the options below. Supports Images (JPG/PNG), PDFs, and Excel (.xlsx / .csv).
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition transform active:scale-95"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isHi ? 'कैमरा से फ़ोटो लें' : 'Take Photo (Camera)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition transform active:scale-95"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{isHi ? 'फ़ाइल चुनें (Photo / PDF / Excel)' : 'Browse Device Files'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Gemini API Key Configuration Box (For Photos & PDFs) */}
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Google Gemini AI Vision API Key (For Photos & PDFs)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {apiKey ? '✓ API Key configured and ready' : 'Excel/CSV files work 100% offline. Photos require a free Gemini API key.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-purple-500 text-slate-700 dark:text-slate-300 transition"
                  >
                    {apiKey ? 'Change Key' : 'Enter Free Key'}
                  </button>

                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline px-2 py-1"
                  >
                    <span>Get Key Free</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Expandable Key Input */}
              {showKeyInput && (
                <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2">
                  <label className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                    Paste Google Gemini API Key:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      defaultValue={apiKey}
                      id="gemini_key_input"
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('gemini_key_input') as HTMLInputElement;
                        if (input) handleSaveApiKey(input.value);
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              )}

              {/* Action Button: Analyze Document */}
              <button
                type="button"
                onClick={handleProcessFile}
                disabled={!selectedFile || isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-purple-600/20 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Document with AI & Fetching Attributes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Auto-Extract Attributes ({selectedFile ? selectedFile.name : 'Choose File First'})</span>
                  </>
                )}
              </button>

            </div>
          )}

          {/* VIEW B: INTERACTIVE REVIEW & VERIFICATION SCREEN */}
          {extractedData && (
            <div className="space-y-5 animate-in fade-in">
              
              {/* Summary Stats Pill */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-purple-900/40">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                    Attributes Extracted from: {extractedData.fileName}
                  </span>
                  <div className="text-sm sm:text-base font-bold mt-0.5">
                    Found <span className="text-emerald-400 font-black">{extractedData.lena.length} Receivables</span> and{' '}
                    <span className="text-rose-400 font-black">{extractedData.dena.length} Payables</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono font-bold">
                  <div className="bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-emerald-300">
                    Lena: {formatIndianCurrency(totalLenaScanned, true)}
                  </div>
                  <div className="bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-xl text-rose-300">
                    Dena: {formatIndianCurrency(totalDenaScanned, true)}
                  </div>
                  <div className="bg-white/10 px-2.5 py-1 rounded-xl text-white">
                    Net: {formatIndianCurrency(Math.abs(netScanned), true)} {netScanned >= 0 ? 'LENA' : 'DENA'}
                  </div>
                </div>
              </div>

              {/* Two Column Grid for Review */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* 1. LENA SIDE */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>{isHi ? 'लेना पक्ष (Receivables)' : 'Receivables / Inflows (Lena)'}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-emerald-300">
                        {extractedData.lena.length}
                      </span>
                    </h4>

                    <button
                      type="button"
                      onClick={() => handleAddNewEntry('lena')}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Row
                    </button>
                  </div>

                  {extractedData.lena.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No Lena entries found.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {extractedData.lena.map((entry, idx) => (
                        <div
                          key={`lena_${idx}`}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
                        >
                          <input
                            type="text"
                            placeholder="Party Name"
                            value={entry.friendName}
                            onChange={(e) => handleUpdateEntry('lena', idx, 'friendName', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Amount"
                            value={entry.rawExpression}
                            onChange={(e) => {
                              handleUpdateEntry('lena', idx, 'rawExpression', e.target.value);
                              handleUpdateEntry('lena', idx, 'amount', Number(e.target.value) || 0);
                            }}
                            className="w-24 px-2 py-1 text-xs font-bold font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none text-right"
                          />
                          <button
                            type="button"
                            onClick={() => handleSwitchSide('lena', idx)}
                            title="Move to Dena"
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry('lena', idx)}
                            title="Delete"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. DENA SIDE */}
                <div className="rounded-2xl border border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>{isHi ? 'देना पक्ष (Payables)' : 'Payables / Outflows (Dena)'}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-rose-300">
                        {extractedData.dena.length}
                      </span>
                    </h4>

                    <button
                      type="button"
                      onClick={() => handleAddNewEntry('dena')}
                      className="text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Row
                    </button>
                  </div>

                  {extractedData.dena.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No Dena entries found.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {extractedData.dena.map((entry, idx) => (
                        <div
                          key={`dena_${idx}`}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
                        >
                          <input
                            type="text"
                            placeholder="Party Name"
                            value={entry.friendName}
                            onChange={(e) => handleUpdateEntry('dena', idx, 'friendName', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Amount"
                            value={entry.rawExpression}
                            onChange={(e) => {
                              handleUpdateEntry('dena', idx, 'rawExpression', e.target.value);
                              handleUpdateEntry('dena', idx, 'amount', Number(e.target.value) || 0);
                            }}
                            className="w-24 px-2 py-1 text-xs font-bold font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none text-right"
                          />
                          <input
                            type="text"
                            placeholder="U/L"
                            value={entry.rawUplineExpression ?? ''}
                            onChange={(e) => handleUpdateEntry('dena', idx, 'rawUplineExpression', e.target.value)}
                            className="w-14 px-1.5 py-1 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                            title="Upline"
                          />
                          <button
                            type="button"
                            onClick={() => handleSwitchSide('dena', idx)}
                            title="Move to Lena"
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry('dena', idx)}
                            title="Delete"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Extracted Notes / Remarks */}
              {extractedData.note && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Document Remark:
                  </span>
                  <input
                    type="text"
                    value={extractedData.note}
                    onChange={(e) => setExtractedData({ ...extractedData, note: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Action Buttons: Merge or Replace */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onApplyData(extractedData, 'merge');
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isHi ? 'आज के खाते में जोड़ें (Merge Entries)' : 'Merge into Today\'s Sheet'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(isHi ? 'क्या आप आज के खाते को इस दस्तावेज़ से बदलना चाहते हैं?' : 'Replace existing sheet entries with this document?')) {
                      onApplyData(extractedData, 'replace');
                      onClose();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs sm:text-sm shadow-md transition transform active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{isHi ? 'आज का नया खाता बनाएं (Replace Sheet)' : 'Replace Today\'s Sheet'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExtractedData(null);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
                >
                  Scan Another
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
