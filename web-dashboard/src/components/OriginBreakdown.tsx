import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { OriginStats } from '../types/dashboard';

ChartJS.register(ArcElement, Tooltip, Legend);

interface OriginBreakdownProps {
  data: OriginStats[];
  loading: boolean;
}

const OriginBreakdown: React.FC<OriginBreakdownProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
  ];

  const chartData = {
    labels: data.map(item => item.country),
    datasets: [
      {
        data: data.map(item => item.coinsReceived),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length).map(color => color),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = data[context.dataIndex]?.percentage || 0;
            return `${label}: ${value} coins (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Tourist Origin Breakdown</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            <Doughnut data={chartData} options={options} />
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Country Statistics</h4>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={item.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: colors[index] }}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-900">{item.country}</p>
                    <p className="text-sm text-gray-500">{item.touristCount} tourists</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{item.coinsReceived}</p>
                  <p className="text-sm text-gray-500">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Top Performing Countries</h5>
            <div className="space-y-2">
              {data.slice(0, 3).map((item, index) => (
                <div key={item.country} className="flex justify-between text-sm">
                  <span className="text-blue-700">#{index + 1} {item.country}</span>
                  <span className="font-medium text-blue-900">{item.coinsReceived} coins</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OriginBreakdown;