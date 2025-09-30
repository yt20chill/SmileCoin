import React from 'react';
import { TrendData } from '../types/dashboard';

interface PerformanceTrendsProps {
  data: TrendData[];
  loading: boolean;
}

const PerformanceTrends: React.FC<PerformanceTrendsProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-100 rounded-lg">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    } else if (change < 0) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      );
    }
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBgColor = (change: number) => {
    if (change > 0) return 'bg-green-50 border-green-200';
    if (change < 0) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
        <div className="text-sm text-gray-500">
          Compared to previous period
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((trend, index) => (
          <div 
            key={trend.period} 
            className={`p-4 rounded-lg border-2 ${getBgColor(trend.change)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{trend.period}</h4>
              {getTrendIcon(trend.change)}
            </div>
            
            <div className="mb-3">
              <p className="text-2xl font-bold text-gray-900">
                {trend.coinsReceived.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">smile coins</p>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className={`text-sm font-medium ${getTrendColor(trend.change)}`}>
                {trend.change > 0 ? '+' : ''}{trend.change}
              </span>
              <span className={`text-sm ${getTrendColor(trend.change)}`}>
                ({trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage}%)
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Performance Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">
              <span className="font-medium">Best Period:</span> {
                data.reduce((best, current) => 
                  current.coinsReceived > best.coinsReceived ? current : best
                ).period
              }
            </p>
          </div>
          <div>
            <p className="text-gray-600">
              <span className="font-medium">Biggest Growth:</span> {
                data.reduce((best, current) => 
                  current.changePercentage > best.changePercentage ? current : best
                ).changePercentage
              }%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTrends;