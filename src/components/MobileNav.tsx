import React from 'react';
import { User, NotificationItem } from '../types';
import { 
  ShieldCheck, 
  Bell, 
  BookOpen, 
  User as UserIcon, 
  PlusCircle,
  BarChart3
} from 'lucide-react';

interface MobileNavProps {
  currentUser: User | null;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onOpenAuthModal: () => void;
  onOpenRulesModal: () => void;
  onOpenRecordModal?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentUser,
  notifications,
  onOpenNotifications,
  onOpenAuthModal,
  onOpenRulesModal,
  onOpenRecordModal,
}) => {
  const unreadCount = currentUser 
    ? notifications.filter(n => n.userId === currentUser.id && !n.isRead).length
    : 0;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-lg">
      <div className="flex items-center justify-around">
        {/* Beranda / Poin */}
        <button
          id="mobile-nav-home"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center gap-1 text-indigo-600 cursor-pointer"
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] font-bold">Poin Saya</span>
        </button>

        {/* If Admin: Catat Poin Center Button */}
        {currentUser?.role === 'admin' && onOpenRecordModal ? (
          <button
            id="mobile-nav-record"
            onClick={onOpenRecordModal}
            className="flex flex-col items-center gap-0.5 -mt-4 p-2.5 rounded-full bg-indigo-600 text-white shadow-lg cursor-pointer hover:bg-indigo-700 transition-all"
          >
            <PlusCircle className="w-6 h-6" />
            <span className="text-[9px] font-bold">Catat</span>
          </button>
        ) : null}

        {/* Pedoman Poin */}
        <button
          id="mobile-nav-rules"
          onClick={onOpenRulesModal}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium">Pedoman</span>
        </button>

        {/* Notifikasi with Live Badge */}
        <button
          id="mobile-nav-notif"
          onClick={onOpenNotifications}
          className="relative flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Notifikasi</span>
        </button>

        {/* Akun */}
        <button
          id="mobile-nav-profile"
          onClick={onOpenAuthModal}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium">
            {currentUser?.role === 'admin' ? 'Admin' : 'Akun'}
          </span>
        </button>
      </div>
    </div>
  );
};
