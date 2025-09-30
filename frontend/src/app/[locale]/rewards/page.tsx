'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MainLayout, Container, PageHeader } from '@/components/layout';
import { RewardsList, VoucherHistory } from '@/components/rewards';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/lib/hooks/useWallet';

export default function VouchersPage() {
  const t = useTranslations('rewards');
  const tWallet = useTranslations('wallet');
  const { wallet } = useWallet();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <MainLayout>
      <Container>
        <PageHeader 
          title={t('title')}
          subtitle="Claim free vouchers and experiences in Hong Kong"
        />
        
        {/* Wallet Balance Summary - Keep coins for rating merchants */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
            >
              {showHistory ? t('hideHistory') : t('showHistory')}
            </Button>
          </div>
        </div>

        {/* Toggle between voucher list and history */}
        {showHistory ? (
          <VoucherHistory />
        ) : (
          <RewardsList 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        )}
      </Container>
    </MainLayout>
  );
}