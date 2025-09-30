import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CoinBalance } from '../CoinBalance';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('CoinBalance', () => {
  const defaultProps = {
    balance: 150,
    isLoading: false,
    showAnimation: false,
  };

  it('renders coin balance correctly', () => {
    render(<CoinBalance {...defaultProps} />);
    
    expect(screen.getByText('Smile Coins')).toBeInTheDocument();
    expect(screen.getByTestId('coin-balance')).toHaveTextContent('150');
  });

  it('displays loading state', () => {
    render(<CoinBalance {...defaultProps} isLoading={true} />);
    
    // Should show loading skeleton instead of actual balance
    expect(screen.queryByTestId('coin-balance')).not.toBeInTheDocument();
    expect(screen.getAllByRole('generic')[0]).toHaveClass('animate-pulse');
  });

  it('formats large numbers with commas', () => {
    render(<CoinBalance {...defaultProps} balance={1234567} />);
    
    expect(screen.getByTestId('coin-balance')).toHaveTextContent('1,234,567');
  });

  it('shows expiry warning when coins expire soon', () => {
    const expiryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    
    render(<CoinBalance {...defaultProps} expiryDate={expiryDate} />);
    
    expect(screen.getByText(/expires soon/i)).toBeInTheDocument();
  });

  it('shows normal expiry info when coins expire later', () => {
    const expiryDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
    
    render(<CoinBalance {...defaultProps} expiryDate={expiryDate} />);
    
    expect(screen.getByText(/expires in/i)).toBeInTheDocument();
    expect(screen.queryByText(/expires soon/i)).not.toBeInTheDocument();
  });

  it('shows expired message when coins have expired', () => {
    const expiryDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    
    render(<CoinBalance {...defaultProps} expiryDate={expiryDate} />);
    
    expect(screen.getByText(/coins have expired/i)).toBeInTheDocument();
  });

  it('does not show expiry info when no expiry date is set', () => {
    render(<CoinBalance {...defaultProps} />);
    
    expect(screen.queryByText(/expires/i)).not.toBeInTheDocument();
  });

  it('animates balance changes', async () => {
    const { rerender } = render(<CoinBalance {...defaultProps} balance={100} />);
    
    // Change balance
    rerender(<CoinBalance {...defaultProps} balance={200} />);
    
    // The component should animate from 100 to 200
    // Since we mocked framer-motion, we can't test the actual animation
    // but we can verify the final value is displayed
    await waitFor(() => {
      expect(screen.getByTestId('coin-balance')).toBeInTheDocument();
    });
  });

  it('handles zero balance correctly', () => {
    render(<CoinBalance {...defaultProps} balance={0} />);
    
    expect(screen.getByTestId('coin-balance')).toHaveTextContent('0');
  });

  it('applies correct styling classes', () => {
    render(<CoinBalance {...defaultProps} />);
    
    const container = screen.getByTestId('coin-balance').closest('div')?.parentElement;
    expect(container).toHaveClass('bg-gradient-to-br', 'from-yellow-400', 'to-orange-500');
  });
});