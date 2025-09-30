'use client';

import { Merchant, Offer } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Percent } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MerchantCardProps {
  merchant: Merchant;
  offer?: Offer;
  onSelect: (merchantId: string) => void;
  locale?: 'en' | 'zh-TW';
}

export function MerchantCard({ merchant, offer, onSelect, locale = 'en' }: MerchantCardProps) {
  const t = useTranslations('merchants');
  
  const merchantName = locale === 'zh-TW' ? merchant.nameZh : merchant.name;
  const merchantDescription = locale === 'zh-TW' ? merchant.descriptionZh : merchant.description;
  const merchantAddress = locale === 'zh-TW' ? merchant.location.addressZh : merchant.location.address;
  
  const offerTitle = offer && locale === 'zh-TW' ? offer.titleZh : offer?.title;
  const offerDescription = offer && locale === 'zh-TW' ? offer.descriptionZh : offer?.description;

  return (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-gray-200 hover:border-hk-red/30"
      onClick={() => onSelect(merchant.id)}
      data-testid="merchant-card"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(merchant.id);
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${merchantName}`}
                alt={merchantName}
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {merchantName}
              </h3>
              <div className="flex items-center space-x-1 mt-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm text-gray-600">
                  {merchant.rating.toFixed(1)} ({merchant.totalRatings})
                </span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {merchant.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {merchantDescription}
        </p>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{merchantAddress}</span>
        </div>
        
        {offer && (
          <div className="bg-gradient-to-r from-hk-red/10 to-hk-gold/10 rounded-lg p-3 mb-3 border border-hk-red/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1">
                <Percent className="w-4 h-4 text-hk-red" />
                <span className="font-semibold text-hk-red">
                  {offer.discountPercentage}% {t('discount')}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {t('validUntil')} {new Date(offer.validUntil).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-700 font-medium">
              {offerTitle}
            </p>
            {offerDescription && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {offerDescription}
              </p>
            )}
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full group-hover:bg-hk-red/5 group-hover:border-hk-red group-hover:text-hk-red transition-colors"
        >
          {t('viewDetails')}
        </Button>
      </CardContent>
    </Card>
  );
}