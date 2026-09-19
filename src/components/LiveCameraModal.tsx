import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Clock, Upload } from 'lucide-react';

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

  const playShutterSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
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

  const startCamera = async () => {
    setIsLoadingCamera(true);
    setCameraError(null);
    setCapturedPreview(null);

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

  const executeSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs">
      <div className="bg-white border border-neutral-200 rounded-md w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-white px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded border border-neutral-200 bg-neutral-50 text-neutral-900 flex items-center justify-center">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Camera Document Scanner
              </h3>
              <p className="text-xs text-neutral-500">
                Hold your letter, medicine bottle, or bill steady inside the box
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded border border-neutral-200 hover:border-neutral-900 flex items-center justify-center text-neutral-700 transition-colors cursor-pointer"
            title="Close camera"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-neutral-950 min-h-[300px] sm:min-h-[400px] flex items-center justify-center overflow-hidden flex-1">
          {isLoadingCamera && (
            <div className="text-center text-neutral-400 p-6 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-neutral-300 mx-auto mb-2" />
              <p>Opening your camera...</p>
            </div>
          )}

          {cameraError && (
            <div className="p-6 text-center text-white max-w-md text-xs">
              <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-white mb-1">Camera Not Available</h4>
              <p className="text-neutral-400 mb-4 leading-relaxed">{cameraError}</p>
              
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-white text-black font-sans font-medium text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo from Device</span>
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
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-white/70 rounded pointer-events-none flex flex-col justify-between p-3">
                <div className="text-white text-xs bg-black/70 px-2 py-0.5 rounded self-start font-medium">
                  Camera Window
                </div>
                <div className="text-center bg-black/70 px-3 py-1 rounded text-white text-xs max-w-sm mx-auto font-medium">
                  Hold document steady inside the box
                </div>
              </div>

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                  <div className="text-6xl font-bold text-white">
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
                className="w-full max-h-[60vh] object-contain rounded border border-neutral-700"
              />
              <div className="absolute top-4 left-4 bg-black text-white text-xs px-2.5 py-1 rounded flex items-center gap-1.5 border border-neutral-700 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Photo Captured</span>
              </div>
            </div>
          )}
        </div>

        {/* Shutter & Controls Bottom Bar */}
        <div className="bg-white p-3.5 sm:p-4 border-t border-neutral-200">
          {!capturedPreview ? (
            <div className="flex items-center justify-between gap-3">
              
              {/* Steady 3s Timer Toggle */}
              <button
                type="button"
                onClick={() => setUseSteadyTimer(!useSteadyTimer)}
                className={`h-9 px-3 rounded-md border text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
                  useSteadyTimer
                    ? 'border-neutral-900 bg-neutral-900 text-white font-medium'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900'
                }`}
                title="Steady hand 3-second countdown before taking photo"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{useSteadyTimer ? '3s Timer: On' : '3s Timer: Off'}</span>
              </button>

              {/* Central Main Shutter Button */}
              <button
                type="button"
                id="btn-camera-shutter"
                disabled={isLoadingCamera || !!cameraError || countdown !== null}
                onClick={handleTriggerSnap}
                className="w-14 h-14 rounded-full bg-black hover:bg-neutral-800 border-2 border-white ring-2 ring-neutral-900 flex items-center justify-center text-white transition-all disabled:opacity-40 cursor-pointer select-none shadow-md"
                title="Take Photo Now"
              >
                <div className="w-10 h-10 rounded-full border border-neutral-600 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </button>

              {/* Switch Camera Facing Mode */}
              <button
                type="button"
                onClick={toggleFacingMode}
                disabled={isLoadingCamera || !!cameraError}
                className="h-9 px-3 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white text-neutral-700 text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer select-none"
                title="Switch Front/Back Camera"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Flip Camera</span>
              </button>

            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="h-9 px-4 flex-1 rounded-md border border-neutral-200 hover:border-neutral-900 bg-white text-neutral-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Take Another</span>
              </button>

              <button
                type="button"
                id="btn-confirm-captured-photo"
                onClick={handleConfirmPhoto}
                className="h-9 px-4 flex-1 rounded-md bg-black hover:bg-neutral-800 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Check className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
