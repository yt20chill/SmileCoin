// Simple test to verify components compile correctly
import React from 'react';
import StatsOverview from './components/StatsOverview';
import DailyStatsChart from './components/DailyStatsChart';
import OriginBreakdown from './components/OriginBreakdown';
import PerformanceTrends from './components/PerformanceTrends';
import RestaurantSelector from './components/RestaurantSelector';
import { TotalStats, DailyStats, OriginStats, TrendData } from './types/dashboard';

// Test data
const testTotalStats: TotalStats = {
  totalCoins: 1247,
  totalTransactions: 456,
  averageCoinsPerDay: 62.3,
  rankingPosition: 8,
  totalRestaurants: 150,
};

const testDailyStats: DailyStats[] = [
  { date: '2024-01-01', coinsReceived: 45, uniqueTourists: 15, transactions: 18 },
];

const testOriginStats: OriginStats[] = [
  { country: 'United States', coinsReceived: 324, touristCount: 89, percentage: 26.0 },
];

const testTrendData: TrendData[] = [
  { period: 'This Week', coinsReceived: 375, change: 23, changePercentage: 6.5 },
];

// Test component
const TestComponents: React.FC = () => {
  return (
    <div>
      <RestaurantSelector />
      <StatsOverview stats={testTotalStats} loading={false} />
      <DailyStatsChart data={testDailyStats} loading={false} />
      <OriginBreakdown data={testOriginStats} loading={false} />
      <PerformanceTrends data={testTrendData} loading={false} />
    </div>
  );
};

export default TestComponents;