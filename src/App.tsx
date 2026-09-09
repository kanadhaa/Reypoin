import React, { useState, useEffect, useCallback } from 'react';
import { User, PointTransaction, NotificationItem } from './types';
import { 
  getStoredUsers, 
  getStoredTransactions, 
  getStoredNotifications, 
  getStoredCurrentUser, 
  setCurrentUser 
} from './lib/storage';
import { initRealtimeFirestoreSync } from './lib/firebase';
import { exportAdminMasterExcel, exportAdminMasterPDF } from './lib/exportUtils';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { MemberDashboard } from './components/MemberDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { NotificationModal } from './components/NotificationModal';
import { AdminRecordModal } from './components/AdminRecordModal';
import { MemberDetailModal } from './components/MemberDetailModal';
import { RulesDirectoryModal } from './components/RulesDirectoryModal';
import { AdminCreateUserModal } from './components/AdminCreateUserModal';
import { ChangeCredentialsModal } from './components/ChangeCredentialsModal';
import { LoginGate } from './components/LoginGate';
import { ShieldCheck, Sparkles, UserCheck, AlertCircle } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<{ connected: boolean; lastSync?: Date; error?: string }>({
    connected: false,
  });

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<User | null>(null);
  const [credentialsTargetUser, setCredentialsTargetUser] = useState<User | null>(null);
  const [preselectedUserForRecord, setPreselectedUserForRecord] = useState<string | undefined>(undefined);

  // Load and synchronize state from storage
  const syncData = useCallback(() => {
    const loadedUsers = getStoredUsers();
    const loadedTx = getStoredTransactions();
    const loadedNotifs = getStoredNotifications();
    const loadedCurUser = getStoredCurrentUser();

    setUsers(loadedUsers);
    setTransactions(loadedTx);
    setNotifications(loadedNotifs);

    // If current user is set, re-sync their points with latest updated user object
    if (loadedCurUser) {
      const refreshedCurUser = loadedUsers.find(u => u.id === loadedCurUser.id) || loadedCurUser;
      setCurrentUserState(refreshedCurUser);
    } else {
      setCurrentUserState(null);
    }
  }, []);

  useEffect(() => {
    syncData();

    const handleDataChanged = () => {
      syncData();
    };

    const handleAuthChanged = () => {
      const loadedCurUser = getStoredCurrentUser();
      setCurrentUserState(loadedCurUser);
    };

    window.addEventListener('osis_data_changed', handleDataChanged);
    window.addEventListener('osis_auth_changed', handleAuthChanged);

    // Initialize real-time Firestore sync
    const unsubscribeFirestore = initRealtimeFirestoreSync((status) => {
      setCloudSyncStatus(status);
    });

    return () => {
      window.removeEventListener('osis_data_changed', handleDataChanged);
      window.removeEventListener('osis_auth_changed', handleAuthChanged);
      unsubscribeFirestore();
    };
  }, [syncData]);

  // Open record modal with preselected user
  const handleOpenRecordForUser = (userId: string) => {
    setPreselectedUserForRecord(userId);
    setIsRecordModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-10 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        users={users}
        notifications={notifications}
        cloudSyncStatus={cloudSyncStatus}
        onOpenNotifications={() => setIsNotifModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        onOpenRecordModal={() => {
          setPreselectedUserForRecord(undefined);
          setIsRecordModalOpen(true);
        }}
        onExportMasterPDF={() => exportAdminMasterPDF(users, transactions)}
        onExportMasterExcel={() => exportAdminMasterExcel(users, transactions)}
        onOpenChangeCredentials={(target) => setCredentialsTargetUser(target)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!currentUser ? (
          // Gerbang Verifikasi & Login Wajib Resmi
          <LoginGate
            users={users}
            onLoginSuccess={(user) => setCurrentUser(user)}
          />
        ) : currentUser.role === 'admin' ? (
          // ADMIN DASHBOARD
          <AdminDashboard
            currentUser={currentUser}
            users={users}
            transactions={transactions}
            onOpenRecordModal={() => {
              setPreselectedUserForRecord(undefined);
              setIsRecordModalOpen(true);
            }}
            onSelectMember={member => setSelectedMemberForDetail(member)}
            onOpenCreateUser={() => setIsCreateUserModalOpen(true)}
            onOpenChangeCredentials={(target) => setCredentialsTargetUser(target)}
          />
        ) : (
          // REGULAR MEMBER DASHBOARD (Strictly only views their own data!)
          <MemberDashboard
            currentUser={currentUser}
            transactions={transactions}
            notifications={notifications}
            onOpenNotifications={() => setIsNotifModalOpen(true)}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onOpenChangeCredentials={(target) => setCredentialsTargetUser(target)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700">OSIS - MPK SMA Negeri 6 Bandung</span>
            <span>•</span>
            <span>Masa Bakti 2026/2027</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Firestore Cloud Database
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Pedoman Poin SK
            </button>
            {currentUser ? (
              <button
                onClick={() => setCurrentUser(null)}
                className="text-rose-600 hover:text-rose-700 font-semibold transition-colors cursor-pointer"
              >
                Keluar ({currentUser.role === 'admin' ? 'Admin' : 'Pengurus'})
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors cursor-pointer"
              >
                Masuk Sistem
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation (Only when logged in) */}
      {currentUser && (
        <MobileNav
          currentUser={currentUser}
          notifications={notifications}
          onOpenNotifications={() => setIsNotifModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenRulesModal={() => setIsRulesModalOpen(true)}
          onOpenRecordModal={
            currentUser.role === 'admin'
              ? () => {
                  setPreselectedUserForRecord(undefined);
                  setIsRecordModalOpen(true);
                }
              : undefined
          }
        />
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        users={users}
        currentUser={currentUser}
      />

      {currentUser && (
        <NotificationModal
          isOpen={isNotifModalOpen}
          onClose={() => setIsNotifModalOpen(false)}
          notifications={notifications.filter(n => n.userId === currentUser.id)}
          userId={currentUser.id}
        />
      )}

      <RulesDirectoryModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {currentUser?.role === 'admin' && (
        <AdminRecordModal
          isOpen={isRecordModalOpen}
          onClose={() => {
            setIsRecordModalOpen(false);
            setPreselectedUserForRecord(undefined);
          }}
          users={users}
          adminUser={currentUser}
          preselectedUserId={preselectedUserForRecord}
          onSuccess={() => syncData()}
        />
      )}

      {currentUser?.role === 'admin' && (
        <AdminCreateUserModal
          isOpen={isCreateUserModalOpen}
          onClose={() => setIsCreateUserModalOpen(false)}
          users={users}
          currentAdmin={currentUser}
          onSuccess={() => syncData()}
        />
      )}

      <MemberDetailModal
        isOpen={Boolean(selectedMemberForDetail)}
        onClose={() => setSelectedMemberForDetail(null)}
        user={selectedMemberForDetail}
        transactions={transactions}
        onOpenRecordForUser={
          currentUser?.role === 'admin' ? handleOpenRecordForUser : undefined
        }
        onOpenChangeCredentials={
          currentUser?.role === 'admin'
            ? (target) => setCredentialsTargetUser(target)
            : undefined
        }
      />

      <ChangeCredentialsModal
        isOpen={Boolean(credentialsTargetUser)}
        onClose={() => setCredentialsTargetUser(null)}
        targetUser={credentialsTargetUser}
        currentUser={currentUser}
        allUsers={users}
        onSuccess={(updatedUser) => {
          syncData();
          if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUserState(updatedUser);
            setCurrentUser(updatedUser);
          }
          if (selectedMemberForDetail && selectedMemberForDetail.id === updatedUser.id) {
            setSelectedMemberForDetail(updatedUser);
          }
        }}
      />
    </div>
  );
}
