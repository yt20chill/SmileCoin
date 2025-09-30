// Tourist-related types
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

export interface TouristBalance {
  balance: number;
  walletAddress: string;
  transactions: Transaction[];
}

// Restaurant-related types
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
  amount: number;
  remainingDailyLimit: number;
}

export interface RestaurantEarnings {
  totalCoins: number;
  dailyBreakdown: DailyEarnings[];
  originBreakdown: OriginEarnings[];
  walletAddress: string;
}

export interface DailyEarnings {
  date: string;
  coins: number;
  transactions: number;
}

export interface OriginEarnings {
  country: string;
  coins: number;
  transactions: number;
}

// Transaction-related types
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'daily_issuance' | 'restaurant_transfer' | 'expiration';
  metadata?: {
    originCountry?: string;
    restaurantId?: string;
    expirationDate?: string;
  };
}

export interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: number;
  explorerUrl: string;
  confirmations?: number;
}

// Blockchain-related types
export interface NetworkStatus {
  network: string;
  blockNumber: number;
  gasPrice: string;
  isHealthy: boolean;
  lastBlockTime: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Database types
export interface WalletRecord {
  id: string;
  userId: string;
  userType: 'tourist' | 'restaurant';
  walletAddress: string;
  encryptedPrivateKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionRecord {
  id: string;
  transactionHash: string;
  blockNumber: number;
  fromAddress: string;
  toAddress: string;
  amount: string;
  gasUsed: number;
  gasPrice: string;
  transactionFee: string;
  status: 'pending' | 'confirmed' | 'failed';
  transactionType: 'daily_issuance' | 'restaurant_transfer' | 'expiration';
  metadata: any;
  createdAt: Date;
  confirmedAt?: Date;
}