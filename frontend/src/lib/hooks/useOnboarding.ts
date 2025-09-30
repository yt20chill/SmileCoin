'use client';

import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_STORAGE_KEY = 'smile-travel-onboarding-completed';

interface OnboardingState {
  hasCompletedOnboarding: boolean | null; // null = checking
  isLoading: boolean;
  error: string | null;
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    hasCompletedOnboarding: null, // Start with null to indicate checking
    isLoading: true,
    error: null
  });

  // Improved status checking with fallbacks
  const checkOnboardingStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check localStorage with error handling
      const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      
      // Default to false (show onboarding) if no value found or empty
      // Only return true if explicitly set to 'true'
      const hasCompleted = completed === 'true';
      
      setState({
        hasCompletedOnboarding: hasCompleted,
        isLoading: false,
        error: null
      });
    } catch (error) {
      // If localStorage fails, default to showing onboarding for new users
      console.warn('Failed to check onboarding status:', error);
      setState({
        hasCompletedOnboarding: false, // Default to showing onboarding
        isLoading: false,
        error: 'Storage unavailable - showing onboarding'
      });
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setState(prev => ({ 
        ...prev, 
        hasCompletedOnboarding: true,
        error: null 
      }));
    } catch (error) {
      console.warn('Failed to save onboarding completion:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to save onboarding status' 
      }));
    }
  }, []);

  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setState(prev => ({ 
        ...prev, 
        hasCompletedOnboarding: false,
        error: null 
      }));
    } catch (error) {
      console.warn('Failed to reset onboarding:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to reset onboarding status' 
      }));
    }
  }, []);

  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  return {
    hasCompletedOnboarding: state.hasCompletedOnboarding,
    isLoading: state.isLoading,
    error: state.error,
    completeOnboarding,
    resetOnboarding,
    skipOnboarding,
    checkOnboardingStatus
  };
}