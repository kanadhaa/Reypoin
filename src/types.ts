export type UserRole = 'moderator' | 'admin' | 'pengurus';

export interface AdminPermissions {
  canManagePoints: boolean;        // Catat & kelola poin prestasi / pelanggaran
  canManageMembers: boolean;       // Tambah/edit data anggota & buat akun
  canManageJarkom: boolean;        // Buat & kelola siaran jarkom kegiatan
  canManageNotulensi: boolean;     // Tulis & kirim notulensi rapat
  canManageKeuangan: boolean;      // Kelola laporan keuangan kegiatan
  canManageEvaluasi: boolean;      // Tulis & kelola rekapan evaluasi kegiatan
  canManageCalendar: boolean;      // Tambah & kelola agenda kalender kegiatan
}

export interface User {
  id: string;
  name: string;
  nis: string; // Nomor Induk Siswa
  username: string;
  password?: string;
  email: string;
  role: UserRole;
  adminPermissions?: AdminPermissions; // Hak akses khusus untuk Admin (diatur oleh Moderator)
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

// Financial Record attached to Event / Kegiatan
export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  recordedByName: string;
  receiptNote?: string;
}

// Evaluation Record attached to Event / Kegiatan
export interface EventEvaluation {
  id: string;
  aspect: 'pra_acara' | 'hari_h' | 'pasca_acara' | 'keuangan' | 'umum';
  title: string;
  positives: string;       // Hal yang berjalan baik / prestasi kegiatan
  challenges: string;      // Kendala / hambatan di lapangan
  recommendation: string;  // Rekomendasi perbaikan ke depan
  authorName: string;
  timestamp: string;
}

// Meeting Minute (Notulensi Rapat) attached to Event / Kegiatan
export interface MeetingMinute {
  id: string;
  title: string;           // Judul / Agenda Rapat
  date: string;
  location: string;
  chairperson: string;     // Pimpinan Rapat
  notetaker: string;       // Notulis
  attendeesSummary: string; // e.g. "Hadir: 32 Pengurus, Sakit: 1"
  discussionPoints: string; // Poin-poin inti pembahasan rapat
  actionItems: string;     // Keputusan, pembagian tugas & tindak lanjut
  timestamp: string;
}

// Jarkom (Jaringan Komunikasi / Broadcast Info)
export interface JarkomBroadcast {
  id: string;
  title: string;           // Judul Informasi Jarkom
  targetAudience: string;  // e.g. "Seluruh Pengurus OSIS-MPK", "Perwakilan Kelas X & XI"
  scheduledDate: string;
  messageContent: string;  // Teks format WhatsApp yang siap disalin
  authorName: string;
  isBroadcasted: boolean;
  timestamp: string;
}

// Main Activity Calendar Event
export interface ActivityEvent {
  id: string;
  title: string;              // Nama Kegiatan / Proker / Rapat
  date: string;               // Tanggal YYYY-MM-DD
  time?: string;              // e.g. "09:00 - 13:00 WIB"
  location: string;           // e.g. "Aula Graha Kartika / Ruang OSIS"
  organizer: 'OSIS' | 'MPK' | 'BERSAMA';
  division: string;           // Sekbid / Komisi
  description: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

  // Sub-modules
  financialRecords?: FinancialRecord[];
  evaluations?: EventEvaluation[];
  meetingMinutes?: MeetingMinute[];
  broadcasts?: JarkomBroadcast[];

  createdBy: string;
  createdById: string;
  createdAt: string;
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
