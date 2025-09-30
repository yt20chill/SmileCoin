'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { OnboardingSlide } from './OnboardingSlide';
import { OnboardingProps, OnboardingSlide as OnboardingSlideType } from '@/lib/types';

const SWIPE_CONFIDENCE_THRESHOLD = 10000;
const swipeVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export function OnboardingCarousel({ onComplete, onSkip }: OnboardingProps) {
  const t = useTranslations('onboarding');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  // Define onboarding slides
  const slides: OnboardingSlideType[] = [
    {
      id: 'welcome',
      title: t('slides.welcome.title'),
      titleZh: t('slides.welcome.title'),
      description: t('slides.welcome.description'),
      descriptionZh: t('slides.welcome.description'),
      icon: '🇭🇰',
      animation: 'browse'
    },
    {
      id: 'earnCoins',
      title: t('slides.earnCoins.title'),
      titleZh: t('slides.earnCoins.title'),
      description: t('slides.earnCoins.description'),
      descriptionZh: t('slides.earnCoins.description'),
      icon: '😊',
      animation: 'earn',
      demoData: { coins: 100 }
    },
    {
      id: 'rateMerchants',
      title: t('slides.rateMerchants.title'),
      titleZh: t('slides.rateMerchants.title'),
      description: t('slides.rateMerchants.description'),
      descriptionZh: t('slides.rateMerchants.description'),
      icon: '⭐',
      animation: 'spend',
      demoData: { coins: 3, merchantName: 'Hong Kong Cafe' }
    },
    {
      id: 'explore',
      title: t('slides.explore.title'),
      titleZh: t('slides.explore.title'),
      description: t('slides.explore.description'),
      descriptionZh: t('slides.explore.description'),
      icon: '🚀',
      animation: 'browse'
    }
  ];

  const paginate = (newDirection: number) => {
    const newSlide = currentSlide + newDirection;
    if (newSlide >= 0 && newSlide < slides.length) {
      setDirection(newDirection);
      setCurrentSlide(newSlide);
    }
  };

  const handleNext = () => {
    if (currentSlide === slides.length - 1) {
      onComplete();
    } else {
      paginate(1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      paginate(-1);
    }
  };

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -SWIPE_CONFIDENCE_THRESHOLD) {
      paginate(1);
    } else if (swipe > SWIPE_CONFIDENCE_THRESHOLD) {
      paginate(-1);
    }
  };

  // Auto-advance slides (optional)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentSlide < slides.length - 1) {
        paginate(1);
      }
    }, 8000); // Auto-advance after 8 seconds

    return () => clearTimeout(timer);
  }, [currentSlide]);

  return (
    <div className="relative w-full h-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Skip button */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground"
        >
          {t('skip')}
        </Button>
      </div>

      {/* Slide container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={swipeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="absolute w-full h-full"
          >
            <OnboardingSlide
              slide={slides[currentSlide]}
              isActive={true}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSkip={onSkip}
              currentSlide={currentSlide + 1}
              totalSlides={slides.length}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress indicators */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentSlide ? 1 : -1);
              setCurrentSlide(index);
            }}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-primary scale-125'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            aria-label={t('slideIndicator', { current: index + 1, total: slides.length })}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4 z-10">
        {currentSlide > 0 && (
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="min-w-20"
          >
            {t('previous')}
          </Button>
        )}
        <Button
          onClick={handleNext}
          className="min-w-20 bg-hk-gradient hover:opacity-90"
        >
          {currentSlide === slides.length - 1 ? t('getStarted') : t('next')}
        </Button>
      </div>
    </div>
  );
}