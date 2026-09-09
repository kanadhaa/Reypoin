import React, { useState } from 'react';
import { NotificationItem } from '../types';
import { formatDateIndo } from '../lib/exportUtils';
import { markNotificationAsRead, markAllNotificationsAsRead, clearUserNotifications } from '../lib/storage';
import { markNotificationAsReadFirebase } from '../lib/firebase';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Info
} from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  userId: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  userId,
}) => {
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  if (!isOpen) return null;

  const filteredNotifs = filterUnreadOnly
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleItemClick = (notif: NotificationItem) => {
    if (!notif.isRead) {
      markNotificationAsRead(notif.id);
      markNotificationAsReadFirebase(notif.id);
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(userId);
  };

  const handleClearAll = () => {
    if (confirm('Hapus semua riwayat notifikasi Anda?')) {
      clearUserNotifications(userId);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div
        id="notification-modal"
        className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Notifikasi Poin Real-Time</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-500 text-white">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Pemberitahuan otomatis pengurangan atau penambahan poin Anda</p>
            </div>
          </div>
          <button
            id="btn-close-notif-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
            <input
              type="checkbox"
              checked={filterUnreadOnly}
              onChange={e => setFilterUnreadOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Hanya yang belum dibaca</span>
          </label>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                id="btn-mark-all-read"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai Semua Dibaca</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                id="btn-clear-notifications"
                onClick={handleClearAll}
                className="flex items-center gap-1 text-slate-400 hover:text-rose-600 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan</span>
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto divide-y divide-slate-100 flex-1 p-2">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-50" />
              <p className="text-slate-600 font-medium text-sm">Tidak ada notifikasi saat ini</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Setiap kali admin mencatat poin prestasi atau kedisiplinan, notifikasi akan langsung muncul di sini.
              </p>
            </div>
          ) : (
            filteredNotifs.map(notif => {
              const isPrestasi = notif.type === 'prestasi';
              const isPelanggaran = notif.type === 'pelanggaran';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3 sm:p-3.5 rounded-xl transition-all cursor-pointer mb-1 ${
                    !notif.isRead
                      ? 'bg-indigo-50/40 border border-indigo-100/80 shadow-xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isPrestasi
                          ? 'bg-emerald-100/70 text-emerald-700'
                          : isPelanggaran
                          ? 'bg-rose-100/70 text-rose-700'
                          : 'bg-indigo-100/70 text-indigo-700'
                      }`}
                    >
                      {isPrestasi ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : isPelanggaran ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            !notif.isRead ? 'text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                        <span>{formatDateIndo(notif.timestamp)}</span>
                        {notif.pointsChanged && (
                          <span
                            className={`font-bold ${
                              notif.pointsChanged > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {notif.pointsChanged > 0 ? `+${notif.pointsChanged}` : notif.pointsChanged} Poin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Sistem Notifikasi Real-time OSIS-MPK SMAN 6 Bandung • Terhubung Otomatis
          </p>
        </div>
      </div>
    </div>
  );
};
