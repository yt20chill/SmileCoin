'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../stores/context';
import { Transaction, SmileCoin } from '../types';

export interface UseWalletReturn {
  wallet: SmileCoin;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  updateBalance: (newBalance: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  earnCoins: (amount: number, description: string, merchantId?: string) => void;
  spendCoins: (amount: number, description: string, merchantId?: string) => void;

  refreshWallet: () => Promise<void>;
  getTransactionHistory: (page?: number, limit?: number) => Transaction[];
  hasMoreTransactions: boolean;
}

export function useWallet(): UseWalletReturn {
  const { state, dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate if there are more transactions to load
  const hasMoreTransactions = state.transactions.length > 0;

  // Update balance with animation trigger
  const updateBalance = useCallback((newBalance: number) => {
    dispatch({ type: 'UPDATE_BALANCE', payload: newBalance });
  }, [dispatch]);

  // Add a new transaction
  const addTransaction = useCallback((
    transactionData: Omit<Transaction, 'id' | 'timestamp'>
  ) => {
    const transaction: Transaction = {
      ...transactionData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });

    // Update balance based on transaction type
    let balanceChange = 0;
    switch (transaction.type) {
      case 'earn':
        balanceChange = transaction.amount;
        break;
      case 'spend':
      case 'expire':
        balanceChange = -transaction.amount;
        break;
    }

    if (balanceChange !== 0) {
      const newBalance = Math.max(0, state.wallet.balance + balanceChange);
      updateBalance(newBalance);
    }
  }, [dispatch, state.wallet.balance, updateBalance]);

  // Earn coins helper
  const earnCoins = useCallback((
    amount: number, 
    description: string, 
    merchantId?: string
  ) => {
    addTransaction({
      type: 'earn',
      amount,
      description,
      merchantId,
      status: 'completed',
    });
  }, [addTransaction]);

  // Spend coins helper
  const spendCoins = useCallback((
    amount: number, 
    description: string, 
    merchantId?: string
  ) => {
    if (state.wallet.balance < amount) {
      setError('Insufficient balance');
      return;
    }

    addTransaction({
      type: 'spend',
      amount,
      description,
      merchantId,
      status: 'completed',
    });
  }, [addTransaction, state.wallet.balance]);

  // Rewards are now free, no redemption needed

  // Refresh wallet data
  const refreshWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would fetch from the blockchain API
      // For now, we'll just refresh the current state
      console.log('Wallet refreshed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh wallet');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get paginated transaction history
  const getTransactionHistory = useCallback((
    page: number = 1, 
    limit: number = 10
  ): Transaction[] => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return state.transactions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(startIndex, endIndex);
  }, [state.transactions]);

  // Auto-refresh wallet periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Check for expired coins
      if (state.wallet.expiryDate && new Date() > state.wallet.expiryDate) {
        addTransaction({
          type: 'expire',
          amount: state.wallet.balance,
          description: 'Coins expired',
          status: 'completed',
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [state.wallet.expiryDate, state.wallet.balance, addTransaction]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    wallet: state.wallet,
    transactions: state.transactions,
    isLoading,
    error,
    updateBalance,
    addTransaction,
    earnCoins,
    spendCoins,
    refreshWallet,
    getTransactionHistory,
    hasMoreTransactions,
  };
}