'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MainLayout, Container, PageHeader } from '@/components/layout';
import { MerchantDetail } from '@/components/merchants/MerchantDetail';
import { RatingInterface } from '@/components/merchants/RatingInterface';
import { useMerchants } from '@/lib/hooks/useMerchants';
import { useRating } from '@/lib/hooks/useRating';
import { useWallet } from '@/lib/hooks/useWallet';
import { Offer } from '@/lib/types';

export default function MerchantDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const t = useTranslations('merchants');
  
  const merchantId = params.merchantId as string;
  const showRating = searchParams.get('showRating') === 'true';
  
  const { merchants, isLoading, error } = useMerchants();
  const { submitRating, isSubmitting } = useRating();
  const { wallet } = useWallet();
  
  const [showRatingInterface, setShowRatingInterface] = useState(showRating);
  
  // Find the merchant by ID
  const merchant = merchants.find(m => m.id === merchantId);
  
  // Mock offers for this merchant (in a real app, this would be fetched from API)
  const mockOffers: Offer[] = [
    {
      id: `offer-${merchantId}-1`,
      merchantId,
      title: '20% Off Special',
      titleZh: '特價8折優惠',
      description: 'Get 20% off your next order',
      descriptionZh: '下次訂單享8折優惠',
      discountPercentage: 20,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      termsAndConditions: 'Valid for dine-in only',
      termsAndConditionsZh: '僅限堂食',
      isActive: true,
    },
  ];
  
  // Show rating interface if URL parameter is set
  useEffect(() => {
    if (showRating) {
      setShowRatingInterface(true);
    }
  }, [showRating]);

  const handleRatingSubmit = async (rating: number, coinsSpent: number, qrCodeData: string) => {
    try {
      await submitRating(merchantId, rating);
      setShowRatingInterface(false);
    } catch (error) {
      console.error('Rating submission failed:', error);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <Container>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </Container>
      </MainLayout>
    );
  }

  if (error || !merchant) {
    return (
      <MainLayout>
        <Container>
          <PageHeader 
            title="Merchant Not Found"
            subtitle="The merchant you're looking for doesn't exist"
          />
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {error || 'This merchant could not be found.'}
            </p>
          </div>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container>
        <PageHeader 
          title={merchant.name}
          subtitle={merchant.category}
        />
        
        <div className="space-y-6">
          {/* Merchant Details */}
          <MerchantDetail 
            merchant={merchant}
            offers={mockOffers}
            ratings={[]}
            merchants={merchants}
            onBack={() => window.history.back()}
          />
          
          {/* Rating Interface Modal/Overlay */}
          {showRatingInterface && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <RatingInterface
                  merchantId={merchantId}
                  merchantName={merchant.name}
                  userBalance={wallet.balance}
                  onRatingSubmit={handleRatingSubmit}
                  onClose={() => setShowRatingInterface(false)}
                  isQRAlreadyScanned={showRating} // Pass true when coming from QR scanner
                />
              </div>
            </div>
          )}
        </div>
      </Container>
    </MainLayout>
  );
}