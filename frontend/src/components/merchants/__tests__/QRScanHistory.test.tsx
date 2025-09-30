import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QRScanHistory } from '../QRScanHistory';
import { QRCodeScan } from '@/lib/types';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      qrScanner: {
        scanHistory: 'QR Scan History',
        totalScans: 'Total Scans',
        validScans: 'Valid Scans',
        successRate: 'Success Rate',
        hideDetails: 'Hide Details',
        showDetails: 'Show Details',
        recentScans: 'Recent Scans',
        noScansYet: 'No scans yet',
        startScanningToSeeHistory: 'Start scanning QR codes to see your history here',
        unknownMerchant: 'Unknown Merchant',
        valid: 'Valid',
        invalid: 'Invalid',
        more: 'more',
        lastScan: 'Last scan',
        close: 'Close',
      },
      merchants: {
        visited: 'Visited',
        visitedMerchants: 'Visited Merchants',
      },
    };
    return translations[namespace]?.[key] || key;
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  },
}));

// Mock QR scanner hook
const mockQRScanHistory: QRCodeScan[] = [
  {
    id: 'scan-1',
    merchantId: 'merchant-001',
    userId: 'user-1',
    scannedData: 'SMILE_MERCHANT_001_RATING_ACCESS',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    isValid: true,
    validatedAt: new Date('2024-01-15T10:30:00Z'),
    merchantName: 'Golden Dragon Restaurant',
    merchantNameZh: '金龍餐廳',
    category: 'restaurant',
    location: 'Central',
  },
  {
    id: 'scan-2',
    merchantId: 'merchant-002',
    userId: 'user-1',
    scannedData: 'SMILE_MERCHANT_002_RATING_ACCESS',
    timestamp: new Date('2024-01-14T15:45:00Z'),
    isValid: true,
    validatedAt: new Date('2024-01-14T15:45:00Z'),
    merchantName: 'Dim Sum Palace',
    merchantNameZh: '點心皇宮',
    category: 'restaurant',
    location: 'Tsim Sha Tsui',
  },
  {
    id: 'scan-3',
    merchantId: 'unknown',
    userId: 'user-1',
    scannedData: 'INVALID_QR_CODE',
    timestamp: new Date('2024-01-13T12:00:00Z'),
    isValid: false,
  },
];

const mockUseQRScanner = {
  isScanning: false,
  isProcessing: false,
  error: null,
  lastScanResult: null,
  startScanning: jest.fn(),
  stopScanning: jest.fn(),
  validateQRCode: jest.fn(),
  clearError: jest.fn(),
  getQRScanHistory: jest.fn().mockReturnValue(mockQRScanHistory),
  getVisitedMerchants: jest.fn().mockReturnValue(['merchant-001', 'merchant-002']),
  getScanStatistics: jest.fn().mockReturnValue({
    totalScans: 3,
    validScans: 2,
    uniqueMerchants: 2,
    lastScanDate: new Date('2024-01-15T10:30:00Z'),
    scanSuccessRate: 67,
  }),
};

jest.mock('@/lib/hooks/useQRScanner', () => ({
  useQRScanner: () => mockUseQRScanner,
}));

describe('QRScanHistory', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<QRScanHistory {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('QR Scan History')).not.toBeInTheDocument();
  });

  it('should render scan history when open', () => {
    render(<QRScanHistory {...defaultProps} />);

    expect(screen.getByText('QR Scan History')).toBeInTheDocument();
    expect(screen.getByTestId('close-history-button')).toBeInTheDocument();
  });

  it('should display scan statistics', () => {
    render(<QRScanHistory {...defaultProps} />);

    expect(screen.getByText('3')).toBeInTheDocument(); // Total scans
    expect(screen.getByText('2')).toBeInTheDocument(); // Valid scans
    expect(screen.getByText('67%')).toBeInTheDocument(); // Success rate
  });

  it('should show details when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<QRScanHistory {...defaultProps} />);

    const toggleButton = screen.getByTestId('toggle-details-button');
    expect(screen.getByText('Show Details')).toBeInTheDocument();

    await user.click(toggleButton);

    expect(screen.getByText('Recent Scans')).toBeInTheDocument();
    expect(screen.getByText('Hide Details')).toBeInTheDocument();
  });

  it('should display scan history items when details are shown', async () => {
    const user = userEvent.setup();
    render(<QRScanHistory {...defaultProps} />);

    // Show details
    await user.click(screen.getByTestId('toggle-details-button'));

    // Check for scan history items
    expect(screen.getByTestId('scan-history-item-scan-1')).toBeInTheDocument();
    expect(screen.getByTestId('scan-history-item-scan-2')).toBeInTheDocument();
    expect(screen.getByTestId('scan-history-item-scan-3')).toBeInTheDocument();

    // Check merchant names
    expect(screen.getByText('Golden Dragon Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Dim Sum Palace')).toBeInTheDocument();
    expect(screen.getByText('Unknown Merchant')).toBeInTheDocument();
  });

  it('should display visited merchants', () => {
    render(<QRScanHistory {...defaultProps} />);

    expect(screen.getByText('Visited Merchants')).toBeInTheDocument();
    expect(screen.getByTestId('visited-merchant-merchant-001')).toBeInTheDocument();
    expect(screen.getByTestId('visited-merchant-merchant-002')).toBeInTheDocument();
  });

  it('should show valid and invalid scan badges correctly', async () => {
    const user = userEvent.setup();
    render(<QRScanHistory {...defaultProps} />);

    // Show details to see scan items
    await user.click(screen.getByTestId('toggle-details-button'));

    // Check for valid/invalid badges
    const validBadges = screen.getAllByText('Valid');
    const invalidBadges = screen.getAllByText('Invalid');

    expect(validBadges).toHaveLength(2); // Two valid scans
    expect(invalidBadges).toHaveLength(1); // One invalid scan
  });

  it('should display no scans message when history is empty', () => {
    mockUseQRScanner.getQRScanHistory.mockReturnValue([]);
    mockUseQRScanner.getScanStatistics.mockReturnValue({
      totalScans: 0,
      validScans: 0,
      uniqueMerchants: 0,
      lastScanDate: null,
      scanSuccessRate: 0,
    });

    render(<QRScanHistory {...defaultProps} />);

    // Show details to see the empty state
    fireEvent.click(screen.getByTestId('toggle-details-button'));

    expect(screen.getByText('No scans yet')).toBeInTheDocument();
    expect(screen.getByText('Start scanning QR codes to see your history here')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    render(<QRScanHistory {...defaultProps} onClose={mockOnClose} />);

    await user.click(screen.getByTestId('close-history-button'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when footer close button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    render(<QRScanHistory {...defaultProps} onClose={mockOnClose} />);

    await user.click(screen.getByTestId('close-history-footer-button'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display last scan date when available', () => {
    render(<QRScanHistory {...defaultProps} />);

    expect(screen.getByText(/Last scan:/)).toBeInTheDocument();
  });

  it('should show more indicator when there are many visited merchants', () => {
    // Mock more than 10 visited merchants
    const manyMerchants = Array.from({ length: 15 }, (_, i) => `merchant-${i + 1}`);
    mockUseQRScanner.getVisitedMerchants.mockReturnValue(manyMerchants);

    render(<QRScanHistory {...defaultProps} />);

    expect(screen.getByText('+5 more')).toBeInTheDocument();
  });

  it('should hide details when toggle button is clicked again', async () => {
    const user = userEvent.setup();
    render(<QRScanHistory {...defaultProps} />);

    // Show details
    await user.click(screen.getByTestId('toggle-details-button'));
    expect(screen.getByText('Recent Scans')).toBeInTheDocument();

    // Hide details
    await user.click(screen.getByTestId('toggle-details-button'));
    expect(screen.queryByText('Recent Scans')).not.toBeInTheDocument();
    expect(screen.getByText('Show Details')).toBeInTheDocument();
  });
});