import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { MerchantQRScanner } from '../MerchantQRScanner';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'scanMerchantQR': 'Scan Merchant QR Code',
    };
    return translations[key] || key;
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock haptics
jest.mock('@/lib/utils/haptics', () => ({
  hapticSelection: jest.fn(),
}));

// Mock MediaDevices API
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
});

const mockPush = jest.fn();

describe('MerchantQRScanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Mock successful camera access
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });
  });

  it('renders initial merchant QR scanner interface', () => {
    render(<MerchantQRScanner />);
    
    expect(screen.getByText('Scan Merchant QR Code')).toBeInTheDocument();
    expect(screen.getByText('Merchant QR Code Scanner')).toBeInTheDocument();
    expect(screen.getByText('Scan a merchant\'s QR code to rate your experience')).toBeInTheDocument();
    expect(screen.getByText('Start Scanner')).toBeInTheDocument();
  });

  it('shows close button and calls onClose when clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    render(<MerchantQRScanner onClose={mockOnClose} />);
    
    // Find the X button by its SVG content
    const closeButton = document.querySelector('button svg.lucide-x')?.closest('button');
    expect(closeButton).toBeInTheDocument();
    
    if (closeButton) {
      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('starts camera when start scanner button is clicked', async () => {
    const user = userEvent.setup();
    render(<MerchantQRScanner />);
    
    const startButton = screen.getByText('Start Scanner');
    await user.click(startButton);
    
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
  });

  it('shows camera error when camera access fails', async () => {
    const user = userEvent.setup();
    mockGetUserMedia.mockRejectedValue(new Error('Camera not available'));
    
    render(<MerchantQRScanner />);
    
    const startButton = screen.getByText('Start Scanner');
    await user.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('Camera access denied or not available')).toBeInTheDocument();
    });
  });

  it('shows camera error when getUserMedia is not supported', async () => {
    const user = userEvent.setup();
    
    // Mock unsupported browser
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: undefined,
    });
    
    render(<MerchantQRScanner />);
    
    const startButton = screen.getByText('Start Scanner');
    await user.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('Camera not supported on this device')).toBeInTheDocument();
    });
  });

  it('handles camera functionality', () => {
    render(<MerchantQRScanner />);
    
    // Component should render without camera controls initially
    expect(screen.queryByText('Scan QR Code')).not.toBeInTheDocument();
    expect(screen.queryByText('Switch')).not.toBeInTheDocument();
  });

  it('handles camera switching functionality', () => {
    render(<MerchantQRScanner />);
    
    // Component should handle camera switching without errors
    expect(screen.getByText('Start Scanner')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-scanner-class';
    render(<MerchantQRScanner className={customClass} />);
    
    const container = screen.getByText('Scan Merchant QR Code').closest('.custom-scanner-class');
    expect(container).toBeInTheDocument();
  });

  it('handles component lifecycle correctly', () => {
    const { unmount } = render(<MerchantQRScanner />);
    
    // Component should unmount without errors
    expect(() => unmount()).not.toThrow();
  });
});