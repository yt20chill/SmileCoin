'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUIState } from './useAppState';
import { addToOfflineQueue, getOfflineQueue, removeFromOfflineQueue } from '../stores/persistence';

// Generic data fetching hook with offline support
export function useDataFetching<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    immediate?: boolean;
    cacheKey?: string;
    retryOnError?: boolean;
    maxRetries?: number;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { actions: { withLoading } } = useUIState();

  const {
    immediate = true,
    cacheKey,
    retryOnError = true,
    maxRetries = 3,
  } = options;

  const fetchData = useCallback(async (retryCount = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await fetchFn();
      setData(result);

      // Cache the result if cacheKey is provided
      if (cacheKey && typeof window !== 'undefined') {
        localStorage.setItem(`cache-${cacheKey}`, JSON.stringify({
          data: result,
          timestamp: Date.now(),
        }));
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);

      // Try to load from cache if available
      if (cacheKey && typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`cache-${cacheKey}`);
          if (cached) {
            const { data: cachedData, timestamp } = JSON.parse(cached);
            // Use cached data if it's less than 1 hour old
            if (Date.now() - timestamp < 60 * 60 * 1000) {
              setData(cachedData);
              setError(`Using cached data: ${errorMessage}`);
              return cachedData;
            }
          }
        } catch (cacheError) {
          console.warn('Failed to load cached data:', cacheError);
        }
      }

      // Retry logic
      if (retryOnError && retryCount < maxRetries) {
        setTimeout(() => {
          fetchData(retryCount + 1);
        }, Math.pow(2, retryCount) * 1000); // Exponential backoff
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, cacheKey, retryOnError, maxRetries]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, dependencies);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

// Hook for API calls with offline queue support
export function useApiCall() {
  const { actions: { withLoading, showError } } = useUIState();

  const apiCall = useCallback(async <T>(
    url: string,
    options: RequestInit = {},
    offlineAction?: {
      type: string;
      payload: any;
    }
  ): Promise<T | null> => {
    return withLoading(async () => {
      // Check if online
      if (typeof navigator !== 'undefined' && !navigator.onLine && offlineAction) {
        // Add to offline queue
        addToOfflineQueue(offlineAction);
        showError('Action queued for when you\'re back online');
        return null;
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }, [withLoading, showError]);

  return { apiCall };
}

// Hook for managing offline queue
export function useOfflineQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const { apiCall } = useApiCall();

  const loadQueue = useCallback(() => {
    const offlineQueue = getOfflineQueue();
    setQueue(offlineQueue);
  }, []);

  const processQueue = useCallback(async () => {
    const offlineQueue = getOfflineQueue();
    
    for (const action of offlineQueue) {
      try {
        // Process the queued action
        switch (action.type) {
          case 'RATE_MERCHANT':
            await apiCall(`/api/merchants/${action.payload.merchantId}/rate`, {
              method: 'POST',
              body: JSON.stringify({ rating: action.payload.rating }),
            });
            break;
          
          case 'REDEEM_REWARD':
            await apiCall(`/api/rewards/${action.payload.rewardId}/redeem`, {
              method: 'POST',
              body: JSON.stringify({ userId: action.payload.userId }),
            });
            break;
          
          default:
            console.warn('Unknown queued action type:', action.type);
        }

        // Remove from queue on success
        removeFromOfflineQueue(action.id);
      } catch (error) {
        console.error('Failed to process queued action:', error);
        // Could implement retry logic here
      }
    }

    // Reload queue after processing
    loadQueue();
  }, [apiCall, loadQueue]);

  useEffect(() => {
    loadQueue();

    // Listen for online events to process queue
    const handleOnline = () => {
      processQueue();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      return () => window.removeEventListener('online', handleOnline);
    }
  }, [loadQueue, processQueue]);

  return {
    queue,
    processQueue,
    loadQueue,
  };
}

// Hook for wallet data fetching
export function useWalletData(userId?: string) {
  const fetchWalletData = useCallback(async () => {
    if (!userId) throw new Error('User ID required');
    
    const response = await fetch(`/api/wallet/${userId}/balance`);
    if (!response.ok) throw new Error('Failed to fetch wallet data');
    
    return response.json();
  }, [userId]);

  return useDataFetching(
    fetchWalletData,
    [userId],
    {
      immediate: !!userId,
      cacheKey: userId ? `wallet-${userId}` : undefined,
      retryOnError: true,
    }
  );
}

// Hook for merchants data fetching
export function useMerchantsData() {
  const fetchMerchants = useCallback(async () => {
    const response = await fetch('/api/merchants');
    if (!response.ok) throw new Error('Failed to fetch merchants');
    
    return response.json();
  }, []);

  return useDataFetching(
    fetchMerchants,
    [],
    {
      cacheKey: 'merchants',
      retryOnError: true,
    }
  );
}

// Hook for offers data fetching
export function useOffersData() {
  const fetchOffers = useCallback(async () => {
    const response = await fetch('/api/offers');
    if (!response.ok) throw new Error('Failed to fetch offers');
    
    return response.json();
  }, []);

  return useDataFetching(
    fetchOffers,
    [],
    {
      cacheKey: 'offers',
      retryOnError: true,
    }
  );
}

// Hook for rewards data fetching
export function useRewardsData() {
  const fetchRewards = useCallback(async () => {
    const response = await fetch('/api/rewards');
    if (!response.ok) throw new Error('Failed to fetch rewards');
    
    return response.json();
  }, []);

  return useDataFetching(
    fetchRewards,
    [],
    {
      cacheKey: 'rewards',
      retryOnError: true,
    }
  );
}

// Hook for transaction history
export function useTransactionsData(userId?: string) {
  const fetchTransactions = useCallback(async () => {
    if (!userId) throw new Error('User ID required');
    
    const response = await fetch(`/api/wallet/${userId}/transactions`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    
    return response.json();
  }, [userId]);

  return useDataFetching(
    fetchTransactions,
    [userId],
    {
      immediate: !!userId,
      cacheKey: userId ? `transactions-${userId}` : undefined,
      retryOnError: true,
    }
  );
}