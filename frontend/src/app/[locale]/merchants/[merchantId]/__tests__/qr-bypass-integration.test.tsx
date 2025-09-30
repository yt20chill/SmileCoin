import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MerchantDetailPage from '../page';

// Mock next/navigation with different scenarios
const mockUseSearchParams = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => ({ merchantId: 'merchant-1' }),
  useSearchParams: () => ({
    get: mockUseSearchParams,
  }),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'rateMerchant': 'Rate Merchant',
      'rateExperience': 'Rate your experience at {merchantName}',
      'yourBalance': 'Your Balance',
      'coins': 'coins',
      'selectRating': 'Select your rating',
      'qrCodeValidated': 'QR Code Validated',
      'canNowRate': 'You can now rate this merchant',
      'scanQRToRate': 'Scan QR Code to Rate',
      'scanQRInstructions': 'You must scan the merchant\'s QR code before you can submit a rating.',
      'scanQRCode': 'Scan QR Code',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock layout components
jest.mock('@/components/layout', () => ({
  MainLayout: ({ children }: any) => <div data-testid="main-layout">{children}</div>,
  Container: ({ children }: any) => <div data-testid="container">{children}</div>,
  PageHeader: ({ title, subtitle }: any) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  ),
}));

// Mock merchant components
jest.mock('@/components/merchants/MerchantDetail', () => ({
  MerchantDetail: ({ merchant }: any) => (
    <div data-testid="merchant-detail">
      <h2>{merchant.name}</h2>
    </div>
  ),
}));

// Mock QR Scanner and Coin Animation
jest.mock('@/components/merchants/QRScanner', () => ({
  QRScanner: ({ isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="qr-scanner">
        <button onClick={onClose}>Close QR Scanner</button>
      </div>
    ) : null,
}));

jest.mock('@/components/wallet/CoinAnimation', () => ({
  CoinAnimation: ({ onComplete }: any) => {
    React.useEffect(() => {
      if (onComplete) {
        setTimeout(onComplete, 0);
      }
    }, [onComplete]);
    
    return (
      <div data-testid="coin-animation">
        Coin Animation
      </div>
    );
  },
}));

// Mock hooks
jest.mock('@/lib/hooks/useMerchants', () => ({
  useMerchants: () => ({
    merchants: [
      {
        id: 'merchant-1',
        name: 'Test Merchant',
        category: 'Restaurant',
        description: 'Test description',
        location: { address: 'Test Address' },
        rating: 4.5,
        totalRatings: 100,
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/lib/hooks/useRating', () => ({
  useRating: () => ({
    submitRating: jest.fn(),
    isSubmitting: false,
  }),
}));

jest.mock('@/lib/hooks/useWallet', () => ({
  useWallet: () => ({
    wallet: { balance: 10 },
  }),
}));

describe('MerchantDetailPage - QR Bypass Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows QR scanning interface when showRating is false', () => {
    // Mock URL without showRating parameter
    mockUseSearchParams.mockImplementation((key: string) => 
      key === 'showRating' ? null : null
    );

    render(<MerchantDetailPage />);
    
    // Should not show rating interface
    expect(screen.queryByTestId('rating-interface')).not.toBeInTheDocument();
  });

  it('bypasses QR scan and shows rating interface when showRating=true', () => {
    // Mock URL with showRating=true parameter
    mockUseSearchParams.mockImplementation((key: string) => 
      key === 'showRating' ? 'true' : null
    );

    render(<MerchantDetailPage />);
    
    // Should show rating interface
    expect(screen.getByText('Rate Merchant')).toBeInTheDocument();
    
    // Should show QR validated message (bypassed)
    expect(screen.getByText('QR Code Validated')).toBeInTheDocument();
    expect(screen.getByText('You can now rate this merchant')).toBeInTheDocument();
    
    // Should show rating options immediately
    expect(screen.getByText('Select your rating')).toBeInTheDocument();
    
    // Should NOT show QR scanning section
    expect(screen.queryByText('Scan QR Code to Rate')).not.toBeInTheDocument();
  });

  it('shows QR scanning interface when showRating=false', () => {
    // Mock URL with showRating=false parameter
    mockUseSearchParams.mockImplementation((key: string) => 
      key === 'showRating' ? 'false' : null
    );

    render(<MerchantDetailPage />);
    
    // Should not show rating interface
    expect(screen.queryByTestId('rating-interface')).not.toBeInTheDocument();
  });

  it('correctly passes isQRAlreadyScanned prop based on showRating parameter', () => {
    // Test with showRating=true
    mockUseSearchParams.mockImplementation((key: string) => 
      key === 'showRating' ? 'true' : null
    );

    const { unmount } = render(<MerchantDetailPage />);
    
    // Should bypass QR scan
    expect(screen.getByText('QR Code Validated')).toBeInTheDocument();
    expect(screen.queryByText('Scan QR Code to Rate')).not.toBeInTheDocument();

    // Test with showRating=null (no parameter) - fresh render
    unmount();
    mockUseSearchParams.mockImplementation((key: string) => null);
    
    render(<MerchantDetailPage />);
    
    // Should not show rating interface at all
    expect(screen.queryByText('QR Code Validated')).not.toBeInTheDocument();
    expect(screen.queryByText('Rate Merchant')).not.toBeInTheDocument();
  });
});