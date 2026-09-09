import React, { useState } from 'react';
import { POINT_PRESETS } from '../data/mockData';
import { 
  X, 
  BookOpen, 
  Award, 
  AlertTriangle, 
  ShieldCheck, 
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface RulesDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesDirectoryModal: React.FC<RulesDirectoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [tab, setTab] = useState<'pelanggaran' | 'prestasi' | 'sp'>('pelanggaran');

  if (!isOpen) return null;

  const pelanggaranList = POINT_PRESETS.filter(p => p.type === 'pelanggaran');
  const prestasiList = POINT_PRESETS.filter(p => p.type === 'prestasi');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div
        id="rules-directory-modal"
        className="bg-white rounded-2xl max-w-2xl w-full my-6 max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Pedoman Poin OSIS-MPK 06 Bandung
              </h3>
              <p className="text-xs text-slate-500">
                Surat Keputusan Bersama Pembina & Komisi Kedisiplinan MPK SMAN 6 Bandung
              </p>
            </div>
          </div>
          <button
            id="btn-close-rules-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold">
          <button
            id="tab-rule-pelanggaran"
            onClick={() => setTab('pelanggaran')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              tab === 'pelanggaran'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Katalog Pelanggaran (-)</span>
          </button>

          <button
            id="tab-rule-prestasi"
            onClick={() => setTab('prestasi')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              tab === 'prestasi'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Katalog Prestasi (+)</span>
          </button>

          <button
            id="tab-rule-sp"
            onClick={() => setTab('sp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              tab === 'sp'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Mekanisme SP & Poin</span>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-5 flex-1 space-y-3">
          {tab === 'pelanggaran' && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-500 mb-3">
                Daftar standar pengurangan poin bagi pengurus yang melanggar AD/ART atau tata tertib OSIS-MPK 06:
              </p>
              {pelanggaranList.map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-rose-50/40 rounded-xl border border-rose-100 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.title}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 font-medium">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 text-xs font-extrabold rounded-lg bg-rose-600 text-white">
                    -{item.defaultPoints} Poin
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'prestasi' && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-500 mb-3">
                Daftar standar penambahan poin apresiasi atas kinerja unggul, inisiatif, dan prestasi pengurus:
              </p>
              {prestasiList.map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.title}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 text-xs font-extrabold rounded-lg bg-emerald-600 text-white">
                    +{item.defaultPoints} Poin
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'sp' && (
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">Mekanisme Dasar Poin</h4>
                <p className="leading-relaxed">
                  Setiap pengurus OSIS dan MPK SMAN 6 Bandung dibekali modal awal <strong>100 Poin</strong> pada awal masa bakti. Poin akan bertambah apabila mencatat prestasi dan berkurang apabila melakukan pelanggaran.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <span className="font-bold text-emerald-800 block text-xs">≥ 100 Poin: Pengurus Teladan</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">Memenuhi kriteria apresiasi tahunan dan piagam kehormatan OSIS-MPK.</p>
                </div>
                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                  <span className="font-bold text-blue-800 block text-xs">85 - 99 Poin: Kondisi Baik</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">Kinerja stabil dan menjalankan amanah dengan disiplin.</p>
                </div>
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                  <span className="font-bold text-amber-800 block text-xs">70 - 84 Poin: Status Waspada</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">Mendapat teguran lisan dari Koordinator Sekbid / Komisi.</p>
                </div>
                <div className="p-3 rounded-xl border border-orange-200 bg-orange-50/50">
                  <span className="font-bold text-orange-800 block text-xs">55 - 69 Poin: Surat Peringatan 1 (SP 1)</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">Konseling wajib bersama BPH dan Komisi Kedisiplinan MPK.</p>
                </div>
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
                  <span className="font-bold text-rose-800 block text-xs">40 - 54 Poin: Surat Peringatan 2 (SP 2)</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">Skorsing dari kepanitiaan dan surat pemberitahuan orang tua.</p>
                </div>
                <div className="p-3 rounded-xl border border-red-300 bg-red-100/60">
                  <span className="font-bold text-red-900 block text-xs">&lt; 40 Poin: Surat Peringatan 3 (SP 3)</span>
                  <p className="text-slate-700 text-[11px] mt-0.5">Sidang Istimewa MPK & rekomendasi pemberhentian dari kepengurusan.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            id="btn-rules-close-done"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
