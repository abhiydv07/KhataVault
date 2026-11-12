import React from 'react';
import { AlertCircle, Download } from 'lucide-react';
import { storageService } from '../utils/storage';

interface DemoBannerProps {
  onExportBackup?: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onExportBackup }) => {
  const handleQuickExport = async () => {
    try {
      if (onExportBackup) {
        onExportBackup();
        return;
      }
      const json = await storageService.exportFullBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KhataVault_Demo_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export backup:', err);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-amber-500/15 dark:bg-amber-950/40 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-3 sm:px-6 py-1.5 sm:py-2 text-xs flex flex-wrap items-center justify-between gap-2 transition"
    >
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>Demo mode:</strong> Data stays in this browser and is not backed up to cloud services.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleQuickExport}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs transition"
          title="Download complete JSON ledger backup to your computer"
        >
          <Download className="w-3 h-3" />
          <span>Export Local Backup</span>
        </button>
      </div>
    </div>
  );
};
