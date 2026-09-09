import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { setCurrentUser, saveUsers } from '../lib/storage';
import { saveUserFirebase } from '../lib/firebase';
import { 
  Lock, 
  User as UserIcon, 
  Shield, 
  X, 
  LogIn, 
  UserPlus, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'switch'>('login');
  
  // Login form state
  const [usernameOrNis, setUsernameOrNis] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regNis, setRegNis] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regClass, setRegClass] = useState('XI MIPA 2');
  const [regOrg, setRegOrg] = useState<'OSIS' | 'MPK'>('OSIS');
  const [regDivision, setRegDivision] = useState('Sekbid 9 - TIK, Publikasi & Media');
  const [regPosition, setRegPosition] = useState('Anggota');
  const [regRole, setRegRole] = useState<UserRole>('pengurus');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!usernameOrNis.trim()) {
      setLoginError('NIS atau Username wajib diisi untuk verifikasi identitas.');
      return;
    }

    if (!password || password.trim() === '') {
      setLoginError('Kata sandi wajib diisi. Masukkan kata sandi akun Anda.');
      return;
    }

    const targetUser = users.find(
      u => u.username.toLowerCase() === usernameOrNis.trim().toLowerCase() ||
           u.nis === usernameOrNis.trim() ||
           u.email.toLowerCase() === usernameOrNis.trim().toLowerCase()
    );

    if (!targetUser) {
      setLoginError('Akun tidak ditemukan! Periksa kembali NIS atau Username yang Anda masukkan.');
      return;
    }

    const expectedPassword = targetUser.password || (targetUser.role === 'admin' ? 'admin123' : 'pengurus123');
    if (password !== expectedPassword) {
      setLoginError('Kata sandi salah! Verifikasi keamanan gagal.');
      return;
    }

    // Authenticate successfully
    setCurrentUser(targetUser);
    onClose();
  };

  const handleSelectAccountForLogin = (user: User) => {
    setUsernameOrNis(user.username);
    setPassword('');
    setLoginError('');
    setMode('login');
  };

  const handleFillCredentials = (uName: string, pass: string) => {
    setUsernameOrNis(uName);
    setPassword(pass);
    setLoginError('');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regNis || !regUsername) {
      alert('Nama, NIS, dan Username wajib diisi.');
      return;
    }

    // Check duplicate
    if (users.some(u => u.username.toLowerCase() === regUsername.toLowerCase() || u.nis === regNis)) {
      alert('Username atau NIS sudah terdaftar dalam sistem.');
      return;
    }

    const newUser: User = {
      id: 'usr-reg-' + Date.now(),
      name: regName,
      nis: regNis,
      username: regUsername.toLowerCase(),
      password: regPassword || '123456',
      email: `${regUsername.toLowerCase()}@sman6bdg.sch.id`,
      role: regRole,
      organization: regOrg,
      division: regDivision,
      position: regPosition,
      classGrade: regClass,
      initialPoints: 100,
      currentPoints: 100,
    };

    const updated = [...users, newUser];
    saveUsers(updated);
    saveUserFirebase(newUser);
    setCurrentUser(newUser);
    alert(`Akun baru berhasil dibuat! Selamat datang di OSIS-MPK 06 Bandung, ${regName}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div
        id="auth-modal"
        className="bg-white rounded-2xl max-w-lg w-full my-6 p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {mode === 'login' && 'Autentikasi Akun Pribadi'}
                {mode === 'register' && 'Pendaftaran Pengurus Baru'}
                {mode === 'switch' && 'Pilih Akun / Quick Switch'}
              </h3>
              <p className="text-xs text-slate-500">
                Sistem Poin Terintegrasi OSIS & MPK SMAN 6 Bandung
              </p>
            </div>
          </div>
          <button
            id="btn-close-auth-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Pill if logged in */}
        {currentUser && (
          <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500">Sesi Aktif:</span>
              <span className="font-bold text-slate-800">{currentUser.name}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {currentUser.role.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Tabs: Login / Register / Quick Switch */}
        <div className="flex border-b border-slate-200 mt-4 text-xs font-semibold">
          <button
            id="tab-auth-login"
            onClick={() => setMode('login')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Masuk Akun
          </button>
          <button
            id="tab-auth-quick"
            onClick={() => setMode('switch')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              mode === 'switch'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Direktori Akun Pengurus
          </button>
          <button
            id="tab-auth-register"
            onClick={() => setMode('register')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Daftar Pengurus Baru
          </button>
        </div>

        {/* 1. Login Mode */}
        {mode === 'login' && (
          <div className="py-4 space-y-4">
            {/* Dedicated Primary Accounts Showcase */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Kredensial Akun Resmi:
                </span>
                <span className="text-[10px] text-slate-400">Pilih akun untuk masuk instan</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Akun Admin Card */}
                <div className="p-3 rounded-xl bg-white border border-purple-200 shadow-2xs hover:border-purple-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-extrabold text-xs text-purple-950 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        Administrator Resmi
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 uppercase">
                        Hak Admin
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-1.5">
                      Pencatatan poin, kelola kedisiplinan & ekspor laporan resmi.
                    </p>
                    <div className="bg-purple-50/60 p-1.5 rounded-lg text-[11px] font-mono text-purple-900 mb-2 border border-purple-100 space-y-0.5">
                      <div>User: <strong className="select-all">admin</strong></div>
                      <div>Sandi: <strong className="select-all">admin123</strong></div>
                    </div>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      id="btn-fill-admin-creds"
                      onClick={() => handleFillCredentials('admin', 'admin123')}
                      className="w-full py-1.5 text-center text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      Gunakan Akun Admin
                    </button>
                  </div>
                </div>

                {/* 2. Akun Pengurus Biasa Card */}
                <div className="p-3 rounded-xl bg-white border border-blue-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-extrabold text-xs text-blue-950 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                        Pengurus Biasa Resmi
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                        Siswa / Anggota
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-1.5">
                      Melihat 100 poin pribadi, riwayat kedisiplinan & prestasi.
                    </p>
                    <div className="bg-blue-50/60 p-1.5 rounded-lg text-[11px] font-mono text-blue-900 mb-2 border border-blue-100 space-y-0.5">
                      <div>User: <strong className="select-all">pengurus</strong></div>
                      <div>Sandi: <strong className="select-all">pengurus123</strong></div>
                    </div>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      id="btn-fill-pengurus-creds"
                      onClick={() => handleFillCredentials('pengurus', 'pengurus123')}
                      className="w-full py-1.5 text-center text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      Gunakan Akun Pengurus
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-sm pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIS / Username / Email Pengurus
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="input-login-username"
                    type="text"
                    required
                    placeholder="Contoh: admin atau pengurus"
                    value={usernameOrNis}
                    onChange={e => setUsernameOrNis(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan sandi akun Anda (contoh: admin123 atau pengurus123)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                id="btn-submit-login"
                className="w-full py-2.5 text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Verifikasi & Masuk ke Sistem</span>
              </button>
            </form>
          </div>
        )}

        {/* 2. Quick Switch Mode */}
        {mode === 'switch' && (
          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
            <p className="text-xs text-slate-500 mb-2">
              Pilih salah satu profil di bawah untuk mengisi formulir login dan memverifikasi kata sandi:
            </p>

            {/* Admin Section */}
            <div>
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block mb-1.5">
                Akun Hak Akses Admin (Pencatat Poin & BPH)
              </span>
              <div className="space-y-1.5">
                {users
                  .filter(u => u.role === 'admin')
                  .sort((a, b) => (a.username === 'admin' ? -1 : b.username === 'admin' ? 1 : 0))
                  .map(u => (
                    <div
                      key={u.id}
                      onClick={() => handleSelectAccountForLogin(u)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
                        u.username === 'admin'
                          ? 'border-purple-300 bg-purple-50/50 hover:bg-purple-100/60 shadow-2xs'
                          : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                              {u.name}
                            </p>
                            {u.username === 'admin' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-200 text-purple-900 rounded font-mono">
                                user: admin
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{u.position} • {u.division}</p>
                        </div>
                      </div>
                      <span className="text-xs text-purple-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Pilih <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Pengurus Biasa Section */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1.5">
                Akun Hak Akses Pengurus Biasa (Lihat Poin Pribadi)
              </span>
              <div className="space-y-1.5">
                {users
                  .filter(u => u.role === 'pengurus')
                  .sort((a, b) => (a.username === 'pengurus' ? -1 : b.username === 'pengurus' ? 1 : 0))
                  .map(u => (
                    <div
                      key={u.id}
                      onClick={() => handleSelectAccountForLogin(u)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
                        u.username === 'pengurus'
                          ? 'border-blue-300 bg-blue-50/50 hover:bg-blue-100/60 shadow-2xs'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                              {u.name}
                            </p>
                            {u.username === 'pengurus' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-200 text-blue-900 rounded font-mono">
                                user: pengurus
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{u.division} • Poin: {u.currentPoints}</p>
                        </div>
                      </div>
                      <span className="text-xs text-blue-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Pilih <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Register Mode */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="py-4 space-y-3 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                id="input-reg-name"
                type="text"
                required
                placeholder="Contoh: Farhan Maulana"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Induk Siswa (NIS)</label>
                <input
                  id="input-reg-nis"
                  type="text"
                  required
                  placeholder="242510..."
                  value={regNis}
                  onChange={e => setRegNis(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username Login</label>
                <input
                  id="input-reg-username"
                  type="text"
                  required
                  placeholder="farhan06"
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organisasi</label>
                <select
                  value={regOrg}
                  onChange={e => setRegOrg(e.target.value as 'OSIS' | 'MPK')}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="OSIS">OSIS SMAN 6</option>
                  <option value="MPK">MPK SMAN 6</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
                <input
                  type="text"
                  value={regClass}
                  onChange={e => setRegClass(e.target.value)}
                  placeholder="XI MIPA 2"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Divisi / Sekbid / Komisi</label>
              <input
                type="text"
                value={regDivision}
                onChange={e => setRegDivision(e.target.value)}
                placeholder="Contoh: Sekbid 3 - Bela Negara"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hak Akses (Role)</label>
                <select
                  value={regRole}
                  onChange={e => setRegRole(e.target.value as UserRole)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pengurus">Pengurus Biasa</option>
                  <option value="admin">Admin / BPH</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-register"
              className="w-full py-2.5 text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftarkan & Langsung Masuk</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
