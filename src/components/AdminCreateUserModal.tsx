import React, { useState } from 'react';
import { User, UserRole, NotificationItem } from '../types';
import { saveUsers, getStoredNotifications, saveNotifications } from '../lib/storage';
import { saveUserFirebase } from '../lib/firebase';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';

interface AdminCreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentAdmin: User;
  onSuccess: (newUser: User) => void;
}

export const AdminCreateUserModal: React.FC<AdminCreateUserModalProps> = ({
  isOpen,
  onClose,
  users,
  currentAdmin,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [nis, setNis] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [classGrade, setClassGrade] = useState('XI MIPA 2');
  const [organization, setOrganization] = useState<'OSIS' | 'MPK'>('OSIS');
  const [division, setDivision] = useState('Sekbid 9 - TIK, Publikasi & Media');
  const [position, setPosition] = useState('Anggota');
  const [role, setRole] = useState<UserRole>('pengurus');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // OSIS division options
  const osisDivisions = [
    'BPH OSIS (Inti)',
    'Sekbid 1 - Pembinaan Keimanan & Ketaqwaan',
    'Sekbid 2 - Budi Pekerti & Akhlak Mulia',
    'Sekbid 3 - Kepribadian Unggul & Bela Negara',
    'Sekbid 4 - Prestasi Akademik, Seni & Olahraga',
    'Sekbid 5 - Demokrasi, HAM & Pendidikan Politik',
    'Sekbid 6 - Kreativitas, Keterampilan & Kewirausahaan',
    'Sekbid 7 - Kualitas Jasmani, Kesehatan & Gizi',
    'Sekbid 8 - Sastra & Budaya',
    'Sekbid 9 - TIK, Publikasi & Media',
    'Sekbid 10 - Komunikasi Bahasa Inggris & Hubungan Luar',
  ];

  // MPK division options
  const mpkDivisions = [
    'BPH MPK (Pimpinan)',
    'Komisi A - Aspirasi & Komunikasi Siswa',
    'Komisi B - Pengawasan Program Kerja OSIS',
    'Komisi C - Kedisiplinan & Tata Tertib Pengurus',
    'Komisi D - Anggaran & Logistik Organisasi',
  ];

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto suggest username if username is empty or was previously auto generated
    if (!username || username === name.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      const suggested = val.toLowerCase().trim().split(' ')[0].replace(/[^a-z0-9]/g, '');
      setUsername(suggested);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (currentAdmin.role !== 'admin') {
      setErrorMsg('Akses Ditolak: Hanya Administrator yang berhak mendaftarkan akun baru!');
      return;
    }

    if (!name.trim() || !nis.trim() || !username.trim()) {
      setErrorMsg('Nama lengkap, NIS, dan Username wajib diisi.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Kata sandi untuk akun baru wajib ditentukan.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanNis = nis.trim();

    // Check duplicate username
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      setErrorMsg(`Username "${cleanUsername}" sudah digunakan oleh pengurus lain. Gunakan username lain.`);
      return;
    }

    // Check duplicate NIS
    if (users.some(u => u.nis === cleanNis)) {
      setErrorMsg(`NIS "${cleanNis}" sudah terdaftar dalam pangkalan data pengurus.`);
      return;
    }

    setIsSubmitting(true);

    const newUser: User = {
      id: `usr-reg-${Date.now()}`,
      name: name.trim(),
      nis: cleanNis,
      username: cleanUsername,
      password: password.trim(),
      email: `${cleanUsername}@sman6bdg.sch.id`,
      role: role,
      organization: organization,
      division: division,
      position: position,
      classGrade: classGrade.trim() || 'XI MIPA 2',
      initialPoints: 100,
      currentPoints: 100,
      lastActive: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    saveUserFirebase(newUser);

    // Add welcome notification for the newly created user
    const currentNotifs = getStoredNotifications();
    const welcomeNotif: NotificationItem = {
      id: `notif-reg-${Date.now()}`,
      userId: newUser.id,
      title: 'Akun Resmi Berhasil Diaktifkan',
      message: `Selamat datang di Portal Resmi OSIS-MPK SMA Negeri 6 Bandung. Akun Anda telah dibuat dan disahkan oleh Administrator (${currentAdmin.name}) dengan modal awal 100 poin kedisiplinan.`,
      type: 'info',
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    saveNotifications([welcomeNotif, ...currentNotifs]);

    setIsSubmitting(false);
    setSuccessMsg(`Akun untuk ${newUser.name} (${cleanUsername}) berhasil didaftarkan!`);

    setTimeout(() => {
      onSuccess(newUser);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div 
        id="admin-create-user-modal"
        className="bg-white rounded-2xl max-w-lg w-full my-6 p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Tambah Akun Pengurus Baru
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 uppercase">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pendaftaran resmi anggota OSIS & MPK SMA Negeri 6 Bandung
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-create-user-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Info */}
        <div className="mt-3 p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
          <span>
            Hanya <strong>Administrator</strong> yang memiliki otoritas untuk mendaftarkan akun pengurus baru.
          </span>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs sm:text-sm">
          {/* Nama Lengkap */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Lengkap Pengurus <span className="text-rose-500">*</span>
            </label>
            <input
              id="create-user-input-name"
              type="text"
              required
              placeholder="Contoh: Reynatan Oktaviane"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Grid NIS & Kelas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                NIS (Nomor Induk Siswa) <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-user-input-nis"
                type="text"
                required
                placeholder="Contoh: 242510088"
                value={nis}
                onChange={e => setNis(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kelas & Tingkat <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-user-input-class"
                type="text"
                required
                placeholder="Contoh: XI MIPA 2 / X-4"
                value={classGrade}
                onChange={e => setClassGrade(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Grid Organisasi & Hak Akses (Role) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Organisasi
              </label>
              <select
                id="create-user-select-org"
                value={organization}
                onChange={e => {
                  const org = e.target.value as 'OSIS' | 'MPK';
                  setOrganization(org);
                  setDivision(org === 'OSIS' ? osisDivisions[0] : mpkDivisions[0]);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="OSIS">OSIS (Organisasi Siswa Intra Sekolah)</option>
                <option value="MPK">MPK (Majelis Perwakilan Kelas)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Hak Akses (Role)
              </label>
              <select
                id="create-user-select-role"
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="pengurus">Pengurus Biasa (Lihat Poin Pribadi)</option>
                <option value="admin">Administrator (Pencatat Poin & Kelola Sistem)</option>
              </select>
            </div>
          </div>

          {/* Sekbid / Komisi & Jabatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Seksi Bidang / Komisi
              </label>
              <select
                id="create-user-select-division"
                value={division}
                onChange={e => setDivision(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              >
                {(organization === 'OSIS' ? osisDivisions : mpkDivisions).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jabatan
              </label>
              <select
                id="create-user-select-position"
                value={position}
                onChange={e => setPosition(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Ketua">Ketua</option>
                <option value="Wakil Ketua">Wakil Ketua</option>
                <option value="Koordinator">Koordinator</option>
                <option value="Sekretaris">Sekretaris</option>
                <option value="Bendahara">Bendahara</option>
                <option value="Anggota">Anggota</option>
              </select>
            </div>
          </div>

          {/* Kredensial Login: Username & Password */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              Kredensial Masuk untuk Pengurus Baru:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Username Akun <span className="text-rose-500">*</span>
                </label>
                <input
                  id="create-user-input-username"
                  type="text"
                  required
                  placeholder="reynatan"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Kata Sandi Awal <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="create-user-input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Tentukan sandi"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-1.5 pr-8 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              *Berikan username dan kata sandi ini kepada pengurus bersangkutan agar dapat login dan memantau poinnya.
            </p>
          </div>

          {/* Modal Awal Poin */}
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <span className="font-semibold">Modal Poin Disiplin Awal:</span>
            <span className="font-black text-sm text-emerald-700">100 Poin (Standar SK)</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-submit-create-user"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 text-white rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              <span>Daftarkan & Sahkan Akun</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
