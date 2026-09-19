/* Hallmark · macrostructure: elder-live-camera · theme: warm-tactile-ink · genre: editorial
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * slop test: pass
 */
import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Sparkles, Clock, Upload } from 'lucide-react';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [useSteadyTimer, setUseSteadyTimer] = useState(false);

  // Play shutter sound via Web Audio API
  const playShutterSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Dual click burst
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Audio context might be restricted
    }
  };

  // Start Camera stream
  const startCamera = async () => {
    setIsLoadingCamera(true);
    setCameraError(null);
    setCapturedPreview(null);

    // Stop previous stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support live video capture. You can upload a photo instead.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Live camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was blocked. Please allow camera access in your browser or select a photo file.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No active camera found on this device. You can pick an existing photo below.');
      } else {
        setCameraError(err.message || 'Unable to open camera stream. Please try uploading an image.');
      }
    } finally {
      setIsLoadingCamera(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCapturedPreview(null);
      setCountdown(null);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  // Handle snapping photo from video stream
  const executeSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    playShutterSound();
    setCapturedPreview(dataUrl);
  };

  const handleTriggerSnap = () => {
    if (useSteadyTimer) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            executeSnap();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      executeSnap();
    }
  };

  const handleConfirmPhoto = () => {
    if (capturedPreview) {
      onCapture(capturedPreview);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    startCamera();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleFileFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onCapture(dataUrl);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border-subtle)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-[var(--color-surface-sunken)] px-5 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-action-amber)] text-white flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[var(--color-ink-display)]">
                Live Camera Scanner
              </h3>
              <p className="text-xs font-bold text-[var(--color-ink-muted)]">
                Point at medicine label, utility bill, or letter
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-xl border border-[var(--color-border-base)] bg-white hover:bg-slate-100 flex items-center justify-center text-[var(--color-ink-primary)] transition-colors"
            title="Close camera"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-black min-h-[300px] sm:min-h-[400px] flex items-center justify-center overflow-hidden flex-1">
          {isLoadingCamera && (
            <div className="text-center text-white p-6">
              <RefreshCw className="w-10 h-10 animate-spin text-amber-400 mx-auto mb-3" />
              <p className="text-base font-bold">Activating your camera stream...</p>
            </div>
          )}

          {cameraError && (
            <div className="p-6 text-center text-white max-w-md">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-red-200 mb-2">Camera Unavailable</h4>
              <p className="text-sm text-slate-300 mb-5 leading-relaxed">{cameraError}</p>
              
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-action-amber)] hover:bg-amber-600 text-white font-extrabold text-base shadow-lg transition-transform active:scale-95"
              >
                <Upload className="w-5 h-5" />
                <span>Upload a Photo from Device</span>
              </button>
              <input
                type="file"
                ref={fileFallbackRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileFallback}
              />
            </div>
          )}

          {/* Active Live Video Stream */}
          {!cameraError && !capturedPreview && (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-contain max-h-[65vh]"
              />

              {/* Viewfinder Reticle Guide */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-amber-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-4 shadow-inner">
                <div className="flex justify-between items-center text-amber-300 text-xs font-mono font-bold bg-black/60 px-3 py-1 rounded-md self-start">
                  <span>[ LIVE DOCUMENT VIEWFINDER ]</span>
                </div>
                <div className="text-center bg-black/60 px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold max-w-sm mx-auto backdrop-blur-xs">
                  Place bill, pill bottle, or letter inside this box
                </div>
              </div>

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <div className="text-7xl sm:text-8xl font-black text-amber-300 animate-ping">
                    {countdown}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Captured Preview Screen */}
          {capturedPreview && (
            <div className="relative w-full h-full flex items-center justify-center p-3">
              <img
                src={capturedPreview}
                alt="Captured document preview"
                className="w-full max-h-[60vh] object-contain rounded-xl border-2 border-amber-400"
              />
              <div className="absolute top-5 left-5 bg-emerald-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                <Check className="w-4 h-4" />
                <span>Photo Captured!</span>
              </div>
            </div>
          )}
        </div>

        {/* Shutter & Controls Bottom Bar */}
        <div className="bg-[var(--color-surface-sunken)] p-4 sm:p-5 border-t border-[var(--color-border-subtle)]">
          {!capturedPreview ? (
            <div className="flex items-center justify-between gap-4">
              
              {/* Steady 3s Timer Toggle */}
              <button
                type="button"
                onClick={() => setUseSteadyTimer(!useSteadyTimer)}
                className={`h-12 px-3 sm:px-4 rounded-xl border-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors ${
                  useSteadyTimer
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-black'
                    : 'border-[var(--color-border-base)] bg-white text-[var(--color-ink-muted)] hover:bg-slate-50'
                }`}
                title="Steady hand 3-second countdown"
              >
                <Clock className="w-4 h-4" />
                <span>{useSteadyTimer ? '3s Timer: ON' : '3s Timer: OFF'}</span>
              </button>

              {/* Central Main Shutter Button */}
              <button
                type="button"
                id="btn-camera-shutter"
                disabled={isLoadingCamera || !!cameraError || countdown !== null}
                onClick={handleTriggerSnap}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 border-4 border-white shadow-xl hover:scale-105 active:scale-95 flex flex-col items-center justify-center text-white transition-all disabled:opacity-50 disabled:scale-100 group"
                title="Take Photo Now"
              >
                <div className="w-14 h-14 rounded-full border-2 border-amber-900/20 flex items-center justify-center group-hover:bg-white/20">
                  <Camera className="w-7 h-7 text-amber-950" />
                </div>
              </button>

              {/* Switch Camera Facing Mode */}
              <button
                type="button"
                onClick={toggleFacingMode}
                disabled={isLoadingCamera || !!cameraError}
                className="h-12 px-3 sm:px-4 rounded-xl border-2 border-[var(--color-border-base)] bg-white hover:bg-slate-50 text-[var(--color-ink-primary)] font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                title="Flip Camera (Front/Back)"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Flip Camera</span>
              </button>

            </div>
          ) : (
            /* Action options for captured photo */
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleRetake}
                className="h-14 flex-1 rounded-xl border-2 border-[var(--color-border-base)] bg-white hover:bg-slate-50 text-[var(--color-ink-primary)] font-extrabold text-base flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Retake Photo</span>
              </button>

              <button
                type="button"
                id="btn-confirm-captured-photo"
                onClick={handleConfirmPhoto}
                className="h-14 flex-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-lg flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98"
              >
                <Check className="w-6 h-6" />
                <span>Use This Photo</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
