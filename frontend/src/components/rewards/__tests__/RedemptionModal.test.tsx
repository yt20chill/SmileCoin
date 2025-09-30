import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RedemptionModal } from '../RedemptionModal';
import { AppProvider } from '@/lib/stores/context';
import type { Reward } from '@/lib/types';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      rewards: {
        redeem: 'Redeem',
        redeemSuccess: 'Reward redeemed successfully!',
        redemptionInstructions: 'Redemption Instructions',
        'category.souvenir': 'Souvenir',
        coinsRequired: 'Coins required',
      },
      common: {
        close: 'Close',
        cancel: 'Cancel',
        confirm: 'Confirm',
      },
    };
    return translations[namespace]?.[key] || key;
  },
}));

// Mock CoinAnimation component
jest.mock('@/components/wallet/CoinAnimation', () => ({
  CoinAnimation: ({ onComplete }: { onComplete: () => void }) => {
    // Auto-complete animation for testing
    setTimeout(onComplete, 100);
    return <div data-testid="coin-animation">Animation</div>;
  },
}));

const mockReward: Reward = {
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
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('RedemptionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={100}
      />,
      { wrapper }
    );

    expect(screen.queryByText('Redeem')).not.toBeInTheDocument();
  });

  it('renders modal content when isOpen is true', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={100}
      />,
      { wrapper }
    );

    expect(screen.getByText('Redeem')).toBeInTheDocument();
    expect(screen.getByText('Hong Kong Postcard Set')).toBeInTheDocument();
    expect(screen.getByText('Beautiful set of 10 Hong Kong landmark postcards')).toBeInTheDocument();
    expect(screen.getByText('Souvenir')).toBeInTheDocument();
  });

  it('shows cost breakdown correctly', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={100}
      />,
      { wrapper }
    );

    expect(screen.getByText('Coins required:')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Current Balance:')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('New Balance:')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument(); // 100 - 50 = 50
  });

  it('shows insufficient balance warning when user cannot afford', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={30} // Less than required 50
      />,
      { wrapper }
    );

    expect(screen.getByText(/insufficient smile coins/i)).toBeInTheDocument();
    expect(screen.getByText(/need 20 more/i)).toBeInTheDocument();
  });

  it('disables confirm button when user cannot afford', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={30}
      />,
      { wrapper }
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toBeDisabled();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={100}
      />,
      { wrapper }
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={100}
      />,
      { wrapper }
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={100}
      />,
      { wrapper }
    );

    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onClose when X button is clicked', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={100}
      />,
      { wrapper }
    );

    const closeButton = screen.getByRole('button', { name: '' }); // X button has no text
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when redeeming', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={100}
        isRedeeming={true}
      />,
      { wrapper }
    );

    expect(screen.getByText(/redeem\.\.\./i)).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: /redeem\.\.\./i });
    expect(confirmButton).toBeDisabled();
  });

  it('shows success state with voucher code', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={100}
        showSuccess={true}
        voucherCode="SMC-ABC123"
      />,
      { wrapper }
    );

    expect(screen.getByText('Reward redeemed successfully!')).toBeInTheDocument();
    expect(screen.getByText('SMC-ABC123')).toBeInTheDocument();
    expect(screen.getByText('Voucher Code:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('shows redemption instructions in success state', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={100}
        showSuccess={true}
        redemptionInstructions="Present this voucher at any Hong Kong Post Office"
      />,
      { wrapper }
    );

    expect(screen.getByText('Redemption Instructions')).toBeInTheDocument();
    expect(screen.getByText('Present this voucher at any Hong Kong Post Office')).toBeInTheDocument();
  });

  it('shows coin animation when showSuccess is true', async () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={100}
        showSuccess={true}
      />,
      { wrapper }
    );

    expect(screen.getByTestId('coin-animation')).toBeInTheDocument();

    // Animation should complete and disappear
    await waitFor(() => {
      expect(screen.queryByTestId('coin-animation')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('prevents confirm action when redeeming', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={100}
        isRedeeming={true}
      />,
      { wrapper }
    );

    const confirmButton = screen.getByRole('button', { name: /redeem\.\.\./i });
    fireEvent.click(confirmButton);

    // Should not call onConfirm when redeeming
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('calculates new balance correctly', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        userBalance={75}
      />,
      { wrapper }
    );

    // Should show 75 - 50 = 25 as new balance
    const newBalanceElements = screen.getAllByText('25');
    expect(newBalanceElements.length).toBeGreaterThan(0);
  });
});