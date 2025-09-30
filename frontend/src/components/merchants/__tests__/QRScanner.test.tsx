import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QRScanner } from '../QRScanner';
import { AppContextProvider } from '@/lib/stores/context';
import { ReactNode } from 'react';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock context provider
const mockContextValue = {
  state: {
    user: { id: 'test-user' },
    qrScans: [],
  },
  dispatch: jest.fn(),
};

jest.mock('@/lib/stores/context', () => ({
  useAppContext: () => mockContextValue,
}));

// Mock QR scanner hook
const mockUseQRScanner = {
  isScanning: false,
  isProcessing: false,
  error: null as string | null,
  lastScanResult: null as any,
  startScanning: jest.fn(),
  stopScanning: jest.fn(),
  validateQRCode: jest.fn(),
  clearError: jest.fn(),
  getQRScanHistory: jest.fn().mockReturnValue([]),
  getVisitedMerchants: jest.fn().mockReturnValue([]),
  getScanStatistics: jest.fn().mockReturnValue({
    totalScans: 0,
    validScans: 0,
    uniqueMerchants: 0,
    lastScanDate: null,
    scanSuccessRate: 0,
  }),
};

jest.mock('@/lib/hooks/useQRScanner', () => ({
  useQRScanner: () => mockUseQRScanner,
}));

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(),
  },
});

const mockGetUserMedia = navigator.mediaDevices.getUserMedia as jest.Mock;

describe('QRScanner', () => {
  const mockOnScanSuccess = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    isOpen: true,
    onScanSuccess: mockOnScanSuccess,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockClear();
    Object.keys(mockUseQRScanner).forEach(key => {
      if (typeof mockUseQRScanner[key as keyof typeof mockUseQRScanner] === 'function') {
        (mockUseQRScanner[key as keyof typeof mockUseQRScanner] as jest.Mock).mockClear();
      }
    });
  });

  it('should not render when isOpen is false', () => {
    render(<QRScanner {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId('qr-scanner-video')).not.toBeInTheDocument();
  });

  it('should render scanner interface when open', () => {
    render(<QRScanner {...defaultProps} />);

    expect(screen.getByText('scanQRCode')).toBeInTheDocument();
    expect(screen.getByText('scanInstructions')).toBeInTheDocument();
    expect(screen.getByTestId('close-scanner-button')).toBeInTheDocument();
  });

  it('should show camera permission request initially', () => {
    render(<QRScanner {...defaultProps} />);

    expect(screen.getByText('requestingCamera')).toBeInTheDocument();
  });

  it('should handle camera permission granted', async () => {
    const mockStream = {
      getTracks: jest.fn().mockReturnValue([
        { stop: jest.fn() }
      ])
    };

    mockGetUserMedia.mockResolvedValue(mockStream);

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(mockUseQRScanner.startScanning).toHaveBeenCalled();
    });
  });

  it('should handle camera permission denied', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('cameraAccessDenied')).toBeInTheDocument();
      expect(screen.getByText('Permission denied')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show retry button when camera access denied', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('retry-camera-button')).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByTestId('retry-camera-button'));
    expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
  });

  it('should show video element when camera permission granted', async () => {
    const mockStream = {
      getTracks: jest.fn().mockReturnValue([
        { stop: jest.fn() }
      ])
    };

    mockGetUserMedia.mockResolvedValue(mockStream);

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('qr-scanner-video')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show scanning active status when scanning', async () => {
    const mockStream = {
      getTracks: jest.fn().mockReturnValue([
        { stop: jest.fn() }
      ])
    };

    mockGetUserMedia.mockResolvedValue(mockStream);
    mockUseQRScanner.isScanning = true;

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('scanningActive')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show processing overlay when processing', async () => {
    const mockStream = {
      getTracks: jest.fn().mockReturnValue([
        { stop: jest.fn() }
      ])
    };

    mockGetUserMedia.mockResolvedValue(mockStream);
    mockUseQRScanner.isProcessing = true;

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('processing-overlay')).toBeInTheDocument();
      expect(screen.getByText('processing')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display error messages', () => {
    mockUseQRScanner.error = 'Test error message';

    render(<QRScanner {...defaultProps} />);

    expect(screen.getByTestId('scanner-error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should display invalid QR code message', () => {
    mockUseQRScanner.lastScanResult = {
      success: false,
      isValid: false,
      message: 'Invalid QR code',
    };

    render(<QRScanner {...defaultProps} />);

    expect(screen.getByTestId('invalid-qr-message')).toBeInTheDocument();
    expect(screen.getByText('Invalid QR code')).toBeInTheDocument();
  });

  it('should display valid QR code message', () => {
    mockUseQRScanner.lastScanResult = {
      success: true,
      isValid: true,
      merchantId: 'merchant-001',
      merchantName: 'Test Merchant',
      message: 'QR code valid',
    };

    render(<QRScanner {...defaultProps} />);

    expect(screen.getByTestId('valid-qr-message')).toBeInTheDocument();
    expect(screen.getByText('qrCodeValid')).toBeInTheDocument();
    expect(screen.getByText('Test Merchant')).toBeInTheDocument();
  });

  it('should call onScanSuccess when valid QR code is scanned', () => {
    mockUseQRScanner.lastScanResult = {
      success: true,
      isValid: true,
      merchantId: 'merchant-001',
      merchantName: 'Test Merchant',
      message: 'QR code valid',
    };

    render(<QRScanner {...defaultProps} />);

    expect(mockOnScanSuccess).toHaveBeenCalledWith('merchant-001', 'Test Merchant');
  });

  it('should close scanner when close button is clicked', () => {
    render(<QRScanner {...defaultProps} />);

    fireEvent.click(screen.getByTestId('close-scanner-button'));

    expect(mockUseQRScanner.stopScanning).toHaveBeenCalled();
    expect(mockUseQRScanner.clearError).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close scanner when cancel button is clicked', () => {
    render(<QRScanner {...defaultProps} />);

    fireEvent.click(screen.getByTestId('cancel-scan-button'));

    expect(mockUseQRScanner.stopScanning).toHaveBeenCalled();
    expect(mockUseQRScanner.clearError).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show scanning instructions', () => {
    render(<QRScanner {...defaultProps} />);

    expect(screen.getByText('pointCameraAtQR')).toBeInTheDocument();
    expect(screen.getByText('scanWillHappenAutomatically')).toBeInTheDocument();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = render(<QRScanner {...defaultProps} />);

    unmount();

    expect(mockUseQRScanner.stopScanning).toHaveBeenCalled();
  });
});