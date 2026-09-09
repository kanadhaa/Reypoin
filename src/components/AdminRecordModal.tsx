import React, { useState } from 'react';
import { User, PointType } from '../types';
import { POINT_PRESETS } from '../data/mockData';
import { recordPointTransactionFirebase } from '../lib/firebase';
import confetti from 'canvas-confetti';
import { 
  X, 
  Award, 
  AlertTriangle, 
  Check, 
  User as UserIcon, 
  Sparkles,
  Search
} from 'lucide-react';

interface AdminRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  adminUser: User;
  preselectedUserId?: string;
  onSuccess?: () => void;
}

export const AdminRecordModal: React.FC<AdminRecordModalProps> = ({
  isOpen,
  onClose,
  users,
  adminUser,
  preselectedUserId,
  onSuccess,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(
    preselectedUserId || (users.find(u => u.role === 'pengurus')?.id || '')
  );
  const [pointType, setPointType] = useState<PointType>('prestasi');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState<number>(10);
  const [category, setCategory] = useState('Kinerja Proker');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  if (!isOpen) return null;

  // Filter regular members to record points for
  const regularMembers = users.filter(u => u.role === 'pengurus' || u.id !== adminUser.id);
  const filteredMembers = regularMembers.filter(m => 
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.division.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.nis.includes(memberSearch)
  );

  const selectedMember = users.find(u => u.id === selectedUserId);

  const availablePresets = POINT_PRESETS.filter(p => p.type === pointType);

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') {
      setTitle('');
      setPoints(pointType === 'prestasi' ? 10 : 5);
      setCategory('Lainnya');
      setDescription('');
      return;
    }

    const preset = availablePresets.find(p => p.id === presetId);
    if (preset) {
      setTitle(preset.title);
      setPoints(preset.defaultPoints);
      setCategory(preset.category);
      setDescription(preset.description);
    }
  };

  const handleTypeChange = (type: PointType) => {
    setPointType(type);
    setSelectedPresetId('');
    const newPresets = POINT_PRESETS.filter(p => p.type === type);
    if (newPresets.length > 0) {
      const first = newPresets[0];
      setSelectedPresetId(first.id);
      setTitle(first.title);
      setPoints(first.defaultPoints);
      setCategory(first.category);
      setDescription(first.description);
    } else {
      setPoints(10);
      setCategory('Umum');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      alert('Pilih pengurus yang akan dicatat poinnya.');
      return;
    }
    if (!title.trim()) {
      alert('Judul atau agenda kejadian wajib diisi.');
      return;
    }
    if (points <= 0) {
      alert('Jumlah poin harus lebih besar dari 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordPointTransactionFirebase({
        userId: selectedUserId,
        type: pointType,
        points: Number(points),
        category: category.trim() || 'Umum',
        title: title.trim(),
        description: description.trim() || 'Dicatat oleh ' + adminUser.name,
        adminUser,
      });

      if (pointType === 'prestasi') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      alert('Gagal mencatat poin: ' + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div
        id="admin-record-modal"
        className="bg-white rounded-2xl max-w-xl w-full my-6 p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">Catat Poin Pengurus</h3>
              <p className="text-xs text-slate-500">
                Pencatatan resmi prestasi & kedisiplinan OSIS-MPK SMAN 6 Bandung
              </p>
            </div>
          </div>
          <button
            id="btn-close-record-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-sm">
          {/* 1. Pilih Pengurus */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Pengurus yang Dicatat
            </label>
            
            {/* Quick search inside dropdown */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama pengurus atau sekbid..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              id="select-target-member"
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">-- Pilih Pengurus --</option>
              {filteredMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.division} - {m.classGrade}) • Poin: {m.currentPoints}
                </option>
              ))}
            </select>

            {selectedMember && (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="font-semibold text-slate-800">{selectedMember.name}</span>
                    <span className="text-slate-500 ml-1">({selectedMember.division})</span>
                  </div>
                </div>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Poin Saat Ini: {selectedMember.currentPoints}
                </span>
              </div>
            )}
          </div>

          {/* 2. Jenis Tindakan (Prestasi / Pelanggaran) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jenis Tindakan
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-type-prestasi"
                onClick={() => handleTypeChange('prestasi')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all ${
                  pointType === 'prestasi'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Prestasi & Penghargaan (+)</span>
              </button>

              <button
                type="button"
                id="btn-type-pelanggaran"
                onClick={() => handleTypeChange('pelanggaran')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all ${
                  pointType === 'pelanggaran'
                    ? 'bg-rose-50 text-rose-700 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Pelanggaran / Disiplin (-)</span>
              </button>
            </div>
          </div>

          {/* 3. Preset Aturan Standar OSIS-MPK 06 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Panduan Aturan Standar (SK OSIS-MPK 06)
            </label>
            <select
              id="select-rule-preset"
              value={selectedPresetId}
              onChange={e => handlePresetSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Pilih dari Aturan Standar --</option>
              {availablePresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {pointType === 'prestasi' ? `[+${preset.defaultPoints}]` : `[-${preset.defaultPoints}]`}{' '}
                  {preset.title}
                </option>
              ))}
              <option value="custom">-- Masukkan Kustom Sendiri --</option>
            </select>
          </div>

          {/* 4. Judul Kejadian */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Kejadian / Agenda / Pelanggaran
            </label>
            <input
              id="input-tx-title"
              type="text"
              required
              placeholder="Contoh: Terlambat Rapat Pleno atau Ketua Pelaksana HUT 06"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 5. Poin & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Besaran Poin ({pointType === 'prestasi' ? '+' : '-'})
              </label>
              <div className="relative">
                <input
                  id="input-tx-points"
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={points}
                  onChange={e => setPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Poin
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori
              </label>
              <input
                id="input-tx-category"
                type="text"
                required
                placeholder="Contoh: Kedisiplinan Rapat"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 6. Deskripsi / Catatan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Bukti / Keterangan Tambahan
            </label>
            <textarea
              id="input-tx-description"
              rows={2}
              placeholder="Rincian kronologi, waktu kejadian, atau apresiasi prestasi yang dicapai..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Preview impact */}
          {selectedMember && (
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs flex items-center justify-between">
              <span className="text-indigo-900 font-medium">Estimasi Poin Setelah Disimpan:</span>
              <span className="font-extrabold text-sm text-indigo-700">
                {selectedMember.currentPoints} {pointType === 'prestasi' ? `+ ${points}` : `- ${points}`} ={' '}
                {pointType === 'prestasi'
                  ? selectedMember.currentPoints + Number(points)
                  : Math.max(0, selectedMember.currentPoints - Number(points))}{' '}
                Poin
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="btn-cancel-record"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-submit-record"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition-all ${
                pointType === 'prestasi'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Catat & Kirim Notifikasi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
