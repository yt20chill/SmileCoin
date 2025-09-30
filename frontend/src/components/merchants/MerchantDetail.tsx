'use client';

import { useState } from 'react';
import { Merchant, Offer, Rating } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock, Phone, Globe, Percent, ArrowLeft, QrCode } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/lib/hooks/useLocale';
import { useWallet } from '@/lib/hooks/useWallet';
import { useRating } from '@/lib/hooks/useRating';
import { RatingInterface } from './RatingInterface';
import { RatingHistory } from './RatingHistory';
import { QRScanHistory } from './QRScanHistory';

interface MerchantDetailProps {
  merchant: Merchant;
  offers: Offer[];
  ratings?: Rating[];
  merchants?: Merchant[];
  onBack: () => void;
}

export function MerchantDetail({ 
  merchant, 
  offers, 
  ratings = [], 
  merchants = [], 
  onBack 
}: MerchantDetailProps) {
  const t = useTranslations('merchants');
  const { locale } = useLocale();
  const { wallet } = useWallet();
  const { submitRating } = useRating();
  const [showRatingInterface, setShowRatingInterface] = useState(false);
  const [showQRHistory, setShowQRHistory] = useState(false);
  
  const merchantName = locale === 'zh-TW' ? merchant.nameZh : merchant.name;
  const merchantDescription = locale === 'zh-TW' ? merchant.descriptionZh : merchant.description;
  const merchantAddress = locale === 'zh-TW' ? merchant.location.addressZh : merchant.location.address;

  const activeOffers = offers.filter(offer => 
    offer.isActive && new Date(offer.validUntil) > new Date()
  );

  const handleRatingSubmit = async (rating: number, coinsSpent: number, qrCodeData: string) => {
    try {
      await submitRating(merchant.id, rating, undefined);
      setShowRatingInterface(false);
    } catch (error) {
      // Error is handled by the rating interface
      console.error('Rating submission failed:', error);
    }
  };

  return (
    <div className="space-y-6" data-testid="merchant-detail">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center space-x-2"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
      </div>

      {/* Merchant Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start space-x-4">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              <img
                src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${merchantName}`}
                alt={merchantName}
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {merchantName}
                  </h1>
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-gray-900">
                        {merchant.rating.toFixed(1)}
                      </span>
                      <span className="text-gray-500">
                        ({merchant.totalRatings} {merchant.totalRatings === 1 ? 'rating' : 'ratings'})
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {merchant.category}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                {merchantDescription}
              </p>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{merchantAddress}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button 
              onClick={() => setShowRatingInterface(true)}
              className="w-full bg-gradient-to-r from-hk-red to-hk-gold hover:from-hk-red/90 hover:to-hk-gold/90 text-white"
              data-testid="rate-merchant-button"
            >
              <Star className="w-4 h-4 mr-2" />
              {t('rateExperience')}
            </Button>
            <Button 
              onClick={() => setShowQRHistory(true)}
              variant="outline"
              className="w-full"
              data-testid="view-qr-history-button"
            >
              <QrCode className="w-4 h-4 mr-2" />
              View QR Scan History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offers Section */}
      {activeOffers.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Percent className="w-5 h-5 mr-2 text-hk-red" />
              {t('offers')} ({activeOffers.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeOffers.map((offer) => {
                const offerTitle = locale === 'zh-TW' ? offer.titleZh : offer.title;
                const offerDescription = locale === 'zh-TW' ? offer.descriptionZh : offer.description;
                const offerTerms = locale === 'zh-TW' ? offer.termsAndConditionsZh : offer.termsAndConditions;

                return (
                  <div
                    key={offer.id}
                    className="bg-gradient-to-r from-hk-red/10 to-hk-gold/10 rounded-lg p-4 border border-hk-red/20"
                    data-testid={`offer-${offer.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="default" className="bg-hk-red hover:bg-hk-red/90">
                            {offer.discountPercentage}% OFF
                          </Badge>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-1" />
                            {t('validUntil')} {new Date(offer.validUntil).toLocaleDateString()}
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {offerTitle}
                        </h3>
                        <p className="text-gray-700 mb-3">
                          {offerDescription}
                        </p>
                        {offerTerms && (
                          <div className="text-xs text-gray-600 bg-white/50 rounded p-2">
                            <strong>Terms & Conditions:</strong> {offerTerms}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating History */}
      <RatingHistory
        merchantId={merchant.id}
        ratings={ratings}
        merchants={merchants}
      />

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            Contact Information
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-3 flex-shrink-0" />
              <span>{merchantAddress}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Phone className="w-4 h-4 mr-3 flex-shrink-0" />
              <span>+852 1234 5678</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Globe className="w-4 h-4 mr-3 flex-shrink-0" />
              <span>www.example.com</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-3 flex-shrink-0" />
              <span>Mon-Sun: 9:00 AM - 10:00 PM</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Interface Modal */}
      {showRatingInterface && (
        <RatingInterface
          merchantId={merchant.id}
          merchantName={merchantName}
          userBalance={wallet.balance}
          onRatingSubmit={handleRatingSubmit}
          onClose={() => setShowRatingInterface(false)}
        />
      )}

      {/* QR Scan History Modal */}
      {showQRHistory && (
        <QRScanHistory
          isOpen={showQRHistory}
          onClose={() => setShowQRHistory(false)}
        />
      )}
    </div>
  );
}