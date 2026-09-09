import React from 'react';
import { User, PointTransaction, NotificationItem } from '../types';
import { getStatusBadge } from '../lib/storage';
import { exportMemberPDF, exportMemberExcel } from '../lib/exportUtils';
import { VisualChart } from './VisualChart';
import { PointHistoryTable } from './PointHistoryTable';
import { 
  ShieldCheck, 
  Award, 
  AlertTriangle, 
  FileDown, 
  FileSpreadsheet, 
  Sparkles, 
  Bell, 
  Lock,
  BookOpen,
  Info,
  Calendar,
  CheckCircle2,
  KeyRound
} from 'lucide-react';

interface MemberDashboardProps {
  currentUser: User;
  transactions: PointTransaction[];
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onOpenRules: () => void;
  onOpenChangeCredentials?: (user: User) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  currentUser,
  transactions,
  notifications,
  onOpenNotifications,
  onOpenRules,
  onOpenChangeCredentials,
}) => {
  // STRICT PRIVACY GUARANTEE: Filter strictly for currentUser.id
  const myTransactions = transactions.filter(t => t.userId === currentUser.id);
  const myNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadNotifs = myNotifications.filter(n => !n.isRead);

  const status = getStatusBadge(currentUser.currentPoints);

  const totalPrestasiPoints = myTransactions
    .filter(t => t.type === 'prestasi')
    .reduce((acc, curr) => acc + curr.points, 0);

  const totalPelanggaranPoints = myTransactions
    .filter(t => t.type === 'pelanggaran')
    .reduce((acc, curr) => acc + curr.points, 0);

  return (
    <div id="member-personal-dashboard" className="space-y-6 animate-in fade-in duration-200">
      {/* Privacy Notice Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Lock className="w-3 h-3" />
                <span>Akses Akun Pribadi Terproteksi</span>
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-indigo-200 font-medium">
                {currentUser.organization} 06 Bandung
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Halo, {currentUser.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Selamat datang di portal poin mandiri. Anda hanya memiliki hak akses untuk memantau poin, riwayat evaluasi, dan notifikasi diri sendiri.
            </p>
          </div>

          {/* Quick Action Buttons on Hero */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-member-export-pdf"
              onClick={() => exportMemberPDF(currentUser, myTransactions)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-xs border border-white/20 transition-all cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4 text-rose-300" />
              <span>Cetak Rapor PDF</span>
            </button>

            <button
              id="btn-member-export-excel"
              onClick={() => exportMemberExcel(currentUser, myTransactions)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-xs border border-white/20 transition-all cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Unduh Excel</span>
            </button>

            {onOpenChangeCredentials && (
              <button
                id="btn-member-change-credentials"
                onClick={() => onOpenChangeCredentials(currentUser)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600/90 hover:bg-indigo-600 rounded-xl backdrop-blur-xs border border-indigo-400/40 transition-all cursor-pointer shadow-xs"
              >
                <KeyRound className="w-4 h-4 text-indigo-200" />
                <span>Ubah Username / Sandi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unread Notifications Alert Toast if any */}
      {unreadNotifs.length > 0 && (
        <div
          onClick={onOpenNotifications}
          className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2.5 text-xs text-amber-900">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span className="font-bold">
              Anda memiliki {unreadNotifs.length} notifikasi poin baru dari Admin / Pembina!
            </span>
          </div>
          <span className="text-xs font-bold text-amber-800 underline">
            Lihat Notifikasi
          </span>
        </div>
      )}

      {/* Top Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Poin Saat Ini */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Poin Akumulasi Saya
            </span>
            <div className={`p-2 rounded-xl ${status.bg} ${status.color}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className={`text-3xl sm:text-4xl font-black ${status.color}`}>
              {currentUser.currentPoints}
            </span>
            <span className="text-xs text-slate-400 font-semibold">/ 100 Base</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Status Kedisiplinan:</span>
            <span className={`font-bold ${status.color}`}>{status.label}</span>
          </div>
        </div>

        {/* Card 2: Total Prestasi */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Poin Prestasi Diperoleh
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl sm:text-4xl font-black text-emerald-600">
              +{totalPrestasiPoints}
            </span>
            <span className="text-xs text-emerald-700 font-semibold">Poin Tambahan</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Jumlah Piagam/Prestasi:</span>
            <span className="font-bold text-emerald-700">
              {myTransactions.filter(t => t.type === 'prestasi').length} Catatan
            </span>
          </div>
        </div>

        {/* Card 3: Total Pengurangan */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pengurangan Poin
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl sm:text-4xl font-black text-rose-600">
              -{totalPelanggaranPoints}
            </span>
            <span className="text-xs text-rose-700 font-semibold">Poin Sanksi</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Jumlah Pelanggaran:</span>
            <span className="font-bold text-rose-700">
              {myTransactions.filter(t => t.type === 'pelanggaran').length} Catatan
            </span>
          </div>
        </div>

        {/* Card 4: Identitas Pengurus */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Profil Kepengurusan
            </span>
            <p className="font-bold text-slate-900 text-sm mt-2">{currentUser.position}</p>
            <p className="text-xs text-indigo-700 font-medium mt-0.5">{currentUser.division}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>NIS: {currentUser.nis}</span>
            <span className="font-semibold text-slate-700">{currentUser.classGrade}</span>
          </div>
        </div>
      </div>

      {/* Visual Chart Section */}
      <VisualChart
        transactions={myTransactions}
        initialPoints={currentUser.initialPoints}
        currentPoints={currentUser.currentPoints}
        title="Grafik Akumulasi Poin Saya"
        subtitle="Visualisasi grafik tren kenaikan prestasi dan penurunan kedisiplinan akun pribadi"
      />

      {/* Personal Real-Time Point History Table */}
      <PointHistoryTable
        transactions={myTransactions}
        title="Riwayat Poin Pribadi Real-Time"
        emptyMessage="Belum ada transaksi poin yang tercatat untuk akun Anda."
        allowExport={true}
        onExportExcel={() => exportMemberExcel(currentUser, myTransactions)}
        onExportPDF={() => exportMemberPDF(currentUser, myTransactions)}
      />

      {/* Point Guidelines Helper Box */}
      <div className="bg-slate-100/80 rounded-xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Ingin Meningkatkan Akumulasi Poin Anda?</h4>
            <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
              Raih poin tambahan dengan aktif menjadi koordinator kepanitiaan, presensi rapat 100%, inisiatif program kerja baru, atau menjuarai lomba mewakili SMAN 6 Bandung.
            </p>
          </div>
        </div>

        <button
          id="btn-member-open-rules-banner"
          onClick={onOpenRules}
          className="shrink-0 px-4 py-2 text-xs font-bold bg-white text-indigo-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          Lihat Daftar Aturan SK
        </button>
      </div>
    </div>
  );
};
