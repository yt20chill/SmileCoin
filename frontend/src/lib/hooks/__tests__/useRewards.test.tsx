import { renderHook, act, waitFor } from '@testing-library/react';
import { useRewards } from '../useRewards';
import { AppProvider } from '../../stores/context';
import { mockData } from '../../mock-data/generators';
import type { Reward, Transaction } from '../../types';

// Mock fetch
global.fetch = jest.fn();

// Mock useWallet hook
jest.mock('../useWallet', () => ({
  useWallet: () => ({
    wallet: { balance: 150 },
    addTransaction: jest.fn(),
  }),
}));

const mockRewards: Reward[] = [
  {
    id: 'reward-1',
    name: 'Hong Kong Postcard Set',
    nameZh: '香港明信片套裝',
    description: 'Beautiful set of 10 Hong Kong landmark postcards',
    descriptionZh: '精美的10張香港地標明信片套裝',
    image: '/images/rewards/postcards.jpg',
    coinsRequired: 50,
    category: 'souvenir',
    isAvailable: true,
    redemptionInstructions: 'Present this voucher at any Hong Kong Post Office',
    redemptionInstructionsZh: '在任何香港郵政局出示此券',
  },
  {
    id: 'reward-2',
    name: 'MTR Day Pass',
    nameZh: 'MTR一日通',
    description: 'Unlimited MTR rides for one day',
    descriptionZh: 'MTR一日無限次乘車',
    image: '/images/rewards/mtr-pass.jpg',
    coinsRequired: 120,
    category: 'voucher',
    isAvailable: true,
    redemptionInstructions: 'Exchange at any MTR station',
    redemptionInstructionsZh: '在任何MTR站兌換',
  },
];

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'redeem',
    amount: 50,
    description: 'Redeemed Hong Kong Postcard Set',
    rewardId: 'reward-1',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    status: 'completed',
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('useRewards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('should fetch rewards successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRewards,
    });

    const { result } = renderHook(() => useRewards(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.rewards).toEqual([]);

    await act(async () => {
      await result.current.fetchRewards();
    });

    await waitFor(() => {
      expect(result.current.rewards).toEqual(mockRewards);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle fetch rewards error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useRewards(), { wrapper });

    await act(async () => {
      await result.current.fetchRewards();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should filter rewards by category', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRewards.filter(r => r.category === 'souvenir'),
    });

    const { result } = renderHook(() => useRewards(), { wrapper });

    await act(async () => {
      await result.current.fetchRewards('souvenir');
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/rewards?category=souvenir');
    });
  });

  it('should redeem reward successfully', async () => {
    const mockRedemptionResponse = {
      success: true,
      newBalance: 100,
      voucher: 'SMC-ABC123',
      transaction: mockTransactions[0],
      reward: mockRewards[0],
      message: 'Reward redeemed successfully',
      redemptionInstructions: 'Present this voucher at any Hong Kong Post Office',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRedemptionResponse,
    });

    const { result } = renderHook(() => useRewards(), { wrapper });

    // Set up initial state with rewards
    act(() => {
      result.current.rewards.push(...mockRewards);
    });

    let redemptionResult;
    await act(async () => {
      redemptionResult = await result.current.redeemReward('reward-1');
    });

    expect(redemptionResult).toEqual(mockRedemptionResponse);
    expect(fetch).toHaveBeenCalledWith('/api/rewards/reward-1/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'demo-user' }),
    });
  });

  it('should handle insufficient balance for redemption', async () => {
    const { result } = renderHook(() => useRewards(), { wrapper });

    // Mock wallet with insufficient balance
    const mockUseWallet = require('../useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      wallet: { balance: 30 }, // Less than required 50
      addTransaction: jest.fn(),
    });

    // Set up initial state with rewards
    act(() => {
      result.current.rewards.push(...mockRewards);
    });

    let redemptionResult;
    await act(async () => {
      redemptionResult = await result.current.redeemReward('reward-1');
    });

    expect(redemptionResult.success).toBe(false);
    expect(redemptionResult.message).toContain('Insufficient Smile Coins');
  });

  it('should handle redemption API error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Redemption failed' }),
    });

    const { result } = renderHook(() => useRewards(), { wrapper });

    // Set up initial state with rewards
    act(() => {
      result.current.rewards.push(...mockRewards);
    });

    let redemptionResult;
    await act(async () => {
      redemptionResult = await result.current.redeemReward('reward-1');
    });

    expect(redemptionResult.success).toBe(false);
    expect(redemptionResult.message).toBe('Redemption failed');
  });

  it('should get rewards by category', () => {
    const { result } = renderHook(() => useRewards(), { wrapper });

    // Set up initial state with rewards
    act(() => {
      result.current.rewards.push(...mockRewards);
    });

    const souvenirRewards = result.current.getRewardsByCategory('souvenir');
    expect(souvenirRewards).toHaveLength(1);
    expect(souvenirRewards[0].category).toBe('souvenir');

    const voucherRewards = result.current.getRewardsByCategory('voucher');
    expect(voucherRewards).toHaveLength(1);
    expect(voucherRewards[0].category).toBe('voucher');
  });

  it('should check if user can afford reward', () => {
    const { result } = renderHook(() => useRewards(), { wrapper });

    const affordableReward = mockRewards[0]; // 50 coins, user has 150
    const expensiveReward = { ...mockRewards[1], coinsRequired: 200 }; // 200 coins, user has 150

    expect(result.current.canAffordReward(affordableReward)).toBe(true);
    expect(result.current.canAffordReward(expensiveReward)).toBe(false);
  });

  it('should get redemption history', () => {
    const { result } = renderHook(() => useRewards(), { wrapper });

    const history = result.current.getRedemptionHistory();
    expect(Array.isArray(history)).toBe(true);
    // History should be sorted by timestamp (newest first)
    if (history.length > 1) {
      expect(history[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        history[1].timestamp.getTime()
      );
    }
  });

  it('should clear error after timeout', async () => {
    jest.useFakeTimers();
    
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    const { result } = renderHook(() => useRewards(), { wrapper });

    await act(async () => {
      await result.current.fetchRewards();
    });

    expect(result.current.error).toBe('Test error');

    // Fast-forward time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.error).toBe(null);
    });

    jest.useRealTimers();
  });
});