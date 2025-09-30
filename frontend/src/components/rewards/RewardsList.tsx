'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RewardCard } from './RewardCard';
import { RedemptionModal } from './RedemptionModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useRewards, RedemptionResult } from '@/lib/hooks/useRewards';
import { useWallet } from '@/lib/hooks/useWallet';
import { Reward } from '@/lib/types';
import { toast } from 'sonner';

interface RewardsListProps {
  selectedCategory?: string;
  onCategoryChange?: (category: string | undefined) => void;
}

export function RewardsList({ selectedCategory, onCategoryChange }: RewardsListProps) {
  const t = useTranslations('rewards');
  const tCommon = useTranslations('common');
  const { 
    rewards, 
    isLoading, 
    error, 
    fetchRewards, 
    redeemReward, 
    getRewardsByCategory,
    refreshRewards 
  } = useRewards();
  const { wallet } = useWallet();
  
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);

  const categories = ['voucher', 'experience'];
  
  // Filter rewards based on selected category
  const filteredRewards = selectedCategory 
    ? getRewardsByCategory(selectedCategory)
    : rewards.filter(r => r.isAvailable);

  // Sort rewards by category and name (all are free now)
  const sortedRewards = [...filteredRewards].sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });

  const handleCategoryFilter = (category: string) => {
    const newCategory = selectedCategory === category ? undefined : category;
    onCategoryChange?.(newCategory);
    fetchRewards(newCategory);
  };

  const handleRedeemClick = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward) {
      setSelectedReward(reward);
      setShowRedemptionModal(true);
      setRedemptionResult(null);
    }
  };

  const handleRedemptionConfirm = async () => {
    if (!selectedReward) return;

    setIsRedeeming(true);
    
    try {
      const result = await redeemReward(selectedReward.id);
      setRedemptionResult(result);
      
      if (result.success) {
        toast.success('Voucher claimed successfully!', {
          description: `${selectedReward.name} - Code: ${result.voucherCode}`,
        });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Redemption failed';
      toast.error(errorMessage);
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleModalClose = () => {
    setShowRedemptionModal(false);
    setSelectedReward(null);
    setRedemptionResult(null);
    setIsRedeeming(false);
  };

  const handleRetry = () => {
    if (selectedCategory) {
      fetchRewards(selectedCategory);
    } else {
      refreshRewards();
    }
  };

  // Auto-refresh rewards periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshRewards();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [refreshRewards]);

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === undefined ? "default" : "outline"}
          size="sm"
          onClick={() => handleCategoryFilter('')}
        >
          All Vouchers
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryFilter(category)}
          >
            {t(`category.${category}`)}
          </Button>
        ))}
      </div>

      {/* Rewards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-80"></div>
            </div>
          ))}
        </div>
      ) : sortedRewards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onRedeem={handleRedeemClick}
              isRedeeming={isRedeeming && selectedReward?.id === reward.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No vouchers available
          </h3>
          <p className="text-gray-500 dark:text-gray-500 mb-4">
            {selectedCategory 
              ? `No ${t(`category.${selectedCategory}`).toLowerCase()} vouchers available right now.`
              : 'No vouchers available right now. Check back later!'
            }
          </p>
          <Button variant="outline" onClick={handleRetry}>
            {tCommon('retry')}
          </Button>
        </div>
      )}

      {/* Redemption Modal */}
      {selectedReward && (
        <RedemptionModal
          reward={selectedReward}
          isOpen={showRedemptionModal}
          onClose={handleModalClose}
          onConfirm={handleRedemptionConfirm}
          userBalance={wallet.balance}
          isRedeeming={isRedeeming}
          voucherCode={redemptionResult?.voucher}
          redemptionInstructions={redemptionResult?.redemptionInstructions}
          showSuccess={redemptionResult?.success || false}
        />
      )}
    </div>
  );
}