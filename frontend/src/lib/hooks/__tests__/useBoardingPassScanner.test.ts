import { renderHook, act, waitFor } from '@testing-library/react';
import { useBoardingPassScanner } from '../useBoardingPassScanner';
import { ApiClient } from '../../api/client';
import { useAppState } from '../useAppState';

// Mock dependencies
jest.mock('../../api/client');
jest.mock('../useAppState');

const mockApiClient = ApiClient as jest.Mocked<typeof ApiClient>;
const mockUseAppState = useAppState as jest.MockedFunction<typeof useAppState>;

// Mock file for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('useBoardingPassScanner', () => {
  const mockState = {
    user: { id: 'user-1', fullName: 'John Smith' },
    wallet: { balance: 100 },
    boardingPasses: []
  };

  const mockActions = {
    updateBalance: jest.fn(),
    addTransaction: jest.fn(),
    addBoardingPass: jest.fn(),
    setBoardingPasses: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppState.mockReturnValue({
      state: mockState as any,
      actions: mockActions as any
    });
  });

  describe('scanBoardingPass', () => {
    it('should successfully scan a valid boarding pass', async () => {
      const mockFile = createMockFile('boarding-pass.jpg', 1024 * 1024, 'image/jpeg');
      const mockScanResult = {
        success: true,
        coinsEarned: 10,
        boardingPass: {
          id: 'bp-1',
          passengerName: 'John Smith',
          flightNumber: 'CX123',
          date: new Date(),
          imageUrl: 'mock-url',
          isScanned: true,
          coinsAwarded: 10,
          scannedAt: new Date(),
          userId: 'user-1'
        },
        transaction: {
          id: 'tx-1',
          type: 'earn',
          amount: 10,
          description: 'Boarding pass scan: CX123',
          timestamp: new Date(),
          status: 'completed'
        },
        message: 'Successfully scanned boarding pass!'
      };

      mockApiClient.scanBoardingPass.mockResolvedValue(mockScanResult);

      const { result } = renderHook(() => useBoardingPassScanner());

      let scanResult;
      await act(async () => {
        scanResult = await result.current.scanBoardingPass(mockFile);
      });

      expect(scanResult).toEqual({
        success: true,
        boardingPass: expect.objectContaining({
          id: 'bp-1',
          passengerName: 'John Smith',
          flightNumber: 'CX123'
        }),
        coinsEarned: 10,
        message: 'Successfully scanned boarding pass!'
      });

      expect(mockActions.updateBalance).toHaveBeenCalledWith(110); // 100 + 10
      expect(mockActions.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'earn',
          amount: 10,
          boardingPassId: 'bp-1'
        })
      );
      expect(mockActions.addBoardingPass).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'bp-1',
          coinsAwarded: 10
        })
      );
    });

    it('should handle invalid file validation', async () => {
      const mockFile = createMockFile('invalid.txt', 1024, 'text/plain');

      const { result } = renderHook(() => useBoardingPassScanner());

      let scanResult;
      await act(async () => {
        scanResult = await result.current.scanBoardingPass(mockFile);
      });

      expect(scanResult).toEqual({
        success: false,
        message: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
        error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
      });

      expect(mockApiClient.scanBoardingPass).not.toHaveBeenCalled();
    });

    it('should handle file size validation', async () => {
      const mockFile = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg'); // 10MB

      const { result } = renderHook(() => useBoardingPassScanner());

      let scanResult;
      await act(async () => {
        scanResult = await result.current.scanBoardingPass(mockFile);
      });

      expect(scanResult).toEqual({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
        error: 'File too large. Maximum size is 5MB.'
      });

      expect(mockApiClient.scanBoardingPass).not.toHaveBeenCalled();
    });

    it('should handle user not logged in', async () => {
      mockUseAppState.mockReturnValue({
        state: { ...mockState, user: null } as any,
        actions: mockActions as any
      });

      const mockFile = createMockFile('boarding-pass.jpg', 1024 * 1024, 'image/jpeg');
      const { result } = renderHook(() => useBoardingPassScanner());

      let scanResult;
      await act(async () => {
        scanResult = await result.current.scanBoardingPass(mockFile);
      });

      expect(scanResult).toEqual({
        success: false,
        message: 'User not logged in',
        error: 'User authentication required'
      });

      expect(mockApiClient.scanBoardingPass).not.toHaveBeenCalled();
    });

    it('should handle API scan failure', async () => {
      const mockFile = createMockFile('boarding-pass.jpg', 1024 * 1024, 'image/jpeg');
      const mockFailureResult = {
        success: false,
        message: 'Name mismatch detected',
        code: 'NAME_MISMATCH'
      };

      mockApiClient.scanBoardingPass.mockResolvedValue(mockFailureResult);

      const { result } = renderHook(() => useBoardingPassScanner());

      let scanResult;
      await act(async () => {
        scanResult = await result.current.scanBoardingPass(mockFile);
      });

      expect(scanResult).toEqual({
        success: false,
        message: 'Name mismatch detected',
        error: 'Name mismatch detected'
      });

      expect(mockActions.updateBalance).not.toHaveBeenCalled();
      expect(mockActions.addTransaction).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const mockFile = createMockFile('boarding-pass.jpg', 1024 * 1024, 'image/jpeg');
      const networkError = new Error('Network connection failed');

      mockApiClient.scanBoardingPass.mockRejectedValue(networkError);

      const { result } = renderHook(() => useBoardingPassScanner());

      let scanResult;
      await act(async () => {
        scanResult = await result.current.scanBoardingPass(mockFile);
      });

      expect(scanResult).toEqual({
        success: false,
        message: 'Network connection failed',
        error: 'Network connection failed'
      });
    });
  });

  describe('loadScanHistory', () => {
    it('should successfully load boarding pass history', async () => {
      const mockHistory = {
        success: true,
        boardingPasses: [
          {
            id: 'bp-1',
            passengerName: 'John Smith',
            flightNumber: 'CX123',
            date: new Date('2024-01-15'),
            imageUrl: 'mock-url-1',
            isScanned: true,
            coinsAwarded: 10,
            scannedAt: new Date('2024-01-15T10:30:00Z'),
            userId: 'user-1'
          }
        ],
        totalCoinsEarned: 10
      };

      mockApiClient.getBoardingPassHistory.mockResolvedValue(mockHistory);

      const { result } = renderHook(() => useBoardingPassScanner());

      await act(async () => {
        await result.current.loadScanHistory();
      });

      expect(result.current.scanHistory).toHaveLength(1);
      expect(result.current.totalCoinsEarned).toBe(10);
      expect(mockActions.setBoardingPasses).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'bp-1',
            flightNumber: 'CX123'
          })
        ])
      );
    });

    it('should handle history loading failure', async () => {
      const error = new Error('Failed to load history');
      mockApiClient.getBoardingPassHistory.mockRejectedValue(error);

      const { result } = renderHook(() => useBoardingPassScanner());

      await act(async () => {
        await result.current.loadScanHistory();
      });

      expect(result.current.error).toBe('Failed to load history');
      expect(result.current.scanHistory).toHaveLength(0);
    });

    it('should handle user not logged in for history', async () => {
      mockUseAppState.mockReturnValue({
        state: { ...mockState, user: null } as any,
        actions: mockActions as any
      });

      const { result } = renderHook(() => useBoardingPassScanner());

      await act(async () => {
        await result.current.loadScanHistory();
      });

      expect(mockApiClient.getBoardingPassHistory).not.toHaveBeenCalled();
      expect(result.current.scanHistory).toHaveLength(0);
    });
  });

  describe('state management', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useBoardingPassScanner());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should reset state', () => {
      const { result } = renderHook(() => useBoardingPassScanner());

      act(() => {
        result.current.reset();
      });

      expect(result.current.isScanning).toBe(false);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastScanResult).toBeNull();
      expect(result.current.scanHistory).toHaveLength(0);
      expect(result.current.totalCoinsEarned).toBe(0);
    });
  });
});