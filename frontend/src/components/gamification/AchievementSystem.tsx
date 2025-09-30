'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Trophy, Star, Target, Award, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export interface Achievement {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  icon: string;
  category: 'boarding-pass' | 'rating' | 'rewards' | 'milestone';
  requirement: number;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementSystemProps {
  achievements: Achievement[];
  onAchievementUnlocked?: (achievement: Achievement) => void;
}

interface AchievementNotificationProps {
  achievement: Achievement;
  onComplete: () => void;
}

function AchievementNotification({ achievement, onComplete }: AchievementNotificationProps) {
  const t = useTranslations('achievements');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  const getRarityConfig = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return {
          gradient: 'from-yellow-400 via-orange-500 to-red-500',
          glow: 'shadow-yellow-500/50',
          particles: 12
        };
      case 'epic':
        return {
          gradient: 'from-purple-400 via-pink-500 to-red-500',
          glow: 'shadow-purple-500/50',
          particles: 8
        };
      case 'rare':
        return {
          gradient: 'from-blue-400 via-cyan-500 to-teal-500',
          glow: 'shadow-blue-500/50',
          particles: 6
        };
      default:
        return {
          gradient: 'from-green-400 via-emerald-500 to-teal-500',
          glow: 'shadow-green-500/50',
          particles: 4
        };
    }
  };

  const config = getRarityConfig(achievement.rarity);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-testid="achievement-notification"
    >
      {/* Background overlay */}
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Achievement card */}
      <motion.div
        className={`relative bg-gradient-to-br ${config.gradient} rounded-2xl p-6 shadow-2xl ${config.glow} shadow-2xl min-w-[280px] max-w-[320px]`}
        initial={{ scale: 0, y: 100, rotate: -10 }}
        animate={{ 
          scale: [0, 1.1, 1], 
          y: [100, -20, 0], 
          rotate: [-10, 5, 0] 
        }}
        exit={{ scale: 0, y: -100, rotate: 10 }}
        transition={{ 
          duration: 0.8,
          ease: "easeOut",
          scale: { times: [0, 0.6, 1] }
        }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <motion.div
            className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 backdrop-blur-sm"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Trophy className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">
              {t('achievement_unlocked')}
            </span>
          </motion.div>
        </div>

        {/* Achievement icon */}
        <div className="flex items-center justify-center mb-4">
          <motion.div
            className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm relative"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 3, ease: "linear", repeat: Infinity },
              scale: { duration: 2, repeat: Infinity }
            }}
          >
            <Image
              src="/images/smile-coin/smile-coin-dynamic-shadow.png"
              alt="Achievement"
              width={48}
              height={48}
              className="w-12 h-12"
            />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 text-yellow-900" fill="currentColor" />
            </div>
          </motion.div>
        </div>

        {/* Achievement details */}
        <div className="text-center text-white">
          <motion.h3
            className="text-lg font-bold mb-2"
            animate={{ opacity: [0, 1] }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {achievement.title}
          </motion.h3>
          <motion.p
            className="text-sm opacity-90"
            animate={{ opacity: [0, 1] }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            {achievement.description}
          </motion.p>
        </div>

        {/* Rarity indicator */}
        <motion.div
          className="absolute top-2 right-2"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Badge className="w-5 h-5 text-white" />
        </motion.div>

        {/* Particle effects */}
        <div className="absolute inset-0">
          {Array.from({ length: config.particles }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              initial={{ 
                scale: 0,
                x: '50%',
                y: '50%',
                opacity: 1
              }}
              animate={{ 
                scale: [0, 1, 0],
                x: `${50 + (Math.random() - 0.5) * 200}%`,
                y: `${50 + (Math.random() - 0.5) * 200}%`,
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AchievementSystem({ achievements, onAchievementUnlocked }: AchievementSystemProps) {
  const [activeNotification, setActiveNotification] = useState<Achievement | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<Achievement[]>([]);

  // Check for newly unlocked achievements
  useEffect(() => {
    const newlyUnlocked = achievements.filter(
      achievement => achievement.isUnlocked && 
      achievement.progress >= achievement.requirement &&
      !achievement.unlockedAt
    );

    if (newlyUnlocked.length > 0) {
      setNotificationQueue(prev => [...prev, ...newlyUnlocked]);
      newlyUnlocked.forEach(achievement => {
        onAchievementUnlocked?.(achievement);
      });
    }
  }, [achievements, onAchievementUnlocked]);

  // Process notification queue
  useEffect(() => {
    if (!activeNotification && notificationQueue.length > 0) {
      const [next, ...rest] = notificationQueue;
      setActiveNotification(next);
      setNotificationQueue(rest);
    }
  }, [activeNotification, notificationQueue]);

  const handleNotificationComplete = () => {
    setActiveNotification(null);
  };

  return (
    <AnimatePresence>
      {activeNotification && (
        <AchievementNotification
          achievement={activeNotification}
          onComplete={handleNotificationComplete}
        />
      )}
    </AnimatePresence>
  );
}

// Achievement progress component for displaying in UI
interface AchievementProgressProps {
  achievement: Achievement;
  showProgress?: boolean;
}

export function AchievementProgress({ achievement, showProgress = true }: AchievementProgressProps) {
  const progressPercentage = Math.min((achievement.progress / achievement.requirement) * 100, 100);
  
  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-500 border-yellow-500';
      case 'epic': return 'text-purple-500 border-purple-500';
      case 'rare': return 'text-blue-500 border-blue-500';
      default: return 'text-green-500 border-green-500';
    }
  };

  return (
    <motion.div
      className={`p-4 rounded-lg border-2 ${achievement.isUnlocked ? getRarityColor(achievement.rarity) : 'border-gray-300'} 
        ${achievement.isUnlocked ? 'bg-gradient-to-br from-white to-gray-50' : 'bg-gray-100'}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          achievement.isUnlocked ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-300'
        }`}>
          <Image
            src="/images/smile-coin/smile-coin-front.png"
            alt="Achievement"
            width={24}
            height={24}
            className={`w-6 h-6 ${achievement.isUnlocked ? '' : 'grayscale'}`}
          />
        </div>
        
        <div className="flex-1">
          <h4 className={`font-semibold ${achievement.isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
            {achievement.title}
          </h4>
          <p className={`text-sm ${achievement.isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
            {achievement.description}
          </p>
          
          {showProgress && !achievement.isUnlocked && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{achievement.progress}/{achievement.requirement}</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>
        
        {achievement.isUnlocked && (
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Award className="w-6 h-6 text-yellow-500" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}