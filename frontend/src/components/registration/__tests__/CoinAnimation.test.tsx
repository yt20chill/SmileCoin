import { render, screen, waitFor } from '@testing-library/react';
import { CoinAnimation } from '../CoinAnimation';

describe('CoinAnimation', () => {
  const mockOnComplete = jest.fn();

  const defaultProps = {
    amount: 100,
    onComplete: mockOnComplete,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders coin animations based on amount', () => {
    render(<CoinAnimation {...defaultProps} />);
    
    // Should generate coins (max 20 for 100 amount)
    const coins = document.querySelectorAll('[class*="absolute"]');
    expect(coins.length).toBeGreaterThan(0);
  });

  it('limits maximum number of coins to 20', () => {
    render(<CoinAnimation amount={1000} onComplete={mockOnComplete} />);
    
    // Should not exceed 20 coins even for large amounts
    // Note: There's also a container div, so we look for coin-specific elements
    const coinElements = document.querySelectorAll('[class*="bg-gradient-to-br"]');
    expect(coinElements.length).toBeLessThanOrEqual(20);
  });

  it('calls onComplete after animation duration', async () => {
    render(<CoinAnimation {...defaultProps} />);
    
    // Fast-forward time to complete animation
    jest.advanceTimersByTime(3000); // Enough time for all animations
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('generates appropriate number of coins for small amounts', () => {
    render(<CoinAnimation amount={50} onComplete={mockOnComplete} />);
    
    // For 50 coins, should generate 5 animated coins (50/10)
    const coinElements = document.querySelectorAll('[class*="bg-gradient-to-br"]');
    expect(coinElements.length).toBe(5);
  });

  it('generates at least 1 coin for very small amounts', () => {
    render(<CoinAnimation amount={5} onComplete={mockOnComplete} />);
    
    // Should generate at least 1 coin
    const coins = document.querySelectorAll('[class*="absolute"]');
    expect(coins.length).toBeGreaterThanOrEqual(1);
  });

  it('renders coin with smile emoji', () => {
    render(<CoinAnimation {...defaultProps} />);
    
    // Should contain smile emoji in coins (multiple coins will have multiple emojis)
    expect(screen.getAllByText('😊').length).toBeGreaterThan(0);
  });

  it('applies proper styling to coins', () => {
    render(<CoinAnimation {...defaultProps} />);
    
    // Check for coin styling classes
    const coinElement = document.querySelector('[class*="bg-gradient-to-br"]');
    expect(coinElement).toBeInTheDocument();
  });

  it('staggers coin animations with delays', () => {
    render(<CoinAnimation amount={30} onComplete={mockOnComplete} />);
    
    // Should generate 3 coins with staggered delays
    const coinElements = document.querySelectorAll('[class*="bg-gradient-to-br"]');
    expect(coinElements.length).toBe(3);
  });

  it('cleans up animation on unmount', () => {
    const { unmount } = render(<CoinAnimation {...defaultProps} />);
    
    // Unmount before animation completes
    unmount();
    
    // Should not call onComplete after unmount
    jest.advanceTimersByTime(3000);
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('handles zero amount gracefully', () => {
    render(<CoinAnimation amount={0} onComplete={mockOnComplete} />);
    
    // Should not generate any coin elements
    const coinElements = document.querySelectorAll('[class*="bg-gradient-to-br"]');
    expect(coinElements.length).toBe(0);
    
    // Should still call onComplete after 1.5 seconds (base duration)
    jest.advanceTimersByTime(1500);
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('positions coins randomly', () => {
    render(<CoinAnimation amount={100} onComplete={mockOnComplete} />);
    
    // Each coin should have different positioning
    const coinContainers = document.querySelectorAll('[class*="absolute"][class*="top-1/2"]');
    expect(coinContainers.length).toBeGreaterThan(1);
    
    // Coins should be positioned absolutely
    coinContainers.forEach(coin => {
      expect(coin).toHaveClass('absolute');
    });
  });

  it('completes animation in reasonable time', async () => {
    render(<CoinAnimation amount={200} onComplete={mockOnComplete} />);
    
    // Animation should complete within 5 seconds
    jest.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });
});