'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, X, Check, AlertCircle, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { hapticSelection } from '@/lib/utils/haptics';

interface MerchantQRScannerProps {
  onScanComplete?: (merchantId: string) => void;
  onClose?: () => void;
  className?: string;
}

export function MerchantQRScanner({ 
  onScanComplete, 
  onClose, 
  className 
}: MerchantQRScannerProps) {
  const t = useTranslations('wallet');
  const router = useRouter();
  
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Mock merchant data for POC
  const mockMerchants = [
    { id: 'merchant-1', name: 'Dim Sum Palace', qrCode: 'QR_MERCHANT_001' },
    { id: 'merchant-2', name: 'Tea House Central', qrCode: 'QR_MERCHANT_002' },
    { id: 'merchant-3', name: 'Roast Duck Express', qrCode: 'QR_MERCHANT_003' },
  ];

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
          width: { ideal: 1280 },
          height: { ideal: 720 }
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
    setScanResult(null);
  }, [stream]);

  // Mock QR code scanning
  const mockScanQRCode = useCallback(() => {
    setIsProcessing(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      // Mock successful scan - randomly select a merchant
      const randomMerchant = mockMerchants[Math.floor(Math.random() * mockMerchants.length)];
      setScanResult(randomMerchant.qrCode);
      setIsProcessing(false);
      
      // Navigate to merchant rating after a short delay
      setTimeout(() => {
        stopCamera();
        onScanComplete?.(randomMerchant.id);
        // Navigate to merchant detail page with rating interface
        router.push(`/merchants/${randomMerchant.id}?showRating=true`);
      }, 1500);
    }, 2000);
  }, [stopCamera, onScanComplete, router]);

  // Switch camera facing mode
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isActive) {
      stopCamera();
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

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Scan Merchant QR Code
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
        {!isActive && !scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <QrCode className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Merchant QR Code Scanner
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Scan a merchant's QR code to rate your experience
              </p>
            </div>
            <Button onClick={startCamera} className="w-full" size="lg">
              <QrCode className="h-4 w-4 mr-2" />
              Start Scanner
            </Button>
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

        {isActive && !scanResult && (
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
              
              {/* QR Code overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white/70 rounded-lg w-48 h-48 flex items-center justify-center">
                  <div className="border border-white/50 w-40 h-40 rounded-md">
                    <div className="w-full h-full border-2 border-dashed border-white/30 rounded flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-white/60" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Scanning animation */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                    <p className="text-sm">Scanning QR Code...</p>
                  </div>
                </div>
              )}
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
                onClick={mockScanQRCode}
                size="lg"
                className="flex-1 mx-4"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Scan QR Code
                  </>
                )}
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

        {/* Success Result */}
        <AnimatePresence>
          {scanResult && (
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
                    QR Code Scanned Successfully!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Redirecting to rating interface...
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}