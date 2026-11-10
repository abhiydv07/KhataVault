import React, { useState } from 'react';
import { X, Search, Users, Clock, Calendar } from 'lucide-react';
import { FriendSummary } from '../types/hisaab';
import { formatIndianCurrency } from '../utils/currencyFormatter';
import { Language, translations } from '../utils/i18n';

interface FriendDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: FriendSummary[];
  lang: Language;
}

export const FriendDirectoryModal: React.FC<FriendDirectoryModalProps> = ({
  isOpen,
  onClose,
  friends,
  lang,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = translations[lang];

  if (!isOpen) return null;

  const filtered = friends.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                {t.friendDirectory}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {friends.length} parties recorded in hisaab
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchFriends}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              autoFocus
            />
          </div>
        </div>

        {/* List of Friends */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
              No party or friend found matching "{searchTerm}".
            </div>
          ) : (
            filtered.map((friend) => {
              const isToCollect = friend.netBalance > 0;
              const isToPay = friend.netBalance < 0;

              return (
                <div
                  key={friend.name}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition"
                >
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {friend.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {friend.transactionCount} entries
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Last: {friend.lastTransactionDate}
                      </span>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {t.netBalance}
                      </div>
                      <div
                        className={`font-mono font-bold text-sm sm:text-base ${
                          isToCollect
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isToPay
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {formatIndianCurrency(Math.abs(friend.netBalance), true)}
                        <span className="text-xs ml-1 font-sans">
                          {isToCollect ? '(Lena)' : isToPay ? '(Dena)' : '(Nill)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
