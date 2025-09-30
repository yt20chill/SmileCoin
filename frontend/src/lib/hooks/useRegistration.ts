'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '../api/client';
import { useAppState } from './useAppState';
import { validateRegistrationData, validateBoardingPassFile } from '../utils/validation';
import type { User } from '../types';

interface RegistrationState {
  isLoading: boolean;
  error: string | null;
  isRegistered: boolean;
  registeredUser: User | null;
  initialCoins: number;
}

interface RegistrationHookReturn extends RegistrationState {
  registerWithBoardingPass: (file: File) => Promise<void>;
  registerManually: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export function useRegistration(): RegistrationHookReturn {
  const router = useRouter();
  const { actions } = useAppState();
  
  const [state, setState] = useState<RegistrationState>({
    isLoading: false,
    error: null,
    isRegistered: false,
    registeredUser: null,
    initialCoins: 0,
  });

  const updateState = useCallback((updates: Partial<RegistrationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      isRegistered: false,
      registeredUser: null,
      initialCoins: 0,
    });
  }, []);

  const registerWithBoardingPass = useCallback(async (file: File) => {
    try {
      updateState({ isLoading: true, error: null });

      // Validate file
      const fileValidation = validateBoardingPassFile(file);
      if (!fileValidation.isValid) {
        throw new Error(fileValidation.error);
      }

      // Upload and process boarding pass
      const uploadResult = await ApiClient.uploadBoardingPass(file);
      
      if (!uploadResult.success || !uploadResult.extractedData) {
        throw new Error('Could not extract flight information from boarding pass');
      }

      // Register user with extracted data
      const userData: Partial<User> = {
        flightNumber: uploadResult.extractedData.flightNumber,
        arrivalDate: new Date(uploadResult.extractedData.arrivalDate),
        email: uploadResult.extractedData.email || undefined,
        preferredLanguage: 'en', // Default, can be changed later
        registrationMethod: 'boarding-pass',
      };

      const registrationResult = await ApiClient.registerUser(userData);
      
      // Update app state
      actions.setUser(registrationResult.user);
      actions.updateBalance(registrationResult.initialCoins);
      
      // Add initial transaction
      actions.addTransaction({
        id: crypto.randomUUID(),
        type: 'earn',
        amount: registrationResult.initialCoins,
        description: 'Welcome bonus for registration',
        timestamp: new Date(),
        status: 'completed',
      });

      updateState({
        isLoading: false,
        isRegistered: true,
        registeredUser: registrationResult.user,
        initialCoins: registrationResult.initialCoins,
      });

    } catch (error) {
      console.error('Boarding pass registration failed:', error);
      updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      });
      throw error; // Re-throw to allow component to handle fallback
    }
  }, [actions, updateState]);

  const registerManually = useCallback(async (userData: Partial<User>) => {
    try {
      updateState({ isLoading: true, error: null });

      // Validate registration data
      const validation = validateRegistrationData(userData);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        throw new Error(firstError);
      }

      // Register user
      const registrationResult = await ApiClient.registerUser({
        ...userData,
        registrationMethod: 'manual',
      });
      
      // Update app state
      actions.setUser(registrationResult.user);
      actions.updateBalance(registrationResult.initialCoins);
      
      // Add initial transaction
      actions.addTransaction({
        id: crypto.randomUUID(),
        type: 'earn',
        amount: registrationResult.initialCoins,
        description: 'Welcome bonus for registration',
        timestamp: new Date(),
        status: 'completed',
      });

      updateState({
        isLoading: false,
        isRegistered: true,
        registeredUser: registrationResult.user,
        initialCoins: registrationResult.initialCoins,
      });

    } catch (error) {
      console.error('Manual registration failed:', error);
      updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  }, [actions, updateState]);

  return {
    ...state,
    registerWithBoardingPass,
    registerManually,
    clearError,
    reset,
  };
}