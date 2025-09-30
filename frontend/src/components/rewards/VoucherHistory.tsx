'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Voucher } from '@/lib/types';
import { useAppContext } from '@/lib/stores/context';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

interface VoucherHistoryProps {
  onRetry?: () => void;
}

export function VoucherHistory({ onRetry }: VoucherHistoryProps) {
  const t = useTranslations('rewards');
  const tCommon = useTranslations('common');
  const { state } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'used' | 'expired'>('all');

  const isCurrentLanguageChinese = state.ui.language === 'zh-TW';

  // Fetch user's vouchers
  const fetchVouchers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, this would fetch from API
      // For now, use mock data from state
      const userVouchers = state.vouchers || [];
      setVouchers(userVouchers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vouchers';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [state.vouchers]);

  // Filter vouchers based on selected filter
  const filteredVouchers = vouchers.filter(voucher => {
    const now = new Date();
    const isExpired = voucher.expiresAt && voucher.expiresAt < now;
    
    switch (filter) {
      case 'active':
        return !voucher.isUsed && !isExpired;
      case 'used':
        return voucher.isUsed;
      case 'expired':
        return isExpired && !voucher.isUsed;
      default:
        return true;
    }
  });

  const getVoucherTypeColor = (voucherType: string) => {
    switch (voucherType) {
      case 'discount':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'free_item':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'experience':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'service':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getVoucherStatus = (voucher: Voucher) => {
    const now = new Date();
    const isExpired = voucher.expiresAt && voucher.expiresAt < now;
    
    if (voucher.isUsed) {
      return { status: 'used', color: 'bg-gray-100 text-gray-800' };
    } else if (isExpired) {
      return { status: 'expired', color: 'bg-red-100 text-red-800' };
    } else {
      return { status: 'active', color: 'bg-green-100 text-green-800' };
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(isCurrentLanguageChinese ? 'zh-TW' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleRetry = () => {
    fetchVouchers();
    onRetry?.();
  };

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
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({vouchers.length})
        </Button>
        <Button
          variant={filter === 'active' ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active ({vouchers.filter(v => !v.isUsed && (!v.expiresAt || v.expiresAt > new Date())).length})
        </Button>
        <Button
          variant={filter === 'used' ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter('used')}
        >
          Used ({vouchers.filter(v => v.isUsed).length})
        </Button>
        <Button
          variant={filter === 'expired' ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter('expired')}
        >
          Expired ({vouchers.filter(v => !v.isUsed && v.expiresAt && v.expiresAt < new Date()).length})
        </Button>
      </div>

      {/* Vouchers List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      ) : filteredVouchers.length > 0 ? (
        <div className="space-y-4">
          {filteredVouchers.map((voucher) => {
            const status = getVoucherStatus(voucher);
            const voucherName = isCurrentLanguageChinese ? voucher.rewardNameZh : voucher.rewardName;
            const instructions = isCurrentLanguageChinese ? voucher.redemptionInstructionsZh : voucher.redemptionInstructions;

            return (
              <Card key={voucher.id} className="transition-all duration-200 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg leading-tight mb-2">
                        {voucherName}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getVoucherTypeColor(voucher.voucherType)}>
                          {t(`voucherType.${voucher.voucherType}`)}
                        </Badge>
                        <Badge className={status.color}>
                          {status.status === 'used' ? t('isUsed') : 
                           status.status === 'expired' ? 'Expired' : 'Active'}
                        </Badge>
                        {voucher.discountPercentage && (
                          <Badge variant="outline">
                            {voucher.discountPercentage}% OFF
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {voucher.code}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('voucherCode')}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t('claimedAt')}:</span>
                      <div className="font-medium">{formatDate(voucher.claimedAt)}</div>
                    </div>
                    {voucher.expiresAt && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">{t('expiresAt')}:</span>
                        <div className="font-medium">{formatDate(voucher.expiresAt)}</div>
                      </div>
                    )}
                    {voucher.usedAt && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Used:</span>
                        <div className="font-medium">{formatDate(voucher.usedAt)}</div>
                      </div>
                    )}
                  </div>

                  {instructions && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                        {t('redemptionInstructions')}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {instructions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            {t('noVouchers')}
          </h3>
          <p className="text-gray-500 dark:text-gray-500 mb-4">
            {t('startClaiming')}
          </p>
          <Button variant="outline" onClick={handleRetry}>
            {tCommon('retry')}
          </Button>
        </div>
      )}
    </div>
  );
}