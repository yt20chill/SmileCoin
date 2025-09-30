'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, QrCode, Gift, Coins, Star, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { hapticSelection } from '@/lib/utils/haptics';
import { FullscreenBoardingPassScanner } from './FullscreenBoardingPassScanner';
import { FullscreenMerchantQRScanner } from './FullscreenMerchantQRScanner';

interface QuickActionsProps {
  onScanComplete?: (coinsEarned: number) => void;
  className?: string;
}

export function QuickActions({ onScanComplete, className }: QuickActionsProps) {
  const t = useTranslations('wallet');
  const router = useRouter();
  const [showBoardingPassScanner, setShowBoardingPassScanner] = useState(false);
  const [showMerchantScanner, setShowMerchantScanner] = useState(false);

  const handleScanBoardingPass = () => {
    hapticSelection();
    setShowBoardingPassScanner(true);
  };

  const handleRateMerchant = () => {
    hapticSelection();
    setShowMerchantScanner(true);
  };

  const handleMyVouchers = () => {
    hapticSelection();
    router.push('/rewards');
  };

  const handleBoardingPassScanComplete = (coinsEarned: number) => {
    setShowBoardingPassScanner(false);
    onScanComplete?.(coinsEarned);
  };

  const handleMerchantScanComplete = (merchantId: string) => {
    setShowMerchantScanner(false);
    // The MerchantQRScanner will handle navigation to rating interface
  };

  if (showBoardingPassScanner) {
    return (
      <FullscreenBoardingPassScanner
        onScanComplete={handleBoardingPassScanComplete}
        onClose={() => setShowBoardingPassScanner(false)}
        className={className}
      />
    );
  }

  if (showMerchantScanner) {
    return (
      <FullscreenMerchantQRScanner
        onScanComplete={handleMerchantScanComplete}
        onClose={() => setShowMerchantScanner(false)}
        className={className}
      />
    );
  }

  return (
    <div className={cn("", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{t('quickActions')}</h3>
        <div className="flex items-center gap-1">
          <Coins className="h-4 w-4 text-yellow-500" />
          <span className="text-xs text-muted-foreground">Earn & Spend</span>
        </div>
      </div>

      {/* Quick Action Buttons - 3 Column Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Scan Boarding Pass */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <button
            onClick={handleScanBoardingPass}
            className="w-full p-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-200 text-white group"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-white">
                  Scan Pass
                </p>
                <p className="text-xs text-white/80 mt-1">
                  +10 Coins
                </p>
              </div>
            </div>
          </button>
        </motion.div>

        {/* Rate Merchant */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <button
            onClick={handleRateMerchant}
            className="w-full p-4 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200 text-white group"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-white">
                  Rate Shop
                </p>
                <p className="text-xs text-white/80 mt-1">
                  Scan QR
                </p>
              </div>
            </div>
          </button>
        </motion.div>

        {/* My Vouchers */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <button
            onClick={handleMyVouchers}
            className="w-full p-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all duration-200 text-white group"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-white">
                  Vouchers
                </p>
                <p className="text-xs text-white/80 mt-1">
                  Vouchers
                </p>
              </div>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}