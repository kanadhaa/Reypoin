import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  writeBatch,
  query,
  orderBy,
  limit,
  updateDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, PointTransaction, NotificationItem, PointType } from '../types';
import { INITIAL_USERS, INITIAL_TRANSACTIONS, INITIAL_NOTIFICATIONS } from '../data/mockData';
import { 
  saveUsers, 
  saveTransactions, 
  saveNotifications, 
  getStoredUsers, 
  getStoredTransactions, 
  getStoredNotifications,
  getStoredCurrentUser,
  setCurrentUser,
  playNotificationChime
} from './storage';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom databaseId if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const USERS_COLLECTION = 'users';
export const TRANSACTIONS_COLLECTION = 'transactions';
export const NOTIFICATIONS_COLLECTION = 'notifications';

let isInitialized = false;
let isSyncing = false;

// Seed Initial Data to Firestore if collection is empty
export async function initializeFirestoreData() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const usersCol = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(query(usersCol, limit(1)));

    if (snapshot.empty) {
      console.log('[Firebase] Seeding initial data to Firestore...');
      const batch = writeBatch(db);

      // Seed Users
      INITIAL_USERS.forEach((u) => {
        const ref = doc(db, USERS_COLLECTION, u.id);
        batch.set(ref, u);
      });

      // Seed Transactions
      INITIAL_TRANSACTIONS.forEach((tx) => {
        const ref = doc(db, TRANSACTIONS_COLLECTION, tx.id);
        batch.set(ref, tx);
      });

      // Seed Notifications
      INITIAL_NOTIFICATIONS.forEach((n) => {
        const ref = doc(db, NOTIFICATIONS_COLLECTION, n.id);
        batch.set(ref, n);
      });

      await batch.commit();
      console.log('[Firebase] Initial data seeded successfully!');
    } else {
      // Ensure the dedicated admin & pengurus biasa accounts exist in Firestore
      const primaryAccounts = INITIAL_USERS.slice(0, 2);
      for (const account of primaryAccounts) {
        const userRef = doc(db, USERS_COLLECTION, account.id);
        await setDoc(userRef, account, { merge: true });
      }
    }
  } catch (error) {
    console.error('[Firebase] Error initializing Firestore data:', error);
  }
}

// Start real-time Firestore synchronization listeners
export function initRealtimeFirestoreSync(
  onStatusChange?: (status: { connected: boolean; lastSync?: Date; error?: string }) => void
) {
  // First seed if needed
  initializeFirestoreData().then(() => {
    if (onStatusChange) onStatusChange({ connected: true, lastSync: new Date() });
  }).catch((err) => {
    if (onStatusChange) onStatusChange({ connected: false, error: String(err) });
  });

  // Listen to Users
  const usersUnsub = onSnapshot(
    collection(db, USERS_COLLECTION),
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudUsers: User[] = [];
        snapshot.forEach((d) => {
          cloudUsers.push(d.data() as User);
        });
        saveUsers(cloudUsers);

        // Update active user in session if changed
        const current = getStoredCurrentUser();
        if (current) {
          const fresh = cloudUsers.find(u => u.id === current.id);
          if (fresh && (fresh.currentPoints !== current.currentPoints || fresh.role !== current.role)) {
            setCurrentUser(fresh);
          }
        }
        if (onStatusChange) onStatusChange({ connected: true, lastSync: new Date() });
      }
    },
    (err) => {
      console.warn('[Firebase] Users subscription error:', err);
      if (onStatusChange) onStatusChange({ connected: false, error: err.message });
    }
  );

  // Listen to Transactions
  const txUnsub = onSnapshot(
    query(collection(db, TRANSACTIONS_COLLECTION)),
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudTx: PointTransaction[] = [];
        snapshot.forEach((d) => {
          cloudTx.push(d.data() as PointTransaction);
        });
        // Sort newest first
        cloudTx.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        saveTransactions(cloudTx);
        if (onStatusChange) onStatusChange({ connected: true, lastSync: new Date() });
      }
    },
    (err) => {
      console.warn('[Firebase] Transactions subscription error:', err);
    }
  );

  // Listen to Notifications
  const notifUnsub = onSnapshot(
    query(collection(db, NOTIFICATIONS_COLLECTION)),
    (snapshot) => {
      if (!snapshot.empty) {
        const cloudNotifs: NotificationItem[] = [];
        snapshot.forEach((d) => {
          cloudNotifs.push(d.data() as NotificationItem);
        });
        // Sort newest first
        cloudNotifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        saveNotifications(cloudNotifs);
        if (onStatusChange) onStatusChange({ connected: true, lastSync: new Date() });
      }
    },
    (err) => {
      console.warn('[Firebase] Notifications subscription error:', err);
    }
  );

  return () => {
    usersUnsub();
    txUnsub();
    notifUnsub();
  };
}

// Record point transaction both locally (optimistic) and in Firestore
export async function recordPointTransactionFirebase(params: {
  userId: string;
  type: PointType;
  points: number;
  category: string;
  title: string;
  description: string;
  adminUser: User;
}): Promise<{ transaction: PointTransaction; user: User; notification: NotificationItem }> {
  const users = getStoredUsers();
  const transactions = getStoredTransactions();
  const notifications = getStoredNotifications();

  const targetIndex = users.findIndex((u) => u.id === params.userId);
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

  // 1. Optimistic Local Update
  saveUsers(users);
  saveTransactions([newTx, ...transactions]);
  saveNotifications([newNotif, ...notifications]);

  const currentUser = getStoredCurrentUser();
  if (currentUser && currentUser.id === targetUser.id) {
    setCurrentUser(targetUser);
  }

  playNotificationChime(params.type);

  // 2. Commit to Firestore
  try {
    const batch = writeBatch(db);

    const userRef = doc(db, USERS_COLLECTION, targetUser.id);
    batch.set(userRef, targetUser, { merge: true });

    const txRef = doc(db, TRANSACTIONS_COLLECTION, newTx.id);
    batch.set(txRef, newTx);

    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, newNotif.id);
    batch.set(notifRef, newNotif);

    await batch.commit();
    console.log('[Firebase] Transaction recorded in Firestore successfully');
  } catch (error) {
    console.error('[Firebase] Failed to write transaction to Firestore, saved locally:', error);
  }

  return { transaction: newTx, user: targetUser, notification: newNotif };
}

// Mark notification as read in Firestore
export async function markNotificationAsReadFirebase(notifId: string) {
  try {
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notifId);
    await updateDoc(notifRef, { isRead: true });
  } catch (e) {
    console.warn('[Firebase] Could not mark notification as read in cloud:', e);
  }
}

// Reset data in Firestore to Default Demo Data
export async function resetFirestoreToDemo() {
  try {
    const batch = writeBatch(db);

    // Re-seed Users
    INITIAL_USERS.forEach((u) => {
      const ref = doc(db, USERS_COLLECTION, u.id);
      batch.set(ref, u);
    });

    // Re-seed Transactions
    INITIAL_TRANSACTIONS.forEach((tx) => {
      const ref = doc(db, TRANSACTIONS_COLLECTION, tx.id);
      batch.set(ref, tx);
    });

    // Re-seed Notifications
    INITIAL_NOTIFICATIONS.forEach((n) => {
      const ref = doc(db, NOTIFICATIONS_COLLECTION, n.id);
      batch.set(ref, n);
    });

    await batch.commit();
    console.log('[Firebase] Firestore reset to demo data committed');
  } catch (error) {
    console.error('[Firebase] Error resetting Firestore:', error);
  }
}

// Save or register user directly to Firestore
export async function saveUserFirebase(user: User) {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.id);
    await setDoc(userRef, user, { merge: true });
    console.log('[Firebase] User saved successfully:', user.username);
  } catch (e) {
    console.warn('[Firebase] Error saving user to Firestore:', e);
  }
}
