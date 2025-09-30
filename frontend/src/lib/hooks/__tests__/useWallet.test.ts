import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../useWallet';
import { Transaction } from '../../types';

// Mock the context
const mockDispatch = jest.fn();
const mockState = {
  user: null,
  wallet: {
    balance: 100,
    pendingTransactions: [],
    lastUpdated: new Date(),
    expiryDate: undefined,
  },
  merchants: [],
  offers: [],
  rewards: [],
  transactions: [
    {
      id: '1',
      type: 'earn' as const,
      amount: 50,
      description: 'Registration bonus',
      timestamp: new Date('2024-01-15T10:00:00Z'),
      status: 'completed' as const,
    },
    {
      id: '2',
      type: 'spend' as const,
      amount: 3,
      description: 'Merchant rating',
      merchantId: 'merchant-1',
      timestamp: new Date('2024-01-15T11:00:00Z'),
      status: 'completed' as const,
    },
  ],
  ui: {
    isLoading: false,
    error: null,
    activeModal: null,
    language: 'en' as const,
  },
};

jest.mock('../../stores/context', () => ({
  useAppContext: () => ({
    state: mockState,
    dispatch: mockDispatch,
  }),
}));

// Create a wrapper component for the hook
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

describe('useWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns wallet state correctly', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    expect(result.current.wallet).toEqual(mockState.wallet);
    expect(result.current.transactions).toEqual(mockState.transactions);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('updates balance correctly', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    act(() => {
      result.current.updateBalance(200);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_BALANCE',
      payload: 200,
    });
  });

  it('adds transaction correctly', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    act(() => {
      result.current.addTransaction({
        type: 'earn',
        amount: 25,
        description: 'Daily bonus',
        status: 'completed',
      });
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_TRANSACTION',
      payload: expect.objectContaining({
        type: 'earn',
        amount: 25,
        description: 'Daily bonus',
        status: 'completed',
        id: expect.any(String),
        timestamp: expect.any(Date),
      }),
    });

    // Should also update balance for earn transaction
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_BALANCE',
      payload: 125, // 100 + 25
    });
  });

  it('earns coins correctly', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    act(() => {
      result.current.earnCoins(30, 'Survey completion', 'merchant-1');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_TRANSACTION',
      payload: expect.objectContaining({
        type: 'earn',
        amount: 30,
        description: 'Survey completion',
        merchantId: 'merchant-1',
        status: 'completed',
      }),
    });
  });

  it('spends coins correctly when sufficient balance', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    act(() => {
      result.current.spendCoins(5, 'Merchant rating', 'merchant-1');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_TRANSACTION',
      payload: expect.objectContaining({
        type: 'spend',
        amount: 5,
        description: 'Merchant rating',
        merchantId: 'merchant-1',
        status: 'completed',
      }),
    });
  });

  it('prevents spending when insufficient balance', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    act(() => {
      result.current.spendCoins(150, 'Expensive rating', 'merchant-1');
    });

    // Should not dispatch transaction
    expect(mockDispatch).not.toHaveBeenCalledWith({
      type: 'ADD_TRANSACTION',
      payload: expect.any(Object),
    });

    // Should set error
    expect(result.current.error).toBe('Insufficient balance');
  });

  it('redeems coins correctly when sufficient balance', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    act(() => {
      result.current.redeemCoins(50, 'Souvenir redemption', 'reward-1');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_TRANSACTION',
      payload: expect.objectContaining({
        type: 'redeem',
        amount: 50,
        description: 'Souvenir redemption',
        rewardId: 'reward-1',
        status: 'completed',
      }),
    });
  });

  it('prevents redemption when insufficient balance', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    act(() => {
      result.current.redeemCoins(150, 'Expensive reward', 'reward-1');
    });

    // Should not dispatch transaction
    expect(mockDispatch).not.toHaveBeenCalledWith({
      type: 'ADD_TRANSACTION',
      payload: expect.any(Object),
    });

    // Should set error
    expect(result.current.error).toBe('Insufficient balance');
  });

  it('refreshes wallet correctly', async () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    await act(async () => {
      await result.current.refreshWallet();
    });

    // Should have set loading state during refresh
    // Since we can't easily test the intermediate loading state,
    // we just verify the function completes without error
    expect(result.current.error).toBe(null);
  });

  it('gets paginated transaction history', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    const page1 = result.current.getTransactionHistory(1, 1);
    expect(page1).toHaveLength(1);
    expect(page1[0].id).toBe('2'); // Most recent transaction first

    const page2 = result.current.getTransactionHistory(2, 1);
    expect(page2).toHaveLength(1);
    expect(page2[0].id).toBe('1'); // Second most recent transaction
  });

  it('calculates hasMoreTransactions correctly', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    expect(result.current.hasMoreTransactions).toBe(true);
  });

  it('clears error after timeout', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    act(() => {
      result.current.spendCoins(150, 'Too expensive');
    });

    expect(result.current.error).toBe('Insufficient balance');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.error).toBe(null);
  });

  it('handles balance updates correctly for different transaction types', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    // Test earn transaction
    act(() => {
      result.current.addTransaction({
        type: 'earn',
        amount: 20,
        description: 'Bonus',
        status: 'completed',
      });
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_BALANCE',
      payload: 120, // 100 + 20
    });

    // Reset mock
    mockDispatch.mockClear();

    // Test spend transaction
    act(() => {
      result.current.addTransaction({
        type: 'spend',
        amount: 10,
        description: 'Rating',
        status: 'completed',
      });
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_BALANCE',
      payload: 90, // 100 - 10
    });
  });

  it('prevents negative balance', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    act(() => {
      result.current.addTransaction({
        type: 'spend',
        amount: 150, // More than current balance
        description: 'Expensive item',
        status: 'completed',
      });
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_BALANCE',
      payload: 0, // Should not go below 0
    });
  });

  it('generates unique transaction IDs', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    const ids = new Set();

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.addTransaction({
          type: 'earn',
          amount: 1,
          description: `Transaction ${i}`,
          status: 'completed',
        });
      }
    });

    // Check that all dispatched transactions have unique IDs
    const transactionCalls = mockDispatch.mock.calls.filter(
      call => call[0].type === 'ADD_TRANSACTION'
    );

    transactionCalls.forEach(call => {
      const transaction = call[0].payload;
      expect(ids.has(transaction.id)).toBe(false);
      ids.add(transaction.id);
    });

    expect(ids.size).toBe(10);
  });
});