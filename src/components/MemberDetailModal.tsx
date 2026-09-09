import React from 'react';
import { User, PointTransaction } from '../types';
import { getStatusBadge } from '../lib/storage';
import { exportMemberPDF, exportMemberExcel } from '../lib/exportUtils';
import { VisualChart } from './VisualChart';
import { PointHistoryTable } from './PointHistoryTable';
import { 
  X, 
  FileDown, 
  FileSpreadsheet, 
  PlusCircle, 
  ShieldAlert, 
  Award, 
  User as UserIcon,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  transactions: PointTransaction[];
  onOpenRecordForUser?: (userId: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  transactions,
  onOpenRecordForUser,
}) => {
  if (!isOpen || !user) return null;

  const userTransactions = transactions.filter(t => t.userId === user.id);
  const status = getStatusBadge(user.currentPoints);

  const totalPrestasi = userTransactions
    .filter(t => t.type === 'prestasi')
    .reduce((acc, curr) => acc + curr.points, 0);

  const totalPelanggaran = userTransactions
    .filter(t => t.type === 'pelanggaran')
    .reduce((acc, curr) => acc + curr.points, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div
        id="member-detail-modal"
        className="bg-white rounded-2xl max-w-4xl w-full my-6 max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">{user.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-200 text-slate-700">
                  {user.nis}
                </span>
              </div>
              <p className="text-xs text-slate-500">{user.division} • {user.position}</p>
            </div>
          </div>
          <button
            id="btn-close-member-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Member Profile Cards & Actions Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Bio Card */}
            <div className="lg:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-200/70 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    Kelas
                  </span>
                  <span className="font-semibold text-slate-800">{user.classGrade}</span>
                </div>
                <div>
                  <span className="text-slate-400 block flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    Organisasi
                  </span>
                  <span className="font-semibold text-indigo-700">{user.organization} SMAN 6</span>
                </div>
                <div>
                  <span className="text-slate-400 block flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </span>
                  <span className="font-semibold text-slate-800 truncate block">{user.email}</span>
                </div>
                {user.phone && (
                  <div>
                    <span className="text-slate-400 block flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      No. WhatsApp
                    </span>
                    <span className="font-semibold text-slate-800">{user.phone}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block">Poin Awal</span>
                  <span className="font-semibold text-slate-800">{user.initialPoints} Poin</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Status Evaluasi</span>
                  <span className={`font-bold ${status.color}`}>{status.label}</span>
                </div>
              </div>

              {/* Status banner */}
              <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${status.bg} ${status.border}`}>
                <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${status.color}`} />
                <div>
                  <span className={`font-bold ${status.color}`}>{status.label}: </span>
                  <span className="text-slate-700">{status.description}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Score summary */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 font-medium">Akumulasi Poin Saat Ini</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-3xl font-extrabold ${status.color}`}>
                    {user.currentPoints}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ 100 Base</span>
                </div>
                <div className="flex items-center gap-3 text-xs mt-2 pt-2 border-t border-slate-100">
                  <span className="text-emerald-600 font-bold">+{totalPrestasi} Pres</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-rose-600 font-bold">-{totalPelanggaran} Pel</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {onOpenRecordForUser && (
                  <button
                    id="btn-add-point-for-member"
                    onClick={() => {
                      onOpenRecordForUser(user.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Catat Poin Anggota Ini</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-export-member-pdf"
                    onClick={() => exportMemberPDF(user, userTransactions)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Rapor PDF</span>
                  </button>
                  <button
                    id="btn-export-member-excel"
                    onClick={() => exportMemberExcel(user, userTransactions)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel (.xlsx)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Accumulation Chart */}
          <VisualChart
            transactions={userTransactions}
            initialPoints={user.initialPoints}
            currentPoints={user.currentPoints}
            title={`Grafik Akumulasi Poin: ${user.name}`}
            subtitle="Pergerakan poin kedisiplinan dan capaian prestasi kepengurusan"
          />

          {/* Point History Table */}
          <PointHistoryTable
            transactions={userTransactions}
            title={`Riwayat Lengkap Poin (${user.name})`}
            emptyMessage="Belum ada transaksi poin yang tercatat untuk pengurus ini."
          />
        </div>
      </div>
    </div>
  );
};
