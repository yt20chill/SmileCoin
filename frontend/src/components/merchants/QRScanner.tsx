'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, X, Camera, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQRScanner } from '@/lib/hooks/useQRScanner';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticQRScan, hapticQRSuccess, hapticQRError } from '@/lib/utils/haptics';

interface QRScannerProps {
  onScanSuccess: (merchantId: string, merchantName: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function QRScanner({ onScanSuccess, onClose, isOpen }: QRScannerProps) {
  const t = useTranslations('qrScanner');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const {
    isScanning,
    isProcessing,
    error,
    lastScanResult,
    startScanning,
    stopScanning,
    clearError,
  } = useQRScanner();

  // Request camera permission and start scanning
  const initializeScanner = async () => {
    try {
      setPermissionError(null);
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      setHasPermission(true);
      
      // Stop the stream as QrScanner will handle it
      stream.getTracks().forEach(track => track.stop());
      
      // Start QR scanning
      if (videoRef.current) {
        hapticQRScan();
        await startScanning(videoRef.current);
      }
    } catch (err) {
      setHasPermission(false);
      setPermissionError(
        err instanceof Error ? err.message : t('cameraPermissionDenied')
      );
    }
  };

  // Handle successful scan
  useEffect(() => {
    if (lastScanResult?.success && lastScanResult.merchantId && lastScanResult.merchantName) {
      hapticQRSuccess();
      onScanSuccess(lastScanResult.merchantId, lastScanResult.merchantName);
    } else if (lastScanResult && !lastScanResult.success) {
      hapticQRError();
    }
  }, [lastScanResult, onScanSuccess]);

  // Initialize scanner when component opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      initializeScanner();
    }
    
    return () => {
      stopScanning();
    };
  }, [isOpen]);

  // Handle close
  const handleClose = () => {
    stopScanning();
    clearError();
    setPermissionError(null);
    setHasPermission(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md"
      >
        <Card className="relative overflow-hidden">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="w-6 h-6 text-blue-600" />
                <span>{t('scanQRCode')}</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
                data-testid="close-scanner-button"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600 text-sm mt-2">
              {t('scanInstructions')}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Camera Permission Status */}
            {hasPermission === null && (
              <div className="flex items-center justify-center p-8">
                <div className="text-center space-y-3">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-gray-600">{t('requestingCamera')}</p>
                </div>
              </div>
            )}

            {/* Permission Denied */}
            {hasPermission === false && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-red-700 font-medium">{t('cameraAccessDenied')}</p>
                    <p className="text-red-600 text-sm">{permissionError}</p>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-gray-600 text-sm">{t('enableCameraInstructions')}</p>
                  <Button
                    onClick={initializeScanner}
                    variant="outline"
                    className="w-full"
                    data-testid="retry-camera-button"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {t('tryAgain')}
                  </Button>
                </div>
              </div>
            )}

            {/* Video Scanner */}
            {hasPermission === true && (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-black rounded-lg object-cover"
                    playsInline
                    muted
                    data-testid="qr-scanner-video"
                  />
                  
                  {/* Scanning Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                    </div>
                  </div>

                  {/* Processing Overlay */}
                  <AnimatePresence>
                    {isProcessing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center"
                        data-testid="processing-overlay"
                      >
                        <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          <span className="text-gray-700">{t('processing')}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Scanner Status */}
                <div className="text-center">
                  {isScanning && !isProcessing && (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">{t('scanningActive')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                  data-testid="scanner-error"
                >
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scan Result */}
            <AnimatePresence>
              {lastScanResult && !lastScanResult.success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  data-testid="invalid-qr-message"
                >
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">{lastScanResult.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {lastScanResult?.success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                  data-testid="valid-qr-message"
                >
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-green-700 font-medium">{t('qrCodeValid')}</p>
                    <p className="text-xs text-green-600">{lastScanResult.merchantName}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Instructions */}
            <div className="text-center text-sm text-gray-500 space-y-1">
              <p>{t('pointCameraAtQR')}</p>
              <p>{t('scanWillHappenAutomatically')}</p>
            </div>

            {/* Cancel Button */}
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full"
              data-testid="cancel-scan-button"
            >
              {t('cancel')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}