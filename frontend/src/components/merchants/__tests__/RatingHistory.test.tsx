import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { RatingHistory } from '../RatingHistory';
import { Rating, Merchant } from '@/lib/types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useLocale hook
jest.mock('@/lib/hooks/useLocale', () => ({
  useLocale: () => ({ locale: 'en' }),
}));

const mockMessages = {
  rating: {
    customerRatings: 'Customer Ratings',
    average: 'Average',
    noRatingsYet: 'No ratings yet',
    beFirstToRate: 'Be the first to rate this merchant!',
    tourist: 'Tourist',
    showMore: 'Show more',
    showLess: 'Show less',
    loading: 'Loading...',
    more: 'more',
    loadMoreFromServer: 'Load more ratings',
    poor: 'Poor',
    good: 'Good',
    excellent: 'Excellent',
    unknown: 'Unknown',
  },
};

const mockMerchants: Merchant[] = [
  {
    id: 'merchant-1',
    name: 'Test Merchant',
    nameZh: '測試商戶',
    description: 'A test merchant',
    descriptionZh: '測試商戶',
    logo: '/test-logo.jpg',
    category: 'restaurant',
    location: {
      address: '123 Test St',
      addressZh: '測試街123號',
      coordinates: [22.2819, 114.1577],
    },
    rating: 4.5,
    totalRatings: 10,
    isActive: true,
  },
];

const mockRatings: Rating[] = [
  {
    id: 'rating-1',
    userId: 'user-1',
    merchantId: 'merchant-1',
    coinsSpent: 3,
    comment: 'Excellent service and food!',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: 'rating-2',
    userId: 'user-2',
    merchantId: 'merchant-1',
    coinsSpent: 2,
    comment: 'Good experience overall.',
    timestamp: new Date('2024-01-14T15:30:00Z'),
  },
  {
    id: 'rating-3',
    userId: 'user-3',
    merchantId: 'merchant-1',
    coinsSpent: 1,
    timestamp: new Date('2024-01-13T12:00:00Z'),
  },
  {
    id: 'rating-4',
    userId: 'user-4',
    merchantId: 'other-merchant',
    coinsSpent: 3,
    comment: 'This should not appear',
    timestamp: new Date('2024-01-12T09:00:00Z'),
  },
];

const defaultProps = {
  merchantId: 'merchant-1',
  ratings: mockRatings,
  merchants: mockMerchants,
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('RatingHistory', () => {
  it('renders empty state when no ratings exist', () => {
    renderWithIntl(
      <RatingHistory 
        {...defaultProps} 
        ratings={[]}
      />
    );
    
    expect(screen.getByTestId('rating-history-empty')).toBeInTheDocument();
    expect(screen.getByText('No ratings yet')).toBeInTheDocument();
    expect(screen.getByText('Be the first to rate this merchant!')).toBeInTheDocument();
  });

  it('renders ratings for the specified merchant only', () => {
    renderWithIntl(<RatingHistory {...defaultProps} />);
    
    expect(screen.getByTestId('rating-history')).toBeInTheDocument();
    expect(screen.getByText('Customer Ratings')).toBeInTheDocument();
    
    // Should show 3 ratings for merchant-1
    expect(screen.getByTestId('rating-item-rating-1')).toBeInTheDocument();
    expect(screen.getByTestId('rating-item-rating-2')).toBeInTheDocument();
    expect(screen.getByTestId('rating-item-rating-3')).toBeInTheDocument();
    
    // Should not show rating for other-merchant
    expect(screen.queryByText('This should not appear')).not.toBeInTheDocument();
  });

  it('displays correct rating labels and coin amounts', () => {
    renderWithIntl(<RatingHistory {...defaultProps} />);
    
    // Check rating labels
    expect(screen.getByText('Excellent')).toBeInTheDocument(); // 3 coins
    expect(screen.getByText('Good')).toBeInTheDocument(); // 2 coins
    expect(screen.getByText('Poor')).toBeInTheDocument(); // 1 coin
  });

  it('shows rating comments when available', () => {
    renderWithIntl(<RatingHistory {...defaultProps} />);
    
    expect(screen.getByText('Excellent service and food!')).toBeInTheDocument();
    expect(screen.getByText('Good experience overall.')).toBeInTheDocument();
  });

  it('calculates and displays average rating correctly', () => {
    renderWithIntl(<RatingHistory {...defaultProps} />);
    
    // Average of 3, 2, 1 = 2.0
    expect(screen.getByText('Average:')).toBeInTheDocument();
    expect(screen.getByText('2.0')).toBeInTheDocument();
  });

  it('displays ratings count badge', () => {
    renderWithIntl(<RatingHistory {...defaultProps} />);
    
    // Should show badge with count of 3 (ratings for this merchant)
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    renderWithIntl(<RatingHistory {...defaultProps} />);
    
    // Check that dates are formatted (exact format may vary by locale)
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 14, 2024/)).toBeInTheDocument();
  });

  it('shows "Tourist" label for all ratings', () => {
    renderWithIntl(<RatingHistory {...defaultProps} />);
    
    const touristLabels = screen.getAllByText('Tourist');
    expect(touristLabels).toHaveLength(3); // One for each rating
  });

  it('expands and collapses long comments', async () => {
    const longCommentRating: Rating = {
      id: 'rating-long',
      userId: 'user-long',
      merchantId: 'merchant-1',
      coinsSpent: 3,
      comment: 'This is a very long comment that should be truncated initially and then expandable when the user clicks show more. It contains a lot of text to test the expand/collapse functionality.',
      timestamp: new Date('2024-01-16T10:00:00Z'),
    };

    const ratingsWithLongComment = [longCommentRating, ...mockRatings];
    
    renderWithIntl(
      <RatingHistory 
        {...defaultProps} 
        ratings={ratingsWithLongComment}
      />
    );

    const expandButton = screen.getByTestId('expand-comment-rating-long');
    expect(expandButton).toBeInTheDocument();
    expect(screen.getByText('Show more')).toBeInTheDocument();

    // Click to expand
    const user = userEvent.setup();
    await user.click(expandButton);

    expect(screen.getByText('Show less')).toBeInTheDocument();
  });

  it('shows load more button when there are more than 5 ratings', () => {
    const manyRatings: Rating[] = Array.from({ length: 8 }, (_, i) => ({
      id: `rating-${i}`,
      userId: `user-${i}`,
      merchantId: 'merchant-1',
      coinsSpent: (i % 3) + 1,
      comment: `Comment ${i}`,
      timestamp: new Date(`2024-01-${i + 1}T10:00:00Z`),
    }));

    renderWithIntl(
      <RatingHistory 
        {...defaultProps} 
        ratings={manyRatings}
      />
    );

    expect(screen.getByTestId('load-more-ratings')).toBeInTheDocument();
    expect(screen.getByText('Show more (3 more)')).toBeInTheDocument();
  });

  it('loads more ratings when load more button is clicked', async () => {
    const manyRatings: Rating[] = Array.from({ length: 8 }, (_, i) => ({
      id: `rating-${i}`,
      userId: `user-${i}`,
      merchantId: 'merchant-1',
      coinsSpent: (i % 3) + 1,
      comment: `Comment ${i}`,
      timestamp: new Date(`2024-01-${i + 1}T10:00:00Z`),
    }));

    renderWithIntl(
      <RatingHistory 
        {...defaultProps} 
        ratings={manyRatings}
      />
    );

    // Initially shows 5 ratings
    expect(screen.getAllByTestId(/rating-item-/).length).toBe(5);

    // Click load more
    const user = userEvent.setup();
    const loadMoreButton = screen.getByTestId('load-more-ratings');
    await user.click(loadMoreButton);

    // Should now show 8 ratings (all of them)
    await waitFor(() => {
      expect(screen.getAllByTestId(/rating-item-/).length).toBe(8);
    });
  });

  it('shows external load more button when hasMore is true', () => {
    const mockOnLoadMore = jest.fn();
    
    renderWithIntl(
      <RatingHistory 
        {...defaultProps} 
        hasMore={true}
        onLoadMore={mockOnLoadMore}
      />
    );

    expect(screen.getByTestId('load-more-external')).toBeInTheDocument();
    expect(screen.getByText('Load more ratings')).toBeInTheDocument();
  });

  it('calls onLoadMore when external load more is clicked', async () => {
    const mockOnLoadMore = jest.fn();
    const user = userEvent.setup();
    
    renderWithIntl(
      <RatingHistory 
        {...defaultProps} 
        hasMore={true}
        onLoadMore={mockOnLoadMore}
      />
    );

    const loadMoreButton = screen.getByTestId('load-more-external');
    await user.click(loadMoreButton);

    expect(mockOnLoadMore).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    renderWithIntl(
      <RatingHistory 
        {...defaultProps} 
        isLoading={true}
        hasMore={true}
        onLoadMore={jest.fn()}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('sorts ratings by timestamp in descending order', () => {
    renderWithIntl(<RatingHistory {...defaultProps} />);

    const ratingItems = screen.getAllByTestId(/rating-item-/);
    
    // First item should be the most recent (rating-1 from Jan 15)
    expect(ratingItems[0]).toHaveAttribute('data-testid', 'rating-item-rating-1');
    
    // Second item should be rating-2 from Jan 14
    expect(ratingItems[1]).toHaveAttribute('data-testid', 'rating-item-rating-2');
    
    // Third item should be rating-3 from Jan 13
    expect(ratingItems[2]).toHaveAttribute('data-testid', 'rating-item-rating-3');
  });
});