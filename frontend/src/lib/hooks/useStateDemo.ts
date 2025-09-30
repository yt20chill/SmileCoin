'use client';

import { useEffect } from 'react';
import { useAppState, useWalletState, useMerchantsState, useUIState } from './useAppState';
import { useWalletData, useMerchantsData, useOffersData, useRewardsData } from './useDataFetching';
import { useOnlineStatus } from './useOnlineStatus';

/**
 * Demo hook showing how to use the state management system
 * This demonstrates the complete integration of all state management features
 */
export function useStateDemo(userId?: string) {
  const { state, actions } = useAppState();
  const { wallet, actions: walletActions } = useWalletState();
  const { merchants, offers, actions: merchantActions } = useMerchantsState();
  const { ui, actions: uiActions } = useUIState();
  const isOnline = useOnlineStatus();

  // Data fetching hooks
  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useWalletData(userId);
  const { data: merchantsData, isLoading: merchantsLoading, refetch: refetchMerchants } = useMerchantsData();
  const { data: offersData, isLoading: offersLoading, refetch: refetchOffers } = useOffersData();
  const { data: rewardsData, isLoading: rewardsLoading, refetch: refetchRewards } = useRewardsData();

  // Initialize data when fetched
  useEffect(() => {
    if (walletData) {
      actions.updateBalance(walletData.balance);
    }
  }, [walletData, actions]);

  useEffect(() => {
    if (merchantsData) {
      actions.setMerchants(merchantsData);
    }
  }, [merchantsData, actions]);

  useEffect(() => {
    if (offersData) {
      actions.setOffers(offersData);
    }
  }, [offersData, actions]);

  useEffect(() => {
    if (rewardsData) {
      actions.setRewards(rewardsData);
    }
  }, [rewardsData, actions]);

  // Example functions demonstrating state management usage
  const demoEarnCoins = async () => {
    try {
      await walletActions.earnCoins(10, 'Demo coin earning', 'demo-merchant');
      uiActions.showError('Earned 10 coins!', 3000);
    } catch (error) {
      console.error('Failed to earn coins:', error);
    }
  };

  const demoSpendCoins = async () => {
    try {
      await walletActions.spendCoins(5, 'Demo rating submission', 'demo-merchant');
      uiActions.showError('Spent 5 coins on rating!', 3000);
    } catch (error) {
      console.error('Failed to spend coins:', error);
    }
  };

  const demoRedeemReward = async () => {
    // Rewards are now free, so no coins needed
    uiActions.showError('Free reward claimed!', 3000);
  };

  const demoRateMerchant = async (merchantId: string, rating: number) => {
    try {
      await merchantActions.rateMerchant(merchantId, rating);
      await walletActions.spendCoins(rating, `Rated merchant ${merchantId}`, merchantId);
    } catch (error) {
      console.error('Failed to rate merchant:', error);
    }
  };

  const demoToggleLanguage = () => {
    const newLanguage = ui.language === 'en' ? 'zh-TW' : 'en';
    actions.setLanguage(newLanguage);
  };

  const refreshAllData = async () => {
    await Promise.all([
      refetchWallet(),
      refetchMerchants(),
      refetchOffers(),
      refetchRewards(),
    ]);
  };

  return {
    // State
    state,
    wallet,
    merchants,
    offers,
    ui,
    isOnline,
    
    // Loading states
    isLoading: walletLoading || merchantsLoading || offersLoading || rewardsLoading,
    
    // Actions
    actions: {
      ...actions,
      ...walletActions,
      ...merchantActions,
      ...uiActions,
    },
    
    // Demo functions
    demo: {
      earnCoins: demoEarnCoins,
      spendCoins: demoSpendCoins,
      redeemReward: demoRedeemReward,
      rateMerchant: demoRateMerchant,
      toggleLanguage: demoToggleLanguage,
      refreshAllData,
    },
    
    // Utility functions
    utils: {
      getMerchantById: merchantActions.getMerchantById,
      getOffersByMerchant: merchantActions.getOffersByMerchant,
      hasEnoughCoins: (amount: number) => wallet.balance >= amount,
      isExpiringSoon: () => {
        if (!wallet.expiryDate) return false;
        const daysUntilExpiry = Math.ceil(
          (wallet.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 7;
      },
    },
  };
}