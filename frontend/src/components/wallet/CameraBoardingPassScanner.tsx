'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Check, Plane, Coins, AlertCircle, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useBoardingPassScanner } from '@/lib/hooks/useBoardingPassScanner';
import { CoinAnimation } from './CoinAnimation';
import { hapticBoardingPassScan, hapticSelection } from '@/lib/utils/haptics';

interface CameraBoardingPassScannerProps {
  onScanComplete?: (coinsEarned: number) => void;
  onClose?: () => void;
  className?: string;
}

export function CameraBoardingPassScanner({ 
  onScanComplete, 
  onClose, 
  className 
}: CameraBoardingPassScannerProps) {
  const t = useTranslations('wallet');
  const tErrors = useTranslations('errors');
  
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
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

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera not supported on this device');
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
      setIsActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      setCameraError('Camera access denied or not available');
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
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
        
        // Show coin animation
        setShowCoinAnimation(true);
        
        // Call completion callback
        onScanComplete?.(result.coinsEarned);
        
        // Close scanner after successful scan
        setTimeout(() => {
          stopCamera();
          onClose?.();
        }, 3000);
      }
    } catch (error) {
      console.error('Boarding pass processing failed:', error);
    }
  }, [capturedImage, scanBoardingPass, onScanComplete, stopCamera, onClose]);

  // Switch camera facing mode
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isActive) {
      stopCamera();
      // Restart with new facing mode will happen via useEffect
    }
  }, [isActive, stopCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isActive && !stream) {
      startCamera();
    }
  }, [facingMode, isActive, stream, startCamera]);

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
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {t('scanBoardingPass')}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isActive && !capturedImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Camera Boarding Pass Scanner
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Take a photo of your boarding pass to earn 10 coins
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={startCamera} className="w-full" size="lg">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
              {/* Mock scan button for testing */}
              <Button 
                onClick={() => {
                  // Mock successful scan for testing
                  const mockResult = {
                    success: true,
                    coinsEarned: 10,
                    message: 'Boarding pass scanned successfully!'
                  };
                  onScanComplete?.(mockResult.coinsEarned);
                  onClose?.();
                }}
                variant="outline" 
                className="w-full" 
                size="sm"
              >
                Mock Scan (Testing)
              </Button>
            </div>
          </motion.div>
        )}

        {cameraError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-md bg-destructive/10 border border-destructive/20"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{cameraError}</p>
            </div>
          </motion.div>
        )}

        {isActive && !capturedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Camera View */}
            <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Camera overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white/50 rounded-lg w-4/5 h-3/5 flex items-center justify-center">
                  <p className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                    Position boarding pass here
                  </p>
                </div>
              </div>
            </div>

            {/* Camera Controls */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={switchCamera}
                className="flex items-center gap-2"
              >
                <SwitchCamera className="h-4 w-4" />
                Switch
              </Button>
              
              <Button
                onClick={capturePhoto}
                size="lg"
                className="flex-1 mx-4"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {capturedImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Captured Image Preview */}
            <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
              <img
                src={capturedImage}
                alt="Captured boarding pass"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Process Controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1"
                disabled={isProcessing}
              >
                Retake
              </Button>
              <Button
                onClick={processCapturedImage}
                className="flex-1"
                disabled={isProcessing || isScanning}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plane className="h-4 w-4 mr-2" />
                    Scan for 10 Coins
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Success Result */}
        <AnimatePresence>
          {lastScanResult?.success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {lastScanResult.message}
                  </p>
                  {lastScanResult.coinsEarned && (
                    <div className="flex items-center gap-1 mt-1">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        +{lastScanResult.coinsEarned} Smile Coins earned!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-md bg-destructive/10 border border-destructive/20"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </motion.div>
        )}
      </CardContent>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Coin Animation Overlay */}
      <AnimatePresence>
        {showCoinAnimation && lastScanResult?.coinsEarned && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <CoinAnimation
              type="earn"
              amount={lastScanResult.coinsEarned}
              onComplete={() => setShowCoinAnimation(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}