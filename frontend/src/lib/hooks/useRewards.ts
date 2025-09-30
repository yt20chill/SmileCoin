'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../stores/context';
import { Reward, Transaction } from '../types';
import { useWallet } from './useWallet';

export interface RedemptionResult {
  success: boolean;
  voucher?: string;
  reward?: Reward;
  message: string;
  redemptionInstructions?: string;
}

export interface UseRewardsReturn {
  rewards: Reward[];
  isLoading: boolean;
  error: string | null;
  redemptionHistory: Transaction[];
  fetchRewards: (category?: string) => Promise<void>;
  redeemReward: (rewardId: string) => Promise<RedemptionResult>;
  getRewardsByCategory: (category: string) => Reward[];
  getRedemptionHistory: () => Transaction[];
  canAffordReward: (reward: Reward) => boolean;
  refreshRewards: () => Promise<void>;
}

export function useRewards(): UseRewardsReturn {
  const { state, dispatch } = useAppContext();
  const { wallet, addTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Since vouchers are free, there's no redemption history in transactions
  const redemptionHistory: Transaction[] = [];

  // Fetch rewards from API
  const fetchRewards = useCallback(async (category?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`/api/rewards?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rewards: ${response.status}`);
      }

      const rewards = await response.json();
      dispatch({ type: 'SET_REWARDS', payload: rewards });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rewards';
      setError(errorMessage);
      console.error('Fetch rewards error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  // Redeem a voucher (always free!)
  const redeemReward = useCallback(async (rewardId: string): Promise<RedemptionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const reward = state.rewards.find(r => r.id === rewardId);
      if (!reward) {
        throw new Error('Reward not found');
      }

      // No coin balance check needed - vouchers are free!
      // This aligns with Requirement 5: vouchers are free and coins are only for rating merchants

      // Call redemption API
      const response = await fetch(`/api/rewards/${rewardId}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: state.user?.id || 'demo-user',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Redemption failed');
      }

      const result: RedemptionResult = {
        success: true,
        voucher: data.voucher,
        reward: data.reward,
        message: data.message,
        redemptionInstructions: data.redemptionInstructions,
      };

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Redemption failed';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, [state.rewards, state.user?.id]);

  // Get rewards by category
  const getRewardsByCategory = useCallback((category: string): Reward[] => {
    return state.rewards.filter(reward => 
      reward.category === category && reward.isAvailable
    );
  }, [state.rewards]);

  // Get redemption history
  const getRedemptionHistory = useCallback((): Transaction[] => {
    return redemptionHistory.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }, [redemptionHistory]);

  // Check if voucher is available (always true since vouchers are free)
  const canAffordReward = useCallback((reward: Reward): boolean => {
    return reward.isAvailable; // No coin requirement - vouchers are free!
  }, []);

  // Refresh rewards data
  const refreshRewards = useCallback(async () => {
    await fetchRewards();
  }, [fetchRewards]);

  // Auto-fetch rewards on mount
  useEffect(() => {
    if (state.rewards.length === 0) {
      fetchRewards();
    }
  }, [fetchRewards, state.rewards.length]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    rewards: state.rewards,
    isLoading,
    error,
    redemptionHistory,
    fetchRewards,
    redeemReward,
    getRewardsByCategory,
    getRedemptionHistory,
    canAffordReward,
    refreshRewards,
  };
}