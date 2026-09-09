import React, { useState } from 'react';
import { ShieldCheck, Lock, User as UserIcon, Eye, EyeOff, LogIn, AlertCircle, UserPlus, KeyRound } from 'lucide-react';
import { User } from '../types';

interface LoginGateProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({
  users,
  onLoginSuccess,
}) => {
  const [usernameOrNis, setUsernameOrNis] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!usernameOrNis.trim()) {
      setErrorMsg('NIS atau Username wajib diisi untuk verifikasi identitas.');
      return;
    }

    if (!password || password.trim() === '') {
      setErrorMsg('Kata sandi wajib diisi. Masukkan kata sandi akun Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const targetUser = users.find(
        u => u.username.toLowerCase() === usernameOrNis.trim().toLowerCase() ||
             u.nis === usernameOrNis.trim() ||
             u.email.toLowerCase() === usernameOrNis.trim().toLowerCase()
      );

      if (!targetUser) {
        setIsLoading(false);
        setErrorMsg('Akun tidak ditemukan. Periksa kembali NIS atau Username yang Anda masukkan.');
        return;
      }

      const expectedPassword = targetUser.password || (targetUser.role === 'admin' ? 'admin123' : 'pengurus123');
      if (password !== expectedPassword) {
        setIsLoading(false);
        setErrorMsg('Kata sandi salah! Verifikasi identitas akun gagal.');
        return;
      }

      setIsLoading(false);
      onLoginSuccess(targetUser);
    }, 250);
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-12 px-4">
      {/* Verification Shield Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl relative overflow-hidden">
        {/* Subtle Decorative Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-600"></div>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto mb-3.5 border border-indigo-100 shadow-2xs">
            <Lock className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider mb-2 border border-slate-200/80">
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span>Verifikasi Keamanan Wajib</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Portal Masuk Resmi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Sistem Informasi Manajemen Poin Kedisiplinan & Prestasi Pengurus OSIS-MPK SMA Negeri 6 Bandung
          </p>
        </div>

        {/* Verification Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              NIS atau Username Pengurus
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-gate-input-username"
                type="text"
                placeholder="Masukkan NIS atau Username terdaftar"
                value={usernameOrNis}
                onChange={e => setUsernameOrNis(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Kata Sandi Akun
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-gate-input-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi akun Anda"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                id="login-gate-toggle-password"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            id="login-gate-btn-submit"
            disabled={isLoading}
            className="w-full py-3 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-70 text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>Verifikasi & Masuk ke Sistem</span>
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sesi Resmi OSIS-MPK SMAN 6 Bandung</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium text-center sm:text-right">
            *Pembuatan akun baru hanya dapat dilakukan oleh <span className="font-bold text-slate-700">Administrator</span>
          </div>
        </div>
      </div>
    </div>
  );
};
