import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RewardsList } from '../RewardsList';
import { AppProvider } from '@/lib/stores/context';
import type { Reward } from '@/lib/types';

const mockRewards: Reward[] = [
  {
    id: 'reward-1',
    name: 'Hong Kong Postcard Set',
    nameZh: '香港明信片套裝',
    description: 'Beautiful postcards',
    descriptionZh: '精美明信片',
    backgroundImage: '/images/merchant/merchant-image-01.jpg',
    category: 'coupon',
    isAvailable: true,
    redemptionInstructions: 'Present at post office',
    redemptionInstructionsZh: '在郵局出示',
    isFree: true,
  },
  {
    id: 'reward-2',
    name: 'MTR Day Pass',
    nameZh: 'MTR一日通',
    description: 'Unlimited MTR rides',
    descriptionZh: 'MTR無限次乘車',
    backgroundImage: '/images/merchant/merchant-image-02.jpg',
    category: 'voucher',
    isAvailable: true,
    redemptionInstructions: 'Exchange at MTR station',
    redemptionInstructionsZh: '在MTR站兌換',
    isFree: true,
  },
  {
    id: 'reward-3',
    name: 'Cooking Class',
    nameZh: '烹飪班',
    description: 'Learn to cook dim sum',
    descriptionZh: '學習製作點心',
    backgroundImage: '/images/merchant/merchant-image-03.jpg',
    category: 'experience',
    isAvailable: true,
    redemptionInstructions: 'Call to book',
    redemptionInstructionsZh: '致電預訂',
    isFree: true,
  },
];

// Mock the hooks
const mockUseRewards = {
  rewards: mockRewards,
  isLoading: false,
  error: null,
  fetchRewards: jest.fn(),
  redeemReward: jest.fn().mockResolvedValue({
    success: true,
    voucher: 'SMC-ABC123',
    message: 'Free reward claimed successfully!',
  }),
  getRewardsByCategory: jest.fn((category: string) => 
    mockRewards.filter(r => r.category === category)
  ),
  refreshRewards: jest.fn(),
};

jest.mock('@/lib/hooks/useRewards', () => ({
  useRewards: jest.fn(() => mockUseRewards),
}));

jest.mock('@/lib/hooks/useWallet', () => ({
  useWallet: () => ({
    wallet: { balance: 100 },
  }),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      rewards: {
        'category.coupon': 'Coupon',
        'category.voucher': 'Voucher',
        'category.experience': 'Experience',
        redeemSuccess: 'Reward redeemed successfully!',
      },
      common: {
        retry: 'Try again',
      },
    };
    return translations[namespace]?.[key] || key;
  },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock components
jest.mock('../RewardCard', () => ({
  RewardCard: ({ reward, onRedeem }: any) => (
    <div data-testid={`reward-card-${reward.id}`}>
      <h3>{reward.name}</h3>
      <button onClick={() => onRedeem(reward.id)}>Redeem</button>
    </div>
  ),
}));

jest.mock('../RedemptionModal', () => ({
  RedemptionModal: ({ isOpen, onClose, onConfirm }: any) => 
    isOpen ? (
      <div data-testid="redemption-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    ) : null,
}));

jest.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

jest.mock('@/components/common/ErrorMessage', () => ({
  ErrorMessage: ({ message, onRetry }: any) => (
    <div data-testid="error-message">
      <p>{message}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('RewardsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders category filter buttons', () => {
    render(<RewardsList />, { wrapper });

    expect(screen.getByRole('button', { name: /all rewards/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /coupon/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /voucher/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /experience/i })).toBeInTheDocument();
  });

  it('renders reward cards for all rewards by default', () => {
    render(<RewardsList />, { wrapper });

    expect(screen.getByTestId('reward-card-reward-1')).toBeInTheDocument();
    expect(screen.getByTestId('reward-card-reward-2')).toBeInTheDocument();
    expect(screen.getByTestId('reward-card-reward-3')).toBeInTheDocument();
  });

  it('filters rewards by category when category button is clicked', () => {
    const mockOnCategoryChange = jest.fn();
    
    render(
      <RewardsList onCategoryChange={mockOnCategoryChange} />, 
      { wrapper }
    );

    const couponButton = screen.getByRole('button', { name: /coupon/i });
    fireEvent.click(couponButton);

    expect(mockOnCategoryChange).toHaveBeenCalledWith('coupon');
  });

  it('shows loading state', () => {
    // Mock loading state
    const { useRewards } = require('@/lib/hooks/useRewards');
    useRewards.mockReturnValue({
      ...mockUseRewards,
      isLoading: true,
    });

    render(<RewardsList />, { wrapper });

    // Should show skeleton loading cards
    const skeletonCards = screen.getAllByRole('generic');
    expect(skeletonCards.some(card => 
      card.classList.contains('animate-pulse')
    )).toBe(true);
  });

  it('shows error state and retry button', () => {
    const mockRefreshRewards = jest.fn();
    const { useRewards } = require('@/lib/hooks/useRewards');
    useRewards.mockReturnValue({
      ...mockUseRewards,
      rewards: [],
      error: 'Network error',
      refreshRewards: mockRefreshRewards,
    });

    render(<RewardsList />, { wrapper });

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    
    expect(mockRefreshRewards).toHaveBeenCalled();
  });

  it('shows empty state when no rewards available', () => {
    const { useRewards } = require('@/lib/hooks/useRewards');
    useRewards.mockReturnValue({
      ...mockUseRewards,
      rewards: [],
      getRewardsByCategory: jest.fn(() => []),
    });

    render(<RewardsList />, { wrapper });

    expect(screen.getByText('No rewards available')).toBeInTheDocument();
    expect(screen.getByText(/no rewards available right now/i)).toBeInTheDocument();
  });

  it('opens redemption modal when reward card redeem is clicked', () => {
    render(<RewardsList />, { wrapper });

    const redeemButton = screen.getAllByRole('button', { name: /redeem/i })[0];
    fireEvent.click(redeemButton);

    expect(screen.getByTestId('redemption-modal')).toBeInTheDocument();
  });

  it('handles redemption confirmation', async () => {
    const mockRedeemReward = jest.fn().mockResolvedValue({
      success: true,
      voucher: 'SMC-ABC123',
      message: 'Free reward claimed successfully!',
    });

    const { useRewards } = require('@/lib/hooks/useRewards');
    useRewards.mockReturnValue({
      ...mockUseRewards,
      redeemReward: mockRedeemReward,
      getRewardsByCategory: jest.fn(() => mockRewards),
    });

    render(<RewardsList />, { wrapper });

    // Open modal
    const redeemButton = screen.getAllByRole('button', { name: /redeem/i })[0];
    fireEvent.click(redeemButton);

    // Confirm redemption
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockRedeemReward).toHaveBeenCalledWith('reward-1');
    });
  });

  it('handles redemption failure', async () => {
    const mockRedeemReward = jest.fn().mockResolvedValue({
      success: false,
      message: 'Redemption failed',
    });

    const { useRewards } = require('@/lib/hooks/useRewards');
    useRewards.mockReturnValue({
      ...mockUseRewards,
      redeemReward: mockRedeemReward,
      getRewardsByCategory: jest.fn(() => mockRewards),
    });

    const { toast } = require('sonner');

    render(<RewardsList />, { wrapper });

    // Open modal and confirm
    const redeemButton = screen.getAllByRole('button', { name: /redeem/i })[0];
    fireEvent.click(redeemButton);
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Redemption failed');
    });
  });

  it('closes modal when close button is clicked', () => {
    render(<RewardsList />, { wrapper });

    // Open modal
    const redeemButton = screen.getAllByRole('button', { name: /redeem/i })[0];
    fireEvent.click(redeemButton);

    expect(screen.getByTestId('redemption-modal')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('redemption-modal')).not.toBeInTheDocument();
  });

  it('sorts rewards by category and name (all free now)', () => {
    render(<RewardsList />, { wrapper });

    const rewardCards = screen.getAllByTestId(/reward-card-/);
    
    // Should be sorted by category then name: coupon (reward-1), experience (reward-3), voucher (reward-2)
    expect(rewardCards[0]).toHaveAttribute('data-testid', 'reward-card-reward-3'); // Cooking Class (experience)
    expect(rewardCards[1]).toHaveAttribute('data-testid', 'reward-card-reward-1'); // Hong Kong Postcard Set (coupon)
    expect(rewardCards[2]).toHaveAttribute('data-testid', 'reward-card-reward-2'); // MTR Day Pass (voucher)
  });

  it('auto-refreshes rewards periodically', () => {
    jest.useFakeTimers();
    
    const mockRefreshRewards = jest.fn();
    const { useRewards } = require('@/lib/hooks/useRewards');
    useRewards.mockReturnValue({
      ...mockUseRewards,
      refreshRewards: mockRefreshRewards,
    });

    render(<RewardsList />, { wrapper });

    // Fast-forward 5 minutes
    jest.advanceTimersByTime(5 * 60 * 1000);

    expect(mockRefreshRewards).toHaveBeenCalled();

    jest.useRealTimers();
  });
});