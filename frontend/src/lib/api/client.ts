// API client with error handling and retry logic

import type { 
  User, 
  Merchant, 
  Offer, 
  Reward, 
  Transaction, 
  Rating,
  NetworkError as INetworkError,
  BlockchainError as IBlockchainError 
} from '../types';

// API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : '/api';

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error implements INetworkError {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class BlockchainError extends Error implements IBlockchainError {
  constructor(
    message: string,
    public transactionId?: string,
    public blockchainCode?: string
  ) {
    super(message);
    this.name = 'BlockchainError';
  }
}

// Retry utility function
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx) except 408, 429
      if (error instanceof ApiError && error.status) {
        const shouldRetry = error.status === 408 || error.status === 429 || error.status >= 500;
        if (!shouldRetry || attempt === maxRetries) {
          throw error;
        }
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
}

// Base fetch wrapper with timeout and error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status >= 500) {
        throw new NetworkError(
          errorData.message || 'Server error occurred',
          response.status,
          errorData.code
        );
      } else if (response.status === 400 && errorData.code?.startsWith('BLOCKCHAIN_')) {
        throw new BlockchainError(
          errorData.message || 'Blockchain service error',
          errorData.transactionId,
          errorData.code
        );
      } else {
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData.code
        );
      }
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new NetworkError('Request timeout', 408, 'TIMEOUT');
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Network connection failed', 0, 'NETWORK_ERROR');
    }
    
    throw error;
  }
}

// API client class
export class ApiClient {
  // User operations
  static async registerUser(userData: Partial<User>): Promise<{ user: User; initialCoins: number }> {
    return withRetry(() => 
      apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
    );
  }
  
  static async getUser(userId: string): Promise<User> {
    return withRetry(() => 
      apiRequest(`/users/${userId}`)
    );
  }
  
  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    return withRetry(() => 
      apiRequest(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
    );
  }
  
  // Wallet operations
  static async getWalletBalance(userId: string): Promise<{ balance: number; lastUpdated: Date }> {
    return withRetry(() => 
      apiRequest(`/wallet/${userId}/balance`)
    );
  }
  
  static async getTransactions(userId: string, limit?: number, offset?: number): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    return withRetry(() => 
      apiRequest(`/wallet/${userId}/transactions?${params}`)
    );
  }
  
  // Merchant operations
  static async getMerchants(category?: string, location?: string): Promise<Merchant[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (location) params.append('location', location);
    
    return withRetry(() => 
      apiRequest(`/merchants?${params}`)
    );
  }
  
  static async getMerchant(merchantId: string): Promise<Merchant> {
    return withRetry(() => 
      apiRequest(`/merchants/${merchantId}`)
    );
  }
  
  static async rateMerchant(
    merchantId: string, 
    userId: string, 
    rating: number
  ): Promise<{ success: boolean; newBalance: number; transaction: Transaction }> {
    return withRetry(() => 
      apiRequest(`/merchants/${merchantId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ userId, rating }),
      })
    );
  }
  
  // Offer operations
  static async getOffers(merchantId?: string): Promise<Offer[]> {
    const params = new URLSearchParams();
    if (merchantId) params.append('merchantId', merchantId);
    
    return withRetry(() => 
      apiRequest(`/offers?${params}`)
    );
  }
  
  static async getOffer(offerId: string): Promise<Offer> {
    return withRetry(() => 
      apiRequest(`/offers/${offerId}`)
    );
  }
  
  // Reward operations
  static async getRewards(category?: string): Promise<Reward[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    
    return withRetry(() => 
      apiRequest(`/rewards?${params}`)
    );
  }
  
  static async getReward(rewardId: string): Promise<Reward> {
    return withRetry(() => 
      apiRequest(`/rewards/${rewardId}`)
    );
  }
  
  static async redeemReward(
    rewardId: string, 
    userId: string
  ): Promise<{ success: boolean; newBalance: number; voucher: string; transaction: Transaction }> {
    return withRetry(() => 
      apiRequest(`/rewards/${rewardId}/redeem`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })
    );
  }
  
  // File upload operations
  static async uploadBoardingPass(file: File): Promise<{ success: boolean; extractedData?: any }> {
    const formData = new FormData();
    formData.append('boardingPass', file);
    
    return withRetry(() => 
      apiRequest('/upload/boarding-pass', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      })
    );
  }

  // Boarding pass scanning operations
  static async scanBoardingPass(
    file: File, 
    userId: string
  ): Promise<{ success: boolean; coinsEarned?: number; boardingPass?: any; transaction?: any; message: string }> {
    const formData = new FormData();
    formData.append('boardingPass', file);
    formData.append('userId', userId);
    
    return withRetry(() => 
      apiRequest('/boarding-pass/scan', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      })
    );
  }

  static async getBoardingPassHistory(userId: string): Promise<{ success: boolean; boardingPasses?: any[]; totalCoinsEarned?: number; message: string }> {
    return withRetry(() => 
      apiRequest(`/boarding-pass/history/${userId}`)
    );
  }

  static async validateBoardingPassName(
    extractedName: string, 
    registeredName: string
  ): Promise<{ isValid: boolean; confidence: number }> {
    return withRetry(() => 
      apiRequest('/boarding-pass/validate-name', {
        method: 'POST',
        body: JSON.stringify({ extractedName, registeredName }),
      })
    );
  }
  
  // Health check
  static async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    return apiRequest('/health');
  }
}

// Offline-aware API client wrapper
export class OfflineApiClient {
  private static isOnline(): boolean {
    return navigator.onLine;
  }
  
  private static async withOfflineHandling<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (!this.isOnline() && fallback) {
      console.warn('Offline mode: using fallback data');
      return fallback();
    }
    
    try {
      return await operation();
    } catch (error) {
      if (error instanceof NetworkError && fallback) {
        console.warn('Network error: falling back to cached data', error);
        return fallback();
      }
      throw error;
    }
  }
  
  // Offline-aware methods that fall back to IndexedDB
  static async getMerchants(category?: string): Promise<Merchant[]> {
    const { DatabaseService } = await import('../db');
    
    return this.withOfflineHandling(
      () => ApiClient.getMerchants(category),
      () => DatabaseService.getMerchants()
    );
  }
  
  static async getOffers(merchantId?: string): Promise<Offer[]> {
    const { DatabaseService } = await import('../db');
    
    return this.withOfflineHandling(
      () => ApiClient.getOffers(merchantId),
      async () => {
        if (merchantId) {
          return DatabaseService.getOffersByMerchant(merchantId);
        }
        return DatabaseService.getActiveOffers();
      }
    );
  }
  
  static async getRewards(category?: string): Promise<Reward[]> {
    const { DatabaseService } = await import('../db');
    
    return this.withOfflineHandling(
      () => ApiClient.getRewards(category),
      () => DatabaseService.getAvailableRewards()
    );
  }
  
  static async getTransactions(userId: string, limit?: number): Promise<Transaction[]> {
    const { DatabaseService } = await import('../db');
    
    return this.withOfflineHandling(
      () => ApiClient.getTransactions(userId, limit),
      () => DatabaseService.getRecentTransactions(limit)
    );
  }
  
  // Queue operations for when back online
  private static queuedOperations: Array<() => Promise<any>> = [];
  
  static queueOperation(operation: () => Promise<any>): void {
    this.queuedOperations.push(operation);
  }
  
  static async syncQueuedOperations(): Promise<void> {
    if (!this.isOnline() || this.queuedOperations.length === 0) {
      return;
    }
    
    const operations = [...this.queuedOperations];
    this.queuedOperations.length = 0;
    
    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('Failed to sync queued operation:', error);
        // Re-queue failed operations
        this.queuedOperations.push(operation);
      }
    }
  }
  
  // Rate merchant with offline queueing
  static async rateMerchant(merchantId: string, userId: string, rating: number): Promise<any> {
    if (!this.isOnline()) {
      // Queue for later sync
      this.queueOperation(() => ApiClient.rateMerchant(merchantId, userId, rating));
      
      // Return mock success for immediate UI feedback
      return {
        success: true,
        newBalance: 0, // Will be updated when synced
        transaction: {
          id: `queued-${Date.now()}`,
          type: 'spend' as const,
          amount: rating,
          description: 'Merchant rating (queued)',
          merchantId,
          timestamp: new Date(),
          status: 'pending' as const,
        },
      };
    }
    
    return ApiClient.rateMerchant(merchantId, userId, rating);
  }
  
  // Redeem reward with offline queueing
  static async redeemReward(rewardId: string, userId: string): Promise<any> {
    if (!this.isOnline()) {
      // Queue for later sync
      this.queueOperation(() => ApiClient.redeemReward(rewardId, userId));
      
      // Return mock success for immediate UI feedback
      return {
        success: true,
        newBalance: 0, // Will be updated when synced
        voucher: `queued-${Date.now()}`,
        transaction: {
          id: `queued-${Date.now()}`,
          type: 'redeem' as const,
          amount: 0, // Will be updated when synced
          description: 'Reward redemption (queued)',
          rewardId,
          timestamp: new Date(),
          status: 'pending' as const,
        },
      };
    }
    
    return ApiClient.redeemReward(rewardId, userId);
  }
}

// Network status monitoring
export class NetworkMonitor {
  private static listeners: Array<(isOnline: boolean) => void> = [];
  
  static init(): void {
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      this.notifyListeners(true);
      OfflineApiClient.syncQueuedOperations();
    });
    
    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      this.notifyListeners(false);
    });
  }
  
  static addListener(callback: (isOnline: boolean) => void): void {
    this.listeners.push(callback);
  }
  
  static removeListener(callback: (isOnline: boolean) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  private static notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(callback => callback(isOnline));
  }
  
  static isOnline(): boolean {
    return navigator.onLine;
  }
}

// Export default client
export default ApiClient;