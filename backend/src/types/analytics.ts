// Type definitions for analytics views and aggregated data

export interface RestaurantAnalytics {
  id: string;
  google_place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  wallet_address: string;
  total_coins_received: number;
  created_at: Date;
  
  // Transaction statistics
  total_transactions: number;
  total_transaction_amount: number;
  avg_transaction_amount: number;
  
  // Time-based statistics
  transactions_last_30_days: number;
  coins_last_30_days: number;
  transactions_last_7_days: number;
  coins_last_7_days: number;
  transactions_today: number;
  coins_today: number;
  
  // Diversity metrics
  unique_origin_countries: number;
  
  // Activity tracking
  last_transaction_date: Date | null;
  
  // Ranking data
  coins_rank: number;
  transaction_count_rank: number;
  activity_score: number;
}

export interface DashboardMetrics {
  totalRestaurants: number;
  totalTransactions: number;
  totalCoinsDistributed: number;
  activeRestaurantsToday: number;
  topRestaurants: RestaurantAnalytics[];
  recentActivity: {
    date: string;
    transactions: number;
    coins: number;
  }[];
}

export interface RestaurantPerformance {
  restaurantId: string;
  name: string;
  dailyStats: {
    date: string;
    transactions: number;
    coins: number;
    uniqueCountries: number;
  }[];
  weeklyTrend: 'up' | 'down' | 'stable';
  monthlyTrend: 'up' | 'down' | 'stable';
}