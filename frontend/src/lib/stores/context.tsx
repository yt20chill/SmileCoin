'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppAction } from '../types';
import { appReducer, initialState } from './reducers';
import { loadPersistedState, persistState } from './persistence';

// App Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// App Provider
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    // Load persisted state on initialization
    const persistedState = loadPersistedState();
    return persistedState ? { ...initial, ...persistedState } : initial;
  });

  // Persist state changes
  useEffect(() => {
    persistState(state);
  }, [state]);

  const value = {
    state,
    dispatch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use app context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Wallet Context (for more granular wallet operations)
interface WalletContextType {
  wallet: AppState['wallet'];
  updateBalance: (balance: number) => void;
  addTransaction: (transaction: AppState['transactions'][0]) => void;
  setExpiryDate: (date: Date | undefined) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { state, dispatch } = useAppContext();

  const updateBalance = (balance: number) => {
    dispatch({ type: 'UPDATE_BALANCE', payload: balance });
  };

  const addTransaction = (transaction: AppState['transactions'][0]) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
  };

  const setExpiryDate = (date: Date | undefined) => {
    // This would need to be added to the main reducer
    // For now, we'll handle it through the main dispatch
    console.log('Setting expiry date:', date);
  };

  const value = {
    wallet: state.wallet,
    updateBalance,
    addTransaction,
    setExpiryDate,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Merchants Context
interface MerchantsContextType {
  merchants: AppState['merchants'];
  offers: AppState['offers'];
  setMerchants: (merchants: AppState['merchants']) => void;
  setOffers: (offers: AppState['offers']) => void;
  getMerchantById: (id: string) => AppState['merchants'][0] | undefined;
  getOffersByMerchant: (merchantId: string) => AppState['offers'];
}

const MerchantsContext = createContext<MerchantsContextType | undefined>(undefined);

interface MerchantsProviderProps {
  children: ReactNode;
}

export function MerchantsProvider({ children }: MerchantsProviderProps) {
  const { state, dispatch } = useAppContext();

  const setMerchants = (merchants: AppState['merchants']) => {
    dispatch({ type: 'SET_MERCHANTS', payload: merchants });
  };

  const setOffers = (offers: AppState['offers']) => {
    dispatch({ type: 'SET_OFFERS', payload: offers });
  };

  const getMerchantById = (id: string) => {
    return state.merchants.find(merchant => merchant.id === id);
  };

  const getOffersByMerchant = (merchantId: string) => {
    return state.offers.filter(offer => offer.merchantId === merchantId);
  };

  const value = {
    merchants: state.merchants,
    offers: state.offers,
    setMerchants,
    setOffers,
    getMerchantById,
    getOffersByMerchant,
  };

  return (
    <MerchantsContext.Provider value={value}>
      {children}
    </MerchantsContext.Provider>
  );
}

// Hook to use merchants context
export function useMerchants() {
  const context = useContext(MerchantsContext);
  if (context === undefined) {
    throw new Error('useMerchants must be used within a MerchantsProvider');
  }
  return context;
}

// UI Context
interface UIContextType {
  ui: AppState['ui'];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLanguage: (language: 'en' | 'zh-TW') => void;
  clearError: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const { state, dispatch } = useAppContext();

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const setLanguage = (language: 'en' | 'zh-TW') => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value = {
    ui: state.ui,
    setLoading,
    setError,
    setLanguage,
    clearError,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

// Hook to use UI context
export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

// Combined Provider for easier setup
interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AppProvider>
      <WalletProvider>
        <MerchantsProvider>
          <UIProvider>
            {children}
          </UIProvider>
        </MerchantsProvider>
      </WalletProvider>
    </AppProvider>
  );
}