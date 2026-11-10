import { storageService } from '../utils/storage';
import { googleDriveService } from './googleDrive';
import { authService } from './supabase';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'pending' | 'error' | 'unconnected';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  isOnline: boolean;
  hasGoogleDrive: boolean;
  isEncrypted: boolean;
  error?: string;
}

const PASSPHRASE_KEY = 'hisaab_encryption_passphrase';

type SyncListener = (state: SyncState) => void;

class SyncManager {
  private state: SyncState = {
    status: navigator.onLine ? 'unconnected' : 'offline',
    lastSyncedAt: null,
    isOnline: navigator.onLine,
    hasGoogleDrive: false,
    isEncrypted: false,
  };

  private listeners: Set<SyncListener> = new Set();
  private pendingMonths: Set<string> = new Set();
  private token: string | null = null;

  constructor() {
    this.initNetworkListeners();
    this.initAuthListener();
    this.state.isEncrypted = Boolean(sessionStorage.getItem(PASSPHRASE_KEY));
  }

  private initNetworkListeners() {
    window.addEventListener('online', () => {
      this.state.isOnline = true;
      if (this.token) {
        this.syncPendingMonths();
      } else {
        this.updateStatus('unconnected');
      }
    });

    window.addEventListener('offline', () => {
      this.state.isOnline = false;
      this.updateStatus('offline');
    });
  }

  private initAuthListener() {
    authService.onAuthStateChange((user, providerToken) => {
      this.token = providerToken;
      this.state.hasGoogleDrive = Boolean(user && providerToken);

      if (!user) {
        this.updateStatus(this.state.isOnline ? 'unconnected' : 'offline');
      } else if (this.state.isOnline) {
        this.syncPendingMonths();
      }
    });

    // Initial check
    authService.getSession().then(({ user, providerToken }) => {
      this.token = providerToken;
      this.state.hasGoogleDrive = Boolean(user && providerToken);
      if (user && providerToken && this.state.isOnline) {
        this.syncPendingMonths();
      }
    });
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  private updateStatus(status: SyncStatus, error?: string) {
    this.state.status = status;
    this.state.error = error;
    this.notify();
  }

  /**
   * Set or remove client-side encryption passphrase
   */
  public setPassphrase(passphrase: string | null) {
    if (passphrase && passphrase.trim() !== '') {
      sessionStorage.setItem(PASSPHRASE_KEY, passphrase);
      this.state.isEncrypted = true;
    } else {
      sessionStorage.removeItem(PASSPHRASE_KEY);
      this.state.isEncrypted = false;
    }
    this.notify();
  }

  public getPassphrase(): string | null {
    return sessionStorage.getItem(PASSPHRASE_KEY);
  }

  /**
   * Queue a month for sync (called after local save)
   */
  public queueMonthSync(month: string) {
    this.pendingMonths.add(month);

    if (!this.state.isOnline) {
      this.updateStatus('offline');
      return;
    }

    if (!this.token) {
      this.updateStatus('pending');
      return;
    }

    this.syncPendingMonths();
  }

  /**
   * Flush pending months to Google Drive
   */
  public async syncPendingMonths() {
    if (!this.token || !this.state.isOnline) {
      return;
    }

    const monthsToSync = Array.from(this.pendingMonths);
    if (monthsToSync.length === 0) {
      this.updateStatus('synced');
      return;
    }

    this.updateStatus('syncing');

    try {
      const passphrase = this.getPassphrase() || undefined;

      for (const month of monthsToSync) {
        const monthFile = await storageService.getMonthFile(month);
        const result = await googleDriveService.uploadMonthFile(this.token, monthFile, passphrase);

        if (!result.success) {
          throw new Error(result.error || 'Failed to upload to Drive');
        }

        this.pendingMonths.delete(month);
      }

      this.state.lastSyncedAt = Date.now();
      this.updateStatus('synced');
    } catch (err: any) {
      console.error('Sync failed:', err);
      this.updateStatus('error', err.message || 'Sync failed');
    }
  }

  /**
   * Force full sync from Google Drive for a month
   */
  public async pullFromDrive(month: string): Promise<boolean> {
    if (!this.token || !this.state.isOnline) return false;

    this.updateStatus('syncing');
    try {
      const fileInfo = await googleDriveService.findMonthFile(this.token, month);
      if (!fileInfo) {
        this.updateStatus('synced');
        return false;
      }

      const passphrase = this.getPassphrase() || undefined;
      const cloudFile = await googleDriveService.downloadMonthFile(this.token, fileInfo.id, passphrase);

      if (cloudFile) {
        await storageService.saveMonthFile(cloudFile);
        this.state.lastSyncedAt = Date.now();
        this.updateStatus('synced');
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Pull failed:', err);
      this.updateStatus('error', err.message || 'Failed to pull from Drive');
      return false;
    }
  }

  public getState(): SyncState {
    return { ...this.state };
  }
}

export const syncManager = new SyncManager();
