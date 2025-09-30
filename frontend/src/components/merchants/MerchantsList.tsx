'use client';

import { Merchant, Offer } from '@/lib/types';
import { MerchantCard } from './MerchantCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/lib/hooks/useLocale';

interface MerchantsListProps {
  merchants: Merchant[];
  offers: Offer[];
  isLoading: boolean;
  error: string | null;
  onMerchantSelect: (merchantId: string) => void;
  onRetry?: () => void;
}

export function MerchantsList({
  merchants,
  offers,
  isLoading,
  error,
  onMerchantSelect,
  onRetry
}: MerchantsListProps) {
  const t = useTranslations('merchants');
  const { locale } = useLocale();

  // Create a map of offers by merchant ID for quick lookup
  const offersByMerchant = Array.isArray(offers) && offers.length ? offers.reduce((acc, offer) => {
    if (!acc[offer.merchantId]) {
      acc[offer.merchantId] = [];
    }
    acc[offer.merchantId].push(offer);
    return acc;
  }, {} as Record<string, Offer[]>) : {} as Record<string, Offer[]>;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12" data-testid="merchants-loading">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12" data-testid="merchants-error">
        <ErrorMessage 
          message={error} 
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (merchants.length === 0) {
    return (
      <div className="text-center py-12" data-testid="no-merchants">
        <div className="text-gray-500 mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No merchants found
        </h3>
        <p className="text-gray-500">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="merchants-grid">
      {merchants.map((merchant) => {
        // Get the best offer for this merchant (highest discount)
        const merchantOffers = offersByMerchant[merchant.id] || [];
        const bestOffer = merchantOffers.length > 0 
          ? merchantOffers.reduce((best, current) => 
              current.discountPercentage > best.discountPercentage ? current : best
            )
          : undefined;

        return (
          <MerchantCard
            key={merchant.id}
            merchant={merchant}
            offer={bestOffer}
            onSelect={onMerchantSelect}
            locale={locale as 'en' | 'zh-TW'}
          />
        );
      })}
    </div>
  );
}