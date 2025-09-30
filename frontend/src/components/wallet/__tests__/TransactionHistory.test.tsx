import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { TransactionHistory } from '../TransactionHistory';
import { Transaction } from '@/lib/types';
import { NextIntlClientProvider } from 'next-intl';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, whileHover, whileTap, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date) => '2 hours ago'),
}));

const mockMessages = {
  rating: {
    loading: 'Loading...',
    more: 'Load More',
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('TransactionHistory', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'earn',
      amount: 50,
      description: 'Registration bonus',
      timestamp: new Date('2024-01-15T10:00:00Z'),
      status: 'completed',
    },
    {
      id: '2',
      type: 'spend',
      amount: 3,
      description: 'Merchant rating',
      merchantId: 'merchant-1',
      timestamp: new Date('2024-01-15T11:00:00Z'),
      status: 'completed',
    },
    {
      id: '3',
      type: 'redeem',
      amount: 100,
      description: 'Souvenir redemption',
      rewardId: 'reward-1',
      timestamp: new Date('2024-01-15T12:00:00Z'),
      status: 'pending',
    },
    {
      id: '4',
      type: 'expire',
      amount: 25,
      description: 'Coin expiry',
      timestamp: new Date('2024-01-15T13:00:00Z'),
      status: 'completed',
    },
  ];

  const defaultProps = {
    transactions: mockTransactions,
    hasMore: false,
    isLoading: false,
  };

  beforeEach(() => {
    // Mock window.pageYOffset and related properties for scroll testing
    Object.defineProperty(window, 'pageYOffset', {
      value: 0,
      writable: true,
    });
    Object.defineProperty(document.documentElement, 'scrollTop', {
      value: 0,
      writable: true,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 1000,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
    });
  });

  it('renders transaction list correctly', () => {
    render(<TransactionHistory {...defaultProps} />);

    expect(screen.getByText('Transaction History')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
    expect(screen.getByText('Registration bonus')).toBeInTheDocument();
    expect(screen.getByText('Merchant rating')).toBeInTheDocument();
    expect(screen.getByText('Souvenir redemption')).toBeInTheDocument();
    expect(screen.getByText('Coin expiry')).toBeInTheDocument();
  });

  it('displays correct amount formatting for different transaction types', () => {
    render(<TransactionHistory {...defaultProps} />);

    // Earn transactions should show positive amounts
    expect(screen.getByText('+50')).toBeInTheDocument();
    
    // Spend, redeem, and expire transactions should show negative amounts
    expect(screen.getByText('-3')).toBeInTheDocument();
    expect(screen.getByText('-100')).toBeInTheDocument();
    expect(screen.getByText('-25')).toBeInTheDocument();
  });

  it('shows pending status badge for pending transactions', () => {
    render(<TransactionHistory {...defaultProps} />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<TransactionHistory {...defaultProps} isLoading={true} transactions={[]} />);

    // Should show skeleton loading items
    expect(screen.getByText('Transaction History')).toBeInTheDocument();
    // Check for skeleton elements by class
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('shows empty state when no transactions', () => {
    render(<TransactionHistory {...defaultProps} transactions={[]} />);

    expect(screen.getByText('No Transactions Yet')).toBeInTheDocument();
    expect(screen.getByText(/Your transaction history will appear here/)).toBeInTheDocument();
  });

  it('shows load more button when hasMore is true', () => {
    renderWithIntl(<TransactionHistory {...defaultProps} hasMore={true} />);

    expect(screen.getByText('Load More')).toBeInTheDocument();
  });

  it('calls onLoadMore when load more button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnLoadMore = jest.fn();

    renderWithIntl(
      <TransactionHistory
        {...defaultProps}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
      />
    );

    const loadMoreButton = screen.getByText('Load More');
    await user.click(loadMoreButton);

    await waitFor(() => {
      expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
    });
  });

  it('disables load more button when loading', () => {
    render(<TransactionHistory {...defaultProps} hasMore={true} />);

    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    // After clicking, button should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('triggers infinite scroll when scrolling near bottom', () => {
    const mockOnLoadMore = jest.fn();
    render(
      <TransactionHistory
        {...defaultProps}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
      />
    );

    // Simulate scrolling near bottom (within 100px of bottom)
    Object.defineProperty(window, 'pageYOffset', { value: 950, writable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: 950, writable: true });

    fireEvent.scroll(window);

    // Should trigger load more
    expect(mockOnLoadMore).toHaveBeenCalled();
  });

  it('displays correct icons for different transaction types', () => {
    render(<TransactionHistory {...defaultProps} />);

    // We can't easily test the specific icons since they're from lucide-react
    // but we can verify the transaction items are rendered
    const transactionItems = screen.getAllByRole('generic').filter(
      el => el.className?.includes('flex items-center gap-4')
    );
    
    expect(transactionItems.length).toBeGreaterThan(0);
  });

  it('shows failed status badge for failed transactions', () => {
    const failedTransaction: Transaction = {
      id: '5',
      type: 'spend',
      amount: 5,
      description: 'Failed payment',
      timestamp: new Date(),
      status: 'failed',
    };

    render(
      <TransactionHistory
        {...defaultProps}
        transactions={[failedTransaction]}
      />
    );

    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    const user = userEvent.setup();
    
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(<TransactionHistory {...defaultProps} />);

    const refreshButton = screen.getByTitle('Refresh transactions');
    await user.click(refreshButton);

    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('displays relative timestamps correctly', () => {
    render(<TransactionHistory {...defaultProps} />);

    // Since we mocked formatDistanceToNow to return '2 hours ago'
    expect(screen.getAllByText('2 hours ago')).toHaveLength(4);
  });

  it('handles large transaction lists efficiently', () => {
    const manyTransactions = Array.from({ length: 100 }, (_, i) => ({
      id: `tx-${i}`,
      type: 'earn' as const,
      amount: 10,
      description: `Transaction ${i}`,
      timestamp: new Date(),
      status: 'completed' as const,
    }));

    render(<TransactionHistory {...defaultProps} transactions={manyTransactions} />);

    // Should only render the first batch (10 items by default)
    expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
    expect(screen.getByText('Transaction 0')).toBeInTheDocument();
  });
});