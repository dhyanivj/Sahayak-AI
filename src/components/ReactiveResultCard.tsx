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
  MessageSquare,
  Share2,
  Copy,
  Check,
  ZoomIn,
  X,
  ExternalLink,
  Clock,
  Globe,
  Mic,
  MicOff,
  CornerDownRight,
  AlertTriangle,
  Plus,
  Utensils,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { CaregiverContact, SahayakActionPayload, ClarifyMessage, MedicineItem } from '../types';

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
  onAddToMedicineCabinet?: (med: Omit<MedicineItem, 'id' | 'userId' | 'addedAt'>) => void;
  onOpenMedicineCabinet?: () => void;
}

export const ReactiveResultCard: React.FC<ReactiveResultCardProps> = ({
  payload: initialPayload,
  fontSizeMode,
  speechRate,
  caregiverContact,
  onReset,
  onSendCaregiverAlert,
  isSendingAlert,
  userName,
  preferredGreeting,
  onAddToMedicineCabinet,
  onOpenMedicineCabinet,
}) => {
  // Current active payload (can be updated by translation)
  const [payload, setPayload] = useState<SahayakActionPayload>(initialPayload);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [alertDispatched, setAlertDispatched] = useState(false);
  const [dispatchedTimestamp, setDispatchedTimestamp] = useState<string | null>(null);
  const [copiedAlert, setCopiedAlert] = useState(false);
  const [copiedRebuttal, setCopiedRebuttal] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAddedToCabinet, setIsAddedToCabinet] = useState(false);

  // Translation State
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<string>(payload.currentLanguage || 'English');

  // Follow-up Conversation ("Ask Sahayak") State
  const [clarifyQuestion, setClarifyQuestion] = useState('');
  const [clarifyMessages, setClarifyMessages] = useState<ClarifyMessage[]>([]);
  const [isAskingClarification, setIsAskingClarification] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [playingClarifyAudioId, setPlayingClarifyAudioId] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);
  const isJumbo = fontSizeMode === 'large';

  // Keep payload in sync if initialPayload changes
  useEffect(() => {
    setPayload(initialPayload);
    setActiveLanguage(initialPayload.currentLanguage || 'English');
    setClarifyMessages([]);
    setIsAddedToCabinet(false);
  }, [initialPayload]);

  // Clean phone digits for WhatsApp
  const cleanPhoneDigits = caregiverContact.phone.replace(/[^0-9]/g, '');

  const findBestVoice = (langCode: string = 'en'): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const matchedLang = voices.find((v) => v.lang.toLowerCase().startsWith(langCode.toLowerCase()));
    if (matchedLang) return matchedLang;

    const preferredEn = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') ||
          v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Karen'))
    );
    return preferredEn || voices[0];
  };

  const getLangCode = (lang: string): string => {
    switch (lang) {
      case 'Hindi': return 'hi-IN';
      case 'Tamil': return 'ta-IN';
      case 'Telugu': return 'te-IN';
      case 'Bengali': return 'bn-IN';
      case 'Marathi': return 'mr-IN';
      case 'Spanish': return 'es-ES';
      default: return 'en-US';
    }
  };

  const speakText = (text: string, lang: string = activeLanguage, onEndCallback?: () => void) => {
    if (!('speechSynthesis' in window) || !text) return;

    window.speechSynthesis.cancel();
    const langCode = getLangCode(lang);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.lang = langCode;

    const voice = findBestVoice(langCode.split('-')[0]);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
    };
    utterance.onend = () => {
      setIsPlayingAudio(false);
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = () => {
      setIsPlayingAudio(false);
      if (onEndCallback) onEndCallback();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Auto-speak initial voice readout
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const timer = setTimeout(() => {
      speakText(payload.voice_readout, activeLanguage);
    }, 350);

    return () => {
      clearTimeout(timer);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [payload.voice_readout]);

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setPlayingClarifyAudioId(null);
    } else {
      speakText(payload.voice_readout, activeLanguage);
    }
  };

  // Translation Handler
  const handleTranslate = async (targetLang: string) => {
    if (targetLang === activeLanguage || isTranslating) return;
    setIsTranslating(true);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload,
          targetLanguage: targetLang,
        }),
      });

      if (!res.ok) throw new Error('Translation failed');
      const translated: SahayakActionPayload = await res.json();
      setPayload(translated);
      setActiveLanguage(targetLang);

      // Speak newly translated voice readout
      speakText(translated.voice_readout, targetLang);
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Follow-Up Question Handler
  const handleSendClarification = async (customQ?: string) => {
    const q = (customQ || clarifyQuestion).trim();
    if (!q || isAskingClarification) return;

    const userMsg: ClarifyMessage = {
      id: `msg-${Date.now()}`,
      sender: 'elder',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...clarifyMessages, userMsg];
    setClarifyMessages(updatedHistory);
    setClarifyQuestion('');
    setIsAskingClarification(true);

    try {
      const res = await fetch('/api/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          currentPayload: payload,
          history: updatedHistory,
          userProfile: {
            name: userName,
            preferredGreeting,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to clarify');
      const data = await res.json();

      const assistantMsg: ClarifyMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'sahayak',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setClarifyMessages([...updatedHistory, assistantMsg]);

      // Speak answer aloud
      setPlayingClarifyAudioId(assistantMsg.id);
      speakText(data.answer, activeLanguage, () => {
        setPlayingClarifyAudioId(null);
      });
    } catch (err) {
      console.error(err);
      const errorMsg: ClarifyMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'sahayak',
        text: `I am right here with you, ${preferredGreeting || 'Friend'}. For safety, remember you can always call your family or pharmacist directly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setClarifyMessages([...updatedHistory, errorMsg]);
    } finally {
      setIsAskingClarification(false);
    }
  };

  // Voice Input Setup using Web Speech Recognition
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isVoiceListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsVoiceListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getLangCode(activeLanguage);

      recognition.onstart = () => {
        setIsVoiceListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setClarifyQuestion(transcript);
        setIsVoiceListening(false);
        // Automatically ask after dictation for ease
        handleSendClarification(transcript);
      };

      recognition.onerror = () => {
        setIsVoiceListening(false);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsVoiceListening(false);
    }
  };

  // Dispatch Caregiver Alert
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

  // Add Medicine to Cabinet
  const handleAddCurrentMedicine = () => {
    if (!onAddToMedicineCabinet) return;

    const medName = payload.medicineDetails?.name || payload.headline;
    const medPurpose = payload.medicineDetails?.purpose || payload.bullets[0] || 'Health routine';
    const medTiming = payload.medicineDetails?.timing || 'morning';
    const medInstructions = payload.medicineDetails?.instructions || payload.bullets[1] || 'Take with water';
    const medCautions = payload.medicineDetails?.cautions || '';

    onAddToMedicineCabinet({
      name: medName,
      purpose: medPurpose,
      timing: medTiming,
      instructions: medInstructions,
      cautions: medCautions,
      takenToday: false,
    });

    setIsAddedToCabinet(true);
  };

  const handleCopyAlert = () => {
    if (!payload.caregiver_alert) return;
    navigator.clipboard.writeText(
      `Sahayak AI Alert for ${caregiverContact.name}: "${payload.caregiver_alert}" - Status: ${payload.headline}`
    );
    setCopiedAlert(true);
    setTimeout(() => setCopiedAlert(false), 2500);
  };

  const handleCopyRebuttal = (script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedRebuttal(true);
    setTimeout(() => setCopiedRebuttal(false), 2500);
  };

  const isUrgent = payload.is_urgent_or_scam;

  const getModeMetadata = () => {
    switch (payload.mode) {
      case 'SAFETY_BILL_SCAM':
        return {
          label: 'Bill & Scam Safety Check',
          icon: ShieldAlert,
        };
      case 'HEALTH_PILL':
        return {
          label: 'Medicine & Prescription Check',
          icon: Pill,
        };
      case 'MEMORY_STIMULATION':
        return {
          label: 'Family & Memory Recall',
          icon: Heart,
        };
      case 'SMART_ASSIST':
      default:
        return {
          label: 'Daily Companion Helper',
          icon: Sparkles,
        };
    }
  };

  const modeMeta = getModeMetadata();
  const ModeIcon = modeMeta.icon;

  const fullAlertMessage = payload.caregiver_alert
    ? `Sahayak AI Alert: ${payload.caregiver_alert} (Status: ${payload.headline})`
    : '';

  // Suggested follow-up quick questions based on mode
  const getQuickQuestions = (): string[] => {
    if (payload.mode === 'HEALTH_PILL') {
      return [
        'Can I take this after meals?',
        'What if I accidentally miss a dose?',
        'What are common side effects for seniors?',
        'Explain this in simpler words',
      ];
    }
    if (payload.mode === 'SAFETY_BILL_SCAM') {
      return [
        'Is it completely safe to ignore this message?',
        'Why exactly is this a fake bill?',
        'What should I say if they call me?',
        'Will my electricity or phone actually be cut?',
      ];
    }
    if (payload.mode === 'MEMORY_STIMULATION') {
      return [
        'Tell me a comforting story about this photo',
        'What questions can I ask my grandchildren about this?',
      ];
    }
    return [
      'Explain this in even simpler words',
      'What is the very first thing I should do?',
    ];
  };

  return (
    <div
      id="card-reactive-result"
      className="rounded-md bg-white border border-neutral-200 overflow-hidden my-4 shadow-sm"
    >
      {/* Zoom Modal for Scanned Document */}
      {isImageModalOpen && payload.sourceImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-md overflow-hidden p-2 border border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded bg-black text-white flex items-center justify-center hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Close image view"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={payload.sourceImage}
              alt="Full resolution scanned document"
              className="max-h-[85vh] w-auto object-contain rounded"
            />
          </div>
        </div>
      )}

      {/* 1. Inspection Header */}
      <div className="p-5 sm:p-6 border-b border-neutral-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {isUrgent ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Caution: Suspicious or Threat
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Looks Safe to Proceed
              </span>
            )}

            {payload.inferenceTimeMs && (
              <span className="text-xs text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded bg-neutral-50">
                Verified in {(payload.inferenceTimeMs / 1000).toFixed(1)}s
              </span>
            )}

            {activeLanguage !== 'English' && (
              <span className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Translated to {activeLanguage}
              </span>
            )}
          </div>

          <button
            id="btn-scan-another"
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onReset();
            }}
            className="h-8 px-3 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white text-neutral-700 hover:text-neutral-900 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none self-start sm:self-auto"
            title="Check another document or ask another question"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Check Another Item</span>
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-snug">
          {payload.headline}
        </h2>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Multilingual Vernacular Bar */}
        <div className="p-3 rounded-md border border-neutral-200 bg-neutral-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-neutral-600 shrink-0" />
            <span className="font-semibold text-neutral-800">
              Listen &amp; Read in My Language:
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { code: 'English', label: 'English' },
              { code: 'Hindi', label: 'हिंदी' },
              { code: 'Tamil', label: 'தமிழ்' },
              { code: 'Telugu', label: 'తెలుగు' },
              { code: 'Bengali', label: 'বাংলা' },
              { code: 'Marathi', label: 'मराठी' },
              { code: 'Spanish', label: 'Español' },
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleTranslate(lang.code)}
                disabled={isTranslating}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer select-none ${
                  activeLanguage === lang.code
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-700'
                }`}
              >
                {lang.label}
              </button>
            ))}
            {isTranslating && (
              <span className="text-[11px] text-neutral-500 italic ml-1">
                Translating...
              </span>
            )}
          </div>
        </div>

        {/* Category & Reason Strip */}
        <div className="p-3.5 rounded-md border border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-neutral-200 bg-white flex items-center justify-center text-neutral-900 shrink-0">
              <ModeIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-medium">Category:</span>
                <span className="font-semibold text-neutral-900">
                  {modeMeta.label}
                </span>
              </div>
              <p className="text-xs text-neutral-600 mt-0.5">
                {payload.confidence_reason}
              </p>
            </div>
          </div>

          {payload.sourceImage && (
            <button
              type="button"
              onClick={() => setIsImageModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-neutral-200 hover:border-neutral-900 bg-white text-neutral-800 text-xs transition-colors cursor-pointer shrink-0"
            >
              <img
                src={payload.sourceImage}
                alt="Thumbnail"
                className="w-4 h-4 rounded object-cover border border-neutral-200"
              />
              <span>View Full Photo</span>
              <ZoomIn className="w-3 h-3 text-neutral-400" />
            </button>
          )}
        </div>

        {/* SPECIALIZED ADVANCED ELDER MODULE 1: Structured Medicine Schedule Banner */}
        {payload.mode === 'HEALTH_PILL' && (
          <div className="p-4 rounded-md border border-sky-200 bg-sky-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-100 pb-2">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-sky-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-sky-950">
                  Prescription &amp; Dosage Information
                </span>
              </div>
              {onAddToMedicineCabinet && (
                <button
                  type="button"
                  id="btn-add-to-pill-cabinet"
                  onClick={handleAddCurrentMedicine}
                  disabled={isAddedToCabinet}
                  className={`h-8 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isAddedToCabinet
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-neutral-900 hover:bg-black text-white'
                  }`}
                >
                  {isAddedToCabinet ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Added to Daily Schedule</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to My Medicine Cabinet</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-white border border-sky-100">
                <span className="text-neutral-500 font-medium block text-[11px]">
                  Medication Name:
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  {payload.medicineDetails?.name || payload.headline}
                </span>
              </div>

              <div className="p-2.5 rounded bg-white border border-sky-100">
                <span className="text-neutral-500 font-medium block text-[11px]">
                  Purpose:
                </span>
                <span className="text-xs font-semibold text-neutral-800">
                  {payload.medicineDetails?.purpose || 'Daily health maintenance'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-white border border-sky-100">
                <span className="text-neutral-500 font-medium block text-[11px]">
                  When To Take:
                </span>
                <span className="text-xs font-semibold text-sky-900 capitalize">
                  {payload.medicineDetails?.timing || 'Morning after food'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-white border border-sky-100">
                <span className="text-neutral-500 font-medium block text-[11px]">
                  Food &amp; Water Instruction:
                </span>
                <span className="text-xs font-semibold text-neutral-800">
                  {payload.medicineDetails?.instructions || 'Drink with full glass of water'}
                </span>
              </div>
            </div>

            {payload.medicineDetails?.cautions && (
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Elder Caution: </strong>
                  {payload.medicineDetails.cautions}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SPECIALIZED ADVANCED ELDER MODULE 2: Scam Deconstructor & Safe Rebuttal Script */}
        {payload.mode === 'SAFETY_BILL_SCAM' && payload.is_urgent_or_scam && (
          <div className="p-4 rounded-md border border-red-200 bg-red-50/40 space-y-3">
            <div className="flex items-center gap-2 border-b border-red-100 pb-2">
              <Shield className="w-4 h-4 text-red-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-950">
                Scam Shield &amp; Psychological Trap Deconstruction
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-white border border-red-200">
                <span className="text-neutral-500 font-medium block text-[11px]">
                  Psychological Pressure Tactic Detected:
                </span>
                <span className="text-xs font-bold text-red-900">
                  {payload.scamDetails?.psychologicalTrap ||
                    'Artificial urgency designed to panic you into quick payment or link clicking'}
                </span>
              </div>

              {payload.scamDetails?.redFlags && payload.scamDetails.redFlags.length > 0 && (
                <div className="p-2.5 rounded bg-white border border-red-200 space-y-1">
                  <span className="text-neutral-500 font-medium block text-[11px]">
                    Specific Red Flags Found:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-neutral-800">
                    {payload.scamDetails.redFlags.map((rf, idx) => (
                      <li key={idx} className="text-xs">
                        {rf}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safe Pre-Written Rebuttal Script */}
              <div className="p-3 rounded bg-white border border-neutral-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Safe Response Message You Can Send:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyRebuttal(
                        payload.scamDetails?.safeRebuttalScript ||
                          'I am an elderly citizen. All bills and payments are handled in person at the official office by my daughter. Do not contact this number again.'
                      )
                    }
                    className="text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedRebuttal ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Safe Reply</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="p-2.5 rounded bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 italic leading-relaxed">
                  "{payload.scamDetails?.safeRebuttalScript ||
                    'I am an elderly citizen. All bills and payments are handled in person at the official office by my family. Do not contact this number again.'}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Key Action Points */}
        <div>
          <div className="pb-2 mb-3 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
              What You Should Do Now
            </h3>
            <span className="text-xs text-neutral-500">
              {payload.bullets.length} recommended steps
            </span>
          </div>

          <div className="space-y-2.5">
            {payload.bullets.map((bullet, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-md border border-neutral-200 bg-white flex items-start gap-3"
              >
                <span className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-800 font-bold text-xs flex items-center justify-center shrink-0 pt-0.5">
                  {idx + 1}
                </span>
                <div
                  className={`flex-1 text-neutral-900 leading-relaxed ${
                    isJumbo ? 'text-lg font-medium' : 'text-sm font-medium'
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
          className="p-4 rounded-md border border-neutral-200 bg-neutral-50/60 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded border border-neutral-200 bg-white flex items-center justify-center text-neutral-900 shrink-0">
                {isPlayingAudio ? (
                  <Volume2 className="w-4 h-4 text-black animate-pulse" />
                ) : (
                  <VolumeX className="w-4 h-4 text-neutral-400" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                  Spoken Explanation
                </h4>
                <p className="text-xs text-neutral-500">
                  Reading aloud to you at {speechRate}x speed in {activeLanguage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-toggle-speech-readout"
                type="button"
                onClick={toggleSpeech}
                className="h-8 px-3 rounded-md bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                title={isPlayingAudio ? 'Stop voice reading' : 'Read aloud for you'}
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Play Voice</span>
                  </>
                )}
              </button>

              <button
                id="btn-replay-speech"
                type="button"
                onClick={() => speakText(payload.voice_readout, activeLanguage)}
                className="h-8 px-2.5 rounded-md bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer select-none"
                title="Read again from the beginning"
              >
                <RotateCcw className="w-3 h-3 text-neutral-500" />
                <span>Read Again</span>
              </button>
            </div>
          </div>

          <div
            className={`p-3.5 rounded bg-white border border-neutral-200 text-neutral-900 leading-relaxed ${
              isPlayingAudio ? 'border-neutral-900 ring-1 ring-neutral-900' : ''
            } ${isJumbo ? 'text-lg' : 'text-xs sm:text-sm'}`}
          >
            {payload.voice_readout}
          </div>
        </div>

        {/* SPECIALIZED ADVANCED ELDER MODULE 3: Interactive Follow-Up AI ("Ask Sahayak") */}
        <div className="p-4 sm:p-5 rounded-md border border-neutral-200 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-neutral-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Have a Doubt? Ask Sahayak Directly
              </h4>
            </div>
            <span className="text-xs text-neutral-500">
              Voice or text · Answers aloud
            </span>
          </div>

          {/* Quick 1-Tap Question Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-neutral-500">
              Quick questions you can tap:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {getQuickQuestions().map((qq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendClarification(qq)}
                  disabled={isAskingClarification}
                  className="px-2.5 py-1 rounded-full border border-neutral-200 hover:border-neutral-900 bg-neutral-50 text-neutral-800 text-xs transition-colors cursor-pointer"
                >
                  "{qq}"
                </button>
              ))}
            </div>
          </div>

          {/* Clarification History */}
          {clarifyMessages.length > 0 && (
            <div className="space-y-2.5 pt-2 max-h-60 overflow-y-auto pr-1">
              {clarifyMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-md text-xs leading-relaxed flex items-start gap-2.5 ${
                    msg.sender === 'elder'
                      ? 'bg-neutral-100 border border-neutral-200 text-neutral-900 ml-4'
                      : 'bg-neutral-50 border border-neutral-200 text-neutral-900 mr-4'
                  }`}
                >
                  <div className="shrink-0 mt-0.5 font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700">
                    {msg.sender === 'elder' ? 'You' : 'Sahayak'}
                  </div>
                  <div className="flex-1">
                    <p className={isJumbo ? 'text-base font-medium' : 'text-xs font-medium'}>
                      {msg.text}
                    </p>
                  </div>
                  {msg.sender === 'sahayak' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (playingClarifyAudioId === msg.id) {
                          window.speechSynthesis.cancel();
                          setPlayingClarifyAudioId(null);
                        } else {
                          setPlayingClarifyAudioId(msg.id);
                          speakText(msg.text, activeLanguage, () => setPlayingClarifyAudioId(null));
                        }
                      }}
                      className="w-6 h-6 rounded border border-neutral-200 bg-white hover:bg-neutral-100 flex items-center justify-center shrink-0 cursor-pointer"
                      title="Listen aloud"
                    >
                      {playingClarifyAudioId === msg.id ? (
                        <VolumeX className="w-3 h-3 text-neutral-700" />
                      ) : (
                        <Volume2 className="w-3 h-3 text-neutral-700" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Voice & Text Question Input Box */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              id="btn-voice-dictate-question"
              onClick={toggleVoiceInput}
              className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                isVoiceListening
                  ? 'border-red-600 bg-red-50 text-red-600 animate-pulse'
                  : 'border-neutral-200 bg-white hover:border-neutral-900 text-neutral-800'
              }`}
              title={isVoiceListening ? 'Listening... Speak your question' : 'Tap to speak your question'}
            >
              {isVoiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={clarifyQuestion}
              onChange={(e) => setClarifyQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendClarification();
                }
              }}
              placeholder={isVoiceListening ? 'Listening to your voice...' : 'Type or speak any question...'}
              className="flex-1 h-10 px-3 rounded-md border border-neutral-200 bg-white text-xs text-neutral-900 focus:border-neutral-900"
            />

            <button
              type="button"
              onClick={() => handleSendClarification()}
              disabled={isAskingClarification || !clarifyQuestion.trim()}
              className={`h-10 px-4 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                !clarifyQuestion.trim()
                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-900 hover:bg-black text-white'
              }`}
            >
              {isAskingClarification ? (
                <Clock className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Ask</span>
                  <CornerDownRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4. Family Caregiver Alert Box */}
        {payload.caregiver_alert ? (
          <div
            id="caregiver-dispatch-box"
            className="p-5 rounded-md border border-neutral-200 bg-white space-y-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 text-neutral-700">
                    Family Alert Ready
                  </span>
                  <span className="text-xs text-neutral-500">
                    Trusted Contact: {caregiverContact.name} ({caregiverContact.relationship})
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-neutral-900">
                  Send this notice to {caregiverContact.name} ({caregiverContact.relationship})?
                </h4>
                <p className="text-xs bg-neutral-50 p-2.5 rounded border border-neutral-200 text-neutral-800 leading-relaxed">
                  "{payload.caregiver_alert}"
                </p>
              </div>

              {/* Primary Send Action */}
              <div className="shrink-0">
                <button
                  id="btn-dispatch-caregiver-alert"
                  onClick={handleDispatchCaregiverAlert}
                  disabled={isSendingAlert || alertDispatched}
                  className={`h-9 px-4 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer select-none ${
                    alertDispatched
                      ? 'bg-neutral-100 text-neutral-900 border border-neutral-300 cursor-default'
                      : 'bg-black hover:bg-neutral-800 text-white border border-black shadow-2xs'
                  }`}
                >
                  {alertDispatched ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Message Sent to {caregiverContact.name}!</span>
                    </>
                  ) : isSendingAlert ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Alert to {caregiverContact.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Direct Multi-Channel Actions */}
            <div className="pt-3 border-t border-neutral-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase text-neutral-400 mr-1 font-semibold">
                Send via:
              </span>

              {/* Direct Phone Call */}
              <a
                id="link-call-caregiver-direct"
                href={`tel:${caregiverContact.phone}`}
                className="h-8 px-2.5 rounded-md bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-900 text-neutral-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                title={`Call ${caregiverContact.name} directly`}
              >
                <Phone className="w-3 h-3 text-neutral-600" />
                <span>Phone Call</span>
              </a>

              {/* Direct SMS */}
              <a
                id="link-sms-caregiver-direct"
                href={`sms:${caregiverContact.phone}?body=${encodeURIComponent(fullAlertMessage)}`}
                className="h-8 px-2.5 rounded-md bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-900 text-neutral-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                title={`Send text message to ${caregiverContact.name}`}
              >
                <MessageSquare className="w-3 h-3 text-neutral-600" />
                <span>Text Message</span>
              </a>

              {/* WhatsApp */}
              <a
                id="link-whatsapp-caregiver-direct"
                href={`https://wa.me/${cleanPhoneDigits}?text=${encodeURIComponent(fullAlertMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-2.5 rounded-md bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-900 text-neutral-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                title={`Send via WhatsApp to ${caregiverContact.name}`}
              >
                <ExternalLink className="w-3 h-3 text-neutral-600" />
                <span>WhatsApp</span>
              </a>

              {/* Native Share */}
              <button
                type="button"
                onClick={async () => {
                  if (!payload.caregiver_alert) return;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: `Sahayak AI: ${payload.headline}`,
                        text: `Notice for ${userName || 'Family'}: "${payload.caregiver_alert}"`,
                      });
                    } catch {}
                  } else {
                    handleCopyAlert();
                  }
                }}
                className="h-8 px-2.5 rounded-md bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-900 text-neutral-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                title="Share via device"
              >
                <Share2 className="w-3 h-3 text-neutral-600" />
                <span>Share</span>
              </button>

              {/* Copy Alert Payload */}
              <button
                type="button"
                onClick={handleCopyAlert}
                className="h-8 px-2.5 rounded-md bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-900 text-neutral-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                title="Copy alert text to clipboard"
              >
                {copiedAlert ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-neutral-600" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            {alertDispatched && (
              <div
                id="alert-success-confirmation"
                className="p-2.5 rounded border border-neutral-200 bg-neutral-50 text-xs text-neutral-800 flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Message sent at {dispatchedTimestamp} · Saved in your family record
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-md border border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Everything looks routine · No need to alert family unless you want to</span>
            </div>
            <a
              id="link-call-caregiver-peace-of-mind"
              href={`tel:${caregiverContact.phone}`}
              className="px-3 py-1 rounded bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-800 text-xs flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3 h-3 text-neutral-600" />
              <span>Call {caregiverContact.name}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
