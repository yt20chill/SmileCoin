import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { DailyStats } from '../types/dashboard';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DailyStatsChartProps {
  data: DailyStats[];
  loading: boolean;
}

const DailyStatsChart: React.FC<DailyStatsChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => format(parseISO(item.date), 'MMM dd')),
    datasets: [
      {
        label: 'Smile Coins Received',
        data: data.map(item => item.coinsReceived),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Unique Tourists',
        data: data.map(item => item.uniqueTourists),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const barChartData = {
    labels: data.map(item => format(parseISO(item.date), 'MMM dd')),
    datasets: [
      {
        label: 'Transactions',
        data: data.map(item => item.transactions),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 1,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Coins & Tourist Activity',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Transactions',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <Line data={chartData} options={lineOptions} />
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <Bar data={barChartData} options={barOptions} />
      </div>
    </div>
  );
};

export default DailyStatsChart;