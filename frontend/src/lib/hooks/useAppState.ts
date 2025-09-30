'use client';

import { useCallback } from 'react';
import { useAppContext, useWallet, useMerchants, useUI } from '../stores/context';
import { User, Transaction, Merchant, Offer, Reward, BoardingPass } from '../types';

// Main app state hook
export function useAppState() {
  const { state, dispatch } = useAppContext();

  const setUser = useCallback((user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, [dispatch]);

  const updateBalance = useCallback((balance: number) => {
    dispatch({ type: 'UPDATE_BALANCE', payload: balance });
  }, [dispatch]);

  const addTransaction = useCallback((transaction: Transaction) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
  }, [dispatch]);

  const setMerchants = useCallback((merchants: Merchant[]) => {
    dispatch({ type: 'SET_MERCHANTS', payload: merchants });
  }, [dispatch]);

  const setOffers = useCallback((offers: Offer[]) => {
    dispatch({ type: 'SET_OFFERS', payload: offers });
  }, [dispatch]);

  const setRewards = useCallback((rewards: Reward[]) => {
    dispatch({ type: 'SET_REWARDS', payload: rewards });
  }, [dispatch]);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, [dispatch]);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, [dispatch]);

  const setLanguage = useCallback((language: 'en' | 'zh-TW') => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  }, [dispatch]);

  const addBoardingPass = useCallback((boardingPass: BoardingPass) => {
    dispatch({ type: 'ADD_BOARDING_PASS', payload: boardingPass });
  }, [dispatch]);

  const setBoardingPasses = useCallback((boardingPasses: BoardingPass[]) => {
    dispatch({ type: 'SET_BOARDING_PASSES', payload: boardingPasses });
  }, [dispatch]);

  const setBoardingPassScanner = useCallback((scannerState: { isActive: boolean; isProcessing?: boolean }) => {
    dispatch({ type: 'SET_BOARDING_PASS_SCANNER', payload: scannerState });
  }, [dispatch]);

  return {
    state,
    actions: {
      setUser,
      updateBalance,
      addTransaction,
      setMerchants,
      setOffers,
      setRewards,
      setLoading,
      setError,
      setLanguage,
      addBoardingPass,
      setBoardingPasses,
      setBoardingPassScanner,
    },
  };
}

// Wallet-specific hook
export function useWalletState() {
  const { wallet, updateBalance, addTransaction } = useWallet();
  const { setError, setLoading } = useUI();

  const earnCoins = useCallback(async (amount: number, description: string, merchantId?: string) => {
    try {
      setLoading(true);

      const transaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'earn',
        amount,
        description,
        merchantId,
        timestamp: new Date(),
        status: 'completed',
      };

      addTransaction(transaction);
      updateBalance(wallet.balance + amount);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to earn coins');
    } finally {
      setLoading(false);
    }
  }, [wallet.balance, updateBalance, addTransaction, setError, setLoading]);

  const spendCoins = useCallback(async (amount: number, description: string, merchantId?: string) => {
    try {
      if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      setLoading(true);

      const transaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'spend',
        amount,
        description,
        merchantId,
        timestamp: new Date(),
        status: 'completed',
      };

      addTransaction(transaction);
      updateBalance(wallet.balance - amount);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to spend coins');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [wallet.balance, updateBalance, addTransaction, setError, setLoading]);

  // Rewards are now free, so no coin redemption needed

  return {
    wallet,
    actions: {
      earnCoins,
      spendCoins,
      updateBalance,
    },
  };
}

// Merchants-specific hook
export function useMerchantsState() {
  const { merchants, offers, setMerchants, setOffers, getMerchantById, getOffersByMerchant } = useMerchants();
  const { setError, setLoading } = useUI();

  const loadMerchants = useCallback(async () => {
    try {
      setLoading(true);
      // This would typically fetch from API
      // For now, we'll use mock data
      const response = await fetch('/api/merchants');
      if (!response.ok) throw new Error('Failed to load merchants');

      const merchantsData = await response.json();
      setMerchants(merchantsData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load merchants');
    } finally {
      setLoading(false);
    }
  }, [setMerchants, setError, setLoading]);

  const loadOffers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/offers');
      if (!response.ok) throw new Error('Failed to load offers');

      const offersData = await response.json();
      setOffers(offersData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [setOffers, setError, setLoading]);

  const rateMerchant = useCallback(async (merchantId: string, rating: number) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/merchants/${merchantId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) throw new Error('Failed to submit rating');

      // Reload merchants to get updated rating
      await loadMerchants();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit rating');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadMerchants, setError, setLoading]);

  return {
    merchants,
    offers,
    actions: {
      loadMerchants,
      loadOffers,
      rateMerchant,
      getMerchantById,
      getOffersByMerchant,
    },
  };
}

// UI-specific hook
export function useUIState() {
  const { ui, setLoading, setError, setLanguage, clearError } = useUI();

  const showError = useCallback((message: string, duration = 5000) => {
    setError(message);
    if (duration > 0) {
      setTimeout(() => clearError(), duration);
    }
  }, [setError, clearError]);

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    errorMessage = 'An error occurred'
  ): Promise<T | null> => {
    try {
      setLoading(true);
      clearError();
      return await asyncFn();
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage;
      showError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError, showError]);

  return {
    ui,
    actions: {
      setLoading,
      setError,
      setLanguage,
      clearError,
      showError,
      withLoading,
    },
  };
}