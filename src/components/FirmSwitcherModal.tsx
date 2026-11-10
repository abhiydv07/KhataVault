import React, { useState } from 'react';
import { X, Building2, Plus, Check, Edit2, Trash2 } from 'lucide-react';
import { firmManager, FirmProfile } from '../utils/firmManager';
import { Language } from '../utils/i18n';

interface FirmSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFirm: FirmProfile;
  onFirmSelected: (firm: FirmProfile) => void;
  lang: Language;
}

export const FirmSwitcherModal: React.FC<FirmSwitcherModalProps> = ({
  isOpen,
  onClose,
  activeFirm,
  onFirmSelected,
  lang,
}) => {
  const isHi = lang === 'hi';
  const [firms, setFirms] = useState<FirmProfile[]>(() => firmManager.getFirms());
  const [newFirmName, setNewFirmName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleSelect = (firm: FirmProfile) => {
    firmManager.setActiveFirm(firm.id);
    onFirmSelected(firm);
    onClose();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirmName.trim()) return;
    try {
      const created = firmManager.createFirm(newFirmName.trim());
      setFirms(firmManager.getFirms());
      setNewFirmName('');
      setIsAdding(false);
      onFirmSelected(created);
      onClose();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveRename = (firmId: string) => {
    if (!editingName.trim()) return;
    firmManager.renameFirm(firmId, editingName.trim());
    setFirms(firmManager.getFirms());
    setEditingId(null);
  };

  const handleDelete = (firmId: string) => {
    if (confirm(isHi ? 'क्या आप इस फर्म / बहीखाता को हटाना चाहते हैं?' : 'Delete this firm ledger book?')) {
      firmManager.deleteFirm(firmId);
      setFirms(firmManager.getFirms());
      onFirmSelected(firmManager.getActiveFirm());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {isHi ? 'फर्म / खाता पुस्तक चुनें' : 'Select Firm / Ledger Book'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHi ? 'अलग-अलग व्यापार के लिए अलग खाता' : 'Manage multiple business ledgers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Firm List */}
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {firms.map((firm) => {
            const isActive = firm.id === activeFirm.id;
            const isEditing = editingId === firm.id;

            return (
              <div
                key={firm.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  isActive
                    ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRename(firm.id)}
                      className="p-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelect(firm)}
                    className="flex-1 text-left flex items-center gap-2.5 min-w-0"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {firm.name}
                    </span>
                    {isActive && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 shrink-0">
                        {isHi ? 'सक्रिय' : 'Active'}
                      </span>
                    )}
                  </button>
                )}

                {/* Edit & Delete actions */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(firm.id);
                        setEditingName(firm.name);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {firm.id !== 'default' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(firm.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete Firm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Firm Form */}
          {isAdding ? (
            <form onSubmit={handleCreate} className="p-3 rounded-xl border border-dashed border-purple-300 dark:border-purple-800 space-y-2 mt-2">
              <input
                type="text"
                value={newFirmName}
                onChange={(e) => setNewFirmName(e.target.value)}
                placeholder={isHi ? 'नई फर्म / दुकान का नाम (उदा. पर्सनल खाता)' : 'New firm name (e.g. Personal Book)'}
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  {isHi ? 'बनाएं' : 'Create'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-400 hover:text-purple-600 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{isHi ? '+ नई फर्म / दुकान जोड़ें' : '+ Add New Firm / Book'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
