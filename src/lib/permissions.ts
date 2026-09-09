import { User, AdminPermissions } from '../types';

export const ALL_PERMISSIONS: AdminPermissions = {
  canManagePoints: true,
  canManageMembers: true,
  canManageJarkom: true,
  canManageNotulensi: true,
  canManageKeuangan: true,
  canManageEvaluasi: true,
  canManageCalendar: true,
};

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  canManagePoints: true,
  canManageMembers: false, // Moderator can selectively enable this for admins
  canManageJarkom: true,
  canManageNotulensi: true,
  canManageKeuangan: false, // Only treasurer / moderator by default
  canManageEvaluasi: true,
  canManageCalendar: true,
};

// Permission labels and descriptions for Moderator UI
export const PERMISSION_DEFINITIONS: {
  key: keyof AdminPermissions;
  label: string;
  description: string;
  category: string;
}[] = [
  {
    key: 'canManagePoints',
    label: 'Pencatatan Poin Kedisiplinan',
    description: 'Bisa mencatat poin pelanggaran & prestasi pengurus serta mengunduh rekap.',
    category: 'Kedisiplinan',
  },
  {
    key: 'canManageMembers',
    label: 'Manajemen Akun & Kredensial',
    description: 'Bisa mendaftarkan akun pengurus baru dan mengubah sandi anggota.',
    category: 'Keanggotaan',
  },
  {
    key: 'canManageCalendar',
    label: 'Kelola Agenda Kalender',
    description: 'Bisa membuat, menjadwalkan, dan mengedit kegiatan di kalender resmi.',
    category: 'Program Kerja',
  },
  {
    key: 'canManageJarkom',
    label: 'Buat & Siarkan Jarkom',
    description: 'Bisa membuat draft jarkom siaran pengumuman ke WhatsApp/media pengurus.',
    category: 'Publikasi & Humas',
  },
  {
    key: 'canManageNotulensi',
    label: 'Notulensi Rapat & Pembahasan',
    description: 'Bisa menulis risalah rapat, poin keputusan, dan pembagian tugas (action items).',
    category: 'Sekretariat',
  },
  {
    key: 'canManageKeuangan',
    label: 'Laporan Keuangan & Anggaran',
    description: 'Bisa mencatat pemasukan, pengeluaran kas, dan saldo anggaran per kegiatan.',
    category: 'Kebendaharaan',
  },
  {
    key: 'canManageEvaluasi',
    label: 'Rekapan Evaluasi Acara',
    description: 'Bisa mengisi kendala, kelebihan, dan rekomendasi pasca pelaksanaan program kerja.',
    category: 'Evaluasi & LPJ',
  },
];

/**
 * Check whether a user has a specific administrative permission.
 * - Moderator: ALWAYS has all permissions.
 * - Admin: Checked against user.adminPermissions (or defaults).
 * - Pengurus: No administrative permissions.
 */
export function hasPermission(
  user: User | null | undefined,
  permission: keyof AdminPermissions
): boolean {
  if (!user) return false;
  if (user.role === 'moderator') return true;
  if (user.role === 'admin') {
    if (user.adminPermissions && typeof user.adminPermissions[permission] === 'boolean') {
      return user.adminPermissions[permission];
    }
    return DEFAULT_ADMIN_PERMISSIONS[permission];
  }
  return false;
}

/**
 * Check if the user has management view access (Moderator or Admin)
 */
export function isStaffOrAdmin(user: User | null | undefined): boolean {
  return user?.role === 'moderator' || user?.role === 'admin';
}

/**
 * Check if user is supreme Moderator
 */
export function isModerator(user: User | null | undefined): boolean {
  return user?.role === 'moderator';
}
