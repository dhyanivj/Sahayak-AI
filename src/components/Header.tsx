import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Volume2,
  Type,
  Bell,
  UserCheck,
  History,
  Cloud,
  LogIn,
  LogOut,
  Pill,
  Globe,
  Eye,
  Check,
  ChevronDown,
} from 'lucide-react';
import { CaregiverContact, UserProfile, AppLanguage } from '../types';
import { FirebaseUser } from '../lib/firebase';
import { getTranslation, SUPPORTED_LANGUAGES } from '../lib/translations';

interface HeaderProps {
  fontSizeMode: 'normal' | 'large' | 'jumbo';
  setFontSizeMode: (mode: 'normal' | 'large' | 'jumbo') => void;
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
  appLanguage?: AppLanguage;
  onSelectLanguage?: (lang: AppLanguage) => void;
  highContrastMode?: boolean;
  onToggleHighContrast?: () => void;
  onReadScreenAloud?: () => void;
  isReadingScreen?: boolean;
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
  appLanguage = 'English',
  onSelectLanguage,
  highContrastMode = false,
  onToggleHighContrast,
  onReadScreenAloud,
  isReadingScreen = false,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement | null>(null);

  const t = getTranslation(appLanguage);
  const displayName =
    userProfile?.preferredGreeting ||
    userProfile?.name ||
    (currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'You');

  // Close language menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangMenuOpen]);

  // Cycle font size: normal -> large -> jumbo -> normal
  const cycleFontSize = () => {
    if (fontSizeMode === 'normal') setFontSizeMode('large');
    else if (fontSizeMode === 'large') setFontSizeMode('jumbo');
    else setFontSizeMode('normal');
  };

  const getFontSizeLabel = () => {
    if (fontSizeMode === 'jumbo') return t.header.jumbo;
    if (fontSizeMode === 'large') return t.header.large;
    return t.header.normal;
  };

  const currentLangMeta = SUPPORTED_LANGUAGES.find((l) => l.code === appLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <header
      className={`sticky top-0 z-40 transition-colors ${
        highContrastMode
          ? 'bg-black text-white border-b-2 border-yellow-400'
          : 'bg-white/95 backdrop-blur-sm border-b border-neutral-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Brand & Senior Greeting */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs ${
                  highContrastMode ? 'bg-yellow-400 text-black font-extrabold' : 'bg-black text-white'
                }`}
              >
                S
              </div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight">
                <span className={`text-base sm:text-lg ${highContrastMode ? 'text-yellow-400' : 'text-neutral-900'}`}>
                  {t.header.brand}
                </span>
              </div>
            </div>

            {/* Cloud sync status pill */}
            {currentUser ? (
              <div
                className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  highContrastMode
                    ? 'border border-yellow-400 bg-neutral-900 text-yellow-300'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}
                title="Connected to Firebase Cloud Storage"
              >
                <Cloud className="w-3 h-3 text-emerald-600" />
                <span>{t.header.cloudSaved}</span>
              </div>
            ) : (
              <div
                className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  highContrastMode
                    ? 'border border-neutral-700 bg-neutral-900 text-neutral-300'
                    : 'border border-neutral-200 bg-neutral-50 text-neutral-600'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 inline-block" />
                <span>{t.header.localDevice}</span>
              </div>
            )}

            {/* Senior identity pill */}
            {userProfile?.name && (
              <div
                className={`hidden lg:flex items-center gap-1.5 text-xs font-medium pl-2 border-l ${
                  highContrastMode ? 'border-neutral-700 text-neutral-300' : 'border-neutral-200 text-neutral-500'
                }`}
              >
                <span>{t.header.helping}</span>
                <span className={`font-semibold ${highContrastMode ? 'text-yellow-400' : 'text-neutral-900'}`}>
                  {displayName}
                </span>
              </div>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
            
            {/* Language Selector Dropdown */}
            {onSelectLanguage && (
              <div className="relative shrink-0" ref={langMenuRef}>
                <button
                  id="btn-language-selector"
                  type="button"
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className={`h-9 px-2.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
                    highContrastMode
                      ? 'border-yellow-400 bg-neutral-900 text-yellow-300 hover:bg-neutral-800'
                      : 'border-neutral-300 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-800'
                  }`}
                  title="Change language / भाषा बदलें"
                  aria-label="Select app language"
                  aria-expanded={isLangMenuOpen}
                >
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-sm sm:text-xs">{currentLangMeta.nativeLabel}</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {isLangMenuOpen && (
                  <div
                    className={`absolute right-0 mt-1 w-52 rounded-md shadow-xl border z-50 py-1.5 ${
                      highContrastMode
                        ? 'bg-neutral-950 border-2 border-yellow-400 text-white'
                        : 'bg-white border-neutral-200 text-neutral-900'
                    }`}
                    role="menu"
                  >
                    <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 mb-1">
                      {t.header.language} / Select Language
                    </div>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          onSelectLanguage(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${
                          appLanguage === lang.code
                            ? highContrastMode
                              ? 'bg-yellow-400/20 text-yellow-300 font-bold'
                              : 'bg-neutral-100 text-neutral-900 font-bold'
                            : highContrastMode
                            ? 'hover:bg-neutral-900 text-neutral-200'
                            : 'hover:bg-neutral-50 text-neutral-700'
                        }`}
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold">{lang.nativeLabel}</span>
                          <span className="text-xs text-neutral-400">({lang.englishLabel})</span>
                        </div>
                        {appLanguage === lang.code && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Read Screen Aloud Button (Accessibility Super Feature) */}
            {onReadScreenAloud && (
              <button
                id="btn-read-screen-aloud"
                type="button"
                onClick={onReadScreenAloud}
                className={`h-9 px-2.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none shrink-0 ${
                  isReadingScreen
                    ? highContrastMode
                      ? 'border-yellow-400 bg-yellow-400 text-black animate-pulse'
                      : 'border-emerald-600 bg-emerald-50 text-emerald-800 animate-pulse'
                    : highContrastMode
                    ? 'border-yellow-400 bg-neutral-900 text-yellow-300 hover:bg-neutral-800'
                    : 'border-neutral-300 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-800'
                }`}
                title="Listen to this screen read aloud / यह पेज सुनकर समझें"
                aria-label="Read screen aloud"
              >
                <Volume2 className={`w-4 h-4 ${isReadingScreen ? 'text-emerald-700' : 'text-neutral-600'}`} />
                <span className="hidden sm:inline">
                  {isReadingScreen ? t.header.readingScreen : t.header.readScreen}
                </span>
              </button>
            )}

            {/* High Contrast Mode Toggle */}
            {onToggleHighContrast && (
              <button
                id="btn-toggle-high-contrast"
                type="button"
                onClick={onToggleHighContrast}
                className={`h-9 px-2 sm:px-2.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer select-none shrink-0 ${
                  highContrastMode
                    ? 'border-yellow-400 bg-yellow-400 text-black font-extrabold'
                    : 'border-neutral-300 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-800'
                }`}
                title="Toggle high-contrast mode for clear eyesight"
                aria-label="Toggle high contrast"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden md:inline">
                  {highContrastMode ? t.header.contrastOn : t.header.contrast}
                </span>
              </button>
            )}

            {/* Medicine Cabinet Button */}
            {onOpenMedicineCabinet && (
              <button
                id="btn-open-medicine-cabinet"
                onClick={onOpenMedicineCabinet}
                className={`h-9 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none shrink-0 ${
                  highContrastMode
                    ? 'border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-yellow-400'
                    : 'border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900'
                }`}
                title="Daily Medicine Routine & AI Interaction Watchdog"
                aria-label="Open daily medicines"
              >
                <Pill className="w-3.5 h-3.5 text-neutral-600" />
                <span className="hidden sm:inline">{t.header.medicines}</span>
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
                className={`h-9 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none shrink-0 ${
                  highContrastMode
                    ? 'border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-yellow-400'
                    : 'border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900'
                }`}
                title="View past items you checked"
                aria-label="Open past checked items"
              >
                <History className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline">{t.header.pastItems}</span>
                {scannedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-900 text-[10px] font-semibold border border-neutral-200">
                    {scannedCount}
                  </span>
                )}
              </button>
            )}

            {/* Font Size Toggle (Normal -> Large -> Jumbo) */}
            <button
              id="btn-toggle-font-size"
              onClick={cycleFontSize}
              className={`h-9 px-2 sm:px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none shrink-0 ${
                highContrastMode
                  ? 'border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-yellow-400'
                  : 'border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900'
              }`}
              title="Change text size on screen (Normal / Large / Jumbo)"
              aria-label="Change text size"
            >
              <Type className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden lg:inline text-neutral-500">{t.header.textSize}:</span>
              <span className="font-bold">{getFontSizeLabel()}</span>
            </button>

            {/* Voice Speed Toggle */}
            <button
              id="btn-toggle-speech-rate"
              onClick={() => setSpeechRate(speechRate === 0.85 ? 0.70 : speechRate === 0.70 ? 1.0 : 0.85)}
              className={`h-9 px-2 sm:px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none shrink-0 ${
                highContrastMode
                  ? 'border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-yellow-400'
                  : 'border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900'
              }`}
              title="Change reading aloud speed (Slow, Normal, Fast)"
              aria-label="Change voice reading speed"
            >
              <Volume2 className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden lg:inline text-neutral-500">{t.header.voiceSpeed}:</span>
              <span className="font-bold">
                {speechRate === 0.85 ? t.header.normal : speechRate === 0.70 ? t.header.slow : t.header.fast}
              </span>
            </button>

            {/* Caregiver Log / Bell */}
            <button
              id="btn-open-caregiver-history"
              onClick={onOpenCaregiverModal}
              className={`h-9 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors relative cursor-pointer select-none shrink-0 ${
                highContrastMode
                  ? 'border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-yellow-400'
                  : 'border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900'
              }`}
              title="View messages sent to family"
              aria-label="Open family messages"
            >
              <Bell className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">{t.header.alerts}</span>
              {dispatchCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {dispatchCount}
                </span>
              )}
            </button>

            {/* Profile Preferences */}
            {onEditProfile && userProfile?.hasCompletedOnboarding && (
              <button
                type="button"
                onClick={onEditProfile}
                className={`h-9 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                  highContrastMode
                    ? 'border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-yellow-400'
                    : 'border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900'
                }`}
                title="Your settings and preferences"
              >
                <UserCheck className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden xl:inline">{t.header.settings}</span>
              </button>
            )}

            {/* Firebase Auth Google Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 shrink-0">
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
                    className="h-9 px-2 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white text-neutral-600 hover:text-neutral-900 text-xs flex items-center transition-colors cursor-pointer"
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
                  className="h-9 px-2.5 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none shrink-0"
                  title="Sign in with Google to save your history safely in Firebase cloud"
                >
                  <LogIn className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="hidden sm:inline">{t.header.signIn}</span>
                </button>
              )
            )}

            {/* Emergency Call Button */}
            {caregiverContact?.phone && (
              <a
                id="link-emergency-call"
                href={`tel:${caregiverContact.phone}`}
                className={`h-9 px-3 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none shadow-sm shrink-0 ${
                  highContrastMode
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-yellow-500'
                    : 'bg-neutral-900 hover:bg-black text-white border border-neutral-900'
                }`}
                title={`Call Emergency Contact: ${caregiverContact.name || 'Caregiver'}`}
              >
                <Phone className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                <span>
                  {t.header.callFamily} ({caregiverContact.name ? caregiverContact.name.split(' ')[0] : 'Family'})
                </span>
              </a>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
