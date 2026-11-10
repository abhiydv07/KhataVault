export interface FirmProfile {
  id: string;
  name: string;
  createdAt: number;
}

const FIRMS_STORAGE_KEY = 'khatasetu_firms_list';
const ACTIVE_FIRM_KEY = 'khatasetu_active_firm_id';

const DEFAULT_FIRM: FirmProfile = {
  id: 'default',
  name: 'Main Firm (मुख्य फर्म)',
  createdAt: 0,
};

export const firmManager = {
  getFirms(): FirmProfile[] {
    if (typeof window === 'undefined') return [DEFAULT_FIRM];
    try {
      const raw = localStorage.getItem(FIRMS_STORAGE_KEY);
      if (!raw) return [DEFAULT_FIRM];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_FIRM];
    } catch {
      return [DEFAULT_FIRM];
    }
  },

  getActiveFirm(): FirmProfile {
    if (typeof window === 'undefined') return DEFAULT_FIRM;
    const firms = this.getFirms();
    const activeId = localStorage.getItem(ACTIVE_FIRM_KEY) || 'default';
    const found = firms.find((f) => f.id === activeId);
    return found || firms[0] || DEFAULT_FIRM;
  },

  setActiveFirm(firmId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_FIRM_KEY, firmId);
    window.dispatchEvent(new Event('khatasetu_firm_changed'));
  },

  createFirm(name: string): FirmProfile {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Firm name cannot be empty');
    const firms = this.getFirms();
    const newFirm: FirmProfile = {
      id: `firm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      createdAt: Date.now(),
    };
    firms.push(newFirm);
    localStorage.setItem(FIRMS_STORAGE_KEY, JSON.stringify(firms));
    this.setActiveFirm(newFirm.id);
    return newFirm;
  },

  renameFirm(firmId: string, newName: string): void {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const firms = this.getFirms().map((f) => (f.id === firmId ? { ...f, name: trimmed } : f));
    localStorage.setItem(FIRMS_STORAGE_KEY, JSON.stringify(firms));
    window.dispatchEvent(new Event('khatasetu_firm_changed'));
  },

  deleteFirm(firmId: string): void {
    if (firmId === 'default') {
      throw new Error('Default firm cannot be deleted');
    }
    const firms = this.getFirms().filter((f) => f.id !== firmId);
    localStorage.setItem(FIRMS_STORAGE_KEY, JSON.stringify(firms));
    this.setActiveFirm('default');
  },
};
