import { storageService } from '../utils/storage';
import { googleDriveService } from './googleDrive';
import { authService } from './supabase';

export type SyncStatus = 'local-only' | 'pending' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  isOnline: boolean;
  hasGoogleDrive: boolean;
  isEncrypted: boolean;
  pendingCount: number;
  error?: string;
}

const PASSPHRASE_KEY = 'hisaab_encryption_passphrase';

type SyncListener = (state: SyncState) => void;

class SyncManager {
  private state: SyncState = {
    status: !navigator.onLine ? 'offline' : 'local-only',
    lastSyncedAt: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    hasGoogleDrive: false,
    isEncrypted: false,
    pendingCount: 0,
  };

  private listeners: Set<SyncListener> = new Set();
  private pendingMonths: Set<string> = new Set();
  private token: string | null = null;

  constructor() {
    this.initNetworkListeners();
    this.initAuthListener();
    if (typeof sessionStorage !== 'undefined') {
      this.state.isEncrypted = Boolean(sessionStorage.getItem(PASSPHRASE_KEY));
    }
  }

  private initNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.state.isOnline = true;
      if (this.token && this.pendingMonths.size > 0) {
        this.syncPendingMonths();
      } else if (!this.token) {
        this.updateStatus('local-only');
      } else if (this.state.lastSyncedAt) {
        this.updateStatus('synced');
      } else {
        this.updateStatus('local-only');
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

      if (!user || !providerToken) {
        this.updateStatus(this.state.isOnline ? 'local-only' : 'offline');
      } else if (this.state.isOnline) {
        if (this.pendingMonths.size > 0) {
          this.syncPendingMonths();
        } else if (this.state.lastSyncedAt) {
          this.updateStatus('synced');
        } else {
          this.updateStatus('local-only');
        }
      }
    });

    authService.getSession().then(({ user, providerToken }) => {
      this.token = providerToken;
      this.state.hasGoogleDrive = Boolean(user && providerToken);
      if (user && providerToken && this.state.isOnline) {
        if (this.pendingMonths.size > 0) {
          this.syncPendingMonths();
        }
      } else {
        this.updateStatus(this.state.isOnline ? 'local-only' : 'offline');
      }
    });
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn({ ...this.state }));
  }

  private updateStatus(status: SyncStatus, error?: string) {
    this.state.status = status;
    this.state.error = error;
    this.state.pendingCount = this.pendingMonths.size;
    this.notify();
  }

  /**
   * Set or remove client-side encryption passphrase
   */
  public setPassphrase(passphrase: string | null) {
    if (typeof sessionStorage === 'undefined') return;
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
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(PASSPHRASE_KEY);
  }

  /**
   * Queue a month for sync (called after local save)
   */
  public queueMonthSync(month: string) {
    this.pendingMonths.add(month);
    this.state.pendingCount = this.pendingMonths.size;

    if (!this.state.isOnline) {
      this.updateStatus('offline');
      return;
    }

    if (!this.token) {
      // Local-only: data stays in browser localStorage
      this.updateStatus('local-only');
      return;
    }

    this.updateStatus('pending');
    this.syncPendingMonths();
  }

  /**
   * Retry pending sync
   */
  public retryPendingSync() {
    if (this.token && this.state.isOnline) {
      this.syncPendingMonths();
    }
  }

  /**
   * Flush pending months to Google Drive
   */
  public async syncPendingMonths() {
    if (!this.token || !this.state.isOnline) {
      this.updateStatus(this.state.isOnline ? 'local-only' : 'offline');
      return;
    }

    const monthsToSync = Array.from(this.pendingMonths);
    if (monthsToSync.length === 0) {
      if (this.state.lastSyncedAt) {
        this.updateStatus('synced');
      } else {
        this.updateStatus('local-only');
      }
      return;
    }

    this.updateStatus('syncing');

    try {
      const passphrase = this.getPassphrase() || undefined;

      for (const month of monthsToSync) {
        const monthFile = await storageService.getMonthFile(month);
        const result = await googleDriveService.uploadMonthFile(this.token, monthFile, passphrase);

        if (!result.success) {
          throw new Error(result.error || 'Failed to upload to Google Drive');
        }

        this.pendingMonths.delete(month);
      }

      this.state.lastSyncedAt = Date.now();
      this.updateStatus('synced');
    } catch (err: any) {
      console.error('Google Drive sync failed:', err);
      this.updateStatus('error', err.message || 'Drive sync error');
    }
  }

  /**
   * Pull latest month data from Google Drive
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
      console.error('Pull from Google Drive failed:', err);
      this.updateStatus('error', err.message || 'Failed to pull from Google Drive');
      return false;
    }
  }

  public getState(): SyncState {
    return { ...this.state };
  }
}

export const syncManager = new SyncManager();
