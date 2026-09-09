import { User, PointTransaction, NotificationItem, PointType } from '../types';
import { INITIAL_USERS, INITIAL_TRANSACTIONS, INITIAL_NOTIFICATIONS } from '../data/mockData';

const USERS_KEY = 'osis06_users_v1';
const TRANSACTIONS_KEY = 'osis06_transactions_v1';
const NOTIFICATIONS_KEY = 'osis06_notifications_v1';
const CURRENT_USER_KEY = 'osis06_current_user_v1';

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed: User[] = JSON.parse(raw);
    // Ensure primary demo admin and regular pengurus always exist in the list
    let modified = false;
    const adminExists = parsed.some(u => u.username === 'admin' || u.id === 'usr-admin-utama');
    const memberExists = parsed.some(u => u.username === 'pengurus' || u.id === 'usr-pengurus-biasa');

    if (!adminExists && INITIAL_USERS[0]) {
      parsed.unshift(INITIAL_USERS[0]);
      modified = true;
    }
    if (!memberExists && INITIAL_USERS[1]) {
      parsed.splice(1, 0, INITIAL_USERS[1]);
      modified = true;
    }
    if (modified) {
      localStorage.setItem(USERS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse users', e);
    return INITIAL_USERS;
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new CustomEvent('osis_data_changed'));
}

export function getStoredTransactions(): PointTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse transactions', e);
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(transactions: PointTransaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  window.dispatchEvent(new CustomEvent('osis_data_changed'));
}

export function getStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse notifications', e);
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveNotifications(notifications: NotificationItem[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent('osis_data_changed'));
}

export function getStoredCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
  window.dispatchEvent(new CustomEvent('osis_auth_changed'));
}

// Sound notification with Web Audio API (safe, no external CDN needed)
export function playNotificationChime(type: 'prestasi' | 'pelanggaran' | 'info' = 'info') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'prestasi') {
      // Happy ascending chord (major arpeggio)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'pelanggaran') {
      // Alert downward tone
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
      osc.frequency.setValueAtTime(261.63, ctx.currentTime + 0.15); // C4
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Gentle chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (err) {
    // Audio contexts may be silenced or blocked by browser policy without user gesture
  }
}

// Add a point transaction with automatic recalculation & real-time notification
export function recordPointTransaction(params: {
  userId: string;
  type: PointType;
  points: number;
  category: string;
  title: string;
  description: string;
  adminUser: User;
}): { transaction: PointTransaction; user: User; notification: NotificationItem } {
  const users = getStoredUsers();
  const transactions = getStoredTransactions();
  const notifications = getStoredNotifications();

  const targetIndex = users.findIndex(u => u.id === params.userId);
  if (targetIndex === -1) {
    throw new Error('Pengurus tidak ditemukan');
  }

  const targetUser = { ...users[targetIndex] };
  const pointDelta = params.type === 'prestasi' ? Math.abs(params.points) : -Math.abs(params.points);
  const newPoints = Math.max(0, targetUser.currentPoints + pointDelta);
  targetUser.currentPoints = newPoints;
  users[targetIndex] = targetUser;

  const newTx: PointTransaction = {
    id: 'trx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    userId: targetUser.id,
    userName: targetUser.name,
    userDivision: targetUser.division,
    type: params.type,
    points: Math.abs(params.points),
    category: params.category,
    title: params.title,
    description: params.description,
    recordedByAdminId: params.adminUser.id,
    recordedByAdminName: `${params.adminUser.name} (${params.adminUser.position})`,
    timestamp: new Date().toISOString(),
  };

  const newNotif: NotificationItem = {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    userId: targetUser.id,
    transactionId: newTx.id,
    title: params.type === 'prestasi' 
      ? `Penambahan Poin Prestasi (+${newTx.points})` 
      : `Pengurangan Poin Kedisiplinan (-${newTx.points})`,
    message: params.type === 'prestasi'
      ? `Selamat! Poin Anda bertambah ${newTx.points} untuk: "${params.title}". Dicatat oleh ${params.adminUser.name}. Poin total sekarang: ${newPoints}.`
      : `Poin Anda dikurangi ${newTx.points} untuk: "${params.title}". Dicatat oleh ${params.adminUser.name}. Poin total sekarang: ${newPoints}.`,
    type: params.type,
    pointsChanged: pointDelta,
    timestamp: new Date().toISOString(),
    isRead: false,
  };

  // Save to storage
  saveUsers(users);
  saveTransactions([newTx, ...transactions]);
  saveNotifications([newNotif, ...notifications]);

  // If current logged-in user is this target user, update their cached session
  const currentUser = getStoredCurrentUser();
  if (currentUser && currentUser.id === targetUser.id) {
    setCurrentUser(targetUser);
  }

  // Play audio cue
  playNotificationChime(params.type);

  return { transaction: newTx, user: targetUser, notification: newNotif };
}

export function markNotificationAsRead(notifId: string): void {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => n.id === notifId ? { ...n, isRead: true } : n);
  saveNotifications(updated);
}

export function markAllNotificationsAsRead(userId: string): void {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n);
  saveNotifications(updated);
}

export function clearUserNotifications(userId: string): void {
  const notifications = getStoredNotifications();
  const updated = notifications.filter(n => n.userId !== userId);
  saveNotifications(updated);
}

export function getStatusBadge(points: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  spLevel: number;
} {
  if (points >= 100) {
    return {
      label: 'Sangat Baik / Teladan',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      description: 'Pengurus teladan dengan catatan poin sempurna & aktif berkontribusi.',
      spLevel: 0,
    };
  }
  if (points >= 85) {
    return {
      label: 'Kondisi Baik',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      description: 'Menjaga kedisiplinan dan tanggung jawab dengan baik.',
      spLevel: 0,
    };
  }
  if (points >= 70) {
    return {
      label: 'Waspada',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      description: 'Perlu memperhatikan kedisiplinan rapat dan tugas agar poin tidak terus berkurang.',
      spLevel: 0,
    };
  }
  if (points >= 55) {
    return {
      label: 'Peringatan SP 1',
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      description: 'Surat Peringatan 1: Wajib konseling dengan BPH & Komisi Disiplin MPK.',
      spLevel: 1,
    };
  }
  if (points >= 40) {
    return {
      label: 'Peringatan SP 2',
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      description: 'Surat Peringatan 2: Skorsing dari kepanitiaan dan panggilan bersama orang tua.',
      spLevel: 2,
    };
  }
  return {
    label: 'Evaluasi Khusus (SP 3)',
    color: 'text-red-800',
    bg: 'bg-red-100',
    border: 'border-red-300',
    description: 'Surat Peringatan 3: Rekomendasi pemberhentian dari kepengurusan OSIS-MPK.',
    spLevel: 3,
  };
}

export function resetToDemoData(): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(INITIAL_USERS[3]));
  window.dispatchEvent(new CustomEvent('osis_data_changed'));
  window.dispatchEvent(new CustomEvent('osis_auth_changed'));
}
