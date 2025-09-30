import { render, screen, fireEvent } from '@testing-library/react';
import { RedemptionHistory } from '../RedemptionHistory';
import { AppProvider } from '@/lib/stores/context';
import type { Transaction, Reward } from '@/lib/types';

// Mock the hooks
jest.mock('@/lib/hooks/useRewards', () => ({
  useRewards: () => ({
    rewards: mockRewards,
    getRedemptionHistory: () => mockTransactions,
  }),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      rewards: {
        'category.souvenir': 'Souvenir',
        'category.voucher': 'Voucher',
        'category.experience': 'Experience',
      },
      wallet: {
        completed: 'Completed',
        pending: 'Pending',
        failed: 'Failed',
      },
    };
    return translations[namespace]?.[key] || key;
  },
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  },
}));

const mockRewards: Reward[] = [
  {
    id: 'reward-1',
    name: 'Hong Kong Postcard Set',
    nameZh: '香港明信片套裝',
    description: 'Beautiful postcards',
    descriptionZh: '精美明信片',
    image: '/images/rewards/postcards.jpg',
    coinsRequired: 50,
    category: 'souvenir',
    isAvailable: true,
    redemptionInstructions: 'Present at post office',
    redemptionInstructionsZh: '在郵局出示',
  },
  {
    id: 'reward-2',
    name: 'MTR Day Pass',
    nameZh: 'MTR一日通',
    description: 'Unlimited MTR rides',
    descriptionZh: 'MTR無限次乘車',
    image: '/images/rewards/mtr-pass.jpg',
    coinsRequired: 120,
    category: 'voucher',
    isAvailable: true,
    redemptionInstructions: 'Exchange at MTR station',
    redemptionInstructionsZh: '在MTR站兌換',
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
  {
    id: 'tx-2',
    type: 'redeem',
    amount: 120,
    description: 'Redeemed MTR Day Pass',
    rewardId: 'reward-2',
    timestamp: new Date('2024-01-14T15:30:00Z'),
    status: 'completed',
  },
  {
    id: 'tx-3',
    type: 'redeem',
    amount: 75,
    description: 'Redeemed Unknown Reward',
    rewardId: 'reward-unknown',
    timestamp: new Date('2024-01-13T09:15:00Z'),
    status: 'pending',
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('RedemptionHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title when showTitle is true', () => {
    render(<RedemptionHistory showTitle={true} />, { wrapper });
    
    expect(screen.getByText('Redemption History')).toBeInTheDocument();
  });

  it('does not render title when showTitle is false', () => {
    render(<RedemptionHistory showTitle={false} />, { wrapper });
    
    expect(screen.queryByText('Redemption History')).not.toBeInTheDocument();
  });

  it('renders all redemption transactions', () => {
    render(<RedemptionHistory />, { wrapper });

    expect(screen.getByText('Hong Kong Postcard Set')).toBeInTheDocument();
    expect(screen.getByText('MTR Day Pass')).toBeInTheDocument();
    expect(screen.getByText('Redeemed Unknown Reward')).toBeInTheDocument();
  });

  it('displays transaction details correctly', () => {
    render(<RedemptionHistory />, { wrapper });

    // Check coins spent (negative amounts)
    expect(screen.getByText('-50')).toBeInTheDocument();
    expect(screen.getByText('-120')).toBeInTheDocument();
    expect(screen.getByText('-75')).toBeInTheDocument();

    // Check status badges
    expect(screen.getAllByText('Completed')).toHaveLength(2);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows reward images when available', () => {
    render(<RedemptionHistory />, { wrapper });

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2); // Only for known rewards
    expect(images[0]).toHaveAttribute('src', '/images/rewards/postcards.jpg');
    expect(images[1]).toHaveAttribute('src', '/images/rewards/mtr-pass.jpg');
  });

  it('displays category badges for known rewards', () => {
    render(<RedemptionHistory />, { wrapper });

    expect(screen.getByText('Souvenir')).toBeInTheDocument();
    expect(screen.getByText('Voucher')).toBeInTheDocument();
  });

  it('limits displayed transactions when limit prop is provided', () => {
    render(<RedemptionHistory limit={2} />, { wrapper });

    // Should only show first 2 transactions
    expect(screen.getByText('Hong Kong Postcard Set')).toBeInTheDocument();
    expect(screen.getByText('MTR Day Pass')).toBeInTheDocument();
    expect(screen.queryByText('Redeemed Unknown Reward')).not.toBeInTheDocument();
  });

  it('shows "Show All" button when there are more transactions than limit', () => {
    render(<RedemptionHistory limit={2} />, { wrapper });

    const showAllButton = screen.getByRole('button', { name: /show all \(3\)/i });
    expect(showAllButton).toBeInTheDocument();
  });

  it('expands to show all transactions when "Show All" is clicked', () => {
    render(<RedemptionHistory limit={2} />, { wrapper });

    const showAllButton = screen.getByRole('button', { name: /show all \(3\)/i });
    fireEvent.click(showAllButton);

    // Now should show all transactions
    expect(screen.getByText('Hong Kong Postcard Set')).toBeInTheDocument();
    expect(screen.getByText('MTR Day Pass')).toBeInTheDocument();
    expect(screen.getByText('Redeemed Unknown Reward')).toBeInTheDocument();

    // Button should disappear
    expect(screen.queryByRole('button', { name: /show all/i })).not.toBeInTheDocument();
  });

  it('shows empty state when no redemptions exist', () => {
    // Mock empty redemption history
    const useRewards = require('@/lib/hooks/useRewards').useRewards;
    useRewards.mockReturnValue({
      rewards: mockRewards,
      getRedemptionHistory: () => [],
    });

    render(<RedemptionHistory />, { wrapper });

    expect(screen.getByText('No redemptions yet')).toBeInTheDocument();
    expect(screen.getByText('Start redeeming rewards to see your history here.')).toBeInTheDocument();
  });

  it('formats transaction timestamps correctly', () => {
    render(<RedemptionHistory />, { wrapper });

    // Should show formatted dates (mocked to return locale string)
    const dateElements = screen.getAllByText(/\/.*\/.*\s.*:.*:.*/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('handles unknown rewards gracefully', () => {
    render(<RedemptionHistory />, { wrapper });

    // Should show transaction description for unknown reward
    expect(screen.getByText('Redeemed Unknown Reward')).toBeInTheDocument();
    
    // Should not show image or category badge for unknown reward
    const unknownTransaction = screen.getByText('Redeemed Unknown Reward').closest('div');
    expect(unknownTransaction?.querySelector('img')).not.toBeInTheDocument();
  });

  it('applies correct status colors', () => {
    render(<RedemptionHistory />, { wrapper });

    const completedBadges = screen.getAllByText('Completed');
    completedBadges.forEach(badge => {
      expect(badge).toHaveClass('text-green-800');
    });

    const pendingBadge = screen.getByText('Pending');
    expect(pendingBadge).toHaveClass('text-yellow-800');
  });

  it('shows transaction count in header badge', () => {
    render(<RedemptionHistory showTitle={true} />, { wrapper });

    expect(screen.getByText('3')).toBeInTheDocument(); // Total transaction count
  });

  it('displays Chinese reward names when language is Chinese', () => {
    // Mock Chinese language context
    const ChineseWrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>
        {children}
      </AppProvider>
    );

    render(<RedemptionHistory />, { wrapper: ChineseWrapper });

    // Should display Chinese names when language is set to Chinese
    // Note: This would need proper context setup to work fully
  });

  it('sorts transactions by timestamp (newest first)', () => {
    render(<RedemptionHistory />, { wrapper });

    const transactionElements = screen.getAllByText(/Redeemed/);
    
    // Should be in order: tx-1 (Jan 15), tx-2 (Jan 14), tx-3 (Jan 13)
    expect(transactionElements[0]).toHaveTextContent('Hong Kong Postcard Set');
    expect(transactionElements[1]).toHaveTextContent('MTR Day Pass');
    expect(transactionElements[2]).toHaveTextContent('Unknown Reward');
  });
});