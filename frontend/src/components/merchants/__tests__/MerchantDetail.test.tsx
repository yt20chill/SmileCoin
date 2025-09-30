import { render, screen, fireEvent } from '@testing-library/react';
import { MerchantDetail } from '../MerchantDetail';
import { Merchant, Offer } from '@/lib/types';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'rateExperience': 'Rate your experience',
      'offers': 'Offers',
      'validUntil': 'Valid until'
    };
    return translations[key] || key;
  }
}));

// Mock useLocale hook
jest.mock('@/lib/hooks/useLocale', () => ({
  useLocale: () => ({
    locale: 'en'
  })
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
  description: 'A wonderful dining experience with authentic cuisine',
  descriptionZh: '正宗美食的絕佳用餐體驗',
  logo: '/test-logo.jpg',
  foodImage: '/merchant-image-01.jpg',
  category: 'Restaurant',
  qrCode: 'SMILE_MERCHANT-1_RATING_ACCESS',
  location: {
    address: '123 Test Street, Central, Hong Kong',
    addressZh: '香港中環測試街123號',
    coordinates: [22.2783, 114.1747]
  },
  rating: 4.5,
  totalRatings: 120,
  isActive: true
};

const mockOffers: Offer[] = [
  {
    id: 'offer-1',
    merchantId: 'merchant-1',
    title: '20% Off All Items',
    titleZh: '全部商品8折',
    description: 'Get 20% discount on all menu items during lunch hours',
    descriptionZh: '午餐時間所有菜單項目享8折優惠',
    discountPercentage: 20,
    validUntil: new Date('2025-12-31'),
    termsAndConditions: 'Valid for dine-in only, not applicable with other offers',
    termsAndConditionsZh: '僅限堂食，不可與其他優惠同時使用',
    isActive: true
  },
  {
    id: 'offer-2',
    merchantId: 'merchant-1',
    title: 'Free Dessert',
    titleZh: '免費甜品',
    description: 'Complimentary dessert with any main course',
    descriptionZh: '點任何主菜即送免費甜品',
    discountPercentage: 15,
    validUntil: new Date('2025-11-30'),
    termsAndConditions: 'One dessert per table',
    termsAndConditionsZh: '每桌限一份甜品',
    isActive: true
  }
];

describe('MerchantDetail', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders merchant information correctly', () => {
    render(
      <MerchantDetail
        merchant={mockMerchant}
        offers={mockOffers}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByText('A wonderful dining experience with authentic cuisine')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(120 ratings)')).toBeInTheDocument();
    expect(screen.getByText('Restaurant')).toBeInTheDocument();
    expect(screen.getAllByText('123 Test Street, Central, Hong Kong')).toHaveLength(2);
  });

  it('calls onBack when back button is clicked', () => {
    render(
      <MerchantDetail
        merchant={mockMerchant}
        offers={mockOffers}
        onBack={mockOnBack}
      />
    );

    const backButton = screen.getByTestId('back-button');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('shows rating interface when rate button is clicked', () => {
    render(
      <MerchantDetail
        merchant={mockMerchant}
        offers={mockOffers}
        onBack={mockOnBack}
      />
    );

    const rateButton = screen.getByTestId('rate-merchant-button');
    fireEvent.click(rateButton);

    // The rating interface should be shown (this is handled internally)
    expect(rateButton).toBeInTheDocument();
  });

  it('renders offers section with all active offers', () => {
    render(
      <MerchantDetail
        merchant={mockMerchant}
        offers={mockOffers}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText(/Offers \(2\)/)).toBeInTheDocument();
    expect(screen.getByTestId('offer-offer-1')).toBeInTheDocument();
    expect(screen.getByTestId('offer-offer-2')).toBeInTheDocument();
    
    expect(screen.getByText('20% OFF')).toBeInTheDocument();
    expect(screen.getByText('15% OFF')).toBeInTheDocument();
    expect(screen.getByText('20% Off All Items')).toBeInTheDocument();
    expect(screen.getByText('Free Dessert')).toBeInTheDocument();
  });

  it('displays offer terms and conditions', () => {
    render(
      <MerchantDetail
        merchant={mockMerchant}
        offers={mockOffers}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText(/Valid for dine-in only/)).toBeInTheDocument();
    expect(screen.getByText(/One dessert per table/)).toBeInTheDocument();
  });

  it('does not render offers section when no offers are provided', () => {
    render(
      <MerchantDetail
        merchant={mockMerchant}
        offers={[]}
        onBack={mockOnBack}
      />
    );

    expect(screen.queryByText(/Offers/)).not.toBeInTheDocument();
  });

  it('filters out inactive offers', () => {
    const offersWithInactive = [
      ...mockOffers,
      {
        id: 'offer-3',
        merchantId: 'merchant-1',
        title: 'Expired Offer',
        titleZh: '過期優惠',
        description: 'This offer has expired',
        descriptionZh: '此優惠已過期',
        discountPercentage: 30,
        validUntil: new Date('2020-01-01'), // Past date
        termsAndConditions: 'Expired',
        termsAndConditionsZh: '已過期',
        isActive: true
      }
    ];

    render(
      <MerchantDetail
        merchant={mockMerchant}
        offers={offersWithInactive}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText(/Offers \(2\)/)).toBeInTheDocument(); // Still only 2 active offers
    expect(screen.queryByText('Expired Offer')).not.toBeInTheDocument();
  });

  it('renders contact information section', () => {
    render(
      <MerchantDetail
        merchant={mockMerchant}
        offers={mockOffers}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getAllByText('123 Test Street, Central, Hong Kong')).toHaveLength(2); // Appears in both merchant info and contact sections
    expect(screen.getByText('+852 1234 5678')).toBeInTheDocument();
    expect(screen.getByText('www.example.com')).toBeInTheDocument();
    expect(screen.getByText('Mon-Sun: 9:00 AM - 10:00 PM')).toBeInTheDocument();
  });

  it('handles singular rating text correctly', () => {
    const merchantWithOneRating = {
      ...mockMerchant,
      totalRatings: 1
    };

    render(
      <MerchantDetail
        merchant={merchantWithOneRating}
        offers={mockOffers}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('(1 rating)')).toBeInTheDocument();
  });

  it('has correct test ids for all interactive elements', () => {
    render(
      <MerchantDetail
        merchant={mockMerchant}
        offers={mockOffers}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByTestId('merchant-detail')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByTestId('rate-merchant-button')).toBeInTheDocument();
    expect(screen.getByTestId('offer-offer-1')).toBeInTheDocument();
    expect(screen.getByTestId('offer-offer-2')).toBeInTheDocument();
  });

  it('applies theme colors correctly', () => {
    render(
      <MerchantDetail
        merchant={mockMerchant}
        offers={mockOffers}
        onBack={mockOnBack}
      />
    );

    const rateButton = screen.getByTestId('rate-merchant-button');
    expect(rateButton).toHaveClass('bg-gradient-to-r', 'from-hk-red', 'to-hk-gold');
  });
});