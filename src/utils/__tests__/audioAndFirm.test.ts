import { describe, it, expect, beforeEach } from 'vitest';
import { firmManager } from '../firmManager';
import { audioService } from '../audioService';

// Polyfill in-memory localStorage for Node test runner
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

(globalThis as any).localStorage = storageMock;
(globalThis as any).window = {
  dispatchEvent: () => true,
  localStorage: storageMock,
};

describe('firmManager', () => {
  beforeEach(() => {
    storageMock.clear();
  });

  it('provides default firm initially', () => {
    const firms = firmManager.getFirms();
    expect(firms.length).toBe(1);
    expect(firms[0].id).toBe('default');
  });

  it('creates and switches to new firm', () => {
    const created = firmManager.createFirm('Shyam Textiles');
    expect(created.name).toBe('Shyam Textiles');
    expect(firmManager.getActiveFirm().id).toBe(created.id);

    const all = firmManager.getFirms();
    expect(all.length).toBe(2);
  });

  it('renames a firm', () => {
    const created = firmManager.createFirm('Branch A');
    firmManager.renameFirm(created.id, 'Branch Surat');
    const active = firmManager.getActiveFirm();
    expect(active.name).toBe('Branch Surat');
  });

  it('deletes a custom firm and reverts to default', () => {
    const created = firmManager.createFirm('Temporary Book');
    expect(firmManager.getActiveFirm().id).toBe(created.id);
    firmManager.deleteFirm(created.id);
    expect(firmManager.getActiveFirm().id).toBe('default');
    expect(firmManager.getFirms().length).toBe(1);
  });
});

describe('audioService', () => {
  beforeEach(() => {
    storageMock.clear();
  });

  it('is enabled by default and can be toggled', () => {
    expect(audioService.isEnabled()).toBe(true);
    audioService.setEnabled(false);
    expect(audioService.isEnabled()).toBe(false);
    audioService.setEnabled(true);
    expect(audioService.isEnabled()).toBe(true);
  });
});
