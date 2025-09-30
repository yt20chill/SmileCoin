'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MainLayout, Container, PageHeader } from '@/components/layout';
import { CoinBalance, CoinAnimation, TransactionHistory, QuickActions, BoardingPassHistory } from '@/components/wallet';
import { useWallet } from '@/lib/hooks/useWallet';
import { CoinAnimationProps } from '@/lib/types';

export default function WalletPage() {
  const t = useTranslations('wallet');
  const {
    wallet,
    transactions,
    isLoading,
    error,
    refreshWallet,
    getTransactionHistory,
    hasMoreTransactions,
  } = useWallet();

  const [showAnimation, setShowAnimation] = useState(false);
  const [animationConfig, setAnimationConfig] = useState<CoinAnimationProps | null>(null);
  const [previousBalance, setPreviousBalance] = useState(wallet.balance);

  // Trigger animation when balance changes
  useEffect(() => {
    if (wallet.balance !== previousBalance && previousBalance !== 0) {
      const difference = wallet.balance - previousBalance;
      const type = difference > 0 ? 'earn' : 'spend';
      
      setAnimationConfig({
        type,
        amount: Math.abs(difference),
        onComplete: () => {
          setAnimationConfig(null);
          setShowAnimation(false);
        },
      });
      setShowAnimation(true);
    }
    setPreviousBalance(wallet.balance);
  }, [wallet.balance, previousBalance]);

  // Load initial data
  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  const handleLoadMoreTransactions = () => {
    // In a real app, this would fetch more transactions from the API
    console.log('Loading more transactions...');
  };

  return (
    <MainLayout>
      <Container>
        <PageHeader 
          title={t('title')}
          subtitle={t('subtitle')}
        />
        
        <div className="space-y-4 pb-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Coin Balance */}
          <CoinBalance
            balance={wallet.balance}
            isLoading={isLoading}
            showAnimation={showAnimation}
            expiryDate={wallet.expiryDate}
          />

          {/* Quick Actions - Mobile-First Design */}
          <QuickActions
            onScanComplete={(coinsEarned) => {
              setAnimationConfig({
                type: 'earn',
                amount: coinsEarned,
                onComplete: () => {
                  setAnimationConfig(null);
                  setShowAnimation(false);
                },
              });
              setShowAnimation(true);
            }}
          />

          {/* Boarding Pass History */}
          <BoardingPassHistory />

          {/* Transaction History */}
          <TransactionHistory
            transactions={getTransactionHistory(1, 20)}
            onLoadMore={handleLoadMoreTransactions}
            hasMore={hasMoreTransactions}
            isLoading={isLoading}
          />
        </div>

        {/* Coin Animation Overlay */}
        {animationConfig && (
          <CoinAnimation
            type={animationConfig.type}
            amount={animationConfig.amount}
            onComplete={animationConfig.onComplete}
          />
        )}
      </Container>
    </MainLayout>
  );
}