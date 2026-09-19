/* Hallmark · macrostructure: elder-intake-docket · theme: warm-tactile-ink · genre: editorial
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * slop test: pass
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Pill,
  Heart,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  CheckCircle2,
  Phone,
  ArrowLeft,
  Info,
  Clock,
  MessageSquare,
  Share2,
  Copy,
  Check,
  ZoomIn,
  X,
  ExternalLink,
} from 'lucide-react';
import { CaregiverContact, SahayakActionPayload } from '../types';

interface ReactiveResultCardProps {
  payload: SahayakActionPayload;
  fontSizeMode: 'normal' | 'large';
  speechRate: number;
  caregiverContact: CaregiverContact;
  onReset: () => void;
  onSendCaregiverAlert: (alertText: string, headline: string) => Promise<boolean>;
  isSendingAlert: boolean;
  userName?: string;
  preferredGreeting?: string;
}

export const ReactiveResultCard: React.FC<ReactiveResultCardProps> = ({
  payload,
  fontSizeMode,
  speechRate,
  caregiverContact,
  onReset,
  onSendCaregiverAlert,
  isSendingAlert,
  userName,
  preferredGreeting,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [alertDispatched, setAlertDispatched] = useState(false);
  const [dispatchedTimestamp, setDispatchedTimestamp] = useState<string | null>(null);
  const [copiedAlert, setCopiedAlert] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isJumbo = fontSizeMode === 'large';

  // Helper to get cleanest telephone number digits for WhatsApp
  const cleanPhoneDigits = caregiverContact.phone.replace(/[^0-9]/g, '');

  // Select the best available natural sounding voice
  const findBestVoice = (): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Preference order: Google English, natural, Samantha, Daniel, Karen, or standard en
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') ||
          v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Karen'))
    );
    return preferred || voices.find((v) => v.lang.startsWith('en')) || voices[0];
  };

  // Voice synthesis effect on load
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported on this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
    setIsPausedAudio(false);

    const speakVoice = () => {
      if (!payload.voice_readout) return;

      const utterance = new SpeechSynthesisUtterance(payload.voice_readout);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      const voice = findBestVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        setIsPlayingAudio(true);
        setIsPausedAudio(false);
      };

      utterance.onend = () => {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
      };

      utterance.onerror = (e) => {
        console.error('Speech synthesis event:', e);
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
      };

      utteranceRef.current = utterance;

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Autoplay speech error:', err);
      }
    };

    // Chrome/Safari often load voices asynchronously
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const timer = setTimeout(speakVoice, 200);
        return () => clearTimeout(timer);
      };
    } else {
      const timer = setTimeout(speakVoice, 300);
      return () => clearTimeout(timer);
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [payload.voice_readout, speechRate]);

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    } else {
      window.speechSynthesis.cancel();
      if (payload.voice_readout) {
        const utterance = new SpeechSynthesisUtterance(payload.voice_readout);
        utterance.rate = speechRate;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';
        const voice = findBestVoice();
        if (voice) utterance.voice = voice;

        utterance.onstart = () => {
          setIsPlayingAudio(true);
          setIsPausedAudio(false);
        };
        utterance.onend = () => {
          setIsPlayingAudio(false);
          setIsPausedAudio(false);
        };
        utterance.onerror = () => {
          setIsPlayingAudio(false);
          setIsPausedAudio(false);
        };
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleReplay = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (payload.voice_readout) {
      const u = new SpeechSynthesisUtterance(payload.voice_readout);
      u.rate = speechRate;
      u.pitch = 1.0;
      u.lang = 'en-US';
      const voice = findBestVoice();
      if (voice) u.voice = voice;

      u.onstart = () => {
        setIsPlayingAudio(true);
        setIsPausedAudio(false);
      };
      u.onend = () => {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
      };
      u.onerror = () => {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
      };
      utteranceRef.current = u;
      window.speechSynthesis.speak(u);
    }
  };

  // Dispatch via Server Webhook
  const handleDispatchCaregiverAlert = async () => {
    if (!payload.caregiver_alert) return;
    const success = await onSendCaregiverAlert(payload.caregiver_alert, payload.headline);
    if (success) {
      setAlertDispatched(true);
      setDispatchedTimestamp(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }
  };

  // Copy Alert text
  const handleCopyAlert = () => {
    if (!payload.caregiver_alert) return;
    navigator.clipboard.writeText(
      `Sahayak AI Alert for ${caregiverContact.name}: "${payload.caregiver_alert}" - Status: ${payload.headline}`
    );
    setCopiedAlert(true);
    setTimeout(() => setCopiedAlert(false), 2500);
  };

  // Native Device Share API
  const handleNativeShare = async () => {
    if (!payload.caregiver_alert) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sahayak AI: ${payload.headline}`,
          text: `Hi ${caregiverContact.name}, notice from Sahayak AI for ${userName || 'Ramesh'}: "${payload.caregiver_alert}"`,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyAlert();
    }
  };

  const isUrgent = payload.is_urgent_or_scam;

  const getModeMetadata = () => {
    switch (payload.mode) {
      case 'SAFETY_BILL_SCAM':
        return {
          label: 'Safety & Anti-Scam Shield',
          icon: ShieldAlert,
          badgeBg: 'bg-red-100/90 text-red-950 border-red-300',
        };
      case 'HEALTH_PILL':
        return {
          label: 'Health & Prescription Guidance',
          icon: Pill,
          badgeBg: 'bg-emerald-100/90 text-emerald-950 border-emerald-300',
        };
      case 'MEMORY_STIMULATION':
        return {
          label: 'Memory Lane & Reminiscence',
          icon: Heart,
          badgeBg: 'bg-amber-100/90 text-amber-950 border-amber-300',
        };
      case 'SMART_ASSIST':
      default:
        return {
          label: 'Smart Home & Life Assistance',
          icon: Sparkles,
          badgeBg: 'bg-blue-100/90 text-blue-950 border-blue-300',
        };
    }
  };

  const modeMeta = getModeMetadata();
  const ModeIcon = modeMeta.icon;

  const fullAlertMessage = payload.caregiver_alert
    ? `Sahayak AI Alert: ${payload.caregiver_alert} (Status: ${payload.headline})`
    : '';

  return (
    <div
      id="card-reactive-result"
      className="max-w-4xl mx-auto rounded-[var(--radius-tactile)] bg-[var(--color-surface)] border-2 border-[var(--color-border-base)] shadow-md overflow-hidden transition-all my-6"
    >
      {/* Zoom Modal for Scanned Document */}
      {isImageModalOpen && payload.sourceImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
              title="Close image view"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={payload.sourceImage}
              alt="Full resolution scanned document"
              className="max-h-[85vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* 1. High-Contrast Status Banner (WCAG AAA Compliant) */}
      <div
        id="banner-status-header"
        className={`p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 ${
          isUrgent
            ? 'bg-[var(--color-danger-border)] text-white border-red-950'
            : 'bg-[var(--color-safe-border)] text-white border-emerald-950'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-white text-slate-900 shadow-xs">
            {isUrgent ? (
              <ShieldAlert className="w-8 h-8 text-red-700" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-800" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="uppercase font-black text-xs tracking-wider px-2.5 py-0.5 rounded-full bg-black/25 text-white whitespace-nowrap">
                {isUrgent ? 'URGENT WARNING • HIGH RISK' : 'VERIFIED • SAFE & ROUTINE'}
              </span>
              {payload.inferenceTimeMs && (
                <span className="text-xs font-bold text-white/90 bg-white/15 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  ⚡ Verified in {(payload.inferenceTimeMs / 1000).toFixed(2)}s
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mt-1 leading-tight text-white tracking-tight">
              {payload.headline}
            </h2>
          </div>
        </div>

        {/* Back / Reset Action Button */}
        <button
          id="btn-scan-another"
          onClick={() => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            onReset();
          }}
          className="h-14 px-6 rounded-xl bg-white hover:bg-slate-100 active:translate-y-0.5 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xs transition-all touch-target whitespace-nowrap shrink-0"
          title="Check another bill or prescription"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Check Another Item</span>
        </button>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        
        {/* Source Image & Mode Header Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-[var(--color-border-base)] flex items-center justify-center shrink-0">
              <ModeIcon className="w-5 h-5 text-[var(--color-action-amber)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase text-[var(--color-ink-muted)]">
                  Mode:
                </span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-md border ${modeMeta.badgeBg}`}>
                  {modeMeta.label}
                </span>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 font-bold">
                Confidence Rationale: {payload.confidence_reason}
              </p>
            </div>
          </div>

          {/* Scanned Image Preview Button */}
          {payload.sourceImage && (
            <button
              type="button"
              onClick={() => setIsImageModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border-2 border-[var(--color-border-base)] hover:border-[var(--color-action-amber)] text-xs font-extrabold text-[var(--color-ink-primary)] shadow-xs transition-colors shrink-0"
              title="Inspect scanned document"
            >
              <img
                src={payload.sourceImage}
                alt="Thumbnail"
                className="w-6 h-6 rounded object-cover border border-slate-200"
              />
              <span>View Scanned Photo</span>
              <ZoomIn className="w-3.5 h-3.5 text-[var(--color-action-amber)]" />
            </button>
          )}
        </div>

        {/* 2. Key Action Points (Numbered for crystal-clear readability) */}
        <div>
          <div className="border-b border-[var(--color-border-subtle)] pb-2 mb-4">
            <h3 className="text-sm font-black text-[var(--color-ink-display)] uppercase tracking-wider">
              Key Action Points for {preferredGreeting || userName || 'You'}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {payload.bullets.map((bullet, idx) => (
              <div
                key={idx}
                className={`p-4 sm:p-5 rounded-xl border-2 flex items-start gap-4 transition-colors ${
                  isUrgent
                    ? 'bg-red-50/70 border-red-300 text-red-950 font-bold'
                    : 'bg-white border-[var(--color-border-base)] text-[var(--color-ink-primary)] font-bold'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-black text-base shadow-2xs ${
                    isUrgent
                      ? 'bg-red-700 text-white'
                      : 'bg-[var(--color-action-amber)] text-white'
                  }`}
                >
                  {idx + 1}
                </div>
                <div
                  className={`flex-1 pt-1 leading-relaxed ${
                    isJumbo ? 'text-2xl font-bold' : 'text-lg sm:text-xl font-bold'
                  }`}
                >
                  {bullet}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Spoken Voice Readout Player */}
        <div
          id="section-voice-readout"
          className="p-5 sm:p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-800 text-white flex items-center justify-center shrink-0">
                {isPlayingAudio ? (
                  <Volume2 className="w-5 h-5 text-white" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Spoken Audio Readout
                </h4>
                <p className="text-xs text-slate-500">
                  Paced for clarity at {speechRate}x speed
                </p>
              </div>
            </div>

            {/* Audio Control Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="btn-toggle-speech-readout"
                type="button"
                onClick={toggleSpeech}
                className="h-11 px-3.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm flex items-center gap-2 touch-target whitespace-nowrap cursor-pointer transition-colors"
                title={isPlayingAudio ? 'Stop reading' : 'Play reading aloud'}
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-4 h-4 text-red-600" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-teal-700" />
                    <span>Listen Aloud</span>
                  </>
                )}
              </button>

              <button
                id="btn-replay-speech"
                type="button"
                onClick={handleReplay}
                className="h-11 px-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm flex items-center gap-1.5 touch-target whitespace-nowrap cursor-pointer transition-colors"
                title="Replay from beginning"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Replay</span>
              </button>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg bg-white border border-slate-200 text-slate-900 leading-relaxed ${
              isPlayingAudio ? 'ring-1 ring-teal-700' : ''
            } ${isJumbo ? 'text-xl' : 'text-base'}`}
          >
            {payload.voice_readout}
          </div>

          {isPlayingAudio && (
            <div className="mt-2 flex items-center gap-2 text-teal-800 font-semibold text-xs">
              <span className="w-2 h-2 rounded-full bg-teal-700 inline-block" />
              <span>Speaking slowly and clearly...</span>
            </div>
          )}
        </div>

        {/* 4. Multi-Channel Family Caregiver Dispatch Box */}
        {payload.caregiver_alert ? (
          <div
            id="caregiver-dispatch-box"
            className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 space-y-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-xs whitespace-nowrap border border-slate-200">
                    Caregiver Dispatch Ready
                  </span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    Contact: {caregiverContact.name} ({caregiverContact.relationship})
                  </span>
                </div>
                <h4 className="text-lg font-serif font-bold text-slate-900">
                  Notify {caregiverContact.relationship.split(' ')[0]} {caregiverContact.name} About This Notice?
                </h4>
                <p className="text-xs sm:text-sm font-mono bg-slate-50 p-3 rounded-md border border-slate-200 text-slate-800 leading-relaxed">
                  "{payload.caregiver_alert}"
                </p>
              </div>

              {/* Primary Dispatch Button */}
              <div className="shrink-0">
                <button
                  id="btn-dispatch-caregiver-alert"
                  onClick={handleDispatchCaregiverAlert}
                  disabled={isSendingAlert || alertDispatched}
                  className={`h-12 px-5 rounded-lg font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors touch-target whitespace-nowrap cursor-pointer ${
                    alertDispatched
                      ? 'bg-emerald-700 text-white cursor-default'
                      : 'bg-teal-800 hover:bg-teal-900 text-white'
                  }`}
                >
                  {alertDispatched ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Alert Recorded & Sent</span>
                    </>
                  ) : isSendingAlert ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispatch Alert to {caregiverContact.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Direct Multi-Channel Actions (Real SMS, WhatsApp, Direct Call, Device Share) */}
            <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-extrabold text-[var(--color-ink-muted)] uppercase tracking-wider mr-1">
                Direct Channels:
              </span>

              {/* Real Direct Phone Call */}
              <a
                id="link-call-caregiver-direct"
                href={`tel:${caregiverContact.phone}`}
                className="h-11 px-3.5 rounded-lg bg-white hover:bg-[var(--color-surface-sunken)] border border-[var(--color-border-base)] text-[var(--color-ink-display)] font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-colors touch-target whitespace-nowrap active:translate-y-0.5"
                title={`Call ${caregiverContact.name} directly on phone`}
              >
                <Phone className="w-4 h-4 text-emerald-700" />
                <span>Call Phone</span>
              </a>

              {/* Real Direct SMS */}
              <a
                id="link-sms-caregiver-direct"
                href={`sms:${caregiverContact.phone}?body=${encodeURIComponent(fullAlertMessage)}`}
                className="h-11 px-3.5 rounded-lg bg-white hover:bg-[var(--color-surface-sunken)] border border-[var(--color-border-base)] text-[var(--color-ink-display)] font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-colors touch-target whitespace-nowrap active:translate-y-0.5"
                title={`Send prefilled SMS to ${caregiverContact.name}`}
              >
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Send SMS</span>
              </a>

              {/* Real Direct WhatsApp */}
              <a
                id="link-whatsapp-caregiver-direct"
                href={`https://wa.me/${cleanPhoneDigits}?text=${encodeURIComponent(fullAlertMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-3.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-colors touch-target whitespace-nowrap active:translate-y-0.5"
                title={`Send via WhatsApp to ${caregiverContact.name}`}
              >
                <ExternalLink className="w-4 h-4 text-emerald-700" />
                <span>WhatsApp</span>
              </a>

              {/* Native Share */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="h-11 px-3.5 rounded-lg bg-white hover:bg-[var(--color-surface-sunken)] border border-[var(--color-border-base)] text-[var(--color-ink-display)] font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-colors touch-target whitespace-nowrap"
                title="Share via device share sheet"
              >
                <Share2 className="w-4 h-4 text-[var(--color-ink-muted)]" />
                <span>Share</span>
              </button>

              {/* Copy Text */}
              <button
                type="button"
                onClick={handleCopyAlert}
                className="h-11 px-3.5 rounded-lg bg-white hover:bg-[var(--color-surface-sunken)] border border-[var(--color-border-base)] text-[var(--color-ink-display)] font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-colors touch-target whitespace-nowrap"
                title="Copy alert text to clipboard"
              >
                {copiedAlert ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span className="text-emerald-800">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[var(--color-ink-muted)]" />
                    <span>Copy Alert</span>
                  </>
                )}
              </button>
            </div>

            {alertDispatched && (
              <div
                id="alert-success-confirmation"
                className="mt-3.5 p-3 rounded-lg bg-emerald-50 border border-emerald-300 flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Alert recorded and dispatched at {dispatchedTimestamp}. Log saved in Family Records.
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span className="font-bold text-sm sm:text-base">
                Routine status. No family alert was necessary for this item.
              </span>
            </div>
            <a
              id="link-call-caregiver-peace-of-mind"
              href={`tel:${caregiverContact.phone}`}
              className="px-3.5 py-2 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-xs sm:text-sm flex items-center gap-1.5 touch-target whitespace-nowrap self-start sm:self-auto"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call {caregiverContact.name} anyway</span>
            </a>
          </div>
        )}

      </div>
    </div>
  );
};
