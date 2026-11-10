import { MonthHisaabFile } from '../types/hisaab';
import { encryptData, decryptData, EncryptedPayload } from './crypto';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
}

export interface SyncResult {
  success: boolean;
  fileId?: string;
  isConflictResolved?: boolean;
  backupFileId?: string;
  error?: string;
}

export const googleDriveService = {
  /**
   * Search for month file (e.g. "2026-11.json") in appDataFolder
   */
  async findMonthFile(token: string, month: string): Promise<DriveFileInfo | null> {
    if (token === 'mock_google_token_valid') {
      const mockKey = `gdrive_mock_file_${month}`;
      const hasMock = localStorage.getItem(mockKey);
      if (hasMock) {
        return {
          id: `mock_drive_id_${month}`,
          name: `${month}.json`,
          modifiedTime: new Date().toISOString(),
        };
      }
      return null;
    }

    try {
      const q = encodeURIComponent(`name = '${month}.json' and 'appDataFolder' in parents and trashed = false`);
      const res = await fetch(`${DRIVE_API_URL}?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Drive search failed: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return data.files[0];
      }
      return null;
    } catch (err: any) {
      console.error('Error finding month file in Drive:', err);
      throw err;
    }
  },

  /**
   * Download and parse month file from Drive
   */
  async downloadMonthFile(
    token: string,
    fileId: string,
    passphrase?: string
  ): Promise<MonthHisaabFile> {
    if (token === 'mock_google_token_valid') {
      const month = fileId.replace('mock_drive_id_', '');
      const raw = localStorage.getItem(`gdrive_mock_file_${month}`);
      if (!raw) {
        throw new Error('File not found in mock drive');
      }
      const parsed = JSON.parse(raw);
      if (parsed.encrypted) {
        if (!passphrase) {
          throw new Error('ENCRYPTION_PASSPHRASE_REQUIRED');
        }
        return await decryptData<MonthHisaabFile>(parsed, passphrase);
      }
      return parsed as MonthHisaabFile;
    }

    try {
      const res = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Drive download failed: ${res.statusText}`);
      }

      const payload = await res.json();
      if (payload.encrypted) {
        if (!passphrase) {
          throw new Error('ENCRYPTION_PASSPHRASE_REQUIRED');
        }
        return await decryptData<MonthHisaabFile>(payload as EncryptedPayload, passphrase);
      }

      return payload as MonthHisaabFile;
    } catch (err: any) {
      console.error('Error downloading from Drive:', err);
      throw err;
    }
  },

  /**
   * Upload or update month file in appDataFolder with conflict resolution & backup snapshot
   */
  async uploadMonthFile(
    token: string,
    monthFile: MonthHisaabFile,
    passphrase?: string
  ): Promise<SyncResult> {
    const fileName = `${monthFile.month}.json`;

    // 1. Prepare data payload (optionally encrypted)
    let bodyContent: string;
    if (passphrase && passphrase.trim() !== '') {
      const encrypted = await encryptData(monthFile, passphrase);
      bodyContent = JSON.stringify(encrypted);
    } else {
      bodyContent = JSON.stringify(monthFile, null, 2);
    }

    // Mock handling
    if (token === 'mock_google_token_valid') {
      const mockKey = `gdrive_mock_file_${monthFile.month}`;
      const existing = localStorage.getItem(mockKey);
      let isConflictResolved = false;

      if (existing) {
        // Create backup copy if conflict
        const backupKey = `gdrive_mock_backup_${monthFile.month}_${Date.now()}`;
        localStorage.setItem(backupKey, existing);
        isConflictResolved = true;
      }

      localStorage.setItem(mockKey, bodyContent);
      return {
        success: true,
        fileId: `mock_drive_id_${monthFile.month}`,
        isConflictResolved,
      };
    }

    try {
      // 2. Check if file already exists in appDataFolder
      const existing = await this.findMonthFile(token, monthFile.month);

      if (existing) {
        // Conflict handling: create backup copy first
        const backupName = `${monthFile.month}_backup_${Date.now()}.json`;
        await this.createFile(token, backupName, bodyContent, ['appDataFolder']);

        // Update existing file content
        const updateRes = await fetch(`${DRIVE_UPLOAD_URL}/${existing.id}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: bodyContent,
        });

        if (!updateRes.ok) {
          throw new Error(`Drive update failed: ${updateRes.statusText}`);
        }

        const data = await updateRes.json();
        return {
          success: true,
          fileId: data.id,
          isConflictResolved: true,
        };
      } else {
        // Create new file in appDataFolder
        const created = await this.createFile(token, fileName, bodyContent, ['appDataFolder']);
        return {
          success: true,
          fileId: created.id,
          isConflictResolved: false,
        };
      }
    } catch (err: any) {
      console.error('Error uploading to Drive:', err);
      return {
        success: false,
        error: err.message || 'Drive sync error',
      };
    }
  },

  /**
   * Helper: Multipart create file in Google Drive
   */
  async createFile(token: string, name: string, content: string, parents: string[]): Promise<{ id: string }> {
    const metadata = {
      name,
      parents,
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      content +
      closeDelimiter;

    const res = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      throw new Error(`Failed to create file: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Delete all AppData files (for GDPR / User Data Deletion compliance)
   */
  async deleteAllAppData(token: string): Promise<void> {
    if (token === 'mock_google_token_valid') {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('gdrive_mock_'))
        .forEach((k) => localStorage.removeItem(k));
      return;
    }

    try {
      const res = await fetch(`${DRIVE_API_URL}?spaces=appDataFolder&fields=files(id)`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.files)) {
        for (const file of data.files) {
          await fetch(`${DRIVE_API_URL}/${file.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }
    } catch (err) {
      console.error('Error deleting AppData files:', err);
      throw err;
    }
  },
};
