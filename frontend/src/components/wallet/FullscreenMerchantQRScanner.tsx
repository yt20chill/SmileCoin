'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, X, Check, AlertCircle, SwitchCamera, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticSelection } from '@/lib/utils/haptics';

interface FullscreenMerchantQRScannerProps {
  onScanComplete?: (merchantId: string) => void;
  onClose?: () => void;
  className?: string;
}

export function FullscreenMerchantQRScanner({ 
  onScanComplete, 
  onClose, 
  className 
}: FullscreenMerchantQRScannerProps) {
  const t = useTranslations('wallet');
  const locale = useLocale();
  const router = useRouter();
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Mock merchant data for POC
  const mockMerchants = [
    { id: 'merchant-001', name: 'Dim Sum Palace', qrCode: 'QR_MERCHANT_001' },
    { id: 'merchant-002', name: 'Tea House Central', qrCode: 'QR_MERCHANT_002' },
    { id: 'merchant-003', name: 'Roast Duck Express', qrCode: 'QR_MERCHANT_003' },
  ];

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
          width: { ideal: 1280 },
          height: { ideal: 720 }
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
        router.push(`/${locale}/merchants/merchant-001?showRating=true`);
      }, 1500);
    }, 2000);
  }, [stopCamera, onScanComplete, router, mockMerchants]);

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

  return (
    <div className={cn("fixed inset-0 z-50 bg-black", className)}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-2 text-white">
          <QrCode className="h-5 w-5" />
          <span className="font-medium">Scan Merchant QR Code</span>
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
      {!cameraError && (
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
              
              {/* QR Code scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* QR Code frame */}
                  <div className="w-64 h-64 border-2 border-white/70 rounded-lg relative">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-400 rounded-br-lg" />
                    
                    {/* QR Code icon in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <QrCode className="h-16 w-16 text-white/30" />
                    </div>
                  </div>
                  
                  {/* Instructions */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                    <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                      Point camera at merchant QR code
                    </p>
                  </div>
                </div>
              </div>

              {/* Scanning animation overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4" />
                    <p className="text-lg font-medium">Scanning QR Code...</p>
                    <p className="text-sm text-white/80 mt-2">Please hold steady</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Error State */}
      {cameraError && (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-white text-center space-y-4">
            <AlertCircle className="h-16 w-16 mx-auto text-red-400" />
            <p className="text-lg font-medium">Camera Error</p>
            <p className="text-sm text-white/80">{cameraError}</p>
            <Button onClick={mockScanQRCode} className="bg-orange-500 hover:bg-orange-600 text-white">
              Mock Scan (Testing)
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      {!cameraError && !isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={switchCamera}
              className="text-white hover:bg-white/20"
              disabled={isInitializing}
            >
              <SwitchCamera className="h-5 w-5 mr-2" />
              Switch
            </Button>
            
            <Button
              onClick={mockScanQRCode}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8"
              disabled={isInitializing || isProcessing}
            >
              <QrCode className="h-5 w-5 mr-2" />
              Scan QR Code
            </Button>
            
            <Button
              onClick={mockScanQRCode}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              disabled={isInitializing}
            >
              Mock Scan
            </Button>
          </div>
        </div>
      )}

      {/* Success Result */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80"
          >
            <div className="text-center text-white space-y-4">
              <Check className="h-16 w-16 mx-auto text-green-400" />
              <p className="text-xl font-semibold">QR Code Scanned Successfully!</p>
              <div className="flex items-center justify-center gap-2">
                <Star className="h-6 w-6 text-orange-400" />
                <span className="text-lg font-medium text-orange-400">
                  Redirecting to rating interface...
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}