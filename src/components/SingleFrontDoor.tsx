/* Hallmark · macrostructure: elder-intake-docket · theme: warm-tactile-ink · genre: editorial
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * slop test: pass
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Mic,
  MicOff,
  Upload,
  Sparkles,
  FileText,
  AlertCircle,
  X,
  PlayCircle,
  Clock,
  ArrowRight,
  ZoomIn,
  Activity,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { SAMPLE_SCENARIOS, SampleScenario } from '../data/sampleScenarios';
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

  // Monitor live microphone volume levels to reassure elder that their voice is being heard
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

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (e) {
      console.warn('Could not start audio visualizer:', e);
    }
  };

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech dictation is not directly supported by this browser. Please type or paste below.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (err) {
        console.error('Stop mic error:', err);
      }
      stopAudioLevelMonitoring();
      setIsListening(false);
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current?.start();
        startAudioLevelMonitoring();
      } catch (err) {
        console.error('Start mic error:', err);
        try {
          recognitionRef.current?.stop();
          setTimeout(() => {
            recognitionRef.current?.start();
            startAudioLevelMonitoring();
          }, 150);
        } catch {
          // ignore
        }
      }
    }
  };

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file or take a photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const rawDataUrl = reader.result as string;
      const rasterized = await ensureRasterImage(rawDataUrl, file.type);
      setSelectedImage({
        dataUrl: rasterized.dataUrl,
        base64: rasterized.base64,
        mimeType: rasterized.mimeType,
        filename: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Live Camera Snapshot from Modal
  const handleCameraCapture = async (imageDataUrl: string) => {
    const rasterized = await ensureRasterImage(imageDataUrl, 'image/jpeg');
    setSelectedImage({
      dataUrl: rasterized.dataUrl,
      base64: rasterized.base64,
      mimeType: rasterized.mimeType,
      filename: `Camera_Scan_${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`,
    });
  };

  const handleSelectScenario = async (scenario: SampleScenario) => {
    if (scenario.imageDataUri) {
      const rasterized = await ensureRasterImage(
        scenario.imageDataUri,
        scenario.imageDataUri.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/jpeg'
      );

      setSelectedImage({
        dataUrl: rasterized.dataUrl,
        base64: rasterized.base64,
        mimeType: rasterized.mimeType,
        filename: scenario.title,
      });
    } else {
      setSelectedImage(null);
    }

    setTextInput(scenario.text || '');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedImage && !textInput.trim()) {
      alert('Please take a photo, upload a notice, or dictate a message first.');
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      stopAudioLevelMonitoring();
      setIsListening(false);
    }

    onAnalyze({
      text: textInput.trim() || undefined,
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

      {/* Greeting Header */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-900">
            Good day, {preferredGreeting || userName || 'Ramesh Ji'}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-1">
            Hold up a bill, medicine bottle, or text notice to verify safety — or speak aloud.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium whitespace-nowrap">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Caregiver Safeguards Active</span>
        </div>
      </div>

      {/* Main Front-Door Ingestion Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Left Column: Camera & Document Ingestion */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`p-6 rounded-xl border transition-colors flex flex-col justify-between ${
            dragOver
              ? 'border-teal-700 bg-teal-50/40'
              : 'border-slate-200 bg-white'
          } min-h-[300px]`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-700" />
                <span>Document Photo</span>
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Prescriptions • Bills • Letters
              </span>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Capture a photo using your camera, or pick an existing image:
            </p>

            {/* Selected Image Preview with High-Contrast Zoom */}
            {selectedImage ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-slate-50 p-3 mb-4">
                <div className="relative max-h-52 overflow-hidden rounded flex items-center justify-center bg-white border border-slate-200">
                  <img
                    src={selectedImage.dataUrl}
                    alt="Document preview"
                    className={`object-contain ${
                      hasPreviewZoom ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                    } max-h-48`}
                    onClick={() => setHasPreviewZoom(!hasPreviewZoom)}
                  />
                  <button
                    type="button"
                    onClick={() => setHasPreviewZoom(!hasPreviewZoom)}
                    className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1"
                    title="Toggle zoom preview"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{hasPreviewZoom ? 'Zoom Out' : 'Zoom In'}</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-2.5">
                  <p className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                    📄 {selectedImage.filename || 'Photo Loaded'}
                  </p>
                  <button
                    type="button"
                    id="btn-remove-selected-image"
                    onClick={() => {
                      setSelectedImage(null);
                      setHasPreviewZoom(false);
                    }}
                    className="text-xs font-bold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                
                {/* Live Camera Button */}
                <button
                  type="button"
                  id="btn-open-live-camera"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="h-24 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100/80 transition-colors flex flex-col items-center justify-center gap-1.5 text-center p-3 cursor-pointer"
                  title="Open live camera scanner"
                >
                  <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900">
                      Take Photo
                    </span>
                    <span className="block text-xs text-slate-500">
                      Live Viewfinder
                    </span>
                  </div>
                </button>

                {/* Upload File Button */}
                <button
                  type="button"
                  id="btn-upload-file-picker"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-24 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100/80 transition-colors flex flex-col items-center justify-center gap-1.5 text-center p-3 cursor-pointer"
                  title="Upload saved image file"
                >
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-300 text-slate-700 flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900">
                      Upload File
                    </span>
                    <span className="block text-xs text-slate-500">
                      From Photos / Files
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

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            Ensure good lighting on labels and text for maximum clarity.
          </div>
        </div>

        {/* Right Column: Spoken Dictation */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mic className="w-5 h-5 text-teal-700" />
                <span>Voice Dictation</span>
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Spoken Words
              </span>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Tap the button and ask about any suspicious message or request:
            </p>

            {/* Microphone Button */}
            <div className="flex flex-col items-center justify-center py-2">
              <button
                type="button"
                id="btn-toggle-microphone"
                onClick={toggleListening}
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white ring-4 ring-red-100'
                    : 'bg-slate-50 border-2 border-slate-300 text-slate-900 hover:border-slate-400'
                }`}
                title={isListening ? 'Tap to stop listening' : 'Tap to start speaking'}
              >
                {isListening ? (
                  <>
                    <Mic className="w-8 h-8" />
                    <span className="text-[11px] font-bold uppercase mt-1 tracking-wider">
                      Listening
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-8 h-8 text-teal-700" />
                    <span className="text-[11px] font-bold uppercase mt-1 tracking-wider">
                      Tap to Speak
                    </span>
                  </>
                )}
              </button>

              {/* VU-Meter when microphone active */}
              {isListening && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-bold text-red-700">
                    Recording voice ({audioLevel}%)
                  </span>
                  <div className="flex items-center gap-1">
                    {[12, 28, 48, 72, 48, 28, 12].map((h, idx) => (
                      <span
                        key={idx}
                        className="w-1 bg-red-600 rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(4, Math.min(20, (audioLevel / 100) * h))}px`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {speechError && (
                <div className="mt-3 p-2.5 rounded bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2 max-w-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{speechError}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            Example: &ldquo;Is this SMS asking me to renew electricity real or fake?&rdquo;
          </div>
        </div>

      </div>

      {/* Transcript & Input Console */}
      <div className="p-6 rounded-xl bg-white border border-slate-200">
        <label
          htmlFor="input-message-text"
          className="block text-sm font-bold text-slate-900 mb-2 flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Spoken Dictation or Pasted Notice</span>
          </span>
          {textInput && (
            <button
              id="btn-clear-text"
              type="button"
              onClick={() => setTextInput('')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Clear Text
            </button>
          )}
        </label>

        <textarea
          id="input-message-text"
          rows={3}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Your spoken words or pasted text will appear here..."
          className={`w-full p-3.5 rounded-lg border border-slate-300 text-slate-900 bg-white focus:border-teal-700 focus:ring-1 focus:ring-teal-700 leading-relaxed outline-none transition-colors ${
            isJumbo ? 'text-xl' : 'text-base'
          }`}
        />

        {/* Action Trigger Bar */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Private safety review • Ready for one-tap caregiver dispatch</span>
          </div>

          <button
            id="btn-submit-analyze"
            type="button"
            disabled={isLoading || (!selectedImage && !textInput.trim())}
            onClick={() => handleSubmit()}
            className={`h-13 px-7 rounded-lg font-bold text-base flex items-center justify-center gap-2.5 transition-colors touch-target whitespace-nowrap cursor-pointer ${
              isLoading || (!selectedImage && !textInput.trim())
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-teal-800 hover:bg-teal-900 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                <span>Checking Notice...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Verify with Sahayak</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Example Scenarios Drawer */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-base font-bold text-slate-900">
              Sample Situations
            </h4>
            <p className="text-xs text-slate-500">
              Tap any preloaded situation to preview elder safety analysis:
            </p>
          </div>
          <PlayCircle className="w-5 h-5 text-slate-500 shrink-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SAMPLE_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              id={`btn-sample-${scenario.id}`}
              type="button"
              onClick={() => handleSelectScenario(scenario)}
              className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-teal-700 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border ${scenario.tagColor} whitespace-nowrap`}
                >
                  {scenario.tag}
                </span>
                <span className="text-xs text-slate-400">
                  Select
                </span>
              </div>
              <h5 className="font-bold text-sm text-slate-900 leading-snug">
                {scenario.title}
              </h5>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {scenario.description}
              </p>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
