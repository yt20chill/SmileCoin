export interface DailyStats {
  date: string;
  coinsReceived: number;
  uniqueTourists: number;
  transactions: number;
}

export interface TotalStats {
  totalCoins: number;
  totalTransactions: number;
  averageCoinsPerDay: number;
  rankingPosition: number;
  totalRestaurants: number;
}

export interface OriginStats {
  country: string;
  coinsReceived: number;
  touristCount: number;
  percentage: number;
}

export interface TrendData {
  period: string;
  coinsReceived: number;
  change: number;
  changePercentage: number;
}

export interface RankingInfo {
  position: number;
  totalRestaurants: number;
  percentile: number;
}

export interface RestaurantInfo {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  totalCoins: number;
  ranking: number;
}