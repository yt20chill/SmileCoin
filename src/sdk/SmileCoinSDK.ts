/**
 * SmileCoin JavaScript SDK
 * Provides easy-to-use methods for interacting with the Tourist Rewards Blockchain Infrastructure
 */

// TypeScript interfaces for all data types
export interface SDKConfig {
  apiUrl: string;
  apiKey: string;
  timeout?: number;
}

export interface TouristRegistration {
  touristId: string;
  originCountry: string;
  arrivalDate: string;
  departureDate: string;
}

export interface TouristWallet {
  walletAddress: string;
  transactionHash: string;
  success: boolean;
}

export interface CoinIssuance {
  transactionHash: string;
  amount: number;
  expirationDate: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: string;
  type: 'daily_issuance' | 'restaurant_transfer' | 'expiration';
  status: 'pending' | 'confirmed' | 'failed';
}

export interface TouristBalance {
  balance: number;
  walletAddress: string;
  transactions: Transaction[];
}

export interface RestaurantRegistration {
  googlePlaceId: string;
  name: string;
  address: string;
}

export interface RestaurantWallet {
  walletAddress: string;
  qrCode: string;
  transactionHash: string;
  success: boolean;
}

export interface CoinTransfer {
  touristId: string;
  restaurantId: string;
  amount: number;
}

export interface TransferResult {
  transactionHash: string;
  success: boolean;
  remainingDailyLimit: number;
}

export interface DailyEarnings {
  date: string;
  totalCoins: number;
  touristCount: number;
}

export interface OriginEarnings {
  country: string;
  totalCoins: number;
  percentage: number;
}

export interface RestaurantEarnings {
  totalCoins: number;
  dailyBreakdown: DailyEarnings[];
  originBreakdown: OriginEarnings[];
}

export interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: number;
  explorerUrl: string;
}

export interface NetworkStatus {
  network: string;
  blockNumber: number;
  gasPrice: string;
  isHealthy: boolean;
}

export interface APIResponse<T = any> {
  data: T;
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export enum SDKErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  DAILY_LIMIT_EXCEEDED = 'DAILY_LIMIT_EXCEEDED',
  TOURIST_NOT_REGISTERED = 'TOURIST_NOT_REGISTERED',
  RESTAURANT_NOT_REGISTERED = 'RESTAURANT_NOT_REGISTERED'
}

export class SDKError extends Error {
  constructor(
    public code: SDKErrorCode,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SDKError';
  }
}

/**
 * SmileCoin SDK - Main class for interacting with the Tourist Rewards Blockchain Infrastructure
 * 
 * This SDK provides a simple, promise-based interface for:
 * - Tourist registration and wallet management
 * - Daily smile coin issuance (10 coins per day)
 * - Restaurant registration and coin transfers
 * - Transaction monitoring and blockchain operations
 * - Error handling with specific business rule validation
 * 
 * @example
 * ```typescript
 * const sdk = new SmileCoinSDK({
 *   apiUrl: 'https://api.smilecoin.example.com',
 *   apiKey: 'your-api-key'
 * });
 * 
 * // Register a tourist
 * const tourist = await sdk.registerTourist({
 *   touristId: 'tourist-123',
 *   originCountry: 'USA',
 *   arrivalDate: '2024-01-15',
 *   departureDate: '2024-01-22'
 * });
 * 
 * // Issue daily coins
 * const coins = await sdk.issueDailyCoins('tourist-123');
 * ```
 * 
 * @version 1.0.0
 * @author SmileCoin Team
 */
export class SmileCoinSDK {
  private apiUrl: string;
  private apiKey: string;
  private timeout: number;

  /**
   * Create a new SmileCoin SDK instance
   * 
   * @param config - Configuration object with API URL and key
   * @param config.apiUrl - Base URL of the SmileCoin API (e.g., 'https://api.smilecoin.example.com')
   * @param config.apiKey - Your API authentication key
   * @param config.timeout - Optional request timeout in milliseconds (default: 30000)
   * 
   * @throws {SDKError} When required configuration is missing
   * 
   * @example
   * ```typescript
   * const sdk = new SmileCoinSDK({
   *   apiUrl: 'https://api.smilecoin.example.com',
   *   apiKey: process.env.SMILECOIN_API_KEY,
   *   timeout: 60000 // 60 seconds
   * });
   * ```
   */
  constructor(config: SDKConfig) {
    if (!config.apiUrl) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'API URL is required');
    }
    if (!config.apiKey) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'API key is required');
    }

    this.apiUrl = config.apiUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  /**
   * Make an authenticated HTTP request to the API
   * 
   * This is an internal method that handles:
   * - Authentication with API key
   * - Request/response serialization
   * - Error handling and transformation
   * - Timeout management
   * - Network error recovery
   * 
   * @param method - HTTP method ('GET', 'POST', 'PUT', 'DELETE')
   * @param endpoint - API endpoint path (without /api prefix, e.g., '/tourists/register')
   * @param data - Optional request body data for POST/PUT requests
   * @returns Promise that resolves to the API response data
   * 
   * @throws {SDKError} For various error conditions:
   *   - AUTHENTICATION_ERROR: Invalid API key (401)
   *   - VALIDATION_ERROR: Bad request data (400-499)
   *   - API_ERROR: Server errors (500+)
   *   - NETWORK_ERROR: Network connectivity issues
   *   - TIMEOUT_ERROR: Request timeout
   * 
   * @private
   */
  private async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.apiUrl}/api${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'SmileCoin-SDK/1.0.0'
        },
        signal: controller.signal
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, use status text
          errorData = { message: response.statusText };
        }

        if (response.status === 401) {
          throw new SDKError(
            SDKErrorCode.AUTHENTICATION_ERROR,
            'Invalid API key or authentication failed',
            errorData
          );
        }

        if (response.status >= 400 && response.status < 500) {
          throw new SDKError(
            SDKErrorCode.VALIDATION_ERROR,
            errorData.error?.message || errorData.message || 'Validation error',
            errorData
          );
        }

        throw new SDKError(
          SDKErrorCode.API_ERROR,
          errorData.error?.message || errorData.message || 'API request failed',
          errorData
        );
      }

      const result = await response.json();
      return result as T;

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new SDKError(
          SDKErrorCode.TIMEOUT_ERROR,
          `Request timeout after ${this.timeout}ms`
        );
      }

      if (error instanceof SDKError) {
        throw error;
      }

      // Network or other errors
      throw new SDKError(
        SDKErrorCode.NETWORK_ERROR,
        'Network error or server unavailable',
        error
      );
    }
  }
 
 // ==========================================
  // TOURIST OPERATIONS
  // ==========================================

  /**
   * Register a new tourist in the system and create their blockchain wallet
   * 
   * This method:
   * - Creates a deterministic blockchain wallet for the tourist
   * - Registers the tourist on the smart contract with their travel dates
   * - Returns wallet address and transaction hash for tracking
   * 
   * @param data - Tourist registration data
   * @param data.touristId - Unique identifier for the tourist
   * @param data.originCountry - Tourist's country of origin (ISO country code or name)
   * @param data.arrivalDate - Arrival date in ISO 8601 format (e.g., '2024-01-15T00:00:00Z')
   * @param data.departureDate - Departure date in ISO 8601 format (must be after arrival)
   * 
   * @returns Promise that resolves to wallet information
   * @returns {string} walletAddress - The tourist's blockchain wallet address
   * @returns {string} transactionHash - Hash of the registration transaction
   * @returns {boolean} success - Whether registration was successful
   * 
   * @throws {SDKError} Various validation and API errors:
   *   - VALIDATION_ERROR: Missing or invalid input data
   *   - API_ERROR: Server-side registration failure
   *   - NETWORK_ERROR: Network connectivity issues
   * 
   * @example
   * ```typescript
   * const tourist = await sdk.registerTourist({
   *   touristId: 'tourist-123',
   *   originCountry: 'USA',
   *   arrivalDate: '2024-01-15T00:00:00Z',
   *   departureDate: '2024-01-22T23:59:59Z'
   * });
   * 
   * console.log('Wallet:', tourist.walletAddress);
   * console.log('Transaction:', tourist.transactionHash);
   * ```
   */
  async registerTourist(data: TouristRegistration): Promise<TouristWallet> {
    // Validate input data
    if (!data.touristId || data.touristId.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Tourist ID is required');
    }
    if (!data.originCountry || data.originCountry.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Origin country is required');
    }
    if (!data.arrivalDate) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Arrival date is required');
    }
    if (!data.departureDate) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Departure date is required');
    }

    // Validate date format and logic
    const arrivalDate = new Date(data.arrivalDate);
    const departureDate = new Date(data.departureDate);
    
    if (isNaN(arrivalDate.getTime())) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Invalid arrival date format');
    }
    if (isNaN(departureDate.getTime())) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Invalid departure date format');
    }
    if (departureDate <= arrivalDate) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Departure date must be after arrival date');
    }

    try {
      const response = await this.request<TouristWallet>('POST', '/tourists/register', data);
      return response;
    } catch (error) {
      if (error instanceof SDKError) {
        throw error;
      }
      throw new SDKError(SDKErrorCode.API_ERROR, 'Failed to register tourist', error);
    }
  }

  /**
   * Issue daily smile coins to a registered tourist
   * 
   * This method:
   * - Mints exactly 10 smile coins to the tourist's wallet
   * - Sets 14-day expiration on the coins
   * - Prevents double issuance on the same day
   * - Records the issuance for physical souvenir eligibility tracking
   * 
   * Business Rules:
   * - Only 1 issuance per tourist per day
   * - Tourist must be registered and within travel dates
   * - Coins expire after 14 days
   * 
   * @param touristId - The tourist's unique identifier (must be registered)
   * 
   * @returns Promise that resolves to coin issuance information
   * @returns {string} transactionHash - Hash of the coin issuance transaction
   * @returns {number} amount - Number of coins issued (always 10)
   * @returns {string} expirationDate - ISO date when coins expire (14 days from issuance)
   * 
   * @throws {SDKError} Various business rule and API errors:
   *   - VALIDATION_ERROR: Missing or invalid tourist ID
   *   - TOURIST_NOT_REGISTERED: Tourist not found or not registered
   *   - API_ERROR: Blockchain transaction failure or daily limit already reached
   * 
   * @example
   * ```typescript
   * try {
   *   const issuance = await sdk.issueDailyCoins('tourist-123');
   *   console.log(`Issued ${issuance.amount} coins`);
   *   console.log(`Expires: ${issuance.expirationDate}`);
   *   
   *   // Wait for blockchain confirmation
   *   await sdk.waitForTransaction(issuance.transactionHash);
   * } catch (error) {
   *   if (error.code === 'TOURIST_NOT_REGISTERED') {
   *     console.log('Register tourist first');
   *   }
   * }
   * ```
   */
  async issueDailyCoins(touristId: string): Promise<CoinIssuance> {
    if (!touristId || touristId.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Tourist ID is required');
    }

    try {
      const response = await this.request<CoinIssuance>('POST', `/tourists/${encodeURIComponent(touristId)}/daily-coins`);
      return response;
    } catch (error) {
      if (error instanceof SDKError) {
        // Handle specific blockchain errors
        if (error.details?.error?.code === 'TOURIST_NOT_REGISTERED') {
          throw new SDKError(
            SDKErrorCode.TOURIST_NOT_REGISTERED,
            'Tourist must be registered before issuing coins',
            error.details
          );
        }
        throw error;
      }
      throw new SDKError(SDKErrorCode.API_ERROR, 'Failed to issue daily coins', error);
    }
  }

  /**
   * Get tourist's current balance and transaction history
   * @param touristId - The tourist's unique identifier
   * @returns Promise with balance and transaction data
   */
  async getTouristBalance(touristId: string): Promise<TouristBalance> {
    if (!touristId || touristId.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Tourist ID is required');
    }

    try {
      const response = await this.request<TouristBalance>('GET', `/tourists/${encodeURIComponent(touristId)}/balance`);
      return response;
    } catch (error) {
      if (error instanceof SDKError) {
        if (error.details?.error?.code === 'TOURIST_NOT_REGISTERED') {
          throw new SDKError(
            SDKErrorCode.TOURIST_NOT_REGISTERED,
            'Tourist not found or not registered',
            error.details
          );
        }
        throw error;
      }
      throw new SDKError(SDKErrorCode.API_ERROR, 'Failed to get tourist balance', error);
    }
  }

  /**
   * Get tourist's transaction history
   * @param touristId - The tourist's unique identifier
   * @param limit - Maximum number of transactions to return (default: 50)
   * @param offset - Number of transactions to skip (default: 0)
   * @returns Promise with transaction history
   */
  async getTouristTransactions(
    touristId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<Transaction[]> {
    if (!touristId || touristId.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Tourist ID is required');
    }
    if (limit < 1 || limit > 100) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Limit must be between 1 and 100');
    }
    if (offset < 0) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Offset must be non-negative');
    }

    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });
      
      const response = await this.request<Transaction[]>(
        'GET', 
        `/tourists/${encodeURIComponent(touristId)}/transactions?${queryParams}`
      );
      return response;
    } catch (error) {
      if (error instanceof SDKError) {
        throw error;
      }
      throw new SDKError(SDKErrorCode.API_ERROR, 'Failed to get tourist transactions', error);
    }
  }  
// ==========================================
  // RESTAURANT OPERATIONS
  // ==========================================

  /**
   * Register a new restaurant in the system
   * @param data - Restaurant registration data
   * @returns Promise with wallet and QR code information
   */
  async registerRestaurant(data: RestaurantRegistration): Promise<RestaurantWallet> {
    // Validate input data
    if (!data.googlePlaceId || data.googlePlaceId.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Google Place ID is required');
    }
    if (!data.name || data.name.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Restaurant name is required');
    }
    if (!data.address || data.address.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Restaurant address is required');
    }

    try {
      const response = await this.request<RestaurantWallet>('POST', '/restaurants/register', data);
      return response;
    } catch (error) {
      if (error instanceof SDKError) {
        throw error;
      }
      throw new SDKError(SDKErrorCode.API_ERROR, 'Failed to register restaurant', error);
    }
  }

  /**
   * Transfer coins from tourist to restaurant
   * @param data - Transfer data including tourist ID, restaurant ID, and amount
   * @returns Promise with transfer result
   */
  async transferCoins(data: CoinTransfer): Promise<TransferResult> {
    // Validate input data
    if (!data.touristId || data.touristId.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Tourist ID is required');
    }
    if (!data.restaurantId || data.restaurantId.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Restaurant ID is required');
    }
    if (!data.amount || data.amount <= 0) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Amount must be greater than 0');
    }
    if (data.amount > 3) {
      throw new SDKError(
        SDKErrorCode.VALIDATION_ERROR, 
        'Cannot transfer more than 3 coins per restaurant per day'
      );
    }

    try {
      const response = await this.request<TransferResult>(
        'POST', 
        `/restaurants/${encodeURIComponent(data.restaurantId)}/receive-coins`,
        {
          touristId: data.touristId,
          amount: data.amount
        }
      );
      return response;
    } catch (error) {
      if (error instanceof SDKError) {
        // Handle specific business rule errors
        if (error.details?.error?.code === 'DAILY_LIMIT_EXCEEDED') {
          throw new SDKError(
            SDKErrorCode.DAILY_LIMIT_EXCEEDED,
            'Daily transfer limit exceeded for this restaurant',
            error.details
          );
        }
        if (error.details?.error?.code === 'INSUFFICIENT_BALANCE') {
          throw new SDKError(
            SDKErrorCode.INSUFFICIENT_BALANCE,
            'Tourist has insufficient balance for this transfer',
            error.details
          );
        }
        if (error.details?.error?.code === 'TOURIST_NOT_REGISTERED') {
          throw new SDKError(
            SDKErrorCode.TOURIST_NOT_REGISTERED,
            'Tourist must be registered before transferring coins',
            error.details
          );
        }
        if (error.details?.error?.code === 'RESTAURANT_NOT_REGISTERED') {
          throw new SDKError(
            SDKErrorCode.RESTAURANT_NOT_REGISTERED,
            'Restaurant must be registered before receiving coins',
            error.details
          );
        }
        throw error;
      }
      throw new SDKError(SDKErrorCode.API_ERROR, 'Failed to transfer coins', error);
    }
  }

  /**
   * Get restaurant's earnings breakdown
   * @param restaurantId - The restaurant's unique identifier (Google Place ID)
   * @returns Promise with earnings data
   */
  async getRestaurantEarnings(restaurantId: string): Promise<RestaurantEarnings> {
    if (!restaurantId || restaurantId.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Restaurant ID is required');
    }

    try {
      const response = await this.request<RestaurantEarnings>(
        'GET', 
        `/restaurants/${encodeURIComponent(restaurantId)}/earnings`
      );
      return response;
    } catch (error) {
      if (error instanceof SDKError) {
        if (error.details?.error?.code === 'RESTAURANT_NOT_REGISTERED') {
          throw new SDKError(
            SDKErrorCode.RESTAURANT_NOT_REGISTERED,
            'Restaurant not found or not registered',
            error.details
          );
        }
        throw error;
      }
      throw new SDKError(SDKErrorCode.API_ERROR, 'Failed to get restaurant earnings', error);
    }
  }

  /**
   * Get restaurant's transaction history
   * @param restaurantId - The restaurant's unique identifier
   * @param limit - Maximum number of transactions to return (default: 50)
   * @param offset - Number of transactions to skip (default: 0)
   * @returns Promise with transaction history
   */
  async getRestaurantTransactions(
    restaurantId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<Transaction[]> {
    if (!restaurantId || restaurantId.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Restaurant ID is required');
    }
    if (limit < 1 || limit > 100) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Limit must be between 1 and 100');
    }
    if (offset < 0) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Offset must be non-negative');
    }

    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });
      
      const response = await this.request<Transaction[]>(
        'GET', 
        `/restaurants/${encodeURIComponent(restaurantId)}/transactions?${queryParams}`
      );
      return response;
    } catch (error) {
      if (error instanceof SDKError) {
        throw error;
      }
      throw new SDKError(SDKErrorCode.API_ERROR, 'Failed to get restaurant transactions', error);
    }
  }

  // ==========================================
  // BLOCKCHAIN OPERATIONS
  // ==========================================

  /**
   * Get the status of a blockchain transaction
   * @param hash - Transaction hash
   * @returns Promise with transaction status
   */
  async getTransactionStatus(hash: string): Promise<TransactionStatus> {
    if (!hash || hash.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Transaction hash is required');
    }
    if (!hash.match(/^0x[a-fA-F0-9]{64}$/)) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Invalid transaction hash format');
    }

    try {
      const response = await this.request<TransactionStatus>(
        'GET', 
        `/blockchain/transaction/${encodeURIComponent(hash)}`
      );
      return response;
    } catch (error) {
      if (error instanceof SDKError) {
        throw error;
      }
      throw new SDKError(SDKErrorCode.API_ERROR, 'Failed to get transaction status', error);
    }
  }

  /**
   * Get current blockchain network status
   * @returns Promise with network status information
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      const response = await this.request<NetworkStatus>('GET', '/blockchain/network/status');
      return response;
    } catch (error) {
      if (error instanceof SDKError) {
        throw error;
      }
      throw new SDKError(SDKErrorCode.API_ERROR, 'Failed to get network status', error);
    }
  }

  /**
   * Wait for a transaction to be confirmed
   * @param hash - Transaction hash
   * @param maxWaitTime - Maximum time to wait in milliseconds (default: 300000 = 5 minutes)
   * @param pollInterval - How often to check status in milliseconds (default: 5000 = 5 seconds)
   * @returns Promise with final transaction status
   */
  async waitForTransaction(
    hash: string, 
    maxWaitTime: number = 300000, 
    pollInterval: number = 5000
  ): Promise<TransactionStatus> {
    if (!hash || hash.trim() === '') {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Transaction hash is required');
    }
    if (maxWaitTime < 1000) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Max wait time must be at least 1000ms');
    }
    if (pollInterval < 1000) {
      throw new SDKError(SDKErrorCode.VALIDATION_ERROR, 'Poll interval must be at least 1000ms');
    }

    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.getTransactionStatus(hash);
        
        if (status.status === 'confirmed' || status.status === 'failed') {
          return status;
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
      } catch (error) {
        // If it's a network error, continue polling
        if (error instanceof SDKError && error.code === SDKErrorCode.NETWORK_ERROR) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }
        throw error;
      }
    }
    
    throw new SDKError(
      SDKErrorCode.TIMEOUT_ERROR, 
      `Transaction confirmation timeout after ${maxWaitTime}ms`
    );
  }
}