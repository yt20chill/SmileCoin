import { render, screen, fireEvent } from '@testing-library/react';
import { MerchantCard } from '../MerchantCard';
import { Merchant, Offer } from '@/lib/types';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'discount': 'Discount',
      'validUntil': 'Valid until',
      'viewDetails': 'View Details'
    };
    return translations[key] || key;
  }
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

const mockMerchant: Merchant = {
  id: 'merchant-1',
  name: 'Test Restaurant',
  nameZh: '測試餐廳',
  description: 'A great place to eat',
  descriptionZh: '一個很棒的用餐地點',
  logo: '/test-logo.jpg',
  foodImage: '/merchant-image-01.jpg',
  category: 'Restaurant',
  qrCode: 'SMILE_MERCHANT-1_RATING_ACCESS',
  location: {
    address: '123 Test Street, Central',
    addressZh: '中環測試街123號',
    coordinates: [22.2783, 114.1747]
  },
  rating: 4.5,
  totalRatings: 120,
  isActive: true
};

const mockOffer: Offer = {
  id: 'offer-1',
  merchantId: 'merchant-1',
  title: '20% Off All Items',
  titleZh: '全部商品8折',
  description: 'Get 20% discount on all menu items',
  descriptionZh: '所有菜單項目享8折優惠',
  discountPercentage: 20,
  validUntil: new Date('2024-12-31'),
  termsAndConditions: 'Valid for dine-in only',
  termsAndConditionsZh: '僅限堂食',
  isActive: true
};

describe('MerchantCard', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders merchant information correctly', () => {
    render(
      <MerchantCard
        merchant={mockMerchant}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByText('A great place to eat')).toBeInTheDocument();
    expect(screen.getByText('4.5 (120)')).toBeInTheDocument();
    expect(screen.getByText('Restaurant')).toBeInTheDocument();
    expect(screen.getByText('123 Test Street, Central')).toBeInTheDocument();
  });

  it('renders Chinese text when locale is zh-TW', () => {
    render(
      <MerchantCard
        merchant={mockMerchant}
        onSelect={mockOnSelect}
        locale="zh-TW"
      />
    );

    expect(screen.getByText('測試餐廳')).toBeInTheDocument();
    expect(screen.getByText('一個很棒的用餐地點')).toBeInTheDocument();
    expect(screen.getByText('中環測試街123號')).toBeInTheDocument();
  });

  it('displays offer information when offer is provided', () => {
    render(
      <MerchantCard
        merchant={mockMerchant}
        offer={mockOffer}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('20% Discount')).toBeInTheDocument();
    expect(screen.getByText('20% Off All Items')).toBeInTheDocument();
    expect(screen.getByText('Get 20% discount on all menu items')).toBeInTheDocument();
  });

  it('displays Chinese offer text when locale is zh-TW', () => {
    render(
      <MerchantCard
        merchant={mockMerchant}
        offer={mockOffer}
        onSelect={mockOnSelect}
        locale="zh-TW"
      />
    );

    expect(screen.getByText('全部商品8折')).toBeInTheDocument();
    expect(screen.getByText('所有菜單項目享8折優惠')).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', () => {
    render(
      <MerchantCard
        merchant={mockMerchant}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByTestId('merchant-card');
    fireEvent.click(card);

    expect(mockOnSelect).toHaveBeenCalledWith('merchant-1');
  });

  it('calls onSelect when view details button is clicked', () => {
    render(
      <MerchantCard
        merchant={mockMerchant}
        onSelect={mockOnSelect}
      />
    );

    const button = screen.getByText('View Details');
    fireEvent.click(button);

    expect(mockOnSelect).toHaveBeenCalledWith('merchant-1');
  });

  it('renders without offer when no offer is provided', () => {
    render(
      <MerchantCard
        merchant={mockMerchant}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.queryByText('20% Discount')).not.toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(
      <MerchantCard
        merchant={mockMerchant}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByTestId('merchant-card');
    expect(card).toHaveAttribute('role', 'button');
    
    const image = screen.getByAltText('Test Restaurant');
    expect(image).toBeInTheDocument();
  });

  it('applies theme colors correctly', () => {
    render(
      <MerchantCard
        merchant={mockMerchant}
        offer={mockOffer}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByTestId('merchant-card');
    expect(card).toHaveClass('hover:border-hk-red/30');
    
    const viewDetailsButton = screen.getByText('View Details');
    expect(viewDetailsButton).toHaveClass('group-hover:bg-hk-red/5', 'group-hover:border-hk-red', 'group-hover:text-hk-red');
  });
});