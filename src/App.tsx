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
import { OfflineBanner } from './components/OfflineBanner';
import {
  CaregiverContact,
  CaregiverDispatchLog,
  SahayakActionPayload,
  UserProfile,
  ScannedRecord,
} from './types';

// Default starter profile
const defaultProfile: UserProfile = {
  name: 'Ramesh Sharma',
  preferredGreeting: 'Ramesh Ji',
  age: 71,
  primaryConcern: 'all',
  fontSizeMode: 'normal',
  speechRate: 0.85,
  caregiver: {
    name: 'Priya',
    relationship: 'Daughter (Emergency Contact)',
    phone: '+1 (555) 019-2834',
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
      name: 'Priya',
      relationship: 'Daughter (Emergency Contact)',
      phone: '+1 (555) 019-2834',
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
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Sync profile preferences when profile changes
  const handleSaveProfile = (updated: UserProfile) => {
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
    playGentleChime('success');
  };

  // Load existing dispatches on startup
  useEffect(() => {
    fetch('/api/caregiver-history')
      .then((res) => res.json())
      .then((data) => {
        if (data.dispatches && Array.isArray(data.dispatches)) {
          setDispatches(data.dispatches);
        }
      })
      .catch((err) => console.warn('Could not load caregiver history:', err));
  }, []);

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

      // Save to Scanned Records History
      const newRecord: ScannedRecord = {
        id: `SCAN-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        headline: fullResult.headline,
        mode: fullResult.mode,
        is_urgent_or_scam: fullResult.is_urgent_or_scam,
        thumbnailUrl: sourceImageDataUrl,
        payload: fullResult,
      };

      setScannedRecords((prev) => {
        const updated = [newRecord, ...prev];
        try {
          localStorage.setItem('sahayak_scanned_history', JSON.stringify(updated.slice(0, 30)));
        } catch (err) {
          console.warn('Could not save scan history:', err);
        }
        return updated;
      });

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

  // Dispatch caregiver alert webhook
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
      }
      playGentleChime('success');
      return true;
    } catch (err: any) {
      console.error('Caregiver notification error:', err);
      alert(`Could not dispatch alert. You can call ${caregiverContact.name} directly using the phone button.`);
      return false;
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Manual test ping to caregiver webhook
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
          headline: `Manual Test Ping from ${seniorGreeting}`,
          mode: 'SMART_ASSIST',
          is_urgent: false,
          alertMessage: `Daily check-in: ${seniorGreeting} has active Sahayak AI companion running smoothly.`,
          recipient: caregiverContact,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.dispatch) {
          setDispatches((prev) => [resData.dispatch, ...prev]);
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

  const handleClearHistory = () => {
    if (confirm('Clear your scanned document history?')) {
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
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

        {/* View Routing: Form Before Landing Page, Reactive Result Card, or Single Front Door */}
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
      <footer className="border-t border-[var(--color-border-base)] bg-[var(--color-surface)] py-5 text-center text-xs sm:text-sm font-bold text-[var(--color-ink-muted)]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p className="flex items-center gap-2">
            <span>🛡️ Sahayak AI (Aura) • Multimodal Companion for {userProfile.preferredGreeting || userProfile.name}</span>
          </p>
          <p className="text-[var(--color-ink-subtle)] text-xs">
            WCAG AAA High-Contrast Standard • Respectful Senior Care
          </p>
        </div>
      </footer>

      {/* Caregiver Alert Log & Emergency Contact Modal */}
      <CaregiverLogModal
        isOpen={isCaregiverModalOpen}
        onClose={() => setIsCaregiverModalOpen(false)}
        dispatches={dispatches}
        contact={caregiverContact}
        onUpdateContact={(updated) => {
          setCaregiverContact(updated);
          setUserProfile((prev) => ({ ...prev, caregiver: updated }));
          try {
            localStorage.setItem(
              'sahayak_user_profile',
              JSON.stringify({ ...userProfile, caregiver: updated })
            );
          } catch (e) {
            console.warn(e);
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
