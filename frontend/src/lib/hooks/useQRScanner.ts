'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { useAppContext } from '../stores/context';
import { QRCodeScanResult, QRCodeScan } from '../types';

export interface UseQRScannerReturn {
  isScanning: boolean;
  isProcessing: boolean;
  error: string | null;
  lastScanResult: QRCodeScanResult | null;
  startScanning: (videoElement: HTMLVideoElement) => Promise<void>;
  stopScanning: () => void;
  validateQRCode: (qrData: string) => Promise<QRCodeScanResult>;
  clearError: () => void;
  getQRScanHistory: () => QRCodeScan[];
  getVisitedMerchants: () => string[];
  getScanStatistics: () => {
    totalScans: number;
    validScans: number;
    uniqueMerchants: number;
    lastScanDate: Date | null;
    scanSuccessRate: number;
  };
}

export function useQRScanner(): UseQRScannerReturn {
  const { state, dispatch } = useAppContext();
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanResult, setLastScanResult] = useState<QRCodeScanResult | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // Start QR code scanning
  const startScanning = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      setError(null);
      setIsScanning(true);

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        throw new Error('No camera available for QR scanning');
      }

      // Create QR scanner instance
      qrScannerRef.current = new QrScanner(
        videoElement,
        async (result) => {
          setIsProcessing(true);
          try {
            const scanResult = await validateQRCode(result.data);
            setLastScanResult(scanResult);
            
            // Update global state
            dispatch({
              type: 'SET_QR_SCANNER',
              payload: {
                isActive: true,
                scannedData: result.data,
                lastScanResult: scanResult
              }
            });

            // If valid, stop scanning
            if (scanResult.success) {
              stopScanning();
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process QR code');
          } finally {
            setIsProcessing(false);
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      // Start scanning
      await qrScannerRef.current.start();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start QR scanner');
      setIsScanning(false);
    }
  }, [dispatch]);

  // Stop QR code scanning
  const stopScanning = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    setIsProcessing(false);
    
    // Update global state
    dispatch({
      type: 'SET_QR_SCANNER',
      payload: {
        isActive: false,
        scannedData: null
      }
    });
  }, [dispatch]);

  // Validate QR code against merchant database
  const validateQRCode = useCallback(async (qrData: string): Promise<QRCodeScanResult> => {
    if (!state.user) {
      return {
        success: false,
        isValid: false,
        message: 'User not authenticated',
        error: 'User not authenticated',
      };
    }

    try {
      // Call API to validate QR code
      const response = await fetch('/api/qr-code/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrData,
          userId: state.user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to validate QR code');
      }

      // If valid, add to scan history with enhanced data
      if (result.success && result.merchantId) {
        const qrScan: QRCodeScan = {
          id: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          merchantId: result.merchantId,
          userId: state.user.id,
          scannedData: qrData,
          timestamp: new Date(),
          isValid: true,
          validatedAt: new Date(),
          merchantName: result.merchantName,
          merchantNameZh: result.merchantNameZh,
          category: result.category,
          location: result.location,
        };

        dispatch({ type: 'ADD_QR_SCAN', payload: qrScan });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate QR code';
      
      // Still record failed scan attempts for analytics
      if (state.user) {
        const failedScan: QRCodeScan = {
          id: `qr_failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          merchantId: 'unknown',
          userId: state.user.id,
          scannedData: qrData,
          timestamp: new Date(),
          isValid: false,
        };

        dispatch({ type: 'ADD_QR_SCAN', payload: failedScan });
      }

      return {
        success: false,
        isValid: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }, [state.user, dispatch]);

  // Get QR scan history for current user
  const getQRScanHistory = useCallback((): QRCodeScan[] => {
    if (!state.user) return [];
    
    // Filter scans for current user and sort by timestamp (newest first)
    return state.qrScans
      .filter(scan => scan.userId === state.user!.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [state.user, state.qrScans]);

  // Get unique merchants visited by current user
  const getVisitedMerchants = useCallback((): string[] => {
    if (!state.user) return [];
    
    const validScans = state.qrScans.filter(
      scan => scan.userId === state.user!.id && scan.isValid
    );
    
    const uniqueMerchants = [...new Set(validScans.map(scan => scan.merchantId))];
    return uniqueMerchants.filter(id => id !== 'unknown');
  }, [state.user, state.qrScans]);

  // Get scan statistics for current user
  const getScanStatistics = useCallback(() => {
    if (!state.user) {
      return {
        totalScans: 0,
        validScans: 0,
        uniqueMerchants: 0,
        lastScanDate: null,
        scanSuccessRate: 0,
      };
    }

    const userScans = state.qrScans.filter(scan => scan.userId === state.user!.id);
    const validScans = userScans.filter(scan => scan.isValid);
    const uniqueMerchants = new Set(validScans.map(scan => scan.merchantId)).size;
    const lastScan = userScans.length > 0 ? userScans[0] : null;
    const successRate = userScans.length > 0 ? (validScans.length / userScans.length) * 100 : 0;

    return {
      totalScans: userScans.length,
      validScans: validScans.length,
      uniqueMerchants,
      lastScanDate: lastScan?.timestamp || null,
      scanSuccessRate: Math.round(successRate),
    };
  }, [state.user, state.qrScans]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    isScanning,
    isProcessing,
    error,
    lastScanResult,
    startScanning,
    stopScanning,
    validateQRCode,
    clearError,
    getQRScanHistory,
    getVisitedMerchants,
    getScanStatistics,
  };
}