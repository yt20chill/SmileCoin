'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Coins, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CoinAnimation } from './CoinAnimation';
import type { User } from '@/lib/types';

interface RegistrationSuccessProps {
  user: User;
  initialCoins: number;
  onContinue: () => void;
}

export function RegistrationSuccess({ user, initialCoins, onContinue }: RegistrationSuccessProps) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tWallet = useTranslations('wallet');
  
  const [showAnimation, setShowAnimation] = useState(false);
  const [animatedCoins, setAnimatedCoins] = useState(0);

  useEffect(() => {
    // Start coin animation after component mounts
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleAnimationComplete = () => {
    setAnimatedCoins(initialCoins);
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
      
      <CardContent className="relative pt-8 pb-6 text-center space-y-6">
        {/* Success Icon with Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.2 
          }}
          className="relative mx-auto w-20 h-20"
        >
          <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              ✓
            </motion.div>
          </div>
          
          {/* Sparkle effects */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </motion.div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">
            Welcome to Hong Kong!
          </h2>
          <p className="text-green-600 dark:text-green-400">
            {t('registerSuccess')}
          </p>
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Flight:</span>
            <span className="font-medium">{user.flightNumber}</span>
          </div>
          {user.email && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="font-medium">{user.email}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Arrival:</span>
            <span className="font-medium">
              {user.arrivalDate.toLocaleDateString()}
            </span>
          </div>
        </motion.div>

        {/* Coin Reward Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="relative"
        >
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg p-6 border-2 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Coins className="h-8 w-8 text-yellow-600" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {tWallet('earned')}
                </p>
                <motion.p 
                  className="text-3xl font-bold text-yellow-700 dark:text-yellow-300"
                  initial={{ scale: 1 }}
                  animate={{ scale: showAnimation ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                >
                  {showAnimation ? animatedCoins : 0}
                </motion.p>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  {tWallet('smileCoins')}
                </p>
              </div>
            </div>

            {/* Coin Animation Component */}
            {showAnimation && (
              <CoinAnimation
                amount={initialCoins}
                onComplete={handleAnimationComplete}
              />
            )}
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Button
            onClick={onContinue}
            size="lg"
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            View My Wallet
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-xs text-muted-foreground space-y-1"
        >
          <p>🎯 Rate merchants to earn more coins</p>
          <p>🎁 Redeem coins for exclusive rewards</p>
          <p>🌟 Explore Hong Kong like never before!</p>
        </motion.div>
      </CardContent>
    </Card>
  );
}