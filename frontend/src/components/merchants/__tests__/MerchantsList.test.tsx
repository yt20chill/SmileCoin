import { render, screen, fireEvent } from '@testing-library/react';
import { MerchantsList } from '../MerchantsList';
import { Merchant, Offer } from '@/lib/types';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}));

// Mock useLocale hook
jest.mock('@/lib/hooks/useLocale', () => ({
  useLocale: () => ({
    locale: 'en'
  })
}));

// Mock MerchantCard component
jest.mock('../MerchantCard', () => ({
  MerchantCard: ({ merchant, offer, onSelect }: any) => (
    <div 
      data-testid={`merchant-card-${merchant.id}`}
      onClick={() => onSelect(merchant.id)}
    >
      <span>{merchant.name}</span>
      {offer && <span data-testid="offer-badge">{offer.title}</span>}
    </div>
  )
}));

// Mock common components
jest.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

jest.mock('@/components/common/ErrorMessage', () => ({
  ErrorMessage: ({ message, onRetry }: any) => (
    <div data-testid="error-message">
      <span>{message}</span>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  )
}));

const mockMerchants: Merchant[] = [
  {
    id: 'merchant-1',
    name: 'Test Restaurant 1',
    nameZh: '測試餐廳1',
    description: 'Great food',
    descriptionZh: '美味食物',
    logo: '/logo1.jpg',
    category: 'Restaurant',
    location: {
      address: '123 Test St',
      addressZh: '測試街123號',
      coordinates: [22.2783, 114.1747]
    },
    rating: 4.5,
    totalRatings: 100,
    isActive: true
  },
  {
    id: 'merchant-2',
    name: 'Test Shop 2',
    nameZh: '測試商店2',
    description: 'Great shopping',
    descriptionZh: '很棒的購物',
    logo: '/logo2.jpg',
    category: 'Shopping',
    location: {
      address: '456 Shop Ave',
      addressZh: '商店大道456號',
      coordinates: [22.2783, 114.1747]
    },
    rating: 4.2,
    totalRatings: 80,
    isActive: true
  }
];

const mockOffers: Offer[] = [
  {
    id: 'offer-1',
    merchantId: 'merchant-1',
    title: '20% Off Food',
    titleZh: '食物8折',
    description: 'Discount on all food items',
    descriptionZh: '所有食物項目折扣',
    discountPercentage: 20,
    validUntil: new Date('2024-12-31'),
    termsAndConditions: 'Dine-in only',
    termsAndConditionsZh: '僅限堂食',
    isActive: true
  },
  {
    id: 'offer-2',
    merchantId: 'merchant-1',
    title: '10% Off Drinks',
    titleZh: '飲品9折',
    description: 'Discount on beverages',
    descriptionZh: '飲品折扣',
    discountPercentage: 10,
    validUntil: new Date('2024-12-31'),
    termsAndConditions: 'All day',
    termsAndConditionsZh: '全天',
    isActive: true
  }
];

describe('MerchantsList', () => {
  const mockOnMerchantSelect = jest.fn();
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    render(
      <MerchantsList
        merchants={[]}
        offers={[]}
        isLoading={true}
        error={null}
        onMerchantSelect={mockOnMerchantSelect}
      />
    );

    expect(screen.getByTestId('merchants-loading')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    render(
      <MerchantsList
        merchants={[]}
        offers={[]}
        isLoading={false}
        error="Failed to load merchants"
        onMerchantSelect={mockOnMerchantSelect}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByTestId('merchants-error')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Failed to load merchants')).toBeInTheDocument();
  });

  it('renders empty state when no merchants found', () => {
    render(
      <MerchantsList
        merchants={[]}
        offers={[]}
        isLoading={false}
        error={null}
        onMerchantSelect={mockOnMerchantSelect}
      />
    );

    expect(screen.getByTestId('no-merchants')).toBeInTheDocument();
    expect(screen.getByText('No merchants found')).toBeInTheDocument();
  });

  it('renders merchants grid correctly', () => {
    render(
      <MerchantsList
        merchants={mockMerchants}
        offers={mockOffers}
        isLoading={false}
        error={null}
        onMerchantSelect={mockOnMerchantSelect}
      />
    );

    expect(screen.getByTestId('merchants-grid')).toBeInTheDocument();
    expect(screen.getByTestId('merchant-card-merchant-1')).toBeInTheDocument();
    expect(screen.getByTestId('merchant-card-merchant-2')).toBeInTheDocument();
    expect(screen.getByText('Test Restaurant 1')).toBeInTheDocument();
    expect(screen.getByText('Test Shop 2')).toBeInTheDocument();
  });

  it('passes best offer to merchant cards', () => {
    render(
      <MerchantsList
        merchants={mockMerchants}
        offers={mockOffers}
        isLoading={false}
        error={null}
        onMerchantSelect={mockOnMerchantSelect}
      />
    );

    // Merchant 1 should have the 20% offer (best of 20% and 10%)
    const merchant1Card = screen.getByTestId('merchant-card-merchant-1');
    expect(merchant1Card).toBeInTheDocument();
    expect(screen.getByText('20% Off Food')).toBeInTheDocument();

    // Merchant 2 should have no offers
    const merchant2Card = screen.getByTestId('merchant-card-merchant-2');
    expect(merchant2Card).toBeInTheDocument();
    expect(merchant2Card.querySelector('[data-testid="offer-badge"]')).not.toBeInTheDocument();
  });

  it('calls onMerchantSelect when merchant card is clicked', () => {
    render(
      <MerchantsList
        merchants={mockMerchants}
        offers={mockOffers}
        isLoading={false}
        error={null}
        onMerchantSelect={mockOnMerchantSelect}
      />
    );

    const merchantCard = screen.getByTestId('merchant-card-merchant-1');
    fireEvent.click(merchantCard);

    expect(mockOnMerchantSelect).toHaveBeenCalledWith('merchant-1');
  });

  it('calls onRetry when retry button is clicked in error state', () => {
    render(
      <MerchantsList
        merchants={[]}
        offers={[]}
        isLoading={false}
        error="Network error"
        onMerchantSelect={mockOnMerchantSelect}
        onRetry={mockOnRetry}
      />
    );

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalled();
  });

  it('handles merchants without offers correctly', () => {
    render(
      <MerchantsList
        merchants={mockMerchants}
        offers={[]} // No offers
        isLoading={false}
        error={null}
        onMerchantSelect={mockOnMerchantSelect}
      />
    );

    expect(screen.getByTestId('merchant-card-merchant-1')).toBeInTheDocument();
    expect(screen.getByTestId('merchant-card-merchant-2')).toBeInTheDocument();
    expect(screen.queryByTestId('offer-badge')).not.toBeInTheDocument();
  });
});