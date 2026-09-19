import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, ScannedRecord, CaregiverDispatchLog, MedicineItem } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with databaseId as required by AI Studio infrastructure
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

// Standard Error Handler per Firebase Skill specs
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test per Firebase Skill specs
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently offline or connecting...');
      return false;
    }
    // Permission denied or not found is acceptable for a test probe document
    return true;
  }
}

// User Profile Database Operations
export async function saveUserProfileToFirestore(
  userId: string,
  profile: UserProfile
): Promise<void> {
  const path = `userProfiles/${userId}`;
  try {
    const docRef = doc(db, 'userProfiles', userId);
    const dataToSave = {
      userId,
      name: profile.name.trim(),
      preferredGreeting: profile.preferredGreeting?.trim() || '',
      age: profile.age || 70,
      primaryConcern: profile.primaryConcern || 'all',
      fontSizeMode: profile.fontSizeMode || 'normal',
      speechRate: profile.speechRate || 0.85,
      caregiverName: profile.caregiver?.name?.trim() || '',
      caregiverRelationship: profile.caregiver?.relationship?.trim() || '',
      caregiverPhone: profile.caregiver?.phone?.trim() || '',
      hasCompletedOnboarding: Boolean(profile.hasCompletedOnboarding),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfileFromFirestore(
  userId: string
): Promise<UserProfile | null> {
  const path = `userProfiles/${userId}`;
  try {
    const docRef = doc(db, 'userProfiles', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      name: data.name || '',
      preferredGreeting: data.preferredGreeting || '',
      age: data.age || 70,
      primaryConcern: data.primaryConcern || 'all',
      fontSizeMode: data.fontSizeMode || 'normal',
      speechRate: data.speechRate || 0.85,
      caregiver: {
        name: data.caregiverName || '',
        relationship: data.caregiverRelationship || '',
        phone: data.caregiverPhone || '',
      },
      hasCompletedOnboarding: Boolean(data.hasCompletedOnboarding),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeUserProfile(
  userId: string,
  onUpdate: (profile: UserProfile | null) => void
): Unsubscribe {
  const path = `userProfiles/${userId}`;
  const docRef = doc(db, 'userProfiles', userId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }
      const data = snap.data();
      onUpdate({
        name: data.name || '',
        preferredGreeting: data.preferredGreeting || '',
        age: data.age || 70,
        primaryConcern: data.primaryConcern || 'all',
        fontSizeMode: data.fontSizeMode || 'normal',
        speechRate: data.speechRate || 0.85,
        caregiver: {
          name: data.caregiverName || '',
          relationship: data.caregiverRelationship || '',
          phone: data.caregiverPhone || '',
        },
        hasCompletedOnboarding: Boolean(data.hasCompletedOnboarding),
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Scanned Records Database Operations
export async function saveScannedRecordToFirestore(
  userId: string,
  record: ScannedRecord
): Promise<void> {
  const path = `userProfiles/${userId}/scannedRecords/${record.id}`;
  try {
    const docRef = doc(db, 'userProfiles', userId, 'scannedRecords', record.id);
    const dataToSave = {
      id: record.id,
      userId,
      timestamp: record.timestamp || new Date().toISOString(),
      headline: record.headline.slice(0, 300),
      urgency: record.is_urgent_or_scam ? 'urgent' : 'routine',
      actionCategory: record.mode,
      confidenceReason: record.payload?.confidence_reason?.slice(0, 500) || '',
      bullets: (record.payload?.bullets || []).slice(0, 10),
      voiceReadout: (record.payload?.voice_readout || record.headline).slice(0, 2000),
      caregiverAlert: record.payload?.caregiver_alert?.slice(0, 1000) || null,
      querySnippet: (record.inputText || '').slice(0, 500),
    };
    await setDoc(docRef, dataToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeScannedRecords(
  userId: string,
  onUpdate: (records: ScannedRecord[]) => void
): Unsubscribe {
  const path = `userProfiles/${userId}/scannedRecords`;
  const recordsCol = collection(db, 'userProfiles', userId, 'scannedRecords');
  const q = query(recordsCol, orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const records: ScannedRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: d.id || docSnap.id,
          timestamp: d.timestamp,
          headline: d.headline,
          mode: d.actionCategory || 'SAFETY_BILL_SCAM',
          is_urgent_or_scam: d.urgency === 'urgent',
          inputText: d.querySnippet,
          payload: {
            mode: d.actionCategory || 'SAFETY_BILL_SCAM',
            headline: d.headline,
            is_urgent_or_scam: d.urgency === 'urgent',
            confidence_reason: d.confidenceReason || '',
            bullets: d.bullets || [],
            voice_readout: d.voiceReadout || '',
            caregiver_alert: d.caregiverAlert || null,
          },
          caregiverDispatched: false,
        };
      });
      onUpdate(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function deleteScannedRecordFromFirestore(
  userId: string,
  recordId: string
): Promise<void> {
  const path = `userProfiles/${userId}/scannedRecords/${recordId}`;
  try {
    const docRef = doc(db, 'userProfiles', userId, 'scannedRecords', recordId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Caregiver Alerts Database Operations
export async function saveCaregiverAlertToFirestore(
  userId: string,
  dispatchLog: CaregiverDispatchLog
): Promise<void> {
  const path = `userProfiles/${userId}/caregiverAlerts/${dispatchLog.id}`;
  try {
    const docRef = doc(db, 'userProfiles', userId, 'caregiverAlerts', dispatchLog.id);
    const dataToSave = {
      id: dispatchLog.id,
      userId,
      timestamp: dispatchLog.timestamp || new Date().toISOString(),
      recipientName: (dispatchLog.recipient.name || 'Family Contact').slice(0, 100),
      recipientPhone: (dispatchLog.recipient.phone || '').slice(0, 30),
      headline: dispatchLog.headline.slice(0, 300),
      alertMessage: dispatchLog.alertMessage.slice(0, 1000),
      status: dispatchLog.status === 'SENT' ? 'dispatched' : 'acknowledged',
      channel: 'in_app',
    };
    await setDoc(docRef, dataToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeCaregiverAlerts(
  userId: string,
  onUpdate: (logs: CaregiverDispatchLog[]) => void
): Unsubscribe {
  const path = `userProfiles/${userId}/caregiverAlerts`;
  const alertsCol = collection(db, 'userProfiles', userId, 'caregiverAlerts');
  const q = query(alertsCol, orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: CaregiverDispatchLog[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: d.id || docSnap.id,
          timestamp: d.timestamp,
          headline: d.headline,
          mode: 'SAFETY_BILL_SCAM',
          is_urgent: true,
          alertMessage: d.alertMessage,
          recipient: {
            name: d.recipientName,
            relationship: 'Emergency Contact',
            phone: d.recipientPhone,
          },
          status: d.status === 'dispatched' ? 'SENT' : 'FAILED',
        };
      });
      onUpdate(logs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Medicine Cabinet Firestore Operations
export async function saveMedicineToFirestore(
  userId: string,
  medicine: MedicineItem
): Promise<void> {
  const path = `userProfiles/${userId}/medicines/${medicine.id}`;
  try {
    const docRef = doc(db, 'userProfiles', userId, 'medicines', medicine.id);
    const dataToSave = {
      id: medicine.id,
      userId,
      name: medicine.name.slice(0, 150),
      purpose: (medicine.purpose || '').slice(0, 200),
      timing: medicine.timing,
      instructions: (medicine.instructions || '').slice(0, 300),
      cautions: (medicine.cautions || '').slice(0, 300),
      takenToday: Boolean(medicine.takenToday),
      addedAt: medicine.addedAt || new Date().toISOString(),
    };
    await setDoc(docRef, dataToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeMedicines(
  userId: string,
  onUpdate: (medicines: MedicineItem[]) => void
): Unsubscribe {
  const path = `userProfiles/${userId}/medicines`;
  const medCol = collection(db, 'userProfiles', userId, 'medicines');
  const q = query(medCol, orderBy('addedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: MedicineItem[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: d.id || docSnap.id,
          userId: d.userId || userId,
          name: d.name,
          purpose: d.purpose || '',
          timing: d.timing || 'morning',
          instructions: d.instructions || '',
          cautions: d.cautions || '',
          takenToday: Boolean(d.takenToday),
          addedAt: d.addedAt || '',
        };
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function deleteMedicineFromFirestore(
  userId: string,
  medicineId: string
): Promise<void> {
  const path = `userProfiles/${userId}/medicines/${medicineId}`;
  try {
    const docRef = doc(db, 'userProfiles', userId, 'medicines', medicineId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function toggleMedicineTakenInFirestore(
  userId: string,
  medicineId: string,
  takenToday: boolean
): Promise<void> {
  const path = `userProfiles/${userId}/medicines/${medicineId}`;
  try {
    const docRef = doc(db, 'userProfiles', userId, 'medicines', medicineId);
    await setDoc(docRef, { takenToday }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Authentication Helpers
export async function loginWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
    throw error;
  }
}

export { onAuthStateChanged };
export type { FirebaseUser };
