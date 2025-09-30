// Type definitions for the web dashboard

export interface DailyStats {
  date: Date;
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
  value: number;
  change: number;
}

export interface RankingInfo {
  position: number;
  totalRestaurants: number;
  percentile: number;
}