import { DailyStats, TotalStats, OriginStats, TrendData } from '../types/dashboard';

// Mock API service - returns mock data directly without HTTP calls
// This will be replaced with real API calls when backend is implemented

export class RestaurantDashboardService {
  static async getDailyStats(googlePlaceId: string): Promise<DailyStats[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data for demo - different data for different restaurants
    const mockDataSets: { [key: string]: DailyStats[] } = {
      'demo-restaurant-123': [
        { date: '2024-01-01', coinsReceived: 45, uniqueTourists: 15, transactions: 18 },
        { date: '2024-01-02', coinsReceived: 52, uniqueTourists: 18, transactions: 21 },
        { date: '2024-01-03', coinsReceived: 38, uniqueTourists: 12, transactions: 15 },
        { date: '2024-01-04', coinsReceived: 67, uniqueTourists: 22, transactions: 25 },
        { date: '2024-01-05', coinsReceived: 71, uniqueTourists: 24, transactions: 28 },
        { date: '2024-01-06', coinsReceived: 59, uniqueTourists: 19, transactions: 23 },
        { date: '2024-01-07', coinsReceived: 43, uniqueTourists: 14, transactions: 17 },
      ],
      'demo-restaurant-456': [
        { date: '2024-01-01', coinsReceived: 32, uniqueTourists: 11, transactions: 14 },
        { date: '2024-01-02', coinsReceived: 28, uniqueTourists: 9, transactions: 12 },
        { date: '2024-01-03', coinsReceived: 41, uniqueTourists: 14, transactions: 16 },
        { date: '2024-01-04', coinsReceived: 55, uniqueTourists: 18, transactions: 21 },
        { date: '2024-01-05', coinsReceived: 48, uniqueTourists: 16, transactions: 19 },
        { date: '2024-01-06', coinsReceived: 37, uniqueTourists: 12, transactions: 15 },
        { date: '2024-01-07', coinsReceived: 44, uniqueTourists: 15, transactions: 17 },
      ],
      'demo-restaurant-789': [
        { date: '2024-01-01', coinsReceived: 78, uniqueTourists: 26, transactions: 31 },
        { date: '2024-01-02', coinsReceived: 82, uniqueTourists: 28, transactions: 33 },
        { date: '2024-01-03', coinsReceived: 69, uniqueTourists: 23, transactions: 28 },
        { date: '2024-01-04', coinsReceived: 91, uniqueTourists: 30, transactions: 36 },
        { date: '2024-01-05', coinsReceived: 87, uniqueTourists: 29, transactions: 34 },
        { date: '2024-01-06', coinsReceived: 75, uniqueTourists: 25, transactions: 30 },
        { date: '2024-01-07', coinsReceived: 73, uniqueTourists: 24, transactions: 29 },
      ],
    };
    
    return mockDataSets[googlePlaceId] || mockDataSets['demo-restaurant-123'];
  }

  static async getTotalStats(googlePlaceId: string): Promise<TotalStats> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock data for demo - different data for different restaurants
    const mockDataSets: { [key: string]: TotalStats } = {
      'demo-restaurant-123': {
        totalCoins: 1247,
        totalTransactions: 456,
        averageCoinsPerDay: 62.3,
        rankingPosition: 8,
        totalRestaurants: 150,
      },
      'demo-restaurant-456': {
        totalCoins: 892,
        totalTransactions: 324,
        averageCoinsPerDay: 44.6,
        rankingPosition: 23,
        totalRestaurants: 150,
      },
      'demo-restaurant-789': {
        totalCoins: 1856,
        totalTransactions: 678,
        averageCoinsPerDay: 92.8,
        rankingPosition: 3,
        totalRestaurants: 150,
      },
    };
    
    return mockDataSets[googlePlaceId] || mockDataSets['demo-restaurant-123'];
  }

  static async getOriginBreakdown(googlePlaceId: string): Promise<OriginStats[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Mock data for demo - different data for different restaurants
    const mockDataSets: { [key: string]: OriginStats[] } = {
      'demo-restaurant-123': [
        { country: 'United States', coinsReceived: 324, touristCount: 89, percentage: 26.0 },
        { country: 'United Kingdom', coinsReceived: 287, touristCount: 76, percentage: 23.0 },
        { country: 'Japan', coinsReceived: 198, touristCount: 52, percentage: 15.9 },
        { country: 'Australia', coinsReceived: 156, touristCount: 41, percentage: 12.5 },
        { country: 'Canada', coinsReceived: 134, touristCount: 35, percentage: 10.7 },
        { country: 'Germany', coinsReceived: 89, touristCount: 23, percentage: 7.1 },
        { country: 'France', coinsReceived: 59, touristCount: 15, percentage: 4.7 },
      ],
      'demo-restaurant-456': [
        { country: 'Japan', coinsReceived: 267, touristCount: 71, percentage: 29.9 },
        { country: 'South Korea', coinsReceived: 178, touristCount: 47, percentage: 20.0 },
        { country: 'United States', coinsReceived: 156, touristCount: 42, percentage: 17.5 },
        { country: 'Australia', coinsReceived: 123, touristCount: 33, percentage: 13.8 },
        { country: 'Singapore', coinsReceived: 89, touristCount: 24, percentage: 10.0 },
        { country: 'Canada', coinsReceived: 56, touristCount: 15, percentage: 6.3 },
        { country: 'United Kingdom', coinsReceived: 23, touristCount: 6, percentage: 2.6 },
      ],
      'demo-restaurant-789': [
        { country: 'United States', coinsReceived: 556, touristCount: 148, percentage: 30.0 },
        { country: 'United Kingdom', coinsReceived: 445, touristCount: 118, percentage: 24.0 },
        { country: 'Australia', coinsReceived: 334, touristCount: 89, percentage: 18.0 },
        { country: 'Germany', coinsReceived: 223, touristCount: 59, percentage: 12.0 },
        { country: 'France', coinsReceived: 167, touristCount: 44, percentage: 9.0 },
        { country: 'Canada', coinsReceived: 93, touristCount: 25, percentage: 5.0 },
        { country: 'Japan', coinsReceived: 37, touristCount: 10, percentage: 2.0 },
      ],
    };
    
    return mockDataSets[googlePlaceId] || mockDataSets['demo-restaurant-123'];
  }

  static async getPerformanceTrends(googlePlaceId: string): Promise<TrendData[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 350));
    
    // Mock data for demo - different data for different restaurants
    const mockDataSets: { [key: string]: TrendData[] } = {
      'demo-restaurant-123': [
        { period: 'This Week', coinsReceived: 375, change: 23, changePercentage: 6.5 },
        { period: 'Last Week', coinsReceived: 352, change: -15, changePercentage: -4.1 },
        { period: 'This Month', coinsReceived: 1247, change: 89, changePercentage: 7.7 },
        { period: 'Last Month', coinsReceived: 1158, change: 45, changePercentage: 4.0 },
      ],
      'demo-restaurant-456': [
        { period: 'This Week', coinsReceived: 285, change: -12, changePercentage: -4.0 },
        { period: 'Last Week', coinsReceived: 297, change: 18, changePercentage: 6.4 },
        { period: 'This Month', coinsReceived: 892, change: -34, changePercentage: -3.7 },
        { period: 'Last Month', coinsReceived: 926, change: 67, changePercentage: 7.8 },
      ],
      'demo-restaurant-789': [
        { period: 'This Week', coinsReceived: 555, change: 67, changePercentage: 13.7 },
        { period: 'Last Week', coinsReceived: 488, change: 34, changePercentage: 7.5 },
        { period: 'This Month', coinsReceived: 1856, change: 234, changePercentage: 14.4 },
        { period: 'Last Month', coinsReceived: 1622, change: 156, changePercentage: 10.6 },
      ],
    };
    
    return mockDataSets[googlePlaceId] || mockDataSets['demo-restaurant-123'];
  }
}