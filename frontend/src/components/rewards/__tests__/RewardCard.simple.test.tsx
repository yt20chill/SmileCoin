import { render, screen } from '@testing-library/react';
import { RewardCard } from '../RewardCard';
import type { Reward } from '@/lib/types';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock the context
jest.mock('@/lib/stores/context', () => ({
  useAppContext: () => ({
    state: {
      ui: { language: 'en' }
    }
  })
}));

const mockReward: Reward = {
  id: 'reward-1',
  name: 'Test Reward',
  nameZh: '測試獎勵',
  description: 'A test reward',
  descriptionZh: '測試獎勵描述',
  backgroundImage: '/images/merchant/merchant-image-01.jpg',
  category: 'coupon',
  isAvailable: true,
  redemptionInstructions: 'Test instructions',
  redemptionInstructionsZh: '測試說明',
  isFree: true,
};

describe('RewardCard', () => {
  const mockOnRedeem = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders reward information', () => {
    render(
      <RewardCard
        reward={mockReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
      />
    );

    expect(screen.getByText('Test Reward')).toBeInTheDocument();
    expect(screen.getByText('A test reward')).toBeInTheDocument();
    expect(screen.getAllByText('FREE')).toHaveLength(2); // Badge and price display
  });

  it('shows claim button when reward is available (always free)', () => {
    render(
      <RewardCard
        reward={mockReward}
        userBalance={0} // Balance doesn't matter - rewards are free!
        onRedeem={mockOnRedeem}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(screen.getByText('Claim Free Reward')).toBeInTheDocument();
  });

  it('disables button when reward is not available', () => {
    const unavailableReward = { ...mockReward, isAvailable: false };
    render(
      <RewardCard
        reward={unavailableReward}
        userBalance={100}
        onRedeem={mockOnRedeem}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});