import React from 'react';
import { User, NotificationItem } from '../types';
import { 
  Bell, 
  BookOpen, 
  LogOut, 
  Users, 
  PlusCircle, 
  FileSpreadsheet, 
  FileDown,
  UserCheck,
  Shield,
  ArrowRightLeft
} from 'lucide-react';
import { setCurrentUser } from '../lib/storage';

interface NavbarProps {
  currentUser: User | null;
  users?: User[];
  notifications: NotificationItem[];
  cloudSyncStatus?: { connected: boolean; lastSync?: Date; error?: string };
  onOpenNotifications: () => void;
  onOpenAuthModal: () => void;
  onOpenRulesModal: () => void;
  onOpenRecordModal?: () => void;
  onExportMasterPDF?: () => void;
  onExportMasterExcel?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  notifications,
  cloudSyncStatus,
  onOpenNotifications,
  onOpenAuthModal,
  onOpenRulesModal,
  onOpenRecordModal,
  onExportMasterPDF,
  onExportMasterExcel,
}) => {
  const unreadCount = currentUser 
    ? notifications.filter(n => n.userId === currentUser.id && !n.isRead).length
    : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand / Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-center font-extrabold shadow-sm border border-indigo-600/30">
              <span className="text-base tracking-tighter">06</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                  OSIS-MPK 06 Bandung
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Sistem Poin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                SMAN 6 Bandung • Transparansi & Kedisiplinan
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action for Admin: Catat Poin */}
            {currentUser?.role === 'admin' && onOpenRecordModal && (
              <button
                id="navbar-btn-record-point"
                onClick={onOpenRecordModal}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Catat Poin</span>
              </button>
            )}

            {/* Admin Master Export dropdown/buttons */}
            {currentUser?.role === 'admin' && (onExportMasterPDF || onExportMasterExcel) && (
              <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {onExportMasterExcel && (
                  <button
                    id="nav-export-excel"
                    onClick={onExportMasterExcel}
                    title="Ekspor Rekap Master Excel"
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-white rounded-lg transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel</span>
                  </button>
                )}
                {onExportMasterPDF && (
                  <button
                    id="nav-export-pdf"
                    onClick={onExportMasterPDF}
                    title="Ekspor Rekap Master PDF"
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-800 hover:bg-white rounded-lg transition-all"
                  >
                    <FileDown className="w-3.5 h-3.5 text-rose-600" />
                    <span>PDF</span>
                  </button>
                )}
              </div>
            )}

            {/* Pedoman Poin SK */}
            <button
              id="navbar-btn-rules"
              onClick={onOpenRulesModal}
              title="Pedoman Poin & Aturan SK"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Pedoman Poin</span>
            </button>

            {/* Notifications Bell */}
            <button
              id="navbar-btn-notifications"
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Notifikasi Real-time"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center animate-bounce shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Account & Logout */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
                <button
                  id="navbar-btn-auth-profile"
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left cursor-pointer group"
                  title="Profil & Ganti Akun"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 max-w-[120px]">
                        {currentUser.name}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                          currentUser.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {currentUser.role === 'admin' ? 'ADMIN' : 'PENGURUS'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                      {currentUser.division}
                    </p>
                  </div>
                </button>

                <button
                  id="navbar-btn-logout"
                  onClick={() => setCurrentUser(null)}
                  title="Keluar dari sesi (Kunci Akses)"
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <button
                id="navbar-btn-login-trigger"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Masuk Sistem</span>
              </button>
            )}

            {/* Cloud Database Status Indicator */}
            <div 
              id="navbar-cloud-sync-badge"
              title={cloudSyncStatus?.connected 
                ? `Firebase Firestore Cloud Aktif • Sinkronisasi Real-time (${cloudSyncStatus.lastSync ? cloudSyncStatus.lastSync.toLocaleTimeString('id-ID') : 'Tersinkron'})` 
                : 'Menyambungkan ke Firebase Firestore...'}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                cloudSyncStatus?.connected 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-2xs' 
                  : 'bg-amber-50 text-amber-800 border-amber-200/80'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cloudSyncStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="hidden xl:inline">{cloudSyncStatus?.connected ? 'Cloud Terhubung' : 'Menyambungkan'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
