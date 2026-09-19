import React from 'react';
import { Phone, Volume2, Type, Bell, UserCheck, History, Cloud, LogIn, LogOut, Pill } from 'lucide-react';
import { CaregiverContact, UserProfile } from '../types';
import { FirebaseUser } from '../lib/firebase';

interface HeaderProps {
  fontSizeMode: 'normal' | 'large';
  setFontSizeMode: (mode: 'normal' | 'large') => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  caregiverContact: CaregiverContact;
  dispatchCount: number;
  onOpenCaregiverModal: () => void;
  userProfile?: UserProfile | null;
  onEditProfile?: () => void;
  scannedCount?: number;
  onOpenScannedHistory?: () => void;
  medicineCount?: number;
  onOpenMedicineCabinet?: () => void;
  currentUser?: FirebaseUser | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  fontSizeMode,
  setFontSizeMode,
  speechRate,
  setSpeechRate,
  caregiverContact,
  dispatchCount,
  onOpenCaregiverModal,
  userProfile,
  onEditProfile,
  scannedCount = 0,
  onOpenScannedHistory,
  medicineCount = 0,
  onOpenMedicineCabinet,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const displayName = userProfile?.preferredGreeting || userProfile?.name || (currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'You');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand & Senior Greeting */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black text-white rounded flex items-center justify-center font-bold text-xs">
                S
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-neutral-900">
                <span>Sahayak</span>
              </div>
            </div>

            {/* Cloud sync status pill */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-[11px] font-medium text-emerald-800" title="Connected to Firebase Cloud Storage">
                <Cloud className="w-3 h-3 text-emerald-600" />
                <span>Cloud Saved</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-neutral-200 bg-neutral-50 text-[11px] font-medium text-neutral-600">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 inline-block" />
                <span>Local Device</span>
              </div>
            )}

            {/* Senior identity pill */}
            {userProfile?.name && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-500 font-medium pl-2 border-l border-neutral-200">
                <span>Helping</span>
                <span className="text-neutral-900 font-semibold">{displayName}</span>
              </div>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            
            {/* Medicine Cabinet Button */}
            {onOpenMedicineCabinet && (
              <button
                id="btn-open-medicine-cabinet"
                onClick={onOpenMedicineCabinet}
                className="h-8 px-2.5 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                title="Daily Medicine Routine & AI Interaction Watchdog"
                aria-label="Open daily medicines"
              >
                <Pill className="w-3.5 h-3.5 text-neutral-600" />
                <span className="hidden sm:inline">Medicines</span>
                {medicineCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-900 text-[10px] font-semibold border border-neutral-200">
                    {medicineCount}
                  </span>
                )}
              </button>
            )}

            {/* Scanned Items Button */}
            {onOpenScannedHistory && (
              <button
                id="btn-open-scanned-archive"
                onClick={onOpenScannedHistory}
                className="h-8 px-2.5 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                title="View past items you checked"
                aria-label="Open past checked items"
              >
                <History className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline">Past Items</span>
                {scannedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-900 text-[10px] font-semibold border border-neutral-200">
                    {scannedCount}
                  </span>
                )}
              </button>
            )}

            {/* Large Print Toggle */}
            <button
              id="btn-toggle-font-size"
              onClick={() => setFontSizeMode(fontSizeMode === 'normal' ? 'large' : 'normal')}
              className="h-8 px-2.5 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none"
              title="Change text size on screen"
              aria-label="Change text size"
            >
              <Type className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline text-neutral-500">Text:</span>
              <span className="font-semibold text-neutral-900">
                {fontSizeMode === 'normal' ? 'Normal' : 'Large'}
              </span>
            </button>

            {/* Voice Speed Toggle */}
            <button
              id="btn-toggle-speech-rate"
              onClick={() => setSpeechRate(speechRate === 0.85 ? 0.70 : speechRate === 0.70 ? 1.0 : 0.85)}
              className="h-8 px-2.5 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none"
              title="Change reading aloud speed (Slow, Normal, Fast)"
              aria-label="Change voice reading speed"
            >
              <Volume2 className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline text-neutral-500">Voice:</span>
              <span className="font-semibold text-neutral-900">
                {speechRate === 0.85 ? 'Normal' : speechRate === 0.70 ? 'Slow' : 'Fast'}
              </span>
            </button>

            {/* Caregiver Log / Bell */}
            <button
              id="btn-open-caregiver-history"
              onClick={onOpenCaregiverModal}
              className="h-8 px-2.5 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs flex items-center gap-1.5 transition-colors relative cursor-pointer select-none"
              title="View messages sent to family"
              aria-label="Open family messages"
            >
              <Bell className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Alerts</span>
              {dispatchCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-neutral-900 text-white text-[10px] flex items-center justify-center font-bold">
                  {dispatchCount}
                </span>
              )}
            </button>

            {/* Profile Preferences */}
            {onEditProfile && userProfile?.hasCompletedOnboarding && (
              <button
                type="button"
                onClick={onEditProfile}
                className="h-8 px-2.5 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Your settings and preferences"
              >
                <UserCheck className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden lg:inline">Settings</span>
              </button>
            )}

            {/* Firebase Auth Google Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-neutral-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center font-semibold text-xs">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Sign Out of Cloud Storage"
                    className="h-8 px-2 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white text-neutral-600 hover:text-neutral-900 text-xs flex items-center transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              onLogin && (
                <button
                  type="button"
                  id="btn-google-login"
                  onClick={onLogin}
                  className="h-8 px-2.5 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                  title="Sign in with Google to save your history safely in Firebase cloud"
                >
                  <LogIn className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )
            )}

            {/* Emergency Call: Solid Black Vercel Button */}
            {caregiverContact?.phone && (
              <a
                id="link-emergency-call"
                href={`tel:${caregiverContact.phone}`}
                className="h-8 px-3 rounded-md bg-neutral-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none border border-neutral-900 shadow-2xs"
                title={`Call Emergency Contact: ${caregiverContact.name || 'Caregiver'}`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {caregiverContact.name ? caregiverContact.name.split(' ')[0] : 'Family'}</span>
              </a>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
