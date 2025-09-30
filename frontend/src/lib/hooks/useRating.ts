'use client';

import { useState, useCallback } from 'react';
import { useAppContext } from '../stores/context';
import { useWallet } from './useWallet';
import { Rating, Transaction } from '../types';

export interface UseRatingReturn {
  isSubmitting: boolean;
  error: string | null;
  submitRating: (merchantId: string, rating: number, comment?: string) => Promise<void>;
  getRatingsByMerchant: (merchantId: string) => Rating[];
  getUserRatingForMerchant: (merchantId: string, userId: string) => Rating | undefined;
  clearError: () => void;
}

export function useRating(): UseRatingReturn {
  const { state, dispatch } = useAppContext();
  const { spendCoins, addTransaction } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submit a rating for a merchant
  const submitRating = useCallback(async (
    merchantId: string, 
    rating: number, 
    comment?: string,
    qrCodeScanned?: string
  ) => {
    if (!state.user) {
      setError('User not authenticated');
      return;
    }

    if (rating < 1 || rating > 3) {
      setError('Rating must be between 1 and 3 coins');
      return;
    }

    if (state.wallet.balance < rating) {
      setError('Insufficient Smile Coins for this rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Call the API to submit rating
      const response = await fetch(`/api/merchants/${merchantId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: state.user.id,
          rating,
          comment,
          qrCodeScanned,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit rating');
      }

      // Update local state with the new transaction and rating
      if (data.transaction) {
        addTransaction({
          type: 'spend',
          amount: rating,
          description: `Rated merchant`,
          merchantId,
          status: 'completed',
        });
      }

      // Update wallet balance
      if (data.newBalance !== undefined) {
        dispatch({ type: 'UPDATE_BALANCE', payload: data.newBalance });
      }

      // Update merchant rating if provided
      if (data.rating) {
        // In a real app, you might want to update the merchant's rating in the state
        // For now, we'll just log it
        console.log('Rating submitted successfully:', data.rating);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit rating';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [state.user, state.wallet.balance, addTransaction, dispatch]);

  // Get all ratings for a specific merchant
  const getRatingsByMerchant = useCallback((merchantId: string): Rating[] => {
    // In a real app, this would fetch from the API or local database
    // For now, we'll return an empty array as ratings are not stored in the main state
    return [];
  }, []);

  // Get user's rating for a specific merchant
  const getUserRatingForMerchant = useCallback((
    merchantId: string, 
    userId: string
  ): Rating | undefined => {
    // In a real app, this would check if the user has already rated this merchant
    // For now, we'll return undefined
    return undefined;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSubmitting,
    error,
    submitRating,
    getRatingsByMerchant,
    getUserRatingForMerchant,
    clearError,
  };
}