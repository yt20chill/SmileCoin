import { renderHook, act } from '@testing-library/react';
import { useQRScanner } from '../useQRScanner';
import { QRCodeScan } from '@/lib/types';

// Mock QrScanner library
jest.mock('qr-scanner', () => {
  const mockInstance = {
    hasCamera: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  };
  
  const MockQrScanner = jest.fn().mockImplementation((videoElement, onResult, options) => {
    return mockInstance;
  });
  
  MockQrScanner.hasCamera = mockInstance.hasCamera;
  
  return MockQrScanner;
});

// Get reference to the mock instance
const mockQrScanner = {
  hasCamera: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  destroy: jest.fn(),
};

// Mock fetch
global.fetch = jest.fn();

// Mock app context
const mockState = {
  user: {
    id: 'test-user-1',
    fullName: 'Test User',
    walletAddress: '0x123',
    preferredLanguage: 'en' as const,
    registrationMethod: 'boarding-pass' as const,
    scannedBoardingPasses: [],
    createdAt: new Date(),
    arrivalDate: new Date(),
  },
  qrScans: [
    {
      id: 'scan-1',
      merchantId: 'merchant-001',
      userId: 'test-user-1',
      scannedData: 'SMILE_MERCHANT_001_RATING_ACCESS',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      isValid: true,
      validatedAt: new Date('2024-01-15T10:30:00Z'),
      merchantName: 'Golden Dragon Restaurant',
      category: 'restaurant',
      location: 'Central',
    },
    {
      id: 'scan-2',
      merchantId: 'merchant-002',
      userId: 'test-user-1',
      scannedData: 'SMILE_MERCHANT_002_RATING_ACCESS',
      timestamp: new Date('2024-01-14T15:45:00Z'),
      isValid: true,
      validatedAt: new Date('2024-01-14T15:45:00Z'),
      merchantName: 'Dim Sum Palace',
      category: 'restaurant',
      location: 'Tsim Sha Tsui',
    },
    {
      id: 'scan-3',
      merchantId: 'unknown',
      userId: 'test-user-1',
      scannedData: 'INVALID_QR_CODE',
      timestamp: new Date('2024-01-13T12:00:00Z'),
      isValid: false,
    },
    {
      id: 'scan-4',
      merchantId: 'merchant-003',
      userId: 'other-user',
      scannedData: 'SMILE_MERCHANT_003_RATING_ACCESS',
      timestamp: new Date('2024-01-12T09:00:00Z'),
      isValid: true,
      validatedAt: new Date('2024-01-12T09:00:00Z'),
      merchantName: 'Other User Scan',
      category: 'cafe',
      location: 'Wan Chai',
    },
  ] as QRCodeScan[],
};

const mockDispatch = jest.fn();

jest.mock('../../stores/context', () => ({
  useAppContext: () => ({
    state: mockState,
    dispatch: mockDispatch,
  }),
}));

describe('useQRScanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    mockQrScanner.hasCamera.mockResolvedValue(true);
    mockQrScanner.start.mockResolvedValue(undefined);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useQRScanner());

    expect(result.current.isScanning).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.lastScanResult).toBe(null);
  });

  it('should start scanning successfully', async () => {
    const { result } = renderHook(() => useQRScanner());
    const mockVideoElement = document.createElement('video');

    await act(async () => {
      await result.current.startScanning(mockVideoElement);
    });

    expect(mockQrScanner.hasCamera).toHaveBeenCalled();
    expect(mockQrScanner.start).toHaveBeenCalled();
    expect(result.current.isScanning).toBe(true);
  });

  it('should handle camera not available error', async () => {
    mockQrScanner.hasCamera.mockResolvedValue(false);
    const { result } = renderHook(() => useQRScanner());
    const mockVideoElement = document.createElement('video');

    await act(async () => {
      await result.current.startScanning(mockVideoElement);
    });

    expect(result.current.error).toBe('No camera available for QR scanning');
    expect(result.current.isScanning).toBe(false);
  });

  it('should stop scanning', () => {
    const { result } = renderHook(() => useQRScanner());

    act(() => {
      result.current.stopScanning();
    });

    expect(mockQrScanner.stop).toHaveBeenCalled();
    expect(mockQrScanner.destroy).toHaveBeenCalled();
    expect(result.current.isScanning).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_QR_SCANNER',
      payload: {
        isActive: false,
        scannedData: null,
      },
    });
  });

  it('should validate QR code successfully', async () => {
    const mockResponse = {
      success: true,
      isValid: true,
      merchantId: 'merchant-001',
      merchantName: 'Golden Dragon Restaurant',
      merchantNameZh: '金龍餐廳',
      category: 'restaurant',
      location: 'Central',
      message: 'QR code validated',
      qrCodeData: 'SMILE_MERCHANT_001_RATING_ACCESS',
      validatedAt: '2024-01-15T10:30:00Z',
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useQRScanner());

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateQRCode('SMILE_MERCHANT_001_RATING_ACCESS');
    });

    expect(fetch).toHaveBeenCalledWith('/api/qr-code/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrData: 'SMILE_MERCHANT_001_RATING_ACCESS',
        userId: 'test-user-1',
      }),
    });

    expect(validationResult).toEqual(mockResponse);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_QR_SCAN',
      payload: expect.objectContaining({
        merchantId: 'merchant-001',
        userId: 'test-user-1',
        scannedData: 'SMILE_MERCHANT_001_RATING_ACCESS',
        isValid: true,
        merchantName: 'Golden Dragon Restaurant',
        category: 'restaurant',
        location: 'Central',
      }),
    });
  });

  it('should handle invalid QR code', async () => {
    const mockResponse = {
      success: false,
      isValid: false,
      message: 'Invalid QR code',
      error: 'QR code not found',
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useQRScanner());

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateQRCode('INVALID_QR_CODE');
    });

    expect(validationResult).toEqual(expect.objectContaining({
      success: false,
      isValid: false,
      message: 'Invalid QR code',
    }));

    // Should still record failed scan
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'ADD_QR_SCAN',
      payload: expect.objectContaining({
        merchantId: 'unknown',
        userId: 'test-user-1',
        scannedData: 'INVALID_QR_CODE',
        isValid: false,
      }),
    });
  });

  it('should handle network error during validation', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useQRScanner());

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateQRCode('SOME_QR_CODE');
    });

    expect(validationResult).toEqual({
      success: false,
      isValid: false,
      message: 'Network error',
      error: 'Network error',
    });
  });

  it('should return empty array when user is not authenticated', () => {
    const { result } = renderHook(() => useQRScanner());
    
    // Temporarily set user to null
    mockState.user = null;

    const history = result.current.getQRScanHistory();
    expect(history).toEqual([]);

    const visitedMerchants = result.current.getVisitedMerchants();
    expect(visitedMerchants).toEqual([]);

    const statistics = result.current.getScanStatistics();
    expect(statistics).toEqual({
      totalScans: 0,
      validScans: 0,
      uniqueMerchants: 0,
      lastScanDate: null,
      scanSuccessRate: 0,
    });

    // Restore user
    mockState.user = {
      id: 'test-user-1',
      fullName: 'Test User',
      walletAddress: '0x123',
      preferredLanguage: 'en' as const,
      registrationMethod: 'boarding-pass' as const,
      scannedBoardingPasses: [],
      createdAt: new Date(),
      arrivalDate: new Date(),
    };
  });

  it('should get QR scan history for current user only', () => {
    const { result } = renderHook(() => useQRScanner());

    const history = result.current.getQRScanHistory();

    expect(history).toHaveLength(3); // Only scans for test-user-1
    expect(history[0].id).toBe('scan-1'); // Most recent first
    expect(history[1].id).toBe('scan-2');
    expect(history[2].id).toBe('scan-3');
    
    // Should not include scan-4 (different user)
    expect(history.find(scan => scan.id === 'scan-4')).toBeUndefined();
  });

  it('should get visited merchants for current user', () => {
    const { result } = renderHook(() => useQRScanner());

    const visitedMerchants = result.current.getVisitedMerchants();

    expect(visitedMerchants).toEqual(['merchant-001', 'merchant-002']);
    // Should not include 'unknown' or merchants from other users
    expect(visitedMerchants).not.toContain('unknown');
    expect(visitedMerchants).not.toContain('merchant-003');
  });

  it('should calculate scan statistics correctly', () => {
    const { result } = renderHook(() => useQRScanner());

    const statistics = result.current.getScanStatistics();

    expect(statistics.totalScans).toBe(3);
    expect(statistics.validScans).toBe(2);
    expect(statistics.uniqueMerchants).toBe(2);
    expect(statistics.scanSuccessRate).toBe(67); // 2/3 * 100 rounded
    expect(statistics.lastScanDate).toEqual(new Date('2024-01-15T10:30:00Z'));
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useQRScanner());

    // Set an error first
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should handle user not authenticated during validation', async () => {
    // Temporarily set user to null
    mockState.user = null;

    const { result } = renderHook(() => useQRScanner());

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateQRCode('SOME_QR_CODE');
    });

    expect(validationResult).toEqual({
      success: false,
      isValid: false,
      message: 'User not authenticated',
      error: 'User not authenticated',
    });

    expect(fetch).not.toHaveBeenCalled();

    // Restore user
    mockState.user = {
      id: 'test-user-1',
      fullName: 'Test User',
      walletAddress: '0x123',
      preferredLanguage: 'en' as const,
      registrationMethod: 'boarding-pass' as const,
      scannedBoardingPasses: [],
      createdAt: new Date(),
      arrivalDate: new Date(),
    };
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useQRScanner());

    // Start scanning first
    act(() => {
      result.current.startScanning(document.createElement('video'));
    });

    unmount();

    expect(mockQrScanner.stop).toHaveBeenCalled();
    expect(mockQrScanner.destroy).toHaveBeenCalled();
  });
});