import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import StatsOverview from './StatsOverview';
import DailyStatsChart from './DailyStatsChart';
import OriginBreakdown from './OriginBreakdown';
import PerformanceTrends from './PerformanceTrends';
import RestaurantSelector from './RestaurantSelector';
import { RestaurantDashboardService } from '../services/api';
import { DailyStats, TotalStats, OriginStats, TrendData } from '../types/dashboard';

const Dashboard: React.FC = () => {
  const { placeId } = useParams<{ placeId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for all dashboard data
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [originStats, setOriginStats] = useState<OriginStats[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  // Use demo restaurant ID if none provided
  const restaurantId = placeId || 'demo-restaurant-123';

  const fetchDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch all dashboard data in parallel
      const [totalStatsData, dailyStatsData, originStatsData, trendStatsData] = await Promise.all([
        RestaurantDashboardService.getTotalStats(restaurantId),
        RestaurantDashboardService.getDailyStats(restaurantId),
        RestaurantDashboardService.getOriginBreakdown(restaurantId),
        RestaurantDashboardService.getPerformanceTrends(restaurantId),
      ]);

      setTotalStats(totalStatsData);
      setDailyStats(dailyStatsData);
      setOriginStats(originStatsData);
      setTrendData(trendStatsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [restaurantId]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Restaurant Dashboard</h2>
          <p className="text-gray-600 mt-1">
            {placeId ? `Restaurant ID: ${placeId}` : 'Demo Restaurant Analytics'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg 
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Restaurant Selector for Demo */}
      <RestaurantSelector />

      {/* Stats Overview */}
      {totalStats && (
        <StatsOverview stats={totalStats} loading={loading} />
      )}

      {/* Daily Statistics Chart */}
      <DailyStatsChart data={dailyStats} loading={loading} />

      {/* Performance Trends */}
      <PerformanceTrends data={trendData} loading={loading} />

      {/* Tourist Origin Breakdown */}
      <OriginBreakdown data={originStats} loading={loading} />

      {/* Footer with blockchain verification info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-900">Blockchain Verified Data</h4>
            <p className="text-blue-700 text-sm mt-1">
              All smile coin transactions are recorded on the blockchain for complete transparency. 
              Click on any transaction to view it on the blockchain explorer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;