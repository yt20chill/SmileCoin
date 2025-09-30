import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { RatingInterface } from '../RatingInterface';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'rateMerchant': 'Rate Merchant',
      'rateExperience': 'Rate your experience at {merchantName}',
      'yourBalance': 'Your Balance',
      'coins': 'coins',
      'selectRating': 'Select your rating',
      'poor': 'Poor',
      'poorDescription': 'Below expectations',
      'good': 'Good',
      'goodDescription': 'Met expectations',
      'excellent': 'Excellent',
      'excellentDescription': 'Exceeded expectations',
      'cancel': 'Cancel',
      'submitRating': 'Submit Rating',
      'willSpend': 'You will use',
      'newBalance': 'New balance',
      'qrCodeValidated': 'QR Code Validated',
      'canNowRate': 'You can now rate this merchant',
      'scanQRToRate': 'Scan QR Code to Rate',
      'scanQRInstructions': 'You must scan the merchant\'s QR code before you can submit a rating.',
      'scanQRCode': 'Scan QR Code',
      'submitting': 'Submitting...',
      'ratingSubmitted': 'Rating submitted successfully!',
      'wrongMerchantQR': 'Wrong merchant QR code',
      'scanQRFirst': 'Please scan QR code first',
      'insufficientBalance': 'Insufficient balance',
      'submitError': 'Failed to submit rating',
    };
    return translations[key] || key;
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock components
jest.mock('@/components/wallet/CoinAnimation', () => ({
  CoinAnimation: ({ onComplete }: any) => {
    // Auto-complete the animation immediately for testing
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

jest.mock('../QRScanner', () => ({
  QRScanner: ({ isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="qr-scanner">
        <button onClick={onClose}>Close QR Scanner</button>
      </div>
    ) : null,
}));

describe('RatingInterface - QR Bypass', () => {
  const defaultProps = {
    merchantId: 'merchant-1',
    merchantName: 'Test Merchant',
    userBalance: 10,
    onRatingSubmit: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires QR scan by default', () => {
    render(<RatingInterface {...defaultProps} />);
    
    // Should show QR scanning section
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    
    // Should not show rating options
    expect(screen.queryByText('Select your rating')).not.toBeInTheDocument();
  });

  it('bypasses QR scan when isQRAlreadyScanned is true', () => {
    render(<RatingInterface {...defaultProps} isQRAlreadyScanned={true} />);
    
    // Should show QR validated message
    expect(screen.getByText('QR Code Validated')).toBeInTheDocument();
    expect(screen.getByText('You can now rate this merchant')).toBeInTheDocument();
    
    // Should show rating options immediately
    expect(screen.getByText('Select your rating')).toBeInTheDocument();
    expect(screen.getByText('Poor')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    
    // Should not show QR scanning section
    expect(screen.queryByText('Scan QR Code')).not.toBeInTheDocument();
  });

  it('allows rating selection when QR is already scanned', async () => {
    render(<RatingInterface {...defaultProps} isQRAlreadyScanned={true} />);
    
    // Select a rating
    const goodRating = screen.getByTestId('rating-option-2');
    await userEvent.click(goodRating);
    
    // Should show rating summary
    expect(screen.getByTestId('rating-summary')).toBeInTheDocument();
    expect(screen.getByText(/You will use/)).toBeInTheDocument();
    expect(screen.getByText(/New balance/)).toBeInTheDocument();
    
    // Submit button should be enabled
    const submitButton = screen.getByTestId('submit-rating-button');
    expect(submitButton).not.toBeDisabled();
  });

  it('submits rating without requiring QR scan when already scanned', async () => {
    const mockOnRatingSubmit = jest.fn().mockResolvedValue(undefined);
    
    render(
      <RatingInterface 
        {...defaultProps} 
        isQRAlreadyScanned={true}
        onRatingSubmit={mockOnRatingSubmit}
      />
    );
    
    // Select excellent rating
    const excellentRating = screen.getByTestId('rating-option-3');
    await userEvent.click(excellentRating);
    
    // Submit rating
    const submitButton = screen.getByTestId('submit-rating-button');
    await userEvent.click(submitButton);
    
    // Should call onRatingSubmit with correct parameters
    await waitFor(() => {
      expect(mockOnRatingSubmit).toHaveBeenCalledWith(
        3, // rating
        3, // coins spent
        'SMILE_MERCHANT-1_RATING_ACCESS' // QR code data
      );
    }, { timeout: 3000 });
  });

  it('shows different behavior for manual QR scan vs pre-scanned', async () => {
    // Test manual QR scan flow
    const { unmount } = render(<RatingInterface {...defaultProps} />);
    
    expect(screen.getByText('Scan QR Code to Rate')).toBeInTheDocument();
    expect(screen.queryByText('Select your rating')).not.toBeInTheDocument();
    
    // Unmount and test pre-scanned flow with fresh render
    unmount();
    render(<RatingInterface {...defaultProps} isQRAlreadyScanned={true} />);
    
    expect(screen.getByText('QR Code Validated')).toBeInTheDocument();
    expect(screen.getByText('Select your rating')).toBeInTheDocument();
    expect(screen.queryByText('Scan QR Code to Rate')).not.toBeInTheDocument();
  });
});