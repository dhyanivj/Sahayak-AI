/* Hallmark · macrostructure: elder-intake-docket · theme: warm-tactile-ink · genre: editorial
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * slop test: pass
 */
import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OnboardingForm } from './components/OnboardingForm';
import { SingleFrontDoor } from './components/SingleFrontDoor';
import { ReactiveResultCard } from './components/ReactiveResultCard';
import { CaregiverLogModal } from './components/CaregiverLogModal';
import { ScannedHistoryModal } from './components/ScannedHistoryModal';
import { MedicineCabinetModal } from './components/MedicineCabinetModal';
import { OfflineBanner } from './components/OfflineBanner';
import {
  CaregiverContact,
  CaregiverDispatchLog,
  SahayakActionPayload,
  UserProfile,
  ScannedRecord,
  MedicineItem,
} from './types';
import {
  auth,
  testConnection,
  loginWithGoogle,
  logoutUser,
  onAuthStateChanged,
  FirebaseUser,
  saveUserProfileToFirestore,
  subscribeUserProfile,
  saveScannedRecordToFirestore,
  subscribeScannedRecords,
  deleteScannedRecordFromFirestore,
  saveCaregiverAlertToFirestore,
  subscribeCaregiverAlerts,
  saveMedicineToFirestore,
  subscribeMedicines,
  deleteMedicineFromFirestore,
  toggleMedicineTakenInFirestore,
} from './lib/firebase';
import { Cloud, LogIn } from 'lucide-react';

// Clean starter profile without hardcoded mock data
const defaultProfile: UserProfile = {
  name: '',
  preferredGreeting: '',
  age: 70,
  primaryConcern: 'all',
  fontSizeMode: 'normal',
  speechRate: 0.85,
  caregiver: {
    name: '',
    relationship: '',
    phone: '',
  },
  hasCompletedOnboarding: false,
};

// Simple web audio synthesizer for gentle feedback chime
function playGentleChime(type: 'success' | 'alert' = 'success') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (err) {
    console.warn('Audio chime failed:', err);
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('sahayak_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.name) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read user profile from local storage', e);
    }
    return defaultProfile;
  });

  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  const [fontSizeMode, setFontSizeMode] = useState<'normal' | 'large'>(
    userProfile.fontSizeMode || 'normal'
  );
  const [speechRate, setSpeechRate] = useState<number>(userProfile.speechRate || 0.85);

  const [caregiverContact, setCaregiverContact] = useState<CaregiverContact>(
    userProfile.caregiver || {
      name: '',
      relationship: '',
      phone: '',
    }
  );

  const [currentPayload, setCurrentPayload] = useState<SahayakActionPayload | null>(null);
  const [dispatches, setDispatches] = useState<CaregiverDispatchLog[]>([]);
  const [scannedRecords, setScannedRecords] = useState<ScannedRecord[]>(() => {
    try {
      const saved = localStorage.getItem('sahayak_scanned_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read scanned records from local storage', e);
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isCaregiverModalOpen, setIsCaregiverModalOpen] = useState(false);
  const [isScannedHistoryOpen, setIsScannedHistoryOpen] = useState(false);
  const [isMedicineCabinetOpen, setIsMedicineCabinetOpen] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [medicines, setMedicines] = useState<MedicineItem[]>(() => {
    try {
      const saved = localStorage.getItem('sahayak_medicines');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read medicines from local storage', e);
    }
    return [];
  });

  // Initialize Firebase Auth & Real-Time Firestore Sync
  useEffect(() => {
    testConnection();

    let unsubProfile: (() => void) | null = null;
    let unsubRecords: (() => void) | null = null;
    let unsubAlerts: (() => void) | null = null;
    let unsubMedicines: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      // Clean up previous subscriptions if any
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }
      if (unsubRecords) {
        unsubRecords();
        unsubRecords = null;
      }
      if (unsubAlerts) {
        unsubAlerts();
        unsubAlerts = null;
      }
      if (unsubMedicines) {
        unsubMedicines();
        unsubMedicines = null;
      }

      if (user) {
        // Subscribe to remote profile from Firestore
        unsubProfile = subscribeUserProfile(user.uid, (remoteProfile) => {
          if (remoteProfile && remoteProfile.name) {
            setUserProfile(remoteProfile);
            setFontSizeMode(remoteProfile.fontSizeMode);
            setSpeechRate(remoteProfile.speechRate);
            setCaregiverContact(remoteProfile.caregiver);
          } else {
            // First time login with an existing local profile: migrate to Firestore
            setUserProfile((current) => {
              if (current.name && current.hasCompletedOnboarding) {
                saveUserProfileToFirestore(user.uid, current).catch(console.warn);
              }
              return current;
            });
          }
        });

        // Subscribe to user's scanned items from Firestore
        unsubRecords = subscribeScannedRecords(user.uid, (records) => {
          setScannedRecords(records);
          try {
            localStorage.setItem('sahayak_scanned_history', JSON.stringify(records.slice(0, 30)));
          } catch (e) {
            console.warn(e);
          }
        });

        // Subscribe to user's caregiver alerts from Firestore
        unsubAlerts = subscribeCaregiverAlerts(user.uid, (alerts) => {
          setDispatches(alerts);
        });

        // Subscribe to user's daily medicines from Firestore
        unsubMedicines = subscribeMedicines(user.uid, (meds) => {
          setMedicines(meds);
          try {
            localStorage.setItem('sahayak_medicines', JSON.stringify(meds));
          } catch (e) {
            console.warn(e);
          }
        });
      } else {
        // Fall back to local storage and server session when not logged in
        fetch('/api/caregiver-history')
          .then((res) => res.json())
          .then((data) => {
            if (data.dispatches && Array.isArray(data.dispatches)) {
              setDispatches(data.dispatches);
            }
          })
          .catch((err) => console.warn('Could not load caregiver history:', err));
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
      if (unsubRecords) unsubRecords();
      if (unsubAlerts) unsubAlerts();
      if (unsubMedicines) unsubMedicines();
    };
  }, []);

  // Save profile changes (both to Firestore and local cache)
  const handleSaveProfile = async (updated: UserProfile) => {
    setUserProfile(updated);
    setFontSizeMode(updated.fontSizeMode);
    setSpeechRate(updated.speechRate);
    setCaregiverContact(updated.caregiver);
    setIsEditingProfile(false);

    try {
      localStorage.setItem('sahayak_user_profile', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save user profile to localStorage', e);
    }

    if (currentUser) {
      try {
        await saveUserProfileToFirestore(currentUser.uid, updated);
      } catch (e) {
        console.warn('Could not sync user profile to Firestore', e);
      }
    }
    playGentleChime('success');
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      playGentleChime('success');
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      playGentleChime('success');
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  // Main Analyze action
  const handleAnalyze = async (data: {
    text?: string;
    image?: { data: string; mimeType: string };
    audio?: { data: string; mimeType: string };
  }) => {
    setIsLoading(true);
    setNetworkError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userProfile,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `Server responded with status ${response.status}`);
      }

      const result: SahayakActionPayload = await response.json();
      
      const sourceImageDataUrl = data.image
        ? `data:${data.image.mimeType};base64,${data.image.data}`
        : undefined;

      const fullResult: SahayakActionPayload = {
        ...result,
        sourceImage: sourceImageDataUrl,
      };

      setCurrentPayload(fullResult);
      playGentleChime(fullResult.is_urgent_or_scam ? 'alert' : 'success');

      // Create new record
      const newRecord: ScannedRecord = {
        id: `SCAN-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        headline: fullResult.headline,
        mode: fullResult.mode,
        is_urgent_or_scam: fullResult.is_urgent_or_scam,
        inputText: data.text,
        thumbnailUrl: sourceImageDataUrl,
        payload: fullResult,
      };

      // Save to local state
      setScannedRecords((prev) => {
        const updated = [newRecord, ...prev.filter((r) => r.id !== newRecord.id)];
        try {
          localStorage.setItem('sahayak_scanned_history', JSON.stringify(updated.slice(0, 30)));
        } catch (err) {
          console.warn('Could not save scan history:', err);
        }
        return updated;
      });

      // Save to Firebase Firestore if logged in
      if (currentUser) {
        try {
          await saveScannedRecordToFirestore(currentUser.uid, newRecord);
        } catch (err) {
          console.warn('Could not save record to Firestore:', err);
        }
      }

      // Smooth scroll to top for immediate viewing
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error('Analyze failed:', err);
      setNetworkError(
        err?.message ||
          'Unable to verify this item right now. Your connection may be interrupted.'
      );
      playGentleChime('alert');
    } finally {
      setIsLoading(false);
    }
  };

  // Dispatch caregiver alert
  const handleSendCaregiverAlert = async (
    alertText: string,
    headline: string
  ): Promise<boolean> => {
    if (!currentPayload) return false;
    setIsSendingAlert(true);

    try {
      const response = await fetch('/api/caregiver-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headline,
          mode: currentPayload.mode,
          is_urgent: currentPayload.is_urgent_or_scam,
          alertMessage: alertText,
          recipient: caregiverContact,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to dispatch alert to caregiver');
      }

      const resData = await response.json();
      if (resData.dispatch) {
        setDispatches((prev) => [resData.dispatch, ...prev]);

        // Save to Firebase Firestore if logged in
        if (currentUser) {
          try {
            await saveCaregiverAlertToFirestore(currentUser.uid, resData.dispatch);
          } catch (err) {
            console.warn('Could not save alert to Firestore:', err);
          }
        }
      }
      playGentleChime('success');
      return true;
    } catch (err: any) {
      console.error('Caregiver notification error:', err);
      alert(`Could not dispatch alert. You can call ${caregiverContact.name || 'family'} directly using the phone button.`);
      return false;
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Manual test ping
  const handleSendManualTestAlert = async () => {
    setIsSendingTest(true);
    try {
      const seniorGreeting = userProfile.preferredGreeting || userProfile.name || 'User';
      const response = await fetch('/api/caregiver-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headline: `Daily Check-In from ${seniorGreeting}`,
          mode: 'SMART_ASSIST',
          is_urgent: false,
          alertMessage: `Daily check-in: ${seniorGreeting} has active Sahayak companion running smoothly.`,
          recipient: caregiverContact,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.dispatch) {
          setDispatches((prev) => [resData.dispatch, ...prev]);
          if (currentUser) {
            try {
              await saveCaregiverAlertToFirestore(currentUser.uid, resData.dispatch);
            } catch (err) {
              console.warn('Could not save alert to Firestore:', err);
            }
          }
        }
        playGentleChime('success');
      }
    } catch (err) {
      console.error('Manual test ping error:', err);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleReset = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentPayload(null);
    setNetworkError(null);
  };

  const handleClearHistory = async () => {
    if (confirm('Clear your scanned document history?')) {
      if (currentUser) {
        for (const record of scannedRecords) {
          try {
            await deleteScannedRecordFromFirestore(currentUser.uid, record.id);
          } catch (e) {
            console.warn(e);
          }
        }
      }
      setScannedRecords([]);
      localStorage.removeItem('sahayak_scanned_history');
    }
  };

  const handleSelectHistoryRecord = (record: ScannedRecord) => {
    setCurrentPayload(record.payload);
    playGentleChime(record.payload.is_urgent_or_scam ? 'alert' : 'success');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Medicine Management Handlers
  const handleAddMedicine = async (
    medData: Omit<MedicineItem, 'id' | 'userId' | 'addedAt'>
  ) => {
    const newMed: MedicineItem = {
      ...medData,
      id: `MED-${Date.now()}`,
      userId: currentUser ? currentUser.uid : 'local-user',
      addedAt: new Date().toISOString(),
    };

    setMedicines((prev) => {
      const updated = [
        newMed,
        ...prev.filter((m) => m.name.toLowerCase() !== newMed.name.toLowerCase()),
      ];
      try {
        localStorage.setItem('sahayak_medicines', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    if (currentUser) {
      try {
        await saveMedicineToFirestore(currentUser.uid, newMed);
      } catch (e) {
        console.warn('Failed to save medicine to Firestore', e);
      }
    }
    playGentleChime('success');
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    setMedicines((prev) => {
      const updated = prev.filter((m) => m.id !== medicineId);
      try {
        localStorage.setItem('sahayak_medicines', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    if (currentUser) {
      try {
        await deleteMedicineFromFirestore(currentUser.uid, medicineId);
      } catch (e) {
        console.warn('Failed to delete medicine from Firestore', e);
      }
    }
  };

  const handleToggleMedicineTaken = async (medicineId: string, takenToday: boolean) => {
    setMedicines((prev) => {
      const updated = prev.map((m) => (m.id === medicineId ? { ...m, takenToday } : m));
      try {
        localStorage.setItem('sahayak_medicines', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    if (currentUser) {
      try {
        await toggleMedicineTakenInFirestore(currentUser.uid, medicineId, takenToday);
      } catch (e) {
        console.warn('Failed to toggle medicine taken in Firestore', e);
      }
    }
    playGentleChime(takenToday ? 'success' : 'alert');
  };

  const showOnboarding = !userProfile.hasCompletedOnboarding || isEditingProfile;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink-primary)]">
      
      {/* Top Header */}
      <Header
        fontSizeMode={fontSizeMode}
        setFontSizeMode={setFontSizeMode}
        speechRate={speechRate}
        setSpeechRate={setSpeechRate}
        caregiverContact={caregiverContact}
        dispatchCount={dispatches.length}
        onOpenCaregiverModal={() => setIsCaregiverModalOpen(true)}
        userProfile={userProfile}
        onEditProfile={() => setIsEditingProfile(true)}
        scannedCount={scannedRecords.length}
        onOpenScannedHistory={() => setIsScannedHistoryOpen(true)}
        medicineCount={medicines.length}
        onOpenMedicineCabinet={() => setIsMedicineCabinetOpen(true)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Firebase Cloud Sync Prompt Banner if not logged in */}
        {!currentUser && userProfile.hasCompletedOnboarding && (
          <div className="mb-6 p-3.5 rounded-md border border-neutral-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded border border-neutral-200 bg-neutral-50 flex items-center justify-center shrink-0 text-neutral-800">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900">
                  Save your safety checks to the Cloud
                </p>
                <p className="text-xs text-neutral-500">
                  Sign in with Google to securely store your history, medicines, and emergency contacts in Firebase.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogin}
              className="h-8 px-3 rounded-md bg-neutral-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0 select-none"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in with Google</span>
            </button>
          </div>
        )}

        {/* Offline / Connection Error Banner */}
        {networkError && (
          <OfflineBanner
            error={networkError}
            onRetry={() => {
              setNetworkError(null);
            }}
            caregiverContact={caregiverContact}
          />
        )}

        {/* View Routing: Onboarding Form, Reactive Result Card, or Single Front Door */}
        {showOnboarding ? (
          <OnboardingForm
            initialProfile={userProfile}
            onComplete={handleSaveProfile}
            isEditing={isEditingProfile}
            onCancel={userProfile.hasCompletedOnboarding ? () => setIsEditingProfile(false) : undefined}
          />
        ) : currentPayload ? (
          <ReactiveResultCard
            payload={currentPayload}
            fontSizeMode={fontSizeMode}
            speechRate={speechRate}
            caregiverContact={caregiverContact}
            onReset={handleReset}
            onSendCaregiverAlert={handleSendCaregiverAlert}
            isSendingAlert={isSendingAlert}
            userName={userProfile.name}
            preferredGreeting={userProfile.preferredGreeting}
            onAddToMedicineCabinet={handleAddMedicine}
            onOpenMedicineCabinet={() => setIsMedicineCabinetOpen(true)}
          />
        ) : (
          <SingleFrontDoor
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            fontSizeMode={fontSizeMode}
            userName={userProfile.name}
            preferredGreeting={userProfile.preferredGreeting}
          />
        )}

      </main>

      {/* Senior Safety Footer */}
      <footer className="border-t border-neutral-200 bg-white py-4 text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-neutral-900 font-medium">Sahayak Elder Safety Companion</span>
            <span className="text-neutral-300">·</span>
            <span>Always here to help you</span>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <Cloud className="w-3 h-3" />
                Firebase Active
              </span>
            )}
            <p className="text-neutral-500 text-xs">
              Safe &amp; Private · Stored in Firebase Firestore
            </p>
          </div>
        </div>
      </footer>

      {/* Daily Medicine Cabinet & AI Drug Interaction Watchdog Modal */}
      <MedicineCabinetModal
        isOpen={isMedicineCabinetOpen}
        onClose={() => setIsMedicineCabinetOpen(false)}
        medicines={medicines}
        onAddMedicine={handleAddMedicine}
        onDeleteMedicine={handleDeleteMedicine}
        onToggleTaken={handleToggleMedicineTaken}
        fontSizeMode={fontSizeMode}
        speechRate={speechRate}
        userName={userProfile.name}
        preferredGreeting={userProfile.preferredGreeting}
        onSendCaregiverAlert={(text: string, headline: string) =>
          handleSendCaregiverAlert(text, headline)
        }
      />

      {/* Caregiver Alert Log & Emergency Contact Modal */}
      <CaregiverLogModal
        isOpen={isCaregiverModalOpen}
        onClose={() => setIsCaregiverModalOpen(false)}
        dispatches={dispatches}
        contact={caregiverContact}
        onUpdateContact={(updated) => {
          setCaregiverContact(updated);
          const newProf = { ...userProfile, caregiver: updated };
          setUserProfile(newProf);
          try {
            localStorage.setItem('sahayak_user_profile', JSON.stringify(newProf));
          } catch (e) {
            console.warn(e);
          }
          if (currentUser) {
            saveUserProfileToFirestore(currentUser.uid, newProf).catch(console.warn);
          }
        }}
        onSendManualTestAlert={handleSendManualTestAlert}
        isSendingTest={isSendingTest}
      />

      {/* Scanned Documents History Archive Modal */}
      <ScannedHistoryModal
        isOpen={isScannedHistoryOpen}
        onClose={() => setIsScannedHistoryOpen(false)}
        records={scannedRecords}
        onSelectRecord={handleSelectHistoryRecord}
        onClearHistory={handleClearHistory}
      />

    </div>
  );
}
