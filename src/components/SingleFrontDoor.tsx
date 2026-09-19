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
} from 'lucide-react';
import { LiveCameraModal } from './LiveCameraModal';

interface SingleFrontDoorProps {
  onAnalyze: (data: {
    text?: string;
    image?: { data: string; mimeType: string };
    audio?: { data: string; mimeType: string };
  }) => Promise<void>;
  isLoading: boolean;
  fontSizeMode: 'normal' | 'large';
  preferredGreeting?: string;
  userName?: string;
}

// Convert any SVG or image into a guaranteed clean raster JPEG for Gemini Multimodal Vision
async function ensureRasterImage(
  dataUrl: string,
  mimeType: string
): Promise<{ dataUrl: string; base64: string; mimeType: string }> {
  if (mimeType.includes('svg') || dataUrl.startsWith('data:image/svg')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const rasterDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          resolve({
            dataUrl: rasterDataUrl,
            base64: rasterDataUrl.split(',')[1],
            mimeType: 'image/jpeg',
          });
          return;
        }
        resolve({ dataUrl, base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
      };
      img.onerror = () => {
        resolve({ dataUrl, base64: dataUrl.split(',')[1], mimeType });
      };
      img.src = dataUrl;
    });
  }

  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return {
    dataUrl,
    base64,
    mimeType: mimeType || 'image/jpeg',
  };
}

export const SingleFrontDoor: React.FC<SingleFrontDoorProps> = ({
  onAnalyze,
  isLoading,
  fontSizeMode,
  preferredGreeting,
  userName,
}) => {
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

  const isJumbo = fontSizeMode === 'large';

  // Setup Web Speech API + Audio Frequency Visualizer
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
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
  }, []);

  // Monitor live microphone volume levels
  const startAudioLevelMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
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
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image document (JPEG, PNG, WEBP).');
      return;
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
      recognitionRef.current.stop();
      stopAudioLevelMonitoring();
      setIsListening(false);
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

  return (
    <div className="space-y-6">
      
      {/* Live Camera Viewfinder Modal */}
      <LiveCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium mb-1">
            <span>Sahayak Safety Companion</span>
            <span>·</span>
            <span>Elder Care Protection</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Check a Document or Ask a Question
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-xl leading-relaxed">
            Take a picture of a bill, medicine bottle, or letter — or speak your question aloud. We will explain it simply and alert family if anything looks unsafe.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Fraud &amp; Safety Protection: Active</span>
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
          className={`p-5 rounded-md border transition-colors flex flex-col justify-between ${
            dragOver
              ? 'border-neutral-900 bg-neutral-50'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          } min-h-[280px]`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-bold">[1]</span>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Add a Photo or Letter
                </h3>
              </div>
              <span className="text-[11px] text-neutral-500 px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50">
                Photo or Document
              </span>
            </div>

            <p className="text-xs text-neutral-600 mb-4">
              Hold up a bill, prescription label, medicine bottle, or printed letter:
            </p>

            {/* Selected Image Preview with High-Contrast Zoom */}
            {selectedImage ? (
              <div className="relative rounded-md overflow-hidden border border-neutral-200 bg-neutral-50 p-3 mb-4">
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
                    className="absolute bottom-2 right-2 bg-neutral-900 text-white text-[11px] px-2 py-0.5 rounded flex items-center gap-1 opacity-90 hover:opacity-100 cursor-pointer"
                    title="Toggle zoom preview"
                  >
                    <ZoomIn className="w-3 h-3" />
                    <span>{hasPreviewZoom ? 'Normal Size' : 'Enlarge'}</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-2.5">
                  <p className="text-xs text-neutral-800 truncate max-w-[200px]">
                    {selectedImage.filename || 'Photo attached'}
                  </p>
                  <button
                    type="button"
                    id="btn-remove-selected-image"
                    onClick={() => {
                      setSelectedImage(null);
                      setHasPreviewZoom(false);
                    }}
                    className="text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-900 bg-white px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Remove</span>
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
                  className="h-24 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 transition-colors flex flex-col items-center justify-center gap-2 text-center p-3 cursor-pointer select-none"
                  title="Take a photo with your camera"
                >
                  <div className="w-8 h-8 rounded border border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-900">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-neutral-900">
                      Use Camera
                    </span>
                    <span className="block text-[11px] text-neutral-500">
                      Take photo now
                    </span>
                  </div>
                </button>

                {/* Upload File Button */}
                <button
                  type="button"
                  id="btn-upload-file-picker"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-24 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 transition-colors flex flex-col items-center justify-center gap-2 text-center p-3 cursor-pointer select-none"
                  title="Upload a saved photo from your device"
                >
                  <div className="w-8 h-8 rounded border border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-900">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-neutral-900">
                      Upload Photo
                    </span>
                    <span className="block text-[11px] text-neutral-500">
                      From your device
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

          <div className="pt-2 border-t border-neutral-100 text-xs text-neutral-500">
            Take a picture with your camera or drag an image here
          </div>
        </div>

        {/* Right Column: Audio & Voice Dictation */}
        <div className="p-5 rounded-md border border-neutral-200 bg-white hover:border-neutral-300 transition-colors flex flex-col justify-between min-h-[280px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-bold">[2]</span>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Speak Your Question
                </h3>
              </div>
              <span className="text-[11px] text-neutral-500 px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50">
                Voice Microphone
              </span>
            </div>

            <p className="text-xs text-neutral-600 mb-4">
              Press the round button below and speak whatever you need help with:
            </p>

            {/* Microphone Button */}
            <div className="flex flex-col items-center justify-center py-2">
              <button
                type="button"
                id="btn-toggle-microphone"
                onClick={toggleListening}
                className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                  isListening
                    ? 'bg-neutral-900 text-white ring-2 ring-neutral-900 ring-offset-2'
                    : 'bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-900 shadow-2xs'
                }`}
                title={isListening ? 'Stop listening' : 'Start speaking'}
              >
                <Mic className="w-6 h-6" />
                <span className="text-[11px] font-medium mt-1">
                  {isListening ? 'Listening...' : 'Tap to Speak'}
                </span>
              </button>

              {/* Decibel meter */}
              {isListening && (
                <div className="mt-3 flex items-center gap-2 text-xs text-neutral-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Hearing your voice clearly</span>
                  <div className="flex items-center gap-1">
                    {[8, 16, 24, 32, 24, 16, 8].map((h, idx) => (
                      <span
                        key={idx}
                        className="w-1 bg-neutral-900 rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(4, Math.min(18, (audioLevel / 100) * h))}px`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {speechError && (
                <div className="mt-3 p-2.5 rounded border border-neutral-200 bg-neutral-50 text-neutral-800 text-xs flex items-center gap-1.5 max-w-sm">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
                  <span>{speechError}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100 text-xs text-neutral-500">
            For example: &ldquo;Is this message asking for electricity bill money authentic?&rdquo;
          </div>
        </div>

      </div>

      {/* Transcript & Prompt Input Console */}
      <div className="p-5 rounded-md border border-neutral-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-bold">[3]</span>
            <label
              htmlFor="input-message-text"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-700"
            >
              Your Question or Message Text (Optional)
            </label>
          </div>
          {textInput && (
            <button
              id="btn-clear-text"
              type="button"
              onClick={() => setTextInput('')}
              className="text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
            >
              Clear Text
            </button>
          )}
        </div>

        <textarea
          id="input-message-text"
          rows={3}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Paste a text message you received, or type any question you have..."
          className={`w-full p-3 rounded-md border border-neutral-200 text-neutral-900 bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 leading-relaxed outline-none transition-colors ${
            isJumbo ? 'text-lg' : 'text-sm'
          }`}
        />

        {/* Action Trigger Bar */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
            <span>Private &amp; Confidential · Your data is never shared</span>
          </div>

          <button
            id="btn-submit-analyze"
            type="button"
            disabled={isLoading || (!selectedImage && !textInput.trim())}
            onClick={() => handleSubmit()}
            className={`h-10 px-5 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer select-none ${
              isLoading || (!selectedImage && !textInput.trim())
                ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                : 'bg-black hover:bg-neutral-800 text-white border border-black shadow-2xs'
            }`}
          >
            {isLoading ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Checking your item...</span>
              </>
            ) : (
              <>
                <span>Check This Item</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
