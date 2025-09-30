# State Management System

This directory contains the complete state management implementation for the Tourist Frontend PWA, including React Context providers, reducers, persistence, and custom hooks.

## Architecture Overview

The state management system is built using:
- **React Context + useReducer** for global state management
- **Custom hooks** for data fetching and state updates
- **IndexedDB/localStorage** for offline persistence
- **Offline queue** for action synchronization

## Core Components

### 1. Reducers (`reducers.ts`)
- `appReducer`: Main application state reducer
- `walletReducer`: Wallet-specific operations
- `uiReducer`: UI state management

### 2. Context Providers (`context.tsx`)
- `AppProvider`: Main application context
- `WalletProvider`: Wallet-specific context
- `MerchantsProvider`: Merchants and offers context
- `UIProvider`: UI state context
- `Providers`: Combined provider wrapper

### 3. Persistence (`persistence.ts`)
- State persistence to localStorage
- Offline action queue management
- Cache management with TTL
- Storage availability checks

### 4. Custom Hooks

#### State Management Hooks (`useAppState.ts`)
- `useAppState()`: Main app state and actions
- `useWalletState()`: Wallet operations (earn, spend, redeem)
- `useMerchantsState()`: Merchant and offer management
- `useUIState()`: UI state and error handling

#### Data Fetching Hooks (`useDataFetching.ts`)
- `useDataFetching()`: Generic data fetching with caching
- `useApiCall()`: API calls with offline queue support
- `useOfflineQueue()`: Offline action queue management
- `useWalletData()`: Wallet data fetching
- `useMerchantsData()`: Merchants data fetching
- `useOffersData()`: Offers data fetching
- `useRewardsData()`: Rewards data fetching
- `useTransactionsData()`: Transaction history fetching

#### Utility Hooks
- `useOnlineStatus()`: Online/offline status detection
- `useLocale()`: Enhanced locale management with state integration

## Usage Examples

### 1. Setting up Providers

```tsx
// app/layout.tsx
import { Providers } from '@/lib/stores';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 2. Using Wallet State

```tsx
// components/wallet/CoinBalance.tsx
import { useWalletState } from '@/lib/stores';

export function CoinBalance() {
  const { wallet, actions } = useWalletState();

  const handleEarnCoins = async () => {
    await actions.earnCoins(10, 'Registration bonus');
  };

  return (
    <div>
      <h2>Balance: {wallet.balance} coins</h2>
      <button onClick={handleEarnCoins}>Earn Coins</button>
    </div>
  );
}
```

### 3. Using Merchants State

```tsx
// components/merchants/MerchantList.tsx
import { useMerchantsState } from '@/lib/stores';

export function MerchantList() {
  const { merchants, actions } = useMerchantsState();

  useEffect(() => {
    actions.loadMerchants();
  }, []);

  const handleRating = async (merchantId: string, rating: number) => {
    await actions.rateMerchant(merchantId, rating);
  };

  return (
    <div>
      {merchants.map(merchant => (
        <MerchantCard 
          key={merchant.id} 
          merchant={merchant}
          onRate={(rating) => handleRating(merchant.id, rating)}
        />
      ))}
    </div>
  );
}
```

### 4. Using Data Fetching with Offline Support

```tsx
// components/rewards/RewardsList.tsx
import { useRewardsData, useWalletState } from '@/lib/stores';

export function RewardsList() {
  const { data: rewards, isLoading, error, refetch } = useRewardsData();
  const { wallet, actions } = useWalletState();

  const handleRedeem = async (rewardId: string, coinsRequired: number) => {
    try {
      await actions.redeemCoins(coinsRequired, 'Reward redemption', rewardId);
      refetch(); // Refresh rewards list
    } catch (error) {
      console.error('Redemption failed:', error);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      {rewards?.map(reward => (
        <RewardCard 
          key={reward.id}
          reward={reward}
          userBalance={wallet.balance}
          onRedeem={() => handleRedeem(reward.id, reward.coinsRequired)}
        />
      ))}
    </div>
  );
}
```

### 5. Using UI State for Error Handling

```tsx
// components/common/ErrorHandler.tsx
import { useUIState } from '@/lib/stores';

export function ErrorHandler() {
  const { ui, actions } = useUIState();

  const handleAsyncOperation = async () => {
    const result = await actions.withLoading(async () => {
      // Some async operation that might fail
      const response = await fetch('/api/some-endpoint');
      if (!response.ok) throw new Error('Operation failed');
      return response.json();
    });

    if (result) {
      console.log('Operation succeeded:', result);
    }
  };

  return (
    <div>
      {ui.isLoading && <LoadingSpinner />}
      {ui.error && (
        <ErrorMessage 
          message={ui.error} 
          onDismiss={actions.clearError}
        />
      )}
      <button onClick={handleAsyncOperation}>
        Perform Operation
      </button>
    </div>
  );
}
```

### 6. Offline Queue Management

```tsx
// components/common/OfflineIndicator.tsx
import { useOnlineStatus, useOfflineQueue } from '@/lib/stores';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { queue, processQueue } = useOfflineQueue();

  return (
    <div>
      <div className={`status ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? 'Online' : 'Offline'}
      </div>
      {queue.length > 0 && (
        <div>
          {queue.length} actions queued
          {isOnline && (
            <button onClick={processQueue}>
              Sync Now
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

## State Persistence

The system automatically persists the following state:
- User information
- Wallet balance and transactions
- UI language preference

Cached data includes:
- Merchants list (1 hour TTL)
- Offers (1 hour TTL)
- Rewards (1 hour TTL)
- Wallet data (1 hour TTL)

## Offline Support

The system provides comprehensive offline support:

1. **Cached Data**: Previously loaded data is available offline
2. **Action Queue**: Actions are queued when offline and synced when online
3. **Graceful Degradation**: UI adapts to offline state
4. **Automatic Sync**: Queued actions are processed when connectivity returns

## Error Handling

The system includes robust error handling:
- Network errors with retry logic
- Validation errors with user-friendly messages
- Blockchain service errors with graceful fallbacks
- Storage quota errors with cleanup

## Performance Considerations

- State updates are batched using React's automatic batching
- Data fetching includes caching and deduplication
- Offline persistence uses efficient storage strategies
- Component re-renders are minimized through proper context structure

## Testing

The state management system is designed to be easily testable:
- Pure reducer functions for unit testing
- Mock providers for component testing
- Offline simulation for integration testing
- Error boundary testing for error scenarios