'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinAnimationProps {
  amount: number;
  onComplete: () => void;
}

interface Coin {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export function CoinAnimation({ amount, onComplete }: CoinAnimationProps) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Generate coins for animation
    const coinCount = Math.min(amount / 10, 20); // Show max 20 coins
    const generatedCoins: Coin[] = [];

    for (let i = 0; i < coinCount; i++) {
      generatedCoins.push({
        id: i,
        x: Math.random() * 200 - 100, // Random x position
        y: Math.random() * 100 - 50,  // Random y position
        delay: i * 0.1, // Stagger animation
      });
    }

    setCoins(generatedCoins);

    // Complete animation after all coins are done
    const totalDuration = coinCount * 0.1 + 1.5; // Stagger delay + animation duration
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete();
    }, totalDuration * 1000);

    return () => clearTimeout(timer);
  }, [amount, onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {isAnimating && coins.map((coin) => (
          <motion.div
            key={coin.id}
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              rotate: 0,
              opacity: 0,
            }}
            animate={{
              x: coin.x,
              y: coin.y,
              scale: [0, 1.2, 1, 0],
              rotate: [0, 180, 360],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.5,
              delay: coin.delay,
              ease: "easeOut",
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-300">
              <span className="text-xs font-bold text-yellow-900">😊</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}