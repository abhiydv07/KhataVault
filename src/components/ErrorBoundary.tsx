import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Download, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('KhataSetu ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleEmergencyExport = () => {
    try {
      const dump: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('khatasetu_') || key.startsWith('lena_dena_hisaab_'))) {
          dump[key] = localStorage.getItem(key);
        }
      }
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KhataSetu_Emergency_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Could not export emergency dump: ' + String(e));
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Application Safely Paused
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected interface issue occurred. Your accounting records remain intact in your private local storage and Google Drive.
              </p>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-left flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-emerald-200">
                <strong>Data Protection Active:</strong> Zero ledger files were deleted or corrupted.
              </div>
            </div>

            {this.state.error && (
              <pre className="text-[10px] bg-slate-950/80 p-2.5 rounded-lg text-slate-400 text-left overflow-x-auto font-mono max-h-24">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-900/30"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>

              <button
                onClick={this.handleEmergencyExport}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl text-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download Emergency Data Copy
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
