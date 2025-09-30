'use client';

import { useState, useCallback } from 'react';
import { ApiClient } from '../api/client';
import { useAppState } from './useAppState';
import { validateBoardingPassFile } from '../utils/validation';
import type { BoardingPass, BoardingPassScanResult, Transaction } from '../types';

interface BoardingPassScannerState {
  isScanning: boolean;
  isProcessing: boolean;
  error: string | null;
  lastScanResult: BoardingPassScanResult | null;
  scanHistory: BoardingPass[];
  totalCoinsEarned: number;
}

interface BoardingPassScannerHookReturn extends BoardingPassScannerState {
  scanBoardingPass: (file: File) => Promise<BoardingPassScanResult>;
  loadScanHistory: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export function useBoardingPassScanner(): BoardingPassScannerHookReturn {
  const { state, actions } = useAppState();
  
  const [scannerState, setScannerState] = useState<BoardingPassScannerState>({
    isScanning: false,
    isProcessing: false,
    error: null,
    lastScanResult: null,
    scanHistory: [],
    totalCoinsEarned: 0,
  });

  const updateScannerState = useCallback((updates: Partial<BoardingPassScannerState>) => {
    setScannerState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateScannerState({ error: null });
  }, [updateScannerState]);

  const reset = useCallback(() => {
    setScannerState({
      isScanning: false,
      isProcessing: false,
      error: null,
      lastScanResult: null,
      scanHistory: [],
      totalCoinsEarned: 0,
    });
  }, []);

  const scanBoardingPass = useCallback(async (file: File): Promise<BoardingPassScanResult> => {
    try {
      updateScannerState({ 
        isScanning: true, 
        isProcessing: true, 
        error: null 
      });

      // Validate file
      const fileValidation = validateBoardingPassFile(file);
      if (!fileValidation.isValid) {
        const result: BoardingPassScanResult = {
          success: false,
          message: fileValidation.error || 'Invalid file',
          error: fileValidation.error
        };
        updateScannerState({ 
          isScanning: false, 
          isProcessing: false, 
          error: fileValidation.error || 'Invalid file',
          lastScanResult: result
        });
        return result;
      }

      if (!state.user?.id) {
        const result: BoardingPassScanResult = {
          success: false,
          message: 'User not logged in',
          error: 'User authentication required'
        };
        updateScannerState({ 
          isScanning: false, 
          isProcessing: false, 
          error: 'User authentication required',
          lastScanResult: result
        });
        return result;
      }

      // Scan boarding pass via API
      const scanResult = await ApiClient.scanBoardingPass(file, state.user.id);
      
      if (scanResult.success && scanResult.coinsEarned && scanResult.boardingPass && scanResult.transaction) {
        // Update wallet balance
        actions.updateBalance(state.wallet.balance + scanResult.coinsEarned);
        
        // Add transaction
        const transaction: Transaction = {
          id: scanResult.transaction.id,
          type: 'earn',
          amount: scanResult.coinsEarned,
          description: scanResult.transaction.description,
          boardingPassId: scanResult.boardingPass.id,
          timestamp: new Date(scanResult.transaction.timestamp),
          status: 'completed'
        };
        actions.addTransaction(transaction);
        
        // Add boarding pass to state
        const boardingPass: BoardingPass = {
          id: scanResult.boardingPass.id,
          passengerName: scanResult.boardingPass.passengerName,
          flightNumber: scanResult.boardingPass.flightNumber,
          date: new Date(scanResult.boardingPass.date),
          imageUrl: scanResult.boardingPass.imageUrl,
          isScanned: true,
          coinsAwarded: scanResult.coinsEarned,
          scannedAt: new Date(scanResult.boardingPass.scannedAt),
          userId: state.user.id
        };
        actions.addBoardingPass(boardingPass);
        
        // Update scanner state
        updateScannerState({
          isScanning: false,
          isProcessing: false,
          lastScanResult: {
            success: true,
            boardingPass,
            coinsEarned: scanResult.coinsEarned,
            message: scanResult.message
          },
          scanHistory: [...scannerState.scanHistory, boardingPass],
          totalCoinsEarned: scannerState.totalCoinsEarned + scanResult.coinsEarned
        });
        
        return {
          success: true,
          boardingPass,
          coinsEarned: scanResult.coinsEarned,
          message: scanResult.message
        };
      } else {
        // Handle scan failure
        const result: BoardingPassScanResult = {
          success: false,
          message: scanResult.message || 'Boarding pass scan failed',
          error: scanResult.message
        };
        
        updateScannerState({
          isScanning: false,
          isProcessing: false,
          error: scanResult.message || 'Boarding pass scan failed',
          lastScanResult: result
        });
        
        return result;
      }
      
    } catch (error) {
      console.error('Boarding pass scan failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Boarding pass scan failed';
      const result: BoardingPassScanResult = {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
      
      updateScannerState({
        isScanning: false,
        isProcessing: false,
        error: errorMessage,
        lastScanResult: result
      });
      
      return result;
    }
  }, [state.user, state.wallet.balance, actions, updateScannerState, scannerState.scanHistory, scannerState.totalCoinsEarned]);

  const loadScanHistory = useCallback(async () => {
    try {
      if (!state.user?.id) {
        return;
      }

      updateScannerState({ isProcessing: true, error: null });

      const historyResult = await ApiClient.getBoardingPassHistory(state.user.id);
      
      if (historyResult.success && historyResult.boardingPasses) {
        const boardingPasses: BoardingPass[] = historyResult.boardingPasses.map((bp: any) => ({
          id: bp.id,
          passengerName: bp.passengerName,
          flightNumber: bp.flightNumber,
          date: new Date(bp.date),
          imageUrl: bp.imageUrl,
          isScanned: bp.isScanned,
          coinsAwarded: bp.coinsAwarded,
          scannedAt: bp.scannedAt ? new Date(bp.scannedAt) : undefined,
          userId: bp.userId
        }));
        
        updateScannerState({
          isProcessing: false,
          scanHistory: boardingPasses,
          totalCoinsEarned: historyResult.totalCoinsEarned || 0
        });
        
        // Update app state with boarding passes
        actions.setBoardingPasses(boardingPasses);
      } else {
        updateScannerState({
          isProcessing: false,
          error: 'Failed to load boarding pass history'
        });
      }
      
    } catch (error) {
      console.error('Failed to load boarding pass history:', error);
      updateScannerState({
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to load history'
      });
    }
  }, [state.user?.id, actions, updateScannerState]);

  return {
    ...scannerState,
    scanBoardingPass,
    loadScanHistory,
    clearError,
    reset,
  };
}