import { renderHook, act, waitFor } from '@testing-library/react';
import { useRating } from '../useRating';
import { useAppContext } from '../../stores/context';
import { useWallet } from '../useWallet';

// Mock the dependencies
jest.mock('../../stores/context');
jest.mock('../useWallet');

// Mock fetch
global.fetch = jest.fn();

const mockUseAppContext = useAppContext as jest.MockedFunction<typeof useAppContext>;
const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  flightNumber: 'CX123',
  arrivalDate: new Date(),
  walletAddress: '0x123',
  preferredLanguage: 'en' as const,
  registrationMethod: 'boarding-pass' as const,
  createdAt: new Date(),
};

const mockWallet = {
  balance: 100,
  pendingTransactions: [],
  lastUpdated: new Date(),
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

const mockState = {
  user: mockUser,
  wallet: mockWallet,
  merchants: [],
  offers: [],
  rewards: [],
  transactions: [],
  ui: {
    isLoading: false,
    error: null,
    activeModal: null,
    language: 'en' as const,
  },
};

const mockDispatch = jest.fn();
const mockSpendCoins = jest.fn();
const mockAddTransaction = jest.fn();

describe('useRating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAppContext.mockReturnValue({
      state: mockState,
      dispatch: mockDispatch,
    });
    
    mockUseWallet.mockReturnValue({
      wallet: mockWallet,
      transactions: [],
      isLoading: false,
      error: null,
      updateBalance: jest.fn(),
      addTransaction: mockAddTransaction,
      earnCoins: jest.fn(),
      spendCoins: mockSpendCoins,
      redeemCoins: jest.fn(),
      refreshWallet: jest.fn(),
      getTransactionHistory: jest.fn(),
      hasMoreTransactions: false,
    });
  });

  describe('submitRating', () => {
    it('successfully submits a rating', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          newBalance: 97,
          transaction: {
            id: 'tx-1',
            type: 'spend',
            amount: 3,
            description: 'Rated merchant',
            merchantId: 'merchant-1',
            timestamp: new Date(),
            status: 'completed',
          },
          rating: {
            id: 'rating-1',
            userId: 'user-1',
            merchantId: 'merchant-1',
            coinsSpent: 3,
            timestamp: new Date(),
          },
        }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const { result } = renderHook(() => useRating());

      await act(async () => {
        await result.current.submitRating('merchant-1', 3, 'Great service!');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/merchants/merchant-1/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-1',
          rating: 3,
          comment: 'Great service!',
        }),
      });

      expect(mockAddTransaction).toHaveBeenCalledWith({
        type: 'spend',
        amount: 3,
        description: 'Rated merchant',
        merchantId: 'merchant-1',
        status: 'completed',
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_BALANCE',
        payload: 97,
      });

      expect(result.current.error).toBeNull();
      expect(result.current.isSubmitting).toBe(false);
    });

    it('handles API error response', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({
          message: 'Insufficient balance',
          code: 'INSUFFICIENT_BALANCE',
        }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const { result } = renderHook(() => useRating());

      await act(async () => {
        try {
          await result.current.submitRating('merchant-1', 3);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Insufficient balance');
      expect(result.current.isSubmitting).toBe(false);
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useRating());

      await act(async () => {
        try {
          await result.current.submitRating('merchant-1', 3);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isSubmitting).toBe(false);
    });

    it('validates rating range', async () => {
      const { result } = renderHook(() => useRating());

      await act(async () => {
        try {
          await result.current.submitRating('merchant-1', 0);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Rating must be between 1 and 3 coins');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('validates rating range upper bound', async () => {
      const { result } = renderHook(() => useRating());

      await act(async () => {
        try {
          await result.current.submitRating('merchant-1', 4);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Rating must be between 1 and 3 coins');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('validates user authentication', async () => {
      mockUseAppContext.mockReturnValue({
        state: { ...mockState, user: null },
        dispatch: mockDispatch,
      });

      const { result } = renderHook(() => useRating());

      await act(async () => {
        try {
          await result.current.submitRating('merchant-1', 3);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('User not authenticated');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('validates sufficient balance', async () => {
      mockUseAppContext.mockReturnValue({
        state: { ...mockState, wallet: { ...mockWallet, balance: 2 } },
        dispatch: mockDispatch,
      });

      const { result } = renderHook(() => useRating());

      await act(async () => {
        try {
          await result.current.submitRating('merchant-1', 3);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Insufficient Smile Coins for this rating');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sets loading state during submission', async () => {
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(mockPromise as any);

      const { result } = renderHook(() => useRating());

      act(() => {
        result.current.submitRating('merchant-1', 3);
      });

      expect(result.current.isSubmitting).toBe(true);

      act(() => {
        resolvePromise({
          ok: true,
          json: async () => ({ success: true, newBalance: 97 }),
        });
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('includes comment in API request when provided', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, newBalance: 97 }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const { result } = renderHook(() => useRating());

      await act(async () => {
        await result.current.submitRating('merchant-1', 2, 'Good service');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/merchants/merchant-1/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-1',
          rating: 2,
          comment: 'Good service',
        }),
      });
    });
  });

  describe('clearError', () => {
    it('clears the error state', async () => {
      const { result } = renderHook(() => useRating());

      // First set an error
      await act(async () => {
        try {
          await result.current.submitRating('merchant-1', 0);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();

      // Then clear it
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('getRatingsByMerchant', () => {
    it('returns empty array (placeholder implementation)', () => {
      const { result } = renderHook(() => useRating());

      const ratings = result.current.getRatingsByMerchant('merchant-1');
      expect(ratings).toEqual([]);
    });
  });

  describe('getUserRatingForMerchant', () => {
    it('returns undefined (placeholder implementation)', () => {
      const { result } = renderHook(() => useRating());

      const rating = result.current.getUserRatingForMerchant('merchant-1', 'user-1');
      expect(rating).toBeUndefined();
    });
  });
});