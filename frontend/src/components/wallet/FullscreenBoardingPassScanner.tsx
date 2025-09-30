'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, SwitchCamera, Plane, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBoardingPassScanner } from '@/lib/hooks/useBoardingPassScanner';
import { hapticBoardingPassScan, hapticSelection } from '@/lib/utils/haptics';

interface FullscreenBoardingPassScannerProps {
  onScanComplete?: (coinsEarned: number) => void;
  onClose?: () => void;
  className?: string;
}

export function FullscreenBoardingPassScanner({ 
  onScanComplete, 
  onClose, 
  className 
}: FullscreenBoardingPassScannerProps) {
  const t = useTranslations('wallet');
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const {
    isScanning,
    isProcessing,
    error,
    lastScanResult,
    scanBoardingPass,
    clearError
  } = useBoardingPassScanner();

  // Auto-start camera on mount
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setIsInitializing(true);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera not supported on this device');
        setIsInitializing(false);
        return;
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      setIsInitializing(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      setCameraError('Camera access denied or not available');
      setIsInitializing(false);
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
  }, [stream]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create image URL
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        hapticSelection();
      }
    }, 'image/jpeg', 0.8);
  }, []);

  // Process captured image
  const processCapturedImage = useCallback(async () => {
    if (!capturedImage || !canvasRef.current) return;

    try {
      // Convert canvas to File object
      const canvas = canvasRef.current;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.8);
      });

      const file = new File([blob], 'boarding-pass.jpg', { type: 'image/jpeg' });
      
      const result = await scanBoardingPass(file);
      
      if (result.success && result.coinsEarned) {
        // Trigger haptic feedback for successful scan
        hapticBoardingPassScan();
        
        // Call completion callback
        onScanComplete?.(result.coinsEarned);
        
        // Close scanner after successful scan
        setTimeout(() => {
          stopCamera();
          onClose?.();
        }, 2000);
      }
    } catch (error) {
      console.error('Boarding pass processing failed:', error);
    }
  }, [capturedImage, scanBoardingPass, onScanComplete, stopCamera, onClose]);

  // Mock scan for testing
  const mockScan = useCallback(() => {
    const mockResult = {
      success: true,
      coinsEarned: 10,
      message: 'Boarding pass scanned successfully!'
    };
    hapticBoardingPassScan();
    onScanComplete?.(mockResult.coinsEarned);
    setTimeout(() => {
      stopCamera();
      onClose?.();
    }, 1000);
  }, [onScanComplete, stopCamera, onClose]);

  // Switch camera facing mode
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (stream) {
      stopCamera();
    }
  }, [stream, stopCamera]);

  // Auto-start camera on mount and when facing mode changes
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose?.();
  }, [stopCamera, onClose]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    clearError();
  }, [clearError]);

  return (
    <div className={cn("fixed inset-0 z-50 bg-black", className)}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-2 text-white">
          <Plane className="h-5 w-5" />
          <span className="font-medium">Scan Boarding Pass</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-10 w-10 p-0 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Camera View */}
      {!capturedImage && !cameraError && (
        <div className="relative w-full h-full">
          {isInitializing ? (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
                <p>Starting camera...</p>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Scanning frame */}
                  <div className="w-80 h-56 border-2 border-white/70 rounded-lg relative">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-yellow-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-yellow-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-yellow-400 rounded-br-lg" />
                  </div>
                  
                  {/* Instructions */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                    <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                      Position boarding pass in frame
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="relative w-full h-full">
          <img
            src={capturedImage}
            alt="Captured boarding pass"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Error State */}
      {cameraError && (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-white text-center space-y-4">
            <AlertCircle className="h-16 w-16 mx-auto text-red-400" />
            <p className="text-lg font-medium">Camera Error</p>
            <p className="text-sm text-white/80">{cameraError}</p>
            <Button onClick={mockScan} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              Mock Scan (Testing)
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      {!cameraError && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          {!capturedImage ? (
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={switchCamera}
                className="text-white hover:bg-white/20"
              >
                <SwitchCamera className="h-5 w-5 mr-2" />
                Switch
              </Button>
              
              <Button
                onClick={capturePhoto}
                size="lg"
                className="w-16 h-16 rounded-full bg-white hover:bg-white/90 text-black p-0"
                disabled={isInitializing}
              >
                <div className="w-12 h-12 rounded-full bg-black/20" />
              </Button>
              
              <Button
                onClick={mockScan}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                Mock Scan
              </Button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
                disabled={isProcessing}
              >
                Retake
              </Button>
              <Button
                onClick={processCapturedImage}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                disabled={isProcessing || isScanning}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Coins className="h-4 w-4 mr-2" />
                    Scan for 10 Coins
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Success Result */}
      <AnimatePresence>
        {lastScanResult?.success && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80"
          >
            <div className="text-center text-white space-y-4">
              <Check className="h-16 w-16 mx-auto text-green-400" />
              <p className="text-xl font-semibold">{lastScanResult.message}</p>
              {lastScanResult.coinsEarned && (
                <div className="flex items-center justify-center gap-2">
                  <Coins className="h-6 w-6 text-yellow-400" />
                  <span className="text-lg font-medium text-yellow-400">
                    +{lastScanResult.coinsEarned} Smile Coins earned!
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-20 left-4 right-4">
          <div className="p-4 rounded-lg bg-red-500/90 text-white">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}