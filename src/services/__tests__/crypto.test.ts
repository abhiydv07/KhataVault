import { describe, it, expect } from 'vitest';
import { encryptData, decryptData } from '../crypto';

describe('Web Crypto AES-GCM Service', () => {
  it('encrypts and decrypts ledger JSON data accurately with correct passphrase', async () => {
    const originalData = {
      month: '2026-11',
      days: {
        '2026-11-10': {
          lenaTotal: 159705,
          denaTotal: 127800,
          farak: 13971,
          friends: ['Ramesh', 'Shyam'],
        },
      },
    };

    const passphrase = 'my-super-secure-hisaab-key-123';
    const encrypted = await encryptData(originalData, passphrase);

    expect(encrypted.encrypted).toBe(true);
    expect(encrypted.salt).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.ciphertext).toBeDefined();

    // Verify ciphertext does NOT contain plaintext strings
    expect(encrypted.ciphertext).not.toContain('159705');
    expect(encrypted.ciphertext).not.toContain('Ramesh');

    // Decrypt
    const decrypted = await decryptData(encrypted, passphrase);
    expect(decrypted).toEqual(originalData);
  });

  it('fails decryption with wrong passphrase', async () => {
    const data = { secret: 'Confidential ledger number' };
    const encrypted = await encryptData(data, 'correct-passphrase');

    await expect(decryptData(encrypted, 'wrong-passphrase')).rejects.toThrow(
      'Decryption failed: Incorrect passphrase or corrupted data'
    );
  });

  it('rejects empty passphrases', async () => {
    await expect(encryptData({ a: 1 }, '')).rejects.toThrow('Passphrase cannot be empty');
    await expect(encryptData({ a: 1 }, '   ')).rejects.toThrow('Passphrase cannot be empty');
  });
});
