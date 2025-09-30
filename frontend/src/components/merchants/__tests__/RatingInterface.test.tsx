import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { RatingInterface } from '../RatingInterface';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock CoinAnimation component
jest.mock('../../wallet/CoinAnimation', () => ({
  CoinAnimation: ({ onComplete }: { onComplete: () => void }) => {
    React.useEffect(() => {
      const timer = setTimeout(onComplete, 100);
      return () => clearTimeout(timer);
    }, [onComplete]);
    return <div data-testid="coin-animation">Coin Animation</div>;
  },
}));

// Mock QRScanner component
jest.mock('../QRScanner', () => ({
  QRScanner: ({ isOpen, onScanSuccess, onClose }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="qr-scanner">
        <button 
          data-testid="mock-scan-success" 
          onClick={() => onScanSuccess('merchant-1', 'Test Merchant')}
        >
          Mock Scan Success
        </button>
        <button data-testid="mock-close-scanner" onClick={onClose}>
          Close Scanner
        </button>
      </div>
    );
  },
}));

const mockMessages = {
  rating: {
    rateMerchant: 'Rate Merchant',
    rateExperience: 'Rate your experience at {merchantName}',
    yourBalance: 'Your Balance',
    coins: 'coins',
    selectRating: 'Select your rating',
    poor: 'Poor',
    poorDescription: 'Below expectations',
    good: 'Good',
    goodDescription: 'Met expectations',
    excellent: 'Excellent',
    excellentDescription: 'Exceeded expectations',
    insufficientBalance: 'Insufficient Smile Coins for this rating',
    cancel: 'Cancel',
    submitRating: 'Submit Rating',
    submitting: 'Submitting...',
    ratingSubmitted: 'Rating submitted successfully!',
    submitError: 'Failed to submit rating',
    willSpend: 'You will spend',
    newBalance: 'New balance',
    scanQRToRate: 'Scan QR Code to Rate',
    scanQRInstructions: 'You must scan the merchant\'s QR code before you can submit a rating.',
    scanQRCode: 'Scan QR Code',
    qrCodeValidated: 'QR Code Validated',
    canNowRate: 'You can now rate this merchant',
    scanQRFirst: 'Please scan the merchant\'s QR code first',
    wrongMerchantQR: 'This QR code is for a different merchant',
  },
};

const defaultProps = {
  merchantId: 'merchant-1',
  merchantName: 'Test Merchant',
  userBalance: 100,
  onRatingSubmit: jest.fn(),
  onClose: jest.fn(),
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('RatingInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders rating interface with QR scan requirement', () => {
    renderWithIntl(<RatingInterface {...defaultProps} />);
    
    expect(screen.getByText('Rate Merchant')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // balance
    expect(screen.getByText('Scan QR Code to Rate')).toBeInTheDocument();
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
  });

  it('shows QR scanner when scan button is clicked', async () => {
    const user = userEvent.setup();
    renderWithIntl(<RatingInterface {...defaultProps} />);
    
    const scanButton = screen.getByTestId('scan-qr-button');
    await user.click(scanButton);
    
    expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
  });

  it('displays rating options after successful QR scan', async () => {
    const user = userEvent.setup();
    renderWithIntl(<RatingInterface {...defaultProps} />);
    
    // Scan QR code first
    const scanButton = screen.getByTestId('scan-qr-button');
    await user.click(scanButton);
    
    const mockScanSuccess = screen.getByTestId('mock-scan-success');
    await user.click(mockScanSuccess);
    
    // Now rating options should be visible
    await waitFor(() => {
      expect(screen.getByTestId('rating-option-1')).toBeInTheDocument();
      expect(screen.getByTestId('rating-option-2')).toBeInTheDocument();
      expect(screen.getByTestId('rating-option-3')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Poor')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('shows QR validated message after successful scan', async () => {
    const user = userEvent.setup();
    renderWithIntl(<RatingInterface {...defaultProps} />);
    
    // Scan QR code
    const scanButton = screen.getByTestId('scan-qr-button');
    await user.click(scanButton);
    
    const mockScanSuccess = screen.getByTestId('mock-scan-success');
    await user.click(mockScanSuccess);
    
    // Should show validation message
    await waitFor(() => {
      expect(screen.getByTestId('qr-validated-message')).toBeInTheDocument();
      expect(screen.getByText('QR Code Validated')).toBeInTheDocument();
    });
  });

  it('prevents rating selection without QR scan', async () => {
    const user = userEvent.setup();
    renderWithIntl(<RatingInterface {...defaultProps} />);
    
    // Rating options should not be visible without QR scan
    expect(screen.queryByTestId('rating-option-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rating-option-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rating-option-3')).not.toBeInTheDocument();
  });

  it('submits rating successfully after QR scan', async () => {
    const user = userEvent.setup();
    const mockOnRatingSubmit = jest.fn().mockResolvedValue(undefined);
    
    renderWithIntl(
      <RatingInterface 
        {...defaultProps} 
        onRatingSubmit={mockOnRatingSubmit}
      />
    );
    
    // First scan QR code
    const scanButton = screen.getByTestId('scan-qr-button');
    await user.click(scanButton);
    
    const mockScanSuccess = screen.getByTestId('mock-scan-success');
    await user.click(mockScanSuccess);
    
    // Wait for rating options to appear
    await waitFor(() => {
      expect(screen.getByTestId('rating-option-2')).toBeInTheDocument();
    });
    
    // Select rating
    const goodRating = screen.getByTestId('rating-option-2');
    await user.click(goodRating);
    
    // Submit rating
    const submitButton = screen.getByTestId('submit-rating-button');
    await user.click(submitButton);
    
    // Should show coin animation
    expect(screen.getByTestId('coin-animation-overlay')).toBeInTheDocument();
    
    // Wait for submission with QR code data
    await waitFor(() => {
      expect(mockOnRatingSubmit).toHaveBeenCalledWith(2, 2, 'SMILE_MERCHANT-1_RATING_ACCESS');
    });
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByText('Rating submitted successfully!')).toBeInTheDocument();
    });
  });

  it('applies theme colors correctly', async () => {
    renderWithIntl(<RatingInterface {...defaultProps} />);
    
    // Check QR scan section colors by finding the container with the specific classes
    const qrSection = document.querySelector('.bg-hk-red\\/5.border-hk-red\\/20');
    expect(qrSection).toBeInTheDocument();
    
    const scanButton = screen.getByTestId('scan-qr-button');
    expect(scanButton).toHaveClass('bg-hk-red', 'hover:bg-hk-red/90');
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    
    renderWithIntl(
      <RatingInterface {...defaultProps} onClose={mockOnClose} />
    );
    
    const cancelButton = screen.getByTestId('cancel-button');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables submit button when no QR scan completed', () => {
    renderWithIntl(<RatingInterface {...defaultProps} />);
    
    const submitButton = screen.getByTestId('submit-rating-button');
    expect(submitButton).toBeDisabled();
  });
});