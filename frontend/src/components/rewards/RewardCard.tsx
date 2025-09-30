'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Reward } from '@/lib/types';
import { useAppContext } from '@/lib/stores/context';

interface RewardCardProps {
  reward: Reward;
  onRedeem: (rewardId: string) => void;
  isRedeeming?: boolean;
}

export function RewardCard({ reward, onRedeem, isRedeeming = false }: RewardCardProps) {
  const t = useTranslations('rewards');
  const { state } = useAppContext();
  const [imageError, setImageError] = useState(false);
  
  const isAvailable = reward.isAvailable;
  const isCurrentLanguageChinese = state.ui.language === 'zh-TW';
  
  const rewardName = isCurrentLanguageChinese ? reward.nameZh : reward.name;
  const rewardDescription = isCurrentLanguageChinese ? reward.descriptionZh : reward.description;

  const handleImageError = () => {
    setImageError(true);
  };

  const handleRedeem = () => {
    if (isAvailable && !isRedeeming) {
      onRedeem(reward.id);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'voucher':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'experience':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getVoucherTypeIcon = (voucherType: string) => {
    switch (voucherType) {
      case 'discount':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      case 'free_item':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        );
      case 'experience':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'service':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        );
    }
  };

  return (
    <Card className={`h-full transition-all duration-200 hover:shadow-lg ${
      !isAvailable ? 'opacity-60' : 'hover:scale-[1.02]'
    }`}>
      <CardHeader className="p-4">
        {/* Food Background Image */}
        <div className="aspect-video relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
          {!imageError ? (
            <div className="relative w-full h-full">
              <img
                src={reward.backgroundImage}
                alt={rewardName}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-black/20" />
              {/* Discount Badge if applicable */}
              {reward.discountPercentage && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-red-500 text-white font-bold shadow-lg">
                    {reward.discountPercentage}% OFF
                  </Badge>
                </div>
              )}
              {/* Voucher Type Badge */}
              <div className="absolute top-2 left-2">
                <Badge className="bg-green-500 text-white font-bold shadow-lg flex items-center gap-1">
                  {getVoucherTypeIcon(reward.voucherType)}
                  {reward.voucherType === 'free_item' ? 'FREE' : 
                   reward.voucherType === 'discount' ? 'SAVE' :
                   reward.voucherType === 'experience' ? 'EXPERIENCE' : 'SERVICE'}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                data-testid="fallback-icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex items-start justify-between gap-2 mt-3">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">
            {rewardName}
          </h3>
          <Badge className={getCategoryColor(reward.category)}>
            {t(`category.${reward.category}`)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
          {rewardDescription}
        </p>
        
        {/* Value Proposition - Focus on benefit, not price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              {getVoucherTypeIcon(reward.voucherType)}
              <span className="font-medium text-sm">
                {reward.voucherType === 'discount' && reward.discountPercentage 
                  ? `${reward.discountPercentage}% Savings`
                  : reward.voucherType === 'free_item' 
                  ? 'Complimentary Item'
                  : reward.voucherType === 'experience'
                  ? 'Unique Experience'
                  : 'Premium Service'}
              </span>
            </div>
          </div>
          
          {reward.isAvailable ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Available
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-600 border-red-600">
              Unavailable
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleRedeem}
          disabled={!isAvailable || isRedeeming}
          className="w-full"
          variant={isAvailable ? "default" : "outline"}
        >
          {isRedeeming ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Claiming...
            </div>
          ) : isAvailable ? (
            'Claim Voucher'
          ) : (
            'Unavailable'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}