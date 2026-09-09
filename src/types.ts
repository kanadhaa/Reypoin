export type UserRole = 'admin' | 'pengurus';

export interface User {
  id: string;
  name: string;
  nis: string; // Nomor Induk Siswa
  username: string;
  password?: string;
  email: string;
  role: UserRole;
  organization: 'OSIS' | 'MPK';
  division: string; // e.g. "Sekbid 1 - Keagamaan", "Komisi Disiplin", "BPH OSIS", "Sekbid 9 - TIK"
  position: string; // e.g. "Ketua", "Wakil Ketua", "Sekretaris", "Koordinator", "Anggota"
  avatarUrl?: string;
  phone?: string;
  classGrade: string; // e.g. "XI MIPA 2", "XII IPS 1"
  initialPoints: number; // default base: 100
  currentPoints: number;
  lastActive?: string;
}

export type PointType = 'prestasi' | 'pelanggaran';

export interface PointCategoryPreset {
  id: string;
  title: string;
  type: PointType;
  defaultPoints: number;
  category: string;
  description: string;
}

export interface PointTransaction {
  id: string;
  userId: string; // Pengurus yang menerima poin
  userName: string;
  userDivision: string;
  type: PointType;
  points: number; // positive number (+15 or -10)
  category: string;
  title: string;
  description: string;
  recordedByAdminId: string;
  recordedByAdminName: string;
  timestamp: string; // ISO string
  evidenceUrl?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  transactionId?: string;
  title: string;
  message: string;
  type: PointType | 'info';
  pointsChanged?: number;
  timestamp: string;
  isRead: boolean;
}

export interface PeriodAccumulationPoint {
  dateLabel: string;
  rawDate: string;
  points: number;
  prestasiTotal: number;
  pelanggaranTotal: number;
}
