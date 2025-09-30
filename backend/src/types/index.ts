// Common types and interfaces

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User types
export interface CreateUserRequest {
  originCountry: string;
  arrivalDate: string;
  departureDate: string;
  walletAddress: string;
}

// Restaurant types
export interface CreateRestaurantRequest {
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  walletAddress: string;
}

// Transaction types
export interface CreateTransactionRequest {
  blockchainHash: string;
  fromAddress: string;
  toAddress: string;
  userId: string;
  restaurantId: string;
  amount: number;
  userOriginCountry: string;
  blockNumber?: string;
  gasUsed?: string;
}

// JWT payload
export interface JwtPayload {
  userId: string;
  walletAddress: string;
  iat?: number;
  exp?: number;
}