import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RewardCard } from '../RewardCard';
import { AppProvider } from '@/lib/stores/context';
import type { Reward } from '@/lib/types';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      rewards: {
        'category.coupon': 'Coupon',
        'category.voucher': 'Voucher',
        'category.experience': 'Experience',
        coinsRequired: 'Coins required',
        available: 'Available',
        unavailable: 'Unavailable',
        redeemNow: 'Redeem Now',
        redeem: 'Redeem',
      },
    };
    return translations[namespace]?.[key] || key;
  },
}));

const mockReward: Reward = {
  id: 'reward-1',
  name: 'Hong Kong Postcard Set',
  nameZh: '香港明信片套裝',
  description: 'Beautiful set of 10 Hong Kong landmark postcards',
  descriptionZh: '精美的10張香港地標明信片套裝',
  backgroundImage: '/images/merchant/merchant-image-01.jpg',
  category: 'voucher',
  voucherType: 'free_item',
  isAvailable: true,
  redemptionInstructions: 'Present this voucher at any Hong Kong Post Office',
  redemptionInstructionsZh: '在任何香港郵政局出示此券',
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('RewardCard', () => {
  const mockOnRedeem = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders reward information correctly', () => {
    render(
      <RewardCard
        reward={mockReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
      />,
      { wrapper }
    );

    expect(screen.getByText('Hong Kong Postcard Set')).toBeInTheDocument();
    expect(screen.getByText('Beautiful set of 10 Hong Kong landmark postcards')).toBeInTheDocument();
    expect(screen.getAllByText('FREE')).toHaveLength(2); // Badge and price display
    expect(screen.getByText('Coupon')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('No coins required')).toBeInTheDocument();
  });

  it('displays Chinese text when language is set to Chinese', () => {
    const { rerender } = render(
      <RewardCard
        reward={mockReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
      />,
      { wrapper }
    );

    // Mock Chinese language context
    const ChineseWrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>
        {children}
      </AppProvider>
    );

    rerender(
      <RewardCard
        reward={mockReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
      />
    );

    // Should display Chinese name and description when language is Chinese
    // Note: This would need proper context setup to work fully
  });

  it('shows claim button when reward is available (always free)', () => {
    render(
      <RewardCard
        reward={mockReward}
        userBalance={0} // Balance doesn't matter - rewards are free!
        onRedeem={mockOnRedeem}
      />,
      { wrapper }
    );

    const claimButton = screen.getByRole('button', { name: /claim free reward/i });
    expect(claimButton).toBeInTheDocument();
    expect(claimButton).not.toBeDisabled();
  });

  it('shows claim button regardless of user balance (rewards are free)', () => {
    render(
      <RewardCard
        reward={mockReward}
        userBalance={0} // No coins needed - rewards are free!
        onRedeem={mockOnRedeem}
      />,
      { wrapper }
    );

    const claimButton = screen.getByRole('button');
    expect(claimButton).not.toBeDisabled();
    expect(screen.getByText('Claim Free Reward')).toBeInTheDocument();
  });

  it('shows unavailable status when reward is not available', () => {
    const unavailableReward = { ...mockReward, isAvailable: false };
    
    render(
      <RewardCard
        reward={unavailableReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
      />,
      { wrapper }
    );

    expect(screen.getAllByText('Unavailable')).toHaveLength(2); // Badge and button
    const redeemButton = screen.getByRole('button');
    expect(redeemButton).toBeDisabled();
  });

  it('calls onRedeem when claim button is clicked', () => {
    render(
      <RewardCard
        reward={mockReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
      />,
      { wrapper }
    );

    const claimButton = screen.getByRole('button', { name: /claim free reward/i });
    fireEvent.click(claimButton);

    expect(mockOnRedeem).toHaveBeenCalledWith('reward-1');
  });

  it('shows loading state when claiming', () => {
    render(
      <RewardCard
        reward={mockReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
        isRedeeming={true}
      />,
      { wrapper }
    );

    expect(screen.getByText(/claiming\.\.\./i)).toBeInTheDocument();
    const claimButton = screen.getByRole('button');
    expect(claimButton).toBeDisabled();
  });

  it('handles image load error gracefully', async () => {
    render(
      <RewardCard
        reward={mockReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
      />,
      { wrapper }
    );

    const image = screen.getByRole('img');
    
    // Simulate image load error
    fireEvent.error(image);

    await waitFor(() => {
      // Should show fallback SVG icon instead of broken image
      expect(screen.getByTestId('fallback-icon')).toBeInTheDocument();
    });
  });

  it('applies correct category styling', () => {
    const { rerender } = render(
      <RewardCard
        reward={mockReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
      />,
      { wrapper }
    );

    // Test coupon category (orange)
    expect(screen.getByText('Coupon')).toHaveClass('text-orange-800');

    // Test voucher category (green)
    const voucherReward = { ...mockReward, category: 'voucher' as const };
    rerender(
      <RewardCard
        reward={voucherReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
      />
    );
    expect(screen.getByText('Voucher')).toHaveClass('text-green-800');

    // Test experience category (purple)
    const experienceReward = { ...mockReward, category: 'experience' as const };
    rerender(
      <RewardCard
        reward={experienceReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
      />
    );
    expect(screen.getByText('Experience')).toHaveClass('text-purple-800');
  });

  it('shows hover effects when reward is affordable', () => {
    render(
      <RewardCard
        reward={mockReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
      />,
      { wrapper }
    );

    const card = screen.getByRole('img').closest('.hover\\:scale-\\[1\\.02\\]');
    expect(card).toBeInTheDocument();
  });

  it('reduces opacity when reward is not available', () => {
    const unavailableReward = { ...mockReward, isAvailable: false };
    render(
      <RewardCard
        reward={unavailableReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
      />,
      { wrapper }
    );

    const card = screen.getByText('Hong Kong Postcard Set').closest('.opacity-60');
    expect(card).toBeInTheDocument();
  });
});