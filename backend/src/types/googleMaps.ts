export enum GoogleMapsErrorType {
  API_KEY_INVALID = 'API_KEY_INVALID',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  REQUEST_DENIED = 'REQUEST_DENIED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  ZERO_RESULTS = 'ZERO_RESULTS',
  OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export class GoogleMapsError extends Error {
  constructor(
    public type: GoogleMapsErrorType,
    public override message: string,
    public originalError?: Error,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'GoogleMapsError';
  }
}

export interface GoogleMapsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    type: GoogleMapsErrorType;
    message: string;
    details?: any;
  };
  meta?: {
    cached?: boolean;
    timestamp?: string;
    requestId?: string;
  };
}

export interface RestaurantWithDistance {
  placeId: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  priceLevel?: number;
  photos?: string[];
  isOpen?: boolean;
  types?: string[];
  vicinity?: string;
  businessStatus?: string;
  distance: number; // in kilometers
}

export interface NearbyRestaurantsResponse {
  restaurants: RestaurantWithDistance[];
  meta: {
    count: number;
    searchLocation: {
      latitude: number;
      longitude: number;
    };
    searchRadius: number;
    cached?: boolean;
  };
}

export interface RestaurantSearchResponse {
  restaurants: RestaurantWithDistance[];
  meta: {
    count: number;
    query: string;
    searchLocation?: {
      latitude: number;
      longitude: number;
    };
    searchRadius?: number;
    cached?: boolean;
  };
}