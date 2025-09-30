import { renderHook, act, waitFor } from '@testing-library/react';
import { useQRScanner } from '../useQRScanner';
import { AppProvider, useAppContext } from '../../stores/context';
import { ReactNode, useEffect } from 'react';

// Mock QrScanner
jest.mock('qr-scanner', () => {
  return jest.fn().mockImplementation((videoElement, onResult, options) => {
    return {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn(),
      destroy: jest.fn(),
    };
  });
});

// Mock QrScanner static methods
const mockQrScanner = require('qr-scanner');
mockQrScanner.hasCamera = jest.fn().mockResolvedValue(true);

// Mock fetch
global.fetch = jest.fn();

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(),
  },
});

const mockGetUserMedia = navigator.mediaDevices.getUserMedia as jest.Mock;

// Mock user for testing
const mockUser = {
  id: 'test-user-123',
  fullName: 'Test User',
  email: 'test@example.com',
  flightNumber: 'CX123',
  arrivalDate: new Date(),
  walletAddress: '0x123',
  preferredLanguage: 'en' as const,
  registrationMethod: 'boarding-pass' as const,
  scannedBoardingPasses: [],
  createdAt: new Date(),
};

// Component to set mock user in context
function MockUserProvider({ children }: { children: ReactNode }) {
  const { dispatch } = useAppContext();
  
  useEffect(() => {
    dispatch({ type: 'SET_USER', payload: mockUser });
  }, [dispatch]);
  
  return <>{children}</>;
}

// Test wrapper with context and mock user
const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>
    <MockUserProvider>
      {children}
    </MockUserProvider>
  </AppProvider>
);

describe('useQRScanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockGetUserMedia.mockClear();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useQRScanner(), { wrapper });

    expect(result.current.isScanning).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.lastScanResult).toBe(null);
  });

  it('should start scanning when camera is available', async () => {
    const mockVideoElement = document.createElement('video');
    
    mockQrScanner.hasCamera.mockResolvedValue(true);

    const { result } = renderHook(() => useQRScanner(), { wrapper });

    await act(async () => {
      await result.current.startScanning(mockVideoElement);
    });

    expect(mockQrScanner.hasCamera).toHaveBeenCalled();
    expect(result.current.isScanning).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should handle QR scanner start failure', async () => {
    const mockVideoElement = document.createElement('video');
    const scannerError = new Error('Scanner failed to start');

    mockQrScanner.hasCamera.mockResolvedValue(true);
    // Mock the QrScanner constructor to throw an error
    mockQrScanner.mockImplementation(() => {
      throw scannerError;
    });

    const { result } = renderHook(() => useQRScanner(), { wrapper });

    await act(async () => {
      await result.current.startScanning(mockVideoElement);
    });

    expect(result.current.isScanning).toBe(false);
    expect(result.current.error).toBe('Scanner failed to start');
  });

  it('should handle no camera available', async () => {
    const mockVideoElement = document.createElement('video');
    
    mockQrScanner.hasCamera.mockResolvedValue(false);

    const { result } = renderHook(() => useQRScanner(), { wrapper });

    await act(async () => {
      await result.current.startScanning(mockVideoElement);
    });

    expect(result.current.isScanning).toBe(false);
    expect(result.current.error).toBe('No camera available for QR scanning');
  });

  it('should stop scanning correctly', async () => {
    const mockVideoElement = document.createElement('video');
    const mockScannerInstance = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn(),
      destroy: jest.fn(),
    };

    mockQrScanner.hasCamera.mockResolvedValue(true);
    mockQrScanner.mockImplementation(() => mockScannerInstance);

    const { result } = renderHook(() => useQRScanner(), { wrapper });

    // Start scanning first
    await act(async () => {
      await result.current.startScanning(mockVideoElement);
    });

    expect(result.current.isScanning).toBe(true);

    // Stop scanning
    act(() => {
      result.current.stopScanning();
    });

    expect(mockScannerInstance.stop).toHaveBeenCalled();
    expect(mockScannerInstance.destroy).toHaveBeenCalled();
    expect(result.current.isScanning).toBe(false);
    expect(result.current.isProcessing).toBe(false);
  });

  it('should validate QR code successfully', async () => {
    const mockResponse = {
      success: true,
      isValid: true,
      merchantId: 'merchant-001',
      merchantName: 'Test Merchant',
      message: 'QR code validated successfully'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse)
    });

    const { result } = renderHook(() => useQRScanner(), { wrapper });

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateQRCode('SMILE_MERCHANT_001_RATING_ACCESS');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/qr-code/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrData: 'SMILE_MERCHANT_001_RATING_ACCESS',
        userId: 'test-user-123',
      }),
    });

    expect(validationResult).toEqual(mockResponse);
  });

  it('should handle invalid QR code', async () => {
    const mockResponse = {
      success: false,
      isValid: false,
      message: 'Invalid QR code',
      error: 'Invalid QR code'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue(mockResponse)
    });

    const { result } = renderHook(() => useQRScanner(), { wrapper });

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateQRCode('INVALID_QR_CODE');
    });

    expect(validationResult).toEqual(mockResponse);
  });

  it('should handle network error during validation', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useQRScanner(), { wrapper });

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

  it('should clear error correctly', () => {
    const { result } = renderHook(() => useQRScanner(), { wrapper });

    // Set an error first
    act(() => {
      // Simulate an error by calling startScanning with invalid setup
      result.current.startScanning(document.createElement('video'));
    });

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should return empty QR scan history', () => {
    const { result } = renderHook(() => useQRScanner(), { wrapper });

    const history = result.current.getQRScanHistory();

    expect(history).toEqual([]);
  });

  it('should handle user not authenticated during validation', async () => {
    // Component to remove user from context
    function RemoveUserProvider({ children }: { children: ReactNode }) {
      const { dispatch } = useAppContext();
      
      useEffect(() => {
        dispatch({ type: 'SET_USER', payload: null as any });
      }, [dispatch]);
      
      return <>{children}</>;
    }

    // Use wrapper that removes user
    const wrapperWithoutUser = ({ children }: { children: ReactNode }) => (
      <AppProvider>
        <RemoveUserProvider>
          {children}
        </RemoveUserProvider>
      </AppProvider>
    );
    
    const { result } = renderHook(() => useQRScanner(), { wrapper: wrapperWithoutUser });

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
  });
});