import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Mic,
  Upload,
  AlertCircle,
  X,
  Clock,
  ArrowRight,
  ZoomIn,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { LiveCameraModal } from './LiveCameraModal';
import { AppLanguage } from '../types';
import { getTranslation, getSpeechLangCode, PresetItem } from '../lib/translations';

interface SingleFrontDoorProps {
  onAnalyze: (data: {
    text?: string;
    image?: { data: string; mimeType: string };
    audio?: { data: string; mimeType: string };
  }) => Promise<void>;
  isLoading: boolean;
  fontSizeMode: 'normal' | 'large' | 'jumbo';
  preferredGreeting?: string;
  userName?: string;
  appLanguage?: AppLanguage;
  highContrastMode?: boolean;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1600;

/**
 * Resize browser images before they become base64. This caps RAM, upload time, and model input
 * without making text on a photographed document too small to read.
 */
async function ensureRasterImage(
  dataUrl: string,
  mimeType: string
): Promise<{ dataUrl: string; base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
      const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
      const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        const base64 = dataUrl.split(',')[1] || dataUrl;
        resolve({ dataUrl, base64, mimeType: mimeType || 'image/jpeg' });
        return;
      }
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(img, 0, 0, width, height);
      const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
      resolve({
        dataUrl: optimizedDataUrl,
        base64: optimizedDataUrl.split(',')[1],
        mimeType: 'image/jpeg',
      });
    };
    img.onerror = () => {
      const base64 = dataUrl.split(',')[1] || dataUrl;
      resolve({ dataUrl, base64, mimeType: mimeType || 'image/jpeg' });
    };
    img.src = dataUrl;
  });
}

export const SingleFrontDoor: React.FC<SingleFrontDoorProps> = ({
  onAnalyze,
  isLoading,
  fontSizeMode,
  preferredGreeting,
  userName,
  appLanguage = 'English',
  highContrastMode = false,
}) => {
  const t = getTranslation(appLanguage);

  const [selectedImage, setSelectedImage] = useState<{
    dataUrl: string;
    base64: string;
    mimeType: string;
    filename?: string;
  } | null>(null);

  const [textInput, setTextInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [hasPreviewZoom, setHasPreviewZoom] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastMeterRenderRef = useRef(0);

  const isJumbo = fontSizeMode === 'jumbo';
  const isLarge = fontSizeMode === 'large' || isJumbo;

  // Setup Web Speech API + Audio Frequency Visualizer calibrated for selected language
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getSpeechLangCode(appLanguage);

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate(40);
          } catch {}
        }
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTextInput((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        if (event.error !== 'no-speech') {
          setSpeechError(`Microphone notice: ${event.error}. You can also type below.`);
        }
        stopAudioLevelMonitoring();
        setIsListening(false);
      };

      recognition.onend = () => {
        stopAudioLevelMonitoring();
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopAudioLevelMonitoring();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [appLanguage]);

  // Monitor live microphone volume levels
  const startAudioLevelMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = (timestamp: number) => {
        const now = Number.isFinite(timestamp) ? timestamp : performance.now();
        analyser.getByteFrequencyData(dataArray);
        // The analyser can run at display refresh rate, but a 10 FPS visual meter is just as
        // readable and avoids re-rendering the full intake screen 60 times per second.
        if (now - lastMeterRenderRef.current >= 100) {
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(normalized);
          lastMeterRenderRef.current = now;
        }
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    } catch (e) {
      console.warn('Audio metering unavailable:', e);
    }
  };

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    lastMeterRenderRef.current = 0;
    setAudioLevel(0);
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      stopAudioLevelMonitoring();
      setIsListening(false);
    } else {
      setSpeechError(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          startAudioLevelMonitoring();
        } catch (err: any) {
          console.warn('Could not start recognition:', err);
          setSpeechError('Microphone permission or recognition error. Please check permissions.');
          setIsListening(false);
        }
      } else {
        setSpeechError('Speech recognition is not supported in this browser. Please type below.');
      }
    }
  };

  const handleFileProcess = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload a JPEG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      alert('Please choose an image smaller than 10 MB.');
      return;
    }

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch {}
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const resultDataUrl = e.target?.result as string;
      const rasterized = await ensureRasterImage(resultDataUrl, file.type);
      setSelectedImage({
        dataUrl: rasterized.dataUrl,
        base64: rasterized.base64,
        mimeType: rasterized.mimeType,
        filename: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleCameraCapture = async (imageDataUrl: string) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch {}
    }
    const rasterized = await ensureRasterImage(imageDataUrl, 'image/jpeg');
    setSelectedImage({
      dataUrl: rasterized.dataUrl,
      base64: rasterized.base64,
      mimeType: rasterized.mimeType,
      filename: `Camera_Capture_${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`,
    });
    setIsCameraModalOpen(false);
  };

  const handleSubmit = async (textToSubmit?: string) => {
    const queryText = textToSubmit !== undefined ? textToSubmit : textInput;
    if (!queryText.trim() && !selectedImage) {
      alert('Please take a photo, upload a document, or type/speak a question first.');
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      stopAudioLevelMonitoring();
      setIsListening(false);
    }

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch {}
    }

    await onAnalyze({
      text: queryText.trim() || undefined,
      image: selectedImage
        ? {
            data: selectedImage.base64,
            mimeType: selectedImage.mimeType,
          }
        : undefined,
    });
  };

  const handlePresetSelect = (preset: PresetItem) => {
    setTextInput(preset.text);
    handleSubmit(preset.text);
  };

  return (
    <div className="space-y-6">
      
      {/* Live Camera Viewfinder Modal */}
      <LiveCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Page Title Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b ${
          highContrastMode ? 'border-yellow-400' : 'border-neutral-200'
        }`}
      >
        <div>
          <div
            className={`flex items-center gap-2 text-xs font-semibold mb-1 ${
              highContrastMode ? 'text-yellow-300' : 'text-neutral-500'
            }`}
          >
            <span>{t.frontDoor.subHeader}</span>
          </div>
          <h2
            className={`font-extrabold tracking-tight ${
              isJumbo
                ? 'text-3xl sm:text-4xl'
                : isLarge
                ? 'text-2xl sm:text-3xl'
                : 'text-xl sm:text-2xl'
            } ${highContrastMode ? 'text-yellow-400' : 'text-neutral-900'}`}
          >
            {t.frontDoor.title}
          </h2>
          <p
            className={`mt-1.5 max-w-2xl leading-relaxed ${
              isJumbo ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'
            } ${highContrastMode ? 'text-neutral-200' : 'text-neutral-600'}`}
          >
            {t.frontDoor.description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              highContrastMode
                ? 'border-2 border-yellow-400 bg-black text-yellow-300'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t.frontDoor.safetyPill}</span>
          </span>
        </div>
      </div>

      {/* Main Front-Door Ingestion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Column: Visual Document Input */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`p-5 rounded-md border transition-all flex flex-col justify-between ${
            highContrastMode
              ? dragOver
                ? 'border-4 border-yellow-400 bg-neutral-900'
                : 'border-2 border-neutral-700 bg-neutral-950 text-white hover:border-yellow-400'
              : dragOver
              ? 'border-neutral-900 bg-neutral-50'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          } min-h-[290px]`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-extrabold ${
                    highContrastMode ? 'text-yellow-400' : 'text-neutral-500'
                  }`}
                >
                  [1]
                </span>
                <h3
                  className={`font-bold ${isJumbo ? 'text-lg' : 'text-sm'} ${
                    highContrastMode ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  {t.frontDoor.dropTitle}
                </h3>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-medium border ${
                  highContrastMode
                    ? 'border-neutral-700 bg-neutral-900 text-yellow-300'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-500'
                }`}
              >
                {t.frontDoor.dropHint.split(' ')[0]}
              </span>
            </div>

            <p
              className={`mb-4 ${isJumbo ? 'text-sm' : 'text-xs'} ${
                highContrastMode ? 'text-neutral-300' : 'text-neutral-600'
              }`}
            >
              {t.frontDoor.dropDesc}
            </p>

            {/* Selected Image Preview with High-Contrast Zoom */}
            {selectedImage ? (
              <div
                className={`relative rounded-md overflow-hidden border p-3 mb-4 ${
                  highContrastMode
                    ? 'border-2 border-yellow-400 bg-neutral-900'
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                <div className="relative max-h-48 overflow-hidden rounded flex items-center justify-center bg-white border border-neutral-200">
                  <img
                    src={selectedImage.dataUrl}
                    alt="Document preview"
                    className={`object-contain ${
                      hasPreviewZoom ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                    } max-h-44`}
                    onClick={() => setHasPreviewZoom(!hasPreviewZoom)}
                  />
                  <button
                    type="button"
                    onClick={() => setHasPreviewZoom(!hasPreviewZoom)}
                    className="absolute bottom-2 right-2 bg-neutral-900 text-white text-[11px] px-2 py-1 rounded flex items-center gap-1 opacity-90 hover:opacity-100 cursor-pointer"
                    title={t.frontDoor.zoomImage}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{hasPreviewZoom ? '1x' : t.frontDoor.zoomImage}</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-2.5">
                  <p
                    className={`text-xs font-semibold truncate max-w-[200px] ${
                      highContrastMode ? 'text-yellow-300' : 'text-neutral-800'
                    }`}
                  >
                    {selectedImage.filename || t.frontDoor.imageSelected}
                  </p>
                  <button
                    type="button"
                    id="btn-remove-selected-image"
                    onClick={() => {
                      setSelectedImage(null);
                      setHasPreviewZoom(false);
                    }}
                    className={`text-xs px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer border font-semibold ${
                      highContrastMode
                        ? 'border-red-500 bg-red-950 text-red-300 hover:bg-red-900'
                        : 'border-neutral-200 hover:border-neutral-900 bg-white text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t.frontDoor.removeImage}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-4">
                
                {/* Live Camera Button */}
                <button
                  type="button"
                  id="btn-open-live-camera"
                  onClick={() => setIsCameraModalOpen(true)}
                  className={`h-28 rounded-md border transition-all flex flex-col items-center justify-center gap-2 text-center p-3 cursor-pointer select-none ${
                    highContrastMode
                      ? 'border-2 border-yellow-400 bg-neutral-900 hover:bg-black text-yellow-300'
                      : 'border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-900 shadow-2xs'
                  }`}
                  title={t.frontDoor.cameraBtn}
                >
                  <div
                    className={`w-9 h-9 rounded flex items-center justify-center ${
                      highContrastMode ? 'bg-yellow-400 text-black' : 'border border-neutral-200 bg-neutral-50 text-neutral-900'
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`block font-bold ${isJumbo ? 'text-sm' : 'text-xs'}`}>
                      {t.frontDoor.cameraBtn}
                    </span>
                  </div>
                </button>

                {/* Upload File Button */}
                <button
                  type="button"
                  id="btn-upload-file-picker"
                  onClick={() => fileInputRef.current?.click()}
                  className={`h-28 rounded-md border transition-all flex flex-col items-center justify-center gap-2 text-center p-3 cursor-pointer select-none ${
                    highContrastMode
                      ? 'border-2 border-neutral-700 hover:border-yellow-400 bg-neutral-900 hover:bg-black text-white'
                      : 'border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-900 shadow-2xs'
                  }`}
                  title={t.frontDoor.uploadBtn}
                >
                  <div
                    className={`w-9 h-9 rounded flex items-center justify-center ${
                      highContrastMode ? 'bg-neutral-800 text-white' : 'border border-neutral-200 bg-neutral-50 text-neutral-900'
                    }`}
                  >
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`block font-bold ${isJumbo ? 'text-sm' : 'text-xs'}`}>
                      {t.frontDoor.uploadBtn}
                    </span>
                  </div>
                </button>

              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />
          </div>

          <div
            className={`pt-2 border-t text-xs ${
              highContrastMode ? 'border-neutral-800 text-neutral-400' : 'border-neutral-100 text-neutral-500'
            }`}
          >
            {t.frontDoor.dropHint}
          </div>
        </div>

        {/* Right Column: Audio & Voice Dictation */}
        <div
          className={`p-5 rounded-md border transition-all flex flex-col justify-between min-h-[290px] ${
            highContrastMode
              ? 'border-2 border-neutral-700 bg-neutral-950 text-white hover:border-yellow-400'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-extrabold ${
                    highContrastMode ? 'text-yellow-400' : 'text-neutral-500'
                  }`}
                >
                  [2]
                </span>
                <h3
                  className={`font-bold ${isJumbo ? 'text-lg' : 'text-sm'} ${
                    highContrastMode ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  {t.frontDoor.voiceTitle}
                </h3>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-medium border ${
                  highContrastMode
                    ? 'border-neutral-700 bg-neutral-900 text-yellow-300'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-500'
                }`}
              >
                {t.frontDoor.micBtn.split(' ')[0]}
              </span>
            </div>

            <p
              className={`mb-4 ${isJumbo ? 'text-sm' : 'text-xs'} ${
                highContrastMode ? 'text-neutral-300' : 'text-neutral-600'
              }`}
            >
              {t.frontDoor.voiceDesc}
            </p>

            {/* Microphone Button */}
            <div className="flex flex-col items-center justify-center py-2">
              <button
                type="button"
                id="btn-toggle-microphone"
                onClick={toggleListening}
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                  isListening
                    ? highContrastMode
                      ? 'bg-yellow-400 text-black ring-4 ring-yellow-400 ring-offset-4 ring-offset-black animate-pulse'
                      : 'bg-neutral-900 text-white ring-4 ring-neutral-900 ring-offset-2 animate-pulse'
                    : highContrastMode
                    ? 'bg-neutral-900 border-2 border-yellow-400 text-yellow-300 hover:bg-neutral-800 shadow-md'
                    : 'bg-white border-2 border-neutral-300 hover:border-neutral-900 text-neutral-900 shadow-sm'
                }`}
                title={isListening ? t.frontDoor.micStop : t.frontDoor.micBtn}
                aria-label={isListening ? t.frontDoor.micStop : t.frontDoor.micBtn}
              >
                <Mic className="w-7 h-7" />
                <span className="text-xs font-bold mt-1 text-center px-2 leading-tight">
                  {isListening ? t.frontDoor.micStop : t.frontDoor.micBtn}
                </span>
              </button>

              {/* Decibel audio meter */}
              {isListening && (
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className={highContrastMode ? 'text-yellow-300' : 'text-neutral-700'}>
                    {t.frontDoor.micListening}
                  </span>
                  <div className="flex items-center gap-1 ml-1">
                    {[8, 16, 24, 32, 24, 16, 8].map((h, idx) => (
                      <span
                        key={idx}
                        className={`w-1 rounded-full transition-all duration-75 ${
                          highContrastMode ? 'bg-yellow-400' : 'bg-neutral-900'
                        }`}
                        style={{
                          height: `${Math.max(4, Math.min(22, (audioLevel / 100) * h))}px`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {speechError && (
                <div
                  className={`mt-3 p-2.5 rounded border text-xs flex items-center gap-1.5 max-w-sm ${
                    highContrastMode
                      ? 'border-yellow-400 bg-neutral-900 text-yellow-200'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-800'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>{speechError}</span>
                </div>
              )}
            </div>
          </div>

          <div
            className={`pt-2 border-t text-xs ${
              highContrastMode ? 'border-neutral-800 text-neutral-400' : 'border-neutral-100 text-neutral-500'
            }`}
          >
            {t.frontDoor.voiceDesc}
          </div>
        </div>

      </div>

      {/* Transcript & Prompt Input Console */}
      <div
        className={`p-5 rounded-md border ${
          highContrastMode ? 'border-2 border-neutral-700 bg-neutral-950 text-white' : 'border-neutral-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-extrabold ${
                highContrastMode ? 'text-yellow-400' : 'text-neutral-500'
              }`}
            >
              [3]
            </span>
            <label
              htmlFor="input-message-text"
              className={`text-xs font-bold uppercase tracking-wider ${
                highContrastMode ? 'text-yellow-300' : 'text-neutral-700'
              }`}
            >
              {t.frontDoor.voiceTitle}
            </label>
          </div>
          {textInput && (
            <button
              id="btn-clear-text"
              type="button"
              onClick={() => setTextInput('')}
              className={`text-xs font-semibold cursor-pointer ${
                highContrastMode ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {t.frontDoor.clearBtn}
            </button>
          )}
        </div>

        <textarea
          id="input-message-text"
          rows={3}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={t.frontDoor.inputPlaceholder}
          className={`w-full p-3 rounded-md border leading-relaxed outline-none transition-all ${
            highContrastMode
              ? 'border-2 border-neutral-700 bg-neutral-900 text-white placeholder-neutral-500 focus:border-yellow-400'
              : 'border-neutral-200 text-neutral-900 bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'
          } ${isJumbo ? 'text-xl' : isLarge ? 'text-lg' : 'text-sm'}`}
        />

        {/* Action Trigger Bar */}
        <div
          className={`mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t ${
            highContrastMode ? 'border-neutral-800' : 'border-neutral-100'
          }`}
        >
          <div
            className={`flex items-center gap-2 text-xs ${
              highContrastMode ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Private &amp; Confidential · 100% Protected</span>
          </div>

          <button
            id="btn-submit-analyze"
            type="button"
            disabled={isLoading || (!selectedImage && !textInput.trim())}
            onClick={() => handleSubmit()}
            className={`h-12 px-6 rounded-md font-bold flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
              isJumbo ? 'text-base' : 'text-sm'
            } ${
              isLoading || (!selectedImage && !textInput.trim())
                ? highContrastMode
                  ? 'bg-neutral-800 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                  : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                : highContrastMode
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-yellow-500 shadow-md font-extrabold'
                : 'bg-black hover:bg-neutral-800 text-white border border-black shadow-sm'
            }`}
          >
            {isLoading ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                <span>{t.frontDoor.analyzingBtn}</span>
              </>
            ) : (
              <>
                <span>{t.frontDoor.submitBtn}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1-Click Realistic Scenarios Presets (Multilingual!) */}
      <div
        className={`p-5 rounded-md border ${
          highContrastMode ? 'border-2 border-neutral-700 bg-neutral-950 text-white' : 'border-neutral-200 bg-neutral-50/70'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3
            className={`font-bold ${isJumbo ? 'text-base' : 'text-xs uppercase tracking-wider'} ${
              highContrastMode ? 'text-yellow-300' : 'text-neutral-700'
            }`}
          >
            {t.frontDoor.presetHeader}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {t.frontDoor.presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetSelect(p)}
              className={`p-3 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between ${
                highContrastMode
                  ? 'border-neutral-700 bg-neutral-900 hover:border-yellow-400 hover:bg-black text-white'
                  : 'border-neutral-200 bg-white hover:border-neutral-900 hover:shadow-2xs text-neutral-900'
              }`}
              title={p.desc}
            >
              <div>
                <span
                  className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mb-1.5 ${
                    p.type === 'scam'
                      ? highContrastMode
                        ? 'bg-red-950 text-red-300 border border-red-700'
                        : 'bg-red-50 text-red-700 border border-red-200'
                      : p.type === 'medicine'
                      ? highContrastMode
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : highContrastMode
                      ? 'bg-purple-950 text-purple-300 border border-purple-700'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}
                >
                  {p.tag}
                </span>
                <h4 className={`font-bold line-clamp-1 ${isJumbo ? 'text-sm' : 'text-xs'}`}>
                  {p.title}
                </h4>
                <p
                  className={`line-clamp-2 mt-1 ${isJumbo ? 'text-xs' : 'text-[11px]'} ${
                    highContrastMode ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  {p.desc}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-semibold text-emerald-600">
                <span>Try now</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
