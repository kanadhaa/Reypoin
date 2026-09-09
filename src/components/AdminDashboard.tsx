import React, { useState, useMemo } from 'react';
import { User, PointTransaction } from '../types';
import { getStatusBadge } from '../lib/storage';
import { exportAdminMasterExcel, exportAdminMasterPDF, exportMemberPDF } from '../lib/exportUtils';
import { VisualChart } from './VisualChart';
import { PointHistoryTable } from './PointHistoryTable';
import { 
  Users, 
  ShieldAlert, 
  Award, 
  AlertTriangle, 
  PlusCircle, 
  FileSpreadsheet, 
  FileDown, 
  Search, 
  Filter, 
  ChevronRight,
  BarChart3,
  TrendingUp,
  Layers,
  GraduationCap,
  UserPlus,
  KeyRound
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  users: User[];
  transactions: PointTransaction[];
  onOpenRecordModal: () => void;
  onSelectMember: (user: User) => void;
  onOpenCreateUser?: () => void;
  onOpenChangeCredentials?: (user: User) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  users,
  transactions,
  onOpenRecordModal,
  onSelectMember,
  onOpenCreateUser,
  onOpenChangeCredentials,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'history'>('overview');
  const [searchMember, setSearchMember] = useState('');
  const [filterOrg, setFilterOrg] = useState<'ALL' | 'OSIS' | 'MPK'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Filter regular members (or all members)
  const regularMembers = users.filter(u => u.role === 'pengurus');

  // Calculation summaries
  const totalPengurus = regularMembers.length;
  const avgPoints = totalPengurus > 0
    ? Math.round(regularMembers.reduce((sum, u) => sum + u.currentPoints, 0) / totalPengurus)
    : 100;

  const totalPrestasiTrx = transactions.filter(t => t.type === 'prestasi').length;
  const totalPelanggaranTrx = transactions.filter(t => t.type === 'pelanggaran').length;

  const spMembers = regularMembers.filter(u => u.currentPoints < 70);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return regularMembers.filter(u => {
      if (filterOrg !== 'ALL' && u.organization !== filterOrg) return false;
      if (filterStatus === 'SP' && u.currentPoints >= 70) return false;
      if (filterStatus === 'WASPADA' && (u.currentPoints < 70 || u.currentPoints >= 85)) return false;
      if (filterStatus === 'BAIK' && u.currentPoints < 85) return false;
      if (searchMember.trim()) {
        const q = searchMember.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchDiv = u.division.toLowerCase().includes(q);
        const matchNis = u.nis.includes(q);
        const matchClass = u.classGrade.toLowerCase().includes(q);
        if (!matchName && !matchDiv && !matchNis && !matchClass) return false;
      }
      return true;
    });
  }, [regularMembers, filterOrg, filterStatus, searchMember]);

  // Division breakdown calculation
  const divisionStats = useMemo(() => {
    const map = new Map<string, { totalPoints: number; count: number }>();
    regularMembers.forEach(u => {
      const current = map.get(u.division) || { totalPoints: 0, count: 0 };
      map.set(u.division, {
        totalPoints: current.totalPoints + u.currentPoints,
        count: current.count + 1,
      });
    });

    return Array.from(map.entries()).map(([div, stat]) => ({
      division: div,
      avg: Math.round(stat.totalPoints / stat.count),
      count: stat.count,
    })).sort((a, b) => b.avg - a.avg);
  }, [regularMembers]);

  return (
    <div id="admin-management-dashboard" className="space-y-6 animate-in fade-in duration-200">
      {/* Admin Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                Hak Akses Administrator • {currentUser.position}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300">{currentUser.name}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Panel Pengawasan & Rekapitulasi Poin OSIS-MPK 06
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Pusat kendali pencatatan pelanggaran, penambahan prestasi, audit riwayat pengurus, dan penerbitan laporan resmi SMAN 6 Bandung.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenCreateUser && (
              <button
                id="btn-admin-create-user-trigger"
                onClick={onOpenCreateUser}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Buat Akun Pengurus</span>
              </button>
            )}

            <button
              id="btn-admin-record-modal-trigger"
              onClick={onOpenRecordModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Catat Poin Pengurus</span>
            </button>

            <button
              id="btn-admin-export-master-excel"
              onClick={() => exportAdminMasterExcel(users, transactions)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Rekap Excel</span>
            </button>

            <button
              id="btn-admin-export-master-pdf"
              onClick={() => exportAdminMasterPDF(users, transactions)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-rose-300" />
              <span>Laporan PDF</span>
            </button>

            {onOpenChangeCredentials && (
              <button
                id="btn-admin-change-credentials-hero"
                onClick={() => onOpenChangeCredentials(currentUser)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
                title="Ubah Username atau Kata Sandi Akun Admin Anda"
              >
                <KeyRound className="w-4 h-4 text-indigo-200" />
                <span>Ubah Sandi Saya</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pengurus
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalPengurus}
            </span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Anggota Aktif</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">OSIS & MPK SMAN 6 Bandung</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rata-rata Poin
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-black text-indigo-700">
              {avgPoints}
            </span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">/ 100 Base</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Standar kesehatan organisasi</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Prestasi / Pelanggaran
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">
              {totalPrestasiTrx}
            </span>
            <span className="text-xs text-slate-400">vs</span>
            <span className="text-xl sm:text-2xl font-black text-rose-600">
              {totalPelanggaranTrx}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Catatan real-time admin</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status Peringatan / SP
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">
              {spMembers.length}
            </span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Pengurus</span>
          </div>
          <p className="text-[11px] text-rose-600/80 mt-1 font-medium">Perlu konseling & evaluasi</p>
        </div>
      </div>

      {/* Tabs for Navigation */}
      <div className="flex border-b border-slate-200 text-xs sm:text-sm font-bold">
        <button
          id="admin-tab-overview"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Visual Analitik & Grafik
        </button>
        <button
          id="admin-tab-members"
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daftar Pengurus ({filteredMembers.length})
        </button>
        <button
          id="admin-tab-history"
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Log Transaksi Seluruh Organisasi ({transactions.length})
        </button>
      </div>

      {/* Tab 1: Visual Analitik & Grafik */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Visual Accumulation Chart */}
          <VisualChart
            transactions={transactions}
            initialPoints={100}
            currentPoints={avgPoints}
            title="Grafik Perkembangan Poin Organisasi"
            subtitle="Dinamika akumulasi perolehan poin seluruh pengurus OSIS-MPK 06 Bandung"
          />

          {/* Division Breakdown & Health Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Division Standings */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Rata-rata Poin per Sekbid / Komisi</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Berdasarkan data aktif</span>
              </div>

              <div className="space-y-3">
                {divisionStats.map(stat => {
                  const status = getStatusBadge(stat.avg);
                  const barWidth = Math.min(100, Math.max(10, (stat.avg / 120) * 100));

                  return (
                    <div key={stat.division} className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800 truncate max-w-[220px]">
                          {stat.division}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${status.color}`}>{stat.avg} Poin</span>
                          <span className="text-slate-400 text-[10px]">({stat.count} orang)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            stat.avg >= 100
                              ? 'bg-emerald-500'
                              : stat.avg >= 85
                              ? 'bg-blue-500'
                              : stat.avg >= 70
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Distribution Matrix */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">Distribusi Status Kedisiplinan</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                    <span className="text-[11px] font-bold text-emerald-800">Sangat Baik (≥100)</span>
                    <p className="text-xl font-black text-emerald-700 mt-1">
                      {regularMembers.filter(u => u.currentPoints >= 100).length} Orang
                    </p>
                    <span className="text-[10px] text-slate-500">Pengurus Teladan</span>
                  </div>

                  <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                    <span className="text-[11px] font-bold text-blue-800">Kondisi Baik (85-99)</span>
                    <p className="text-xl font-black text-blue-700 mt-1">
                      {regularMembers.filter(u => u.currentPoints >= 85 && u.currentPoints < 100).length} Orang
                    </p>
                    <span className="text-[10px] text-slate-500">Kinerja Stabil</span>
                  </div>

                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                    <span className="text-[11px] font-bold text-amber-800">Waspada (70-84)</span>
                    <p className="text-xl font-black text-amber-700 mt-1">
                      {regularMembers.filter(u => u.currentPoints >= 70 && u.currentPoints < 85).length} Orang
                    </p>
                    <span className="text-[10px] text-slate-500">Perlu Pengawasan</span>
                  </div>

                  <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
                    <span className="text-[11px] font-bold text-rose-800">Kena Sanksi SP (&lt;70)</span>
                    <p className="text-xl font-black text-rose-700 mt-1">
                      {regularMembers.filter(u => u.currentPoints < 70).length} Orang
                    </p>
                    <span className="text-[10px] text-slate-500">Konseling & Sidang</span>
                  </div>
                </div>
              </div>

              {/* Quick Prompt */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Ingin mencatat poin sekarang?</span>
                <button
                  onClick={onOpenRecordModal}
                  className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  + Tambah Poin Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Daftar Pengurus */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="input-search-members"
                type="text"
                placeholder="Cari nama, NIS, kelas, atau sekbid..."
                value={searchMember}
                onChange={e => setSearchMember(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Org Filter */}
              <select
                value={filterOrg}
                onChange={e => setFilterOrg(e.target.value as 'ALL' | 'OSIS' | 'MPK')}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Organisasi</option>
                <option value="OSIS">OSIS</option>
                <option value="MPK">MPK</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="BAIK">Kondisi Baik / Teladan</option>
                <option value="WASPADA">Status Waspada</option>
                <option value="SP">Terkendala SP (&lt;70)</option>
              </select>

              {onOpenCreateUser && (
                <button
                  id="btn-admin-create-user-table-trigger"
                  onClick={onOpenCreateUser}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all shadow-2xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Tambah Akun</span>
                </button>
              )}
            </div>
          </div>

          {/* Members Table */}
          <div className="divide-y divide-slate-100">
            {filteredMembers.map(member => {
              const status = getStatusBadge(member.currentPoints);
              const memberTx = transactions.filter(t => t.userId === member.id);
              const presCount = memberTx.filter(t => t.type === 'prestasi').length;
              const pelCount = memberTx.filter(t => t.type === 'pelanggaran').length;

              return (
                <div
                  key={member.id}
                  id={`member-row-${member.id}`}
                  onClick={() => onSelectMember(member)}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                          {member.name}
                        </h4>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                          {member.nis}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {member.division} • {member.classGrade}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="text-emerald-600 font-medium">+{presCount} Prestasi</span>
                        <span>•</span>
                        <span className="text-rose-600 font-medium">-{pelCount} Pelanggaran</span>
                      </div>
                    </div>
                  </div>

                    {/* Points & Badge */}
                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                      {onOpenChangeCredentials && (
                        <button
                          type="button"
                          id={`btn-admin-change-member-creds-${member.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChangeCredentials(member);
                          }}
                          title={`Ubah Username & Kata Sandi untuk ${member.name}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      )}

                      <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className={`text-lg font-black ${status.color}`}>
                            {member.currentPoints}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">Poin</span>
                        </div>
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${status.bg} ${status.color} border ${status.border}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Log Transaksi Seluruh Organisasi */}
      {activeTab === 'history' && (
        <PointHistoryTable
          transactions={transactions}
          title="Audit Log Transaksi Poin Seluruh Pengurus"
          emptyMessage="Belum ada transaksi poin yang tercatat di organisasi."
          allowExport={true}
          onExportExcel={() => exportAdminMasterExcel(users, transactions)}
          onExportPDF={() => exportAdminMasterPDF(users, transactions)}
        />
      )}
    </div>
  );
};
