/**
 * Client-Side AES-GCM Encryption using Web Crypto API
 * Ledger data is encrypted in the user's browser BEFORE uploading to Google Drive.
 * Our servers and Google Drive never see the unencrypted plaintext when enabled.
 */

export interface EncryptedPayload {
  encrypted: true;
  version: 1;
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
}

// Helper: Convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Safe access to Web Crypto API in both browser and Node/Vitest environments
function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  throw new Error('Web Crypto API is not supported in this environment');
}

// Derive AES-GCM key from passphrase using PBKDF2
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const cryptoObj = getCrypto();
  const enc = new TextEncoder();
  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt arbitrary object / JSON string with passphrase
 */
export async function encryptData(data: any, passphrase: string): Promise<EncryptedPayload> {
  if (!passphrase || passphrase.trim() === '') {
    throw new Error('Passphrase cannot be empty');
  }

  const cryptoObj = getCrypto();
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  const enc = new TextEncoder();
  const encodedData = enc.encode(jsonString);

  // Generate 16 bytes random salt and 12 bytes IV
  const salt = cryptoObj.getRandomValues(new Uint8Array(16));
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);

  const encryptedBuffer = await cryptoObj.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  return {
    encrypted: true,
    version: 1,
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(encryptedBuffer),
  };
}

/**
 * Decrypt payload with passphrase
 */
export async function decryptData<T = any>(payload: EncryptedPayload, passphrase: string): Promise<T> {
  if (!payload || !payload.encrypted) {
    throw new Error('Invalid encrypted payload');
  }

  const cryptoObj = getCrypto();
  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(passphrase, salt);

  try {
    const decryptedBuffer = await cryptoObj.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
  } catch (err) {
    throw new Error('Decryption failed: Incorrect passphrase or corrupted data');
  }
}
