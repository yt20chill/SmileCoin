import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistrationSuccess } from '../RegistrationSuccess';
import type { User } from '@/lib/types';

// Mock the CoinAnimation component
jest.mock('../CoinAnimation', () => ({
  CoinAnimation: ({ amount, onComplete }: { amount: number; onComplete: () => void }) => {
    // Simulate animation completion after a short delay
    setTimeout(onComplete, 100);
    return <div data-testid="coin-animation">Animating {amount} coins</div>;
  },
}));

describe('RegistrationSuccess', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    flightNumber: 'CX123',
    arrivalDate: new Date('2024-12-01T10:00:00Z'),
    walletAddress: '0x123',
    preferredLanguage: 'en',
    registrationMethod: 'boarding-pass',
    createdAt: new Date(),
  };

  const mockOnContinue = jest.fn();

  const defaultProps = {
    user: mockUser,
    initialCoins: 100,
    onContinue: mockOnContinue,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders success message and user information', () => {
    render(<RegistrationSuccess {...defaultProps} />);
    
    expect(screen.getByText('Welcome to Hong Kong!')).toBeInTheDocument();
    expect(screen.getByText('auth.registerSuccess')).toBeInTheDocument();
    
    // Check user info display
    expect(screen.getByText('CX123')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('12/1/2024')).toBeInTheDocument();
  });

  it('displays initial coin amount', () => {
    render(<RegistrationSuccess {...defaultProps} />);
    
    expect(screen.getByText('wallet.earned')).toBeInTheDocument();
    expect(screen.getByText('wallet.smileCoins')).toBeInTheDocument();
  });

  it('shows coin animation after delay', async () => {
    render(<RegistrationSuccess {...defaultProps} />);
    
    // Animation should start after a delay
    await waitFor(() => {
      expect(screen.getByTestId('coin-animation')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    expect(screen.getByText('Animating 100 coins')).toBeInTheDocument();
  });

  it('updates coin display after animation completes', async () => {
    render(<RegistrationSuccess {...defaultProps} />);
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('calls onContinue when continue button is clicked', async () => {
    const user = userEvent.setup();
    render(<RegistrationSuccess {...defaultProps} />);
    
    const continueButton = screen.getByText('View My Wallet');
    await user.click(continueButton);
    
    expect(mockOnContinue).toHaveBeenCalled();
  });

  it('handles user without email', () => {
    const userWithoutEmail = { ...mockUser, email: undefined };
    render(<RegistrationSuccess {...defaultProps} user={userWithoutEmail} />);
    
    expect(screen.getByText('CX123')).toBeInTheDocument();
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
  });

  it('displays gamification tips', () => {
    render(<RegistrationSuccess {...defaultProps} />);
    
    expect(screen.getByText('🎯 Rate merchants to earn more coins')).toBeInTheDocument();
    expect(screen.getByText('🎁 Redeem coins for exclusive rewards')).toBeInTheDocument();
    expect(screen.getByText('🌟 Explore Hong Kong like never before!')).toBeInTheDocument();
  });

  it('shows success icon with animation', () => {
    render(<RegistrationSuccess {...defaultProps} />);
    
    // Check for success checkmark
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('displays different coin amounts correctly', async () => {
    render(<RegistrationSuccess {...defaultProps} initialCoins={50} />);
    
    // Should eventually show coin animation
    await waitFor(() => {
      expect(screen.getByTestId('coin-animation')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('formats arrival date correctly', () => {
    const userWithDifferentDate = {
      ...mockUser,
      arrivalDate: new Date('2024-06-15T14:30:00Z'),
    };
    
    render(<RegistrationSuccess {...defaultProps} user={userWithDifferentDate} />);
    
    expect(screen.getByText('6/15/2024')).toBeInTheDocument();
  });

  it('shows sparkle effects', () => {
    render(<RegistrationSuccess {...defaultProps} />);
    
    // Check for sparkle icon (should be in the DOM)
    const sparkleIcon = document.querySelector('.lucide-sparkles');
    expect(sparkleIcon).toBeInTheDocument();
  });

  it('has proper gradient styling', () => {
    render(<RegistrationSuccess {...defaultProps} />);
    
    const continueButton = screen.getByText('View My Wallet');
    expect(continueButton).toHaveClass('bg-gradient-to-r');
  });
});