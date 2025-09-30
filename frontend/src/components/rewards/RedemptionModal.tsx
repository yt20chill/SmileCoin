'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reward } from '@/lib/types';
import { useAppContext } from '@/lib/stores/context';
import { CoinAnimation } from '@/components/wallet/CoinAnimation';

interface RedemptionModalProps {
  reward: Reward;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userBalance: number;
  isRedeeming?: boolean;
  voucherCode?: string;
  redemptionInstructions?: string;
  showSuccess?: boolean;
}

export function RedemptionModal({
  reward,
  isOpen,
  onClose,
  onConfirm,
  userBalance,
  isRedeeming = false,
  voucherCode,
  redemptionInstructions,
  showSuccess = false,
}: RedemptionModalProps) {
  const t = useTranslations('rewards');
  const tCommon = useTranslations('common');
  const { state } = useAppContext();
  const [showAnimation, setShowAnimation] = useState(false);
  
  const isCurrentLanguageChinese = state.ui.language === 'zh-TW';
  const rewardName = isCurrentLanguageChinese ? reward.nameZh : reward.name;
  const rewardDescription = isCurrentLanguageChinese ? reward.descriptionZh : reward.description;
  const instructions = isCurrentLanguageChinese ? reward.redemptionInstructionsZh : reward.redemptionInstructions;
  
  const canClaim = reward.isAvailable; // Vouchers are always available when shown

  useEffect(() => {
    if (showSuccess) {
      setShowAnimation(true);
    }
  }, [showSuccess]);

  const handleAnimationComplete = () => {
    setShowAnimation(false);
  };

  const handleConfirm = () => {
    if (canClaim && !isRedeeming) {
      onConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Success animation - no coins needed for free rewards */}

        <CardHeader className="text-center">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {showSuccess ? 'Voucher Claimed!' : 'Claim Voucher'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Reward Info */}
          <div className="text-center">
            <div className="aspect-video relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 mb-4">
              <img
                src={reward.backgroundImage}
                alt={rewardName}
                className="w-full h-full object-cover"
              />
              {/* Voucher Type Badge Overlay */}
              <div className="absolute top-2 left-2">
                <Badge className="bg-blue-500 text-white font-bold shadow-lg">
                  {reward.voucherType === 'free_item' ? 'FREE' : 
                   reward.voucherType === 'discount' ? 'SAVE' :
                   reward.voucherType === 'experience' ? 'EXPERIENCE' : 'SERVICE'}
                </Badge>
              </div>
              {/* Discount Badge if applicable */}
              {reward.discountPercentage && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-red-500 text-white font-bold shadow-lg">
                    {reward.discountPercentage}% OFF
                  </Badge>
                </div>
              )}
            </div>
            
            <h3 className="font-semibold text-lg mb-2">{rewardName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {rewardDescription}
            </p>
            
            <Badge className="mb-4">
              {t(`category.${reward.category}`)}
            </Badge>
          </div>

          {/* Success State */}
          {showSuccess && voucherCode && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="text-center">
                <div className="text-green-600 dark:text-green-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Voucher Claimed Successfully!
                </h4>
                <div className="bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded p-3 mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Voucher Code:</p>
                  <p className="font-mono text-lg font-bold text-green-600 dark:text-green-400">
                    {voucherCode}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Redemption Instructions */}
          {(showSuccess || redemptionInstructions) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                {t('redemptionInstructions')}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {redemptionInstructions || instructions}
              </p>
            </div>
          )}

          {/* Confirmation State */}
          {!showSuccess && (
            <>
              {/* Voucher Value Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {reward.voucherType === 'discount' && reward.discountPercentage 
                        ? `${reward.discountPercentage}% SAVINGS`
                        : reward.voucherType === 'free_item' 
                        ? 'COMPLIMENTARY'
                        : reward.voucherType === 'experience'
                        ? 'EXPERIENCE'
                        : 'SERVICE'}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {reward.voucherType === 'discount' 
                      ? 'Save money with this discount voucher!'
                      : reward.voucherType === 'free_item'
                      ? 'Enjoy this complimentary item at participating locations.'
                      : reward.voucherType === 'experience'
                      ? 'Unlock a unique Hong Kong experience!'
                      : 'Access premium services with this voucher.'}
                  </p>
                </div>
              </div>

              {/* Smile Coins Information */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">
                    Keep your Smile Coins for rating merchants!
                  </span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 ml-7">
                  Your current balance: {userBalance} coins
                </p>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          {showSuccess ? (
            <Button onClick={onClose} className="w-full">
              {tCommon('close')}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                {tCommon('cancel')}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!canClaim || isRedeeming}
                className="flex-1"
              >
                {isRedeeming ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Claiming...
                  </div>
                ) : (
                  'Claim Voucher'
                )}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}