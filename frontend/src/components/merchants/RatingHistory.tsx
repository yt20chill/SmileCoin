'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Coins, Clock, User, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/lib/hooks/useLocale';
import { Rating, Merchant } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface RatingHistoryProps {
  merchantId: string;
  ratings: Rating[];
  merchants: Merchant[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

interface RatingWithMerchant extends Rating {
  merchant?: Merchant;
}

export function RatingHistory({ 
  merchantId, 
  ratings, 
  merchants, 
  isLoading = false,
  onLoadMore,
  hasMore = false 
}: RatingHistoryProps) {
  const t = useTranslations('rating');
  const { locale } = useLocale();
  const [expandedRatings, setExpandedRatings] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(5);

  // Filter ratings for this merchant and add merchant info
  const merchantRatings: RatingWithMerchant[] = ratings
    .filter(rating => rating.merchantId === merchantId)
    .map(rating => ({
      ...rating,
      merchant: merchants.find(m => m.id === rating.merchantId)
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const visibleRatings = merchantRatings.slice(0, displayCount);
  const canShowMore = displayCount < merchantRatings.length;

  const toggleExpanded = (ratingId: string) => {
    const newExpanded = new Set(expandedRatings);
    if (newExpanded.has(ratingId)) {
      newExpanded.delete(ratingId);
    } else {
      newExpanded.add(ratingId);
    }
    setExpandedRatings(newExpanded);
  };

  const getRatingLabel = (coinsSpent: number) => {
    switch (coinsSpent) {
      case 1: return { label: t('poor'), color: 'bg-red-500' };
      case 2: return { label: t('good'), color: 'bg-yellow-500' };
      case 3: return { label: t('excellent'), color: 'bg-green-500' };
      default: return { label: t('unknown'), color: 'bg-gray-500' };
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const averageRating = merchantRatings.length > 0 
    ? merchantRatings.reduce((sum, rating) => sum + rating.coinsSpent, 0) / merchantRatings.length
    : 0;

  if (merchantRatings.length === 0) {
    return (
      <Card data-testid="rating-history-empty">
        <CardContent className="text-center py-8">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('noRatingsYet')}
          </h3>
          <p className="text-gray-600">
            {t('beFirstToRate')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="rating-history">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>{t('customerRatings')}</span>
            <Badge variant="secondary">
              {merchantRatings.length}
            </Badge>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{t('average')}:</span>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{averageRating.toFixed(1)}</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence>
          {visibleRatings.map((rating, index) => {
            const ratingInfo = getRatingLabel(rating.coinsSpent);
            const isExpanded = expandedRatings.has(rating.id);
            
            return (
              <motion.div
                key={rating.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                data-testid={`rating-item-${rating.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Rating Badge */}
                    <div className={`w-8 h-8 rounded-full ${ratingInfo.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-sm">{rating.coinsSpent}</span>
                    </div>

                    {/* Rating Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">{ratingInfo.label}</span>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Coins className="w-3 h-3" />
                          <span>{rating.coinsSpent}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{t('tourist')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(rating.timestamp)}</span>
                        </div>
                      </div>

                      {/* Comment */}
                      {rating.comment && (
                        <div className="mt-3">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className={`text-gray-700 ${!isExpanded && rating.comment.length > 100 ? 'line-clamp-2' : ''}`}>
                                {rating.comment}
                              </p>
                              {rating.comment.length > 100 && (
                                <button
                                  onClick={() => toggleExpanded(rating.id)}
                                  className="text-blue-600 hover:text-blue-700 text-sm mt-1 flex items-center space-x-1"
                                  data-testid={`expand-comment-${rating.id}`}
                                >
                                  <span>{isExpanded ? t('showLess') : t('showMore')}</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Load More Button */}
        {canShowMore && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              onClick={() => setDisplayCount(prev => prev + 5)}
              disabled={isLoading}
              data-testid="load-more-ratings"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                  {t('loading')}
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  {t('showMore')} ({merchantRatings.length - displayCount} {t('more')})
                </>
              )}
            </Button>
          </div>
        )}

        {/* External Load More */}
        {hasMore && onLoadMore && (
          <div className="text-center pt-4 border-t">
            <Button
              variant="ghost"
              onClick={onLoadMore}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700"
              data-testid="load-more-external"
            >
              {t('loadMoreFromServer')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}