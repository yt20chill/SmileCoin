'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Zap, Star, Award, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export interface EngagementMetrics {
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  currentBalance: number;
  boardingPassesScanned: number;
  merchantsRated: number;
  rewardsRedeemed: number;
  daysActive: number;
  currentStreak: number;
  level: number;
  experiencePoints: number;
  nextLevelXP: number;
}

interface ProgressIndicatorsProps {
  metrics: EngagementMetrics;
  showDetailed?: boolean;
}

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

function CircularProgress({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8, 
  color = '#3B82F6',
  children 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  progress?: number;
  maxProgress?: number;
}

function MetricCard({ 
  icon, 
  title, 
  value, 
  subtitle, 
  color = 'bg-blue-500',
  progress,
  maxProgress = 100
}: MetricCardProps) {
  return (
    <motion.div
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <motion.span
          className="text-2xl font-bold text-gray-900"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {value}
        </motion.span>
        
        {progress !== undefined && (
          <div className="flex items-center gap-2">
            <Image
              src="/images/smile-coin/smile-coin-front.png"
              alt="Smile Coin"
              width={16}
              height={16}
              className="w-4 h-4"
            />
          </div>
        )}
      </div>
      
      {progress !== undefined && (
        <div className="mt-3">
          <Progress 
            value={(progress / maxProgress) * 100} 
            className="h-2"
          />
        </div>
      )}
    </motion.div>
  );
}

export function ProgressIndicators({ metrics, showDetailed = false }: ProgressIndicatorsProps) {
  const t = useTranslations('progress');
  
  const levelProgress = (metrics.experiencePoints / metrics.nextLevelXP) * 100;
  
  return (
    <div className="space-y-6">
      {/* Level Progress - Main Feature */}
      <motion.div
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Image
                src="/images/silme-travel-logo-white.svg"
                alt="Smile Travel"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              {t('tourist_level')}
            </h2>
            <p className="text-gray-600 text-sm">{t('keep_exploring')}</p>
          </div>
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Level {metrics.level}
          </motion.div>
        </div>
        
        <div className="flex items-center justify-center">
          <CircularProgress
            value={metrics.experiencePoints}
            max={metrics.nextLevelXP}
            size={140}
            strokeWidth={10}
            color="url(#gradient)"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(levelProgress)}%
              </div>
              <div className="text-xs text-gray-500">
                {metrics.experiencePoints}/{metrics.nextLevelXP} XP
              </div>
            </div>
          </CircularProgress>
          
          {/* SVG gradient definition */}
          <svg width="0" height="0">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          icon={<Image src="/images/smile-coin/smile-coin-front.png" alt="Coins" width={20} height={20} />}
          title={t('current_balance')}
          value={metrics.currentBalance}
          color="bg-gradient-to-r from-yellow-400 to-orange-500"
        />
        
        <MetricCard
          icon={<TrendingUp className="w-5 h-5" />}
          title={t('coins_earned')}
          value={metrics.totalCoinsEarned}
          color="bg-gradient-to-r from-green-400 to-emerald-500"
        />
        
        <MetricCard
          icon={<Target className="w-5 h-5" />}
          title={t('boarding_passes')}
          value={metrics.boardingPassesScanned}
          color="bg-gradient-to-r from-blue-400 to-cyan-500"
        />
        
        <MetricCard
          icon={<Star className="w-5 h-5" />}
          title={t('merchants_rated')}
          value={metrics.merchantsRated}
          color="bg-gradient-to-r from-purple-400 to-pink-500"
        />
      </div>

      {/* Detailed Metrics (if enabled) */}
      {showDetailed && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            {t('detailed_stats')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              icon={<Award className="w-5 h-5" />}
              title={t('rewards_redeemed')}
              value={metrics.rewardsRedeemed}
              color="bg-gradient-to-r from-indigo-400 to-purple-500"
            />
            
            <MetricCard
              icon={<Calendar className="w-5 h-5" />}
              title={t('days_active')}
              value={metrics.daysActive}
              subtitle={t('current_streak', { days: metrics.currentStreak })}
              color="bg-gradient-to-r from-teal-400 to-blue-500"
            />
            
            <MetricCard
              icon={<TrendingUp className="w-5 h-5" />}
              title={t('coins_spent')}
              value={metrics.totalCoinsSpent}
              color="bg-gradient-to-r from-red-400 to-pink-500"
            />
            
            <MetricCard
              icon={<Target className="w-5 h-5" />}
              title={t('efficiency_rate')}
              value={`${Math.round((metrics.totalCoinsSpent / Math.max(metrics.totalCoinsEarned, 1)) * 100)}%`}
              subtitle={t('coins_utilization')}
              color="bg-gradient-to-r from-orange-400 to-red-500"
            />
          </div>
        </motion.div>
      )}

      {/* Streak Indicator */}
      {metrics.currentStreak > 0 && (
        <motion.div
          className="bg-gradient-to-r from-orange-400 to-red-500 rounded-xl p-4 text-white"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-6 h-6" />
              </motion.div>
              <div>
                <h4 className="font-bold">{t('active_streak')}</h4>
                <p className="text-sm opacity-90">{t('keep_it_up')}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{metrics.currentStreak}</div>
              <div className="text-xs opacity-90">{t('days')}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}