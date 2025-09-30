// Type definitions for the backend

export interface User {
  id: string;
  email: string;
  name: string;
  originCountry: string;
  arrivalDate: Date;
  departureDate: Date;
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Restaurant {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  walletAddress: string;
  qrCodeData: string;
  totalCoinsReceived: number;
  dailyCoinsCache: Record<string, number>;
  lastRankingUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  blockchainHash: string;
  fromAddress: string;
  toAddress: string;
  userId: string;
  restaurantId: string;
  amount: number;
  transactionDate: Date;
  userOriginCountry: string;
  blockNumber?: number;
  gasUsed?: number;
  createdAt: Date;
}

export interface DailyReward {
  id: string;
  userId: string;
  rewardDate: Date;
  coinsReceived: number;
  coinsGiven: number;
  allCoinsGiven: boolean;
  createdAt: Date;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}