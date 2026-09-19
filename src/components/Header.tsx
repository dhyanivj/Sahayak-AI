/* Hallmark · macrostructure: elder-intake-docket · theme: warm-tactile-ink · genre: editorial
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * slop test: pass
 */
import React from 'react';
import { Phone, Shield, Volume2, Type, Bell, UserCheck, History } from 'lucide-react';
import { CaregiverContact, UserProfile } from '../types';

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
}) => {
  const displayName = userProfile?.preferredGreeting || userProfile?.name || 'Ramesh Ji';
  const ageDisplay = userProfile?.age ? `(Age ${userProfile.age})` : '';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Identity & Senior Context */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-slate-900">
                  Sahayak <span className="text-teal-700 font-sans font-semibold text-base sm:text-lg">Aura</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Safety Companion
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-sm font-medium text-slate-600">
                  Active for <strong className="text-slate-900 font-bold">{displayName}</strong> {ageDisplay}
                </p>
                {onEditProfile && userProfile?.hasCompletedOnboarding && (
                  <button
                    type="button"
                    onClick={onEditProfile}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:underline"
                    title="Edit profile & preferences"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Preferences</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Controls Bar: Clear, high-contrast, non-competing buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Scanned Archive Button */}
            {onOpenScannedHistory && (
              <button
                id="btn-open-scanned-archive"
                onClick={onOpenScannedHistory}
                className="h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 hover:bg-white text-slate-800 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors touch-target whitespace-nowrap select-none"
                title="View past scanned documents"
                aria-label="Open scanned archive"
              >
                <History className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="hidden sm:inline">Past Scans</span>
                {scannedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-bold text-xs">
                    {scannedCount}
                  </span>
                )}
              </button>
            )}

            {/* Font Size Toggle */}
            <button
              id="btn-toggle-font-size"
              onClick={() => setFontSizeMode(fontSizeMode === 'normal' ? 'large' : 'normal')}
              className="h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 hover:bg-white text-slate-800 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors touch-target whitespace-nowrap select-none"
              title="Toggle Large Print mode"
              aria-label="Toggle text size"
            >
              <Type className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="hidden sm:inline text-slate-500">Print:</span>
              <span className="font-bold text-slate-900">
                {fontSizeMode === 'normal' ? '18px' : '22px'}
              </span>
            </button>

            {/* Voice Speed Toggle */}
            <button
              id="btn-toggle-speech-rate"
              onClick={() => setSpeechRate(speechRate === 0.85 ? 0.70 : speechRate === 0.70 ? 1.0 : 0.85)}
              className="h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 hover:bg-white text-slate-800 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors touch-target whitespace-nowrap select-none"
              title="Cycle Voice Cadence: 0.85x, 0.70x, 1.0x"
              aria-label="Cycle voice reading speed"
            >
              <Volume2 className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="hidden sm:inline text-slate-500">Speed:</span>
              <span className="font-bold text-slate-900">{speechRate}x</span>
            </button>

            {/* Family Alerts History Trigger */}
            <button
              id="btn-open-caregiver-history"
              onClick={onOpenCaregiverModal}
              className="h-11 px-3 rounded-lg border border-slate-300 bg-slate-50 hover:bg-white text-slate-800 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors relative touch-target whitespace-nowrap select-none"
              title="Family Alerts History"
              aria-label="Open family dispatches log"
            >
              <Bell className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="hidden sm:inline">Log</span>
              {dispatchCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {dispatchCount}
                </span>
              )}
            </button>

            {/* Direct Emergency Call Button */}
            <a
              id="link-emergency-call"
              href={`tel:${caregiverContact.phone}`}
              className="h-11 px-3 sm:px-3.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors touch-target whitespace-nowrap select-none"
              title={`Call Emergency Caregiver: ${caregiverContact.name}`}
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>Call {caregiverContact.name}</span>
            </a>

          </div>

        </div>
      </div>
    </header>
  );
};
