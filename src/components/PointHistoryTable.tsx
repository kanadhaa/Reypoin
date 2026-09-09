import React, { useState, useMemo } from 'react';
import { PointTransaction } from '../types';
import { formatDateIndo } from '../lib/exportUtils';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  UserCheck, 
  FileText,
  X,
  ExternalLink
} from 'lucide-react';

interface PointHistoryTableProps {
  transactions: PointTransaction[];
  title?: string;
  emptyMessage?: string;
  allowExport?: boolean;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
}

export const PointHistoryTable: React.FC<PointHistoryTableProps> = ({
  transactions,
  title = 'Riwayat Transaksi Poin',
  emptyMessage = 'Belum ada transaksi poin yang tercatat.',
  allowExport = false,
  onExportExcel,
  onExportPDF,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'prestasi' | 'pelanggaran'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedTx, setSelectedTx] = useState<PointTransaction | null>(null);

  // Categories list from current transactions
  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [transactions]);

  // Filtered and sorted transactions
  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = t.description.toLowerCase().includes(q);
          const matchCat = t.category.toLowerCase().includes(q);
          const matchAdmin = t.recordedByAdminName.toLowerCase().includes(q);
          const matchUser = t.userName?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCat && !matchAdmin && !matchUser) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [transactions, filterType, selectedCategory, searchTerm, sortOrder]);

  return (
    <div id="point-history-section" className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header & Actions */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">{title}</h3>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
              {filtered.length} Catatan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Catatan waktu nyata setiap pengurangan dan penambahan poin</p>
        </div>

        {/* Quick export shortcuts if allowed */}
        {allowExport && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            {onExportExcel && (
              <button
                id="btn-export-table-excel"
                onClick={onExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
              >
                <span>Unduh Excel</span>
              </button>
            )}
            {onExportPDF && (
              <button
                id="btn-export-table-pdf"
                onClick={onExportPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 cursor-pointer"
              >
                <span>Unduh PDF</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Cari kejadian, pelanggaran, atau catatan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              id="filter-type-all"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              id="filter-type-prestasi"
              onClick={() => setFilterType('prestasi')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterType === 'prestasi'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Prestasi (+)
            </button>
            <button
              id="filter-type-pelanggaran"
              onClick={() => setFilterType('pelanggaran')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterType === 'pelanggaran'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              Pelanggaran (-)
            </button>
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <select
              id="filter-category-select"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Sort Order */}
          <button
            id="btn-sort-order"
            onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}</span>
          </button>
        </div>
      </div>

      {/* List / Table */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-600 font-medium text-sm">{emptyMessage}</p>
          <p className="text-slate-400 text-xs mt-1">Coba ubah kata kunci pencarian atau filter kategori.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map(tx => {
            const isPrestasi = tx.type === 'prestasi';
            return (
              <div
                key={tx.id}
                id={`tx-row-${tx.id}`}
                onClick={() => setSelectedTx(tx)}
                className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  {/* Icon Indicator */}
                  <div
                    className={`mt-0.5 p-2 rounded-xl shrink-0 ${
                      isPrestasi
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}
                  >
                    {isPrestasi ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                        {tx.title}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          isPrestasi
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                        }`}
                      >
                        {tx.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-1 sm:line-clamp-2">
                      {tx.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-1.5">
                      <span>{formatDateIndo(tx.timestamp)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <UserCheck className="w-3 h-3" />
                        {tx.recordedByAdminName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Points Badge */}
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-sm font-extrabold ${
                      isPrestasi
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isPrestasi ? `+${tx.points}` : `-${tx.points}`} Poin
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-0.5 group-hover:text-indigo-500">
                    <span>Rincian</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div
            id="tx-detail-modal"
            className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    selectedTx.type === 'prestasi'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {selectedTx.type === 'prestasi' ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Rincian Catatan Poin</h4>
                  <p className="text-xs text-slate-500">ID: {selectedTx.id}</p>
                </div>
              </div>
              <button
                id="btn-close-tx-modal"
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-3.5 text-sm">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Jenis Tindakan</span>
                  <span
                    className={`font-bold text-xs uppercase px-2 py-0.5 rounded-md ${
                      selectedTx.type === 'prestasi'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedTx.type}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                  <span className="text-xs text-slate-500 font-medium">Perubahan Poin</span>
                  <span
                    className={`text-lg font-extrabold ${
                      selectedTx.type === 'prestasi' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {selectedTx.type === 'prestasi' ? `+${selectedTx.points}` : `-${selectedTx.points}`} Poin
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Judul Agenda / Kejadian</label>
                <p className="font-bold text-slate-900 text-base">{selectedTx.title}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Kategori</label>
                <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                  {selectedTx.category}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Deskripsi / Catatan Rinci</label>
                <div className="p-3 bg-slate-50 rounded-lg text-slate-700 text-xs sm:text-sm leading-relaxed border border-slate-200/60">
                  {selectedTx.description}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Waktu Pencatatan</span>
                  <span className="font-semibold text-slate-700">{formatDateIndo(selectedTx.timestamp)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dicatat Oleh Admin</span>
                  <span className="font-semibold text-slate-700">{selectedTx.recordedByAdminName}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                id="btn-close-tx-modal-done"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
