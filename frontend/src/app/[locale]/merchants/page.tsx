'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { MainLayout, Container, PageHeader } from '@/components/layout';
import { MerchantFilters } from '@/components/merchants/MerchantFilters';
import { MerchantsList } from '@/components/merchants/MerchantsList';
import { MerchantDetail } from '@/components/merchants/MerchantDetail';
import { useMerchants } from '@/lib/hooks/useMerchants';

export default function MerchantsPage() {
  const t = useTranslations('merchants');
  const router = useRouter();
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  
  const {
    filteredMerchants,
    offers,
    isLoading,
    error,
    filters,
    categories,
    setSearch,
    setCategoryFilter,
    setLocationFilter,
    setDiscountFilter,
    refreshData,
    getMerchantById,
    getOffersByMerchant
  } = useMerchants();

  const handleMerchantSelect = (merchantId: string) => {
    setSelectedMerchantId(merchantId);
  };

  const handleBackToList = () => {
    setSelectedMerchantId(null);
  };

  const handleRateClick = () => {
    // Navigate to rating interface - this will be implemented in task 10
    router.push(`/merchants/${selectedMerchantId}/rate`);
  };

  const selectedMerchant = selectedMerchantId ? getMerchantById(selectedMerchantId) : null;
  const merchantOffers = selectedMerchantId ? getOffersByMerchant(selectedMerchantId) : [];

  return (
    <MainLayout>
      <Container>
        <PageHeader 
          title={t('title')}
          subtitle="Discover local businesses and earn Smile Coins"
        />
        
        {selectedMerchant ? (
          <MerchantDetail
            merchant={selectedMerchant}
            offers={merchantOffers}
            onBack={handleBackToList}
          />
        ) : (
          <div className="space-y-6">
            <MerchantFilters
              onSearch={setSearch}
              onCategoryFilter={setCategoryFilter}
              onLocationFilter={setLocationFilter}
              onDiscountFilter={setDiscountFilter}
              categories={categories}
              activeFilters={filters}
            />
            
            <MerchantsList
              merchants={filteredMerchants}
              offers={offers}
              isLoading={isLoading}
              error={error}
              onMerchantSelect={handleMerchantSelect}
              onRetry={refreshData}
            />
          </div>
        )}
      </Container>
    </MainLayout>
  );
}