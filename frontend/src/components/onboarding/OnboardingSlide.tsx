'use client';

import { motion } from 'framer-motion';
import { OnboardingSlideProps } from '@/lib/types';
import { OnboardingAnimation } from './OnboardingAnimation';

export function OnboardingSlide({
  slide,
  isActive,
  currentSlide,
  totalSlides
}: OnboardingSlideProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      {/* Icon and Animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
        className="mb-8"
      >
        <div className="relative">
          {/* Background circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
            className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto"
          >
            <span className="text-6xl">{slide.icon}</span>
          </motion.div>
          
          {/* Animation overlay */}
          {isActive && (
            <OnboardingAnimation
              type={slide.animation}
              demoData={slide.demoData}
            />
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="max-w-md mx-auto space-y-4"
      >
        <h2 className="text-3xl font-bold text-foreground">
          {slide.title}
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {slide.description}
        </p>
      </motion.div>

      {/* Demo data display */}
      {slide.demoData && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 p-4 bg-card rounded-lg border shadow-sm"
        >
          {slide.demoData.coins && (
            <div className="flex items-center justify-center space-x-2">
              <img src="/images/smile-coin/smile-coin-front.png" className='size-12'/>
              <span className="text-xl font-semibold text-primary">
                {slide.demoData.coins} Smile Coins
              </span>
            </div>
          )}
          {slide.demoData.merchantName && (
            <div className="text-sm text-muted-foreground mt-2">
              Rating: {slide.demoData.merchantName}
            </div>
          )}
          {slide.demoData.rewardName && (
            <div className="text-sm text-muted-foreground mt-2">
              Redeeming: {slide.demoData.rewardName}
            </div>
          )}
        </motion.div>
      )}

      {/* Slide indicator text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-sm text-muted-foreground"
      >
        {currentSlide} of {totalSlides}
      </motion.div>
    </div>
  );
}