'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ArrowUpRight, Coins } from 'lucide-react';
import { CoinAnimationProps } from '@/lib/types';
import Image from 'next/image';

export function CoinAnimation({ type, amount, onComplete }: CoinAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for exit animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getAnimationConfig = () => {
    switch (type) {
      case 'earn':
        return {
          icon: Plus,
          color: 'from-green-400 to-emerald-500',
          textColor: 'text-green-100',
          iconColor: 'text-green-200',
          message: 'Coins Earned!',
          initialY: 100,
          finalY: -50,
          scale: [0, 1.2, 1],
        };
      case 'spend':
        return {
          icon: Minus,
          color: 'from-red-400 to-rose-500',
          textColor: 'text-red-100',
          iconColor: 'text-red-200',
          message: 'Coins Spent',
          initialY: -50,
          finalY: 100,
          scale: [1, 0.8, 0],
        };
      case 'spend':
        return {
          icon: ArrowUpRight,
          color: 'from-purple-400 to-pink-500',
          textColor: 'text-purple-100',
          iconColor: 'text-purple-200',
          message: 'Reward Redeemed!',
          initialY: 0,
          finalY: -100,
          scale: [0, 1.3, 1],
        };
      default:
        return {
          icon: Coins,
          color: 'from-yellow-400 to-orange-500',
          textColor: 'text-yellow-100',
          iconColor: 'text-yellow-200',
          message: 'Coins Updated',
          initialY: 0,
          finalY: 0,
          scale: [1, 1.1, 1],
        };
    }
  };

  const config = getAnimationConfig();
  const Icon = config.icon;

  // Generate floating coins for visual effect using smile-coin graphics
  const floatingCoins = Array.from({ length: Math.min(amount, 5) }, (_, i) => (
    <motion.div
      key={i}
      className="absolute"
      initial={{ 
        x: 0, 
        y: 0, 
        scale: 0, 
        rotate: 0,
        opacity: 1 
      }}
      animate={{ 
        x: (Math.random() - 0.5) * 200,
        y: config.finalY + (Math.random() - 0.5) * 50,
        scale: [0, 1, 0.8, 0],
        rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
        opacity: [0, 1, 1, 0]
      }}
      transition={{ 
        duration: 1.5,
        delay: i * 0.1,
        ease: "easeOut"
      }}
    >
      <Image
        src="/images/smile-coin/smile-coin-dynamic.png"
        alt="Smile Coin"
        width={24}
        height={24}
        className="w-6 h-6"
      />
    </motion.div>
  ));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="coin-animation"
        >
          {/* Background overlay */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Main animation container */}
          <motion.div
            className="relative z-10"
            initial={{ y: config.initialY, scale: 0 }}
            animate={{ y: 0, scale: config.scale }}
            exit={{ y: config.finalY, scale: 0 }}
            transition={{ 
              duration: 0.8,
              ease: "easeOut",
              scale: {
                times: [0, 0.6, 1],
                duration: 0.8
              }
            }}
          >
            {/* Main card */}
            <div className={`bg-gradient-to-br ${config.color} rounded-2xl p-6 shadow-2xl min-w-[200px]`}>
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm relative"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                >
                  <Image
                    src="/images/smile-coin/smile-coin-dynamic-shadow.png"
                    alt="Smile Coin"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                  <Icon className={`w-4 h-4 ${config.iconColor} absolute top-1 right-1`} />
                </motion.div>
              </div>

              <div className="text-center">
                <motion.div
                  className={`text-2xl font-bold ${config.textColor} mb-1`}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {type === 'spend' ? '-' : '+'}{amount}
                </motion.div>
                <div className={`text-sm ${config.textColor} opacity-90`}>
                  {config.message}
                </div>
              </div>
            </div>

            {/* Floating coins */}
            <div className="absolute inset-0 flex items-center justify-center">
              {floatingCoins}
            </div>

            {/* Ripple effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-white/30"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </motion.div>

          {/* Particle effects using smile coin graphics */}
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute"
                initial={{ 
                  scale: 0,
                  x: 0,
                  y: 0,
                  opacity: 1
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  x: Math.cos((i / 8) * Math.PI * 2) * 100,
                  y: Math.sin((i / 8) * Math.PI * 2) * 100,
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 1.2,
                  delay: 0.5 + i * 0.05,
                  ease: "easeOut"
                }}
              >
                <Image
                  src="/images/smile-coin/smile-coin-front.png"
                  alt="Smile Coin"
                  width={8}
                  height={8}
                  className="w-2 h-2"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}