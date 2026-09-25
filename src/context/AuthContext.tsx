import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from '../firebase';
import { UserProfile, UserScanRecord, UserBatchRunRecord } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  isSyncing: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  // Scan Persistence
  userScans: UserScanRecord[];
  saveScanRecord: (scan: Omit<UserScanRecord, 'id' | 'userId' | 'timestamp'>) => Promise<string | null>;
  updateScanStatus: (scanId: string, status: UserScanRecord['incidentStatus']) => Promise<void>;
  updateScanNotes: (scanId: string, notes: string) => Promise<void>;
  toggleBookmarkScan: (scanId: string, current: boolean) => Promise<void>;
  deleteScanRecord: (scanId: string) => Promise<void>;
  // Batch Persistence
  userBatchRuns: UserBatchRunRecord[];
  saveBatchRunRecord: (run: Omit<UserBatchRunRecord, 'id' | 'userId' | 'timestamp'>) => Promise<string | null>;
  deleteBatchRunRecord: (runId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [userScans, setUserScans] = useState<UserScanRecord[]>([]);
  const [userBatchRuns, setUserBatchRuns] = useState<UserBatchRunRecord[]>([]);

  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);

          if (!snap.exists()) {
            const initialProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'SecOps Analyst',
              photoURL: currentUser.photoURL || '',
              role: 'Security Analyst',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              preferences: {
                alertThreshold: 0.85,
                autoSaveScans: true,
                highRiskAlertSound: true
              }
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          } else {
            const profileData = snap.data() as UserProfile;
            setUserProfile(profileData);
            // Non-blocking update of last sign-in
            updateDoc(userDocRef, { lastLoginAt: new Date().toISOString() }).catch(() => {});
          }
        } catch (err: any) {
          console.error('Error fetching/creating user profile in Firestore:', err);
        }
      } else {
        setUserProfile(null);
        setUserScans([]);
        setUserBatchRuns([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore Subscriptions for Scans and Batch Runs
  useEffect(() => {
    if (!user) {
      setUserScans([]);
      setUserBatchRuns([]);
      return;
    }

    setIsSyncing(true);

    // 1. Scans Subcollection Query
    const scansCol = collection(db, 'users', user.uid, 'scans');
    const scansQuery = query(scansCol, orderBy('timestamp', 'desc'), limit(100));

    const unsubscribeScans = onSnapshot(
      scansQuery,
      (snapshot) => {
        const scansList: UserScanRecord[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as UserScanRecord),
          id: docSnap.id
        }));
        setUserScans(scansList);
        setIsSyncing(false);
      },
      (err) => {
        console.error('Firestore scans subscription error:', err);
        setIsSyncing(false);
      }
    );

    // 2. Batch Runs Subcollection Query
    const batchCol = collection(db, 'users', user.uid, 'batch_runs');
    const batchQuery = query(batchCol, orderBy('timestamp', 'desc'), limit(50));

    const unsubscribeBatch = onSnapshot(
      batchQuery,
      (snapshot) => {
        const batchList: UserBatchRunRecord[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as UserBatchRunRecord),
          id: docSnap.id
        }));
        setUserBatchRuns(batchList);
      },
      (err) => {
        console.error('Firestore batch runs subscription error:', err);
      }
    );

    return () => {
      unsubscribeScans();
      unsubscribeBatch();
    };
  }, [user]);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User voluntarily dismissed popup
        return;
      }
      console.error('Google Sign-In failed:', err);
      setAuthError(err.message || 'Failed to authenticate with Google.');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setUserScans([]);
      setUserBatchRuns([]);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const clearAuthError = () => setAuthError(null);

  // Scan Persistence Handlers
  const saveScanRecord = async (
    scanData: Omit<UserScanRecord, 'id' | 'userId' | 'timestamp'>
  ): Promise<string | null> => {
    if (!user) return null;
    try {
      const scanColRef = collection(db, 'users', user.uid, 'scans');
      const newDocRef = doc(scanColRef);
      const newScan: UserScanRecord = {
        ...scanData,
        id: newDocRef.id,
        userId: user.uid,
        timestamp: new Date().toISOString(),
        incidentStatus: scanData.incidentStatus || (scanData.is_intrusion ? 'Under Investigation' : 'Unreviewed'),
        isBookmarked: scanData.isBookmarked ?? false
      };
      await setDoc(newDocRef, newScan);
      return newDocRef.id;
    } catch (err: any) {
      console.error('Failed to save scan record to Firestore:', err);
      return null;
    }
  };

  const updateScanStatus = async (scanId: string, status: UserScanRecord['incidentStatus']) => {
    if (!user) return;
    try {
      const scanDocRef = doc(db, 'users', user.uid, 'scans', scanId);
      await updateDoc(scanDocRef, { incidentStatus: status });
    } catch (err: any) {
      console.error('Failed to update scan incident status:', err);
    }
  };

  const updateScanNotes = async (scanId: string, notes: string) => {
    if (!user) return;
    try {
      const scanDocRef = doc(db, 'users', user.uid, 'scans', scanId);
      await updateDoc(scanDocRef, { notes });
    } catch (err: any) {
      console.error('Failed to update scan notes:', err);
    }
  };

  const toggleBookmarkScan = async (scanId: string, current: boolean) => {
    if (!user) return;
    try {
      const scanDocRef = doc(db, 'users', user.uid, 'scans', scanId);
      await updateDoc(scanDocRef, { isBookmarked: !current });
    } catch (err: any) {
      console.error('Failed to toggle bookmark status:', err);
    }
  };

  const deleteScanRecord = async (scanId: string) => {
    if (!user) return;
    try {
      const scanDocRef = doc(db, 'users', user.uid, 'scans', scanId);
      await deleteDoc(scanDocRef);
    } catch (err: any) {
      console.error('Failed to delete scan record:', err);
    }
  };

  // Batch Run Persistence Handlers
  const saveBatchRunRecord = async (
    runData: Omit<UserBatchRunRecord, 'id' | 'userId' | 'timestamp'>
  ): Promise<string | null> => {
    if (!user) return null;
    try {
      const batchColRef = collection(db, 'users', user.uid, 'batch_runs');
      const newDocRef = doc(batchColRef);
      const newRun: UserBatchRunRecord = {
        ...runData,
        id: newDocRef.id,
        userId: user.uid,
        timestamp: new Date().toISOString()
      };
      await setDoc(newDocRef, newRun);
      return newDocRef.id;
    } catch (err: any) {
      console.error('Failed to save batch run to Firestore:', err);
      return null;
    }
  };

  const deleteBatchRunRecord = async (runId: string) => {
    if (!user) return;
    try {
      const batchDocRef = doc(db, 'users', user.uid, 'batch_runs', runId);
      await deleteDoc(batchDocRef);
    } catch (err: any) {
      console.error('Failed to delete batch run:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authError,
        isSyncing,
        signInWithGoogle,
        logout,
        clearAuthError,
        userScans,
        saveScanRecord,
        updateScanStatus,
        updateScanNotes,
        toggleBookmarkScan,
        deleteScanRecord,
        userBatchRuns,
        saveBatchRunRecord,
        deleteBatchRunRecord
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
