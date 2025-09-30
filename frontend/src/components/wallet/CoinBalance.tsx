'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, TrendingUp, Clock } from 'lucide-react';
import { CoinAnimationProps } from '@/lib/types';
import { hapticCoinEarn } from '@/lib/utils/haptics';
import Image from 'next/image';

interface CoinBalanceProps {
  balance: number;
  isLoading: boolean;
  showAnimation?: boolean;
  expiryDate?: Date;
}

export function CoinBalance({ balance, isLoading, showAnimation = false, expiryDate }: CoinBalanceProps) {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate balance changes
  useEffect(() => {
    if (isLoading) return;
    
    const startValue = displayBalance;
    const endValue = balance;
    const duration = 1000; // 1 second
    const startTime = Date.now();

    if (startValue === endValue) {
      setDisplayBalance(balance);
      return;
    }

    setIsAnimating(true);
    
    // Trigger haptic feedback for balance increase
    if (endValue > startValue) {
      hapticCoinEarn();
    }

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOutCubic);
      
      setDisplayBalance(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [balance, isLoading, displayBalance]);

  // Calculate time until expiry
  const getTimeUntilExpiry = (): { expired: true } | { days: number; hours: number; expired: false } | null => {
    if (!expiryDate) return null;
    
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { days, hours, expired: false };
  };

  const expiryInfo = getTimeUntilExpiry();
  const isExpiringSoon = expiryInfo && !expiryInfo.expired && expiryInfo.days < 7;

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 bg-white/20 rounded animate-pulse mb-2"></div>
            <div className="h-8 bg-white/20 rounded animate-pulse"></div>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-yellow-100 text-sm font-medium">Smile Coins</p>
          <div className="flex items-center gap-2">
            <motion.span
              className="text-3xl font-bold"
              animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
              data-testid="coin-balance"
            >
              {displayBalance.toLocaleString()}
            </motion.span>
            <AnimatePresence>
              {showAnimation && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.5 }}
                >
                  <TrendingUp className="w-6 h-6 text-yellow-200" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <motion.div
          className="relative"
          animate={isAnimating ? { rotate: [0, 360] } : {}}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Image
              src="/images/smile-coin/smile-coin-dynamic.png"
              alt="Smile Coin"
              width={48}
              height={48}
              className="size-12"
            />
          </div>
          {showAnimation && (
            <motion.div
              className="absolute inset-0 w-16 h-16 bg-white/10 rounded-full"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1, repeat: 2 }}
            />
          )}
        </motion.div>
      </div>

      {/* Expiry Warning */}
      <AnimatePresence>
        {expiryInfo && !expiryInfo.expired && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`flex items-center gap-2 p-3 rounded-lg ${
              isExpiringSoon 
                ? 'bg-red-500/20 border border-red-400/30' 
                : 'bg-white/10 border border-white/20'
            }`}
          >
            <Clock className={`w-4 h-4 ${isExpiringSoon ? 'text-red-200' : 'text-yellow-200'}`} />
            <span className={`text-sm ${isExpiringSoon ? 'text-red-100' : 'text-yellow-100'}`}>
              {isExpiringSoon ? 'Expires soon: ' : 'Expires in: '}
              {!expiryInfo.expired && expiryInfo.days > 0 && `${expiryInfo.days}d `}
              {!expiryInfo.expired && `${expiryInfo.hours}h`}
            </span>
          </motion.div>
        )}
        {expiryInfo?.expired && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-red-500/30 border border-red-400/50"
          >
            <Clock className="w-4 h-4 text-red-200" />
            <span className="text-sm text-red-100">Coins have expired</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}