import React, { useState, useEffect } from 'react';
import { User, NotificationItem } from '../types';
import { saveUsers, getStoredNotifications, saveNotifications, playNotificationChime } from '../lib/storage';
import { saveUserFirebase } from '../lib/firebase';
import { 
  X, 
  KeyRound, 
  User as UserIcon, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Lock,
  Sparkles
} from 'lucide-react';

interface ChangeCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
  currentUser: User | null;
  allUsers: User[];
  onSuccess: (updatedUser: User) => void;
}

export const ChangeCredentialsModal: React.FC<ChangeCredentialsModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  allUsers,
  onSuccess,
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever targetUser opens
  useEffect(() => {
    if (targetUser) {
      setNewUsername(targetUser.username || '');
      setCurrentPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser) return null;

  const isSelf = currentUser?.id === targetUser.id;
  const isAdminManagingOther = currentUser?.role === 'admin' && !isSelf;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUsername = newUsername.trim().toLowerCase().replace(/\s+/g, '');

    if (!cleanUsername) {
      setErrorMsg('Username tidak boleh kosong.');
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMsg('Username minimal harus 3 karakter.');
      return;
    }

    // Check duplicate username against other accounts
    const isDuplicate = allUsers.some(
      u => u.id !== targetUser.id && u.username.toLowerCase() === cleanUsername
    );
    if (isDuplicate) {
      setErrorMsg(`Username "${cleanUsername}" sudah digunakan oleh pengurus lain. Silakan pilih username lain.`);
      return;
    }

    // If self-updating, verify current password if password or username is changed
    if (isSelf && targetUser.password) {
      if (!currentPasswordInput) {
        setErrorMsg('Harap masukkan kata sandi saat ini untuk memverifikasi identitas Anda.');
        return;
      }
      if (currentPasswordInput !== targetUser.password) {
        setErrorMsg('Kata sandi saat ini yang Anda masukkan salah.');
        return;
      }
    }

    // If changing password, validate new password
    if (newPassword.trim()) {
      if (newPassword.length < 4) {
        setErrorMsg('Kata sandi baru minimal harus 4 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi baru tidak sesuai.');
        return;
      }
    } else if (cleanUsername === targetUser.username.toLowerCase()) {
      setErrorMsg('Tidak ada perubahan yang dilakukan pada username maupun kata sandi.');
      return;
    }

    setIsSubmitting(true);

    const finalPassword = newPassword.trim() ? newPassword.trim() : targetUser.password;
    const updatedUser: User = {
      ...targetUser,
      username: cleanUsername,
      password: finalPassword,
      lastActive: new Date().toISOString(),
    };

    // Save to local storage
    const updatedUsersList = allUsers.map(u => (u.id === updatedUser.id ? updatedUser : u));
    saveUsers(updatedUsersList);

    // Save to Firestore
    saveUserFirebase(updatedUser);

    // Log notification
    const existingNotifs = getStoredNotifications();
    const credsNotif: NotificationItem = {
      id: `notif-creds-${Date.now()}`,
      userId: updatedUser.id,
      title: 'Kredensial Akun Diperbarui',
      message: isAdminManagingOther
        ? `Kredensial akun Anda (Username / Kata Sandi) telah diperbarui oleh Administrator (${currentUser?.name}).`
        : 'Anda telah berhasil memperbarui Username atau Kata Sandi akun Anda.',
      type: 'info',
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    saveNotifications([credsNotif, ...existingNotifs]);
    playNotificationChime('info');

    setIsSubmitting(false);
    setSuccessMsg('Kredensial berhasil diperbarui!');

    setTimeout(() => {
      onSuccess(updatedUser);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div 
        id="change-credentials-modal"
        className="bg-white rounded-2xl max-w-md w-full my-6 p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {isSelf ? 'Ubah Username & Sandi' : `Ubah Kredensial: ${targetUser.name}`}
              </h3>
              <p className="text-xs text-slate-500">
                {isAdminManagingOther
                  ? 'Administrator memiliki kewenangan mengatur kredensial anggota'
                  : 'Perbarui informasi masuk akun Anda secara mandiri'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-change-credentials-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Badge */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {targetUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 line-clamp-1">{targetUser.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded">
                  {targetUser.nis}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{targetUser.position} • {targetUser.division}</p>
            </div>
          </div>
          <span
            className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
              targetUser.role === 'admin'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {targetUser.role}
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
          {/* Username Field */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Username Baru</span>
              <span className="text-[11px] font-normal text-slate-400">Huruf/angka tanpa spasi</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-change-username"
                type="text"
                required
                placeholder="masukkan username"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs sm:text-sm"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Username digunakan untuk login bersama kata sandi Anda.
            </p>
          </div>

          {/* Current Password Field (Only for self-updating user) */}
          {isSelf && (
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Kata Sandi Saat Ini <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400">Diperlukan untuk konfirmasi keamanan</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-verify-current-password"
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  placeholder="Masukkan kata sandi lama Anda"
                  value={currentPasswordInput}
                  onChange={e => setCurrentPasswordInput(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* New Password Field */}
          <div className="pt-1 border-t border-slate-100">
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Kata Sandi Baru</span>
              <span className="text-[10px] text-slate-400">Kosongkan jika tidak ingin ganti sandi</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-change-new-password"
                type={showNewPass ? 'text' : 'password'}
                placeholder="Tentukan kata sandi baru (opsional)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password Field */}
          {newPassword.trim().length > 0 && (
            <div className="animate-in fade-in">
              <label className="block font-bold text-slate-700 mb-1">
                Ulangi Kata Sandi Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-change-confirm-password"
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  placeholder="Ketik ulang kata sandi baru"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-save-change-credentials"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>Simpan Kredensial Baru</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
