'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRewards } from '@/lib/hooks/useRewards';
import { useAppContext } from '@/lib/stores/context';
import { Transaction, Reward } from '@/lib/types';
import { format } from 'date-fns';
import { Gift } from 'lucide-react';

interface RedemptionHistoryProps {
  limit?: number;
  showTitle?: boolean;
}

export function RedemptionHistory({ limit, showTitle = true }: RedemptionHistoryProps) {
  const t = useTranslations('rewards');
  const tWallet = useTranslations('wallet');
  const { state } = useAppContext();
  const { rewards, getRedemptionHistory } = useRewards();
  const [showAll, setShowAll] = useState(false);
  
  const redemptionHistory = getRedemptionHistory();
  const displayedHistory = limit && !showAll 
    ? redemptionHistory.slice(0, limit)
    : redemptionHistory;
  
  const hasMore = limit && redemptionHistory.length > limit && !showAll;
  const isCurrentLanguageChinese = state.ui.language === 'zh-TW';

  const getRewardInfo = (rewardId?: string): Reward | null => {
    if (!rewardId) return null;
    return rewards.find(r => r.id === rewardId) || null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  if (redemptionHistory.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              Redemption History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No redemptions yet
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              Start redeeming rewards to see your history here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            Redemption History
            <Badge variant="outline" className="ml-auto">
              {redemptionHistory.length}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="space-y-4">
        {displayedHistory.map((transaction) => {
          // Since rewards are now free, we don't have rewardId in transactions
          // We'll just use the transaction description
          const rewardName = transaction.description;

          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Reward Icon */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 relative flex items-center justify-center">
                  <Gift className="h-6 w-6 text-gray-500" />
                </div>
                
                {/* Transaction Info */}
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm truncate">
                    {rewardName}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(transaction.timestamp)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Free Reward Indicator */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="font-semibold text-sm">FREE</span>
                  </div>
                </div>

                {/* Status */}
                <Badge className={getStatusColor(transaction.status)}>
                  {tWallet(transaction.status)}
                </Badge>
              </div>
            </div>
          );
        })}

        {/* Show More Button */}
        {hasMore && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(true)}
            >
              Show All ({redemptionHistory.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}