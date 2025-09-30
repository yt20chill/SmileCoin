'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface OnboardingAnimationProps {
  type: 'earn' | 'spend' | 'redeem' | 'browse';
  demoData?: {
    coins?: number;
    merchantName?: string;
    rewardName?: string;
  };
}

export function OnboardingAnimation({ type, demoData }: OnboardingAnimationProps) {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 3);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const renderEarnAnimation = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {animationStep === 0 && (
          <motion.div
            key="boarding-pass"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ duration: 0.5 }}
            className="absolute"
          >
            <div className="w-16 h-10 bg-blue-500 rounded border-2 border-blue-600 flex items-center justify-center">
              <span className="text-xs text-white font-bold">✈️</span>
            </div>
          </motion.div>
        )}
        {animationStep === 1 && (
          <motion.div
            key="arrow"
            initial={{ scale: 0, x: -20 }}
            animate={{ scale: 1, x: 0 }}
            exit={{ scale: 0, x: 20 }}
            transition={{ duration: 0.5 }}
            className="absolute"
          >
            <span className="text-2xl">→</span>
          </motion.div>
        )}
        {animationStep === 2 && (
          <motion.div
            key="coins"
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="absolute flex space-x-1"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border border-yellow-500"
              >
                <span className="text-xs">😊</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderSpendAnimation = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {animationStep === 0 && (
          <motion.div
            key="merchant"
            initial={{ scale: 0, x: -30 }}
            animate={{ scale: 1, x: 0 }}
            exit={{ scale: 0, x: -30 }}
            transition={{ duration: 0.5 }}
            className="absolute"
          >
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏪</span>
            </div>
          </motion.div>
        )}
        {animationStep === 1 && (
          <motion.div
            key="rating"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute flex space-x-1"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.2, duration: 0.4 }}
                className="text-xl"
              >
                ⭐
              </motion.div>
            ))}
          </motion.div>
        )}
        {animationStep === 2 && (
          <motion.div
            key="coins-spent"
            initial={{ scale: 1, y: 0 }}
            animate={{ scale: 0.8, y: -20 }}
            exit={{ scale: 0, y: -40 }}
            transition={{ duration: 0.5 }}
            className="absolute flex space-x-1"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-yellow-500"
              >
                <span className="text-xs">😊</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderRedeemAnimation = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {animationStep === 0 && (
          <motion.div
            key="coins-stack"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, x: -30 }}
            transition={{ duration: 0.5 }}
            className="absolute flex flex-wrap justify-center max-w-16"
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-yellow-500 m-0.5"
              >
                <span className="text-xs">😊</span>
              </motion.div>
            ))}
          </motion.div>
        )}
        {animationStep === 1 && (
          <motion.div
            key="exchange"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute"
          >
            <span className="text-3xl">⇄</span>
          </motion.div>
        )}
        {animationStep === 2 && (
          <motion.div
            key="reward"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ duration: 0.5 }}
            className="absolute"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-lg">🎁</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderBrowseAnimation = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute"
      >
        <div className="flex space-x-2">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center"
          >
            <span className="text-sm">🏪</span>
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            className="w-8 h-8 bg-green-500 rounded flex items-center justify-center"
          >
            <span className="text-sm">🍜</span>
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            className="w-8 h-8 bg-red-500 rounded flex items-center justify-center"
          >
            <span className="text-sm">🛍️</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );

  const animations = {
    earn: renderEarnAnimation,
    spend: renderSpendAnimation,
    redeem: renderRedeemAnimation,
    browse: renderBrowseAnimation
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {animations[type]()}
    </div>
  );
}