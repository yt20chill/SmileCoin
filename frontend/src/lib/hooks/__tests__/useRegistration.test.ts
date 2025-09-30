import { renderHook, act } from '@testing-library/react';
import { useRegistration } from '../useRegistration';
import { ApiClient } from '../../api/client';
import * as validation from '../../utils/validation';

// Mock dependencies
jest.mock('../../api/client');
jest.mock('../../utils/validation');
jest.mock('../useAppState');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockApiClient = ApiClient as jest.Mocked<typeof ApiClient>;
const mockValidation = validation as jest.Mocked<typeof validation>;

// Mock useAppState
const mockActions = {
  setUser: jest.fn(),
  updateBalance: jest.fn(),
  addTransaction: jest.fn(),
};

jest.mock('../useAppState', () => ({
  useAppState: () => ({
    actions: mockActions,
  }),
}));

describe('useRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockValidation.validateBoardingPassFile.mockReturnValue({ isValid: true });
    mockValidation.validateRegistrationData.mockReturnValue({ 
      isValid: true, 
      errors: {} 
    });
  });

  describe('initial state', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useRegistration());
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.isRegistered).toBe(false);
      expect(result.current.registeredUser).toBe(null);
      expect(result.current.initialCoins).toBe(0);
    });
  });

  describe('registerWithBoardingPass', () => {
    const mockFile = new File([''], 'boarding-pass.jpg', { type: 'image/jpeg' });
    
    it('successfully registers with boarding pass', async () => {
      const mockUploadResult = {
        success: true,
        extractedData: {
          flightNumber: 'CX123',
          arrivalDate: '2024-12-01T10:00:00Z',
          email: 'test@example.com',
        },
      };
      
      const mockRegistrationResult = {
        user: {
          id: '1',
          flightNumber: 'CX123',
          email: 'test@example.com',
          arrivalDate: new Date('2024-12-01T10:00:00Z'),
          walletAddress: '0x123',
          preferredLanguage: 'en' as const,
          registrationMethod: 'boarding-pass' as const,
          createdAt: new Date(),
        },
        initialCoins: 100,
      };
      
      mockApiClient.uploadBoardingPass.mockResolvedValue(mockUploadResult);
      mockApiClient.registerUser.mockResolvedValue(mockRegistrationResult);
      
      const { result } = renderHook(() => useRegistration());
      
      await act(async () => {
        await result.current.registerWithBoardingPass(mockFile);
      });
      
      expect(mockValidation.validateBoardingPassFile).toHaveBeenCalledWith(mockFile);
      expect(mockApiClient.uploadBoardingPass).toHaveBeenCalledWith(mockFile);
      expect(mockApiClient.registerUser).toHaveBeenCalledWith({
        flightNumber: 'CX123',
        arrivalDate: new Date('2024-12-01T10:00:00Z'),
        email: 'test@example.com',
        preferredLanguage: 'en',
        registrationMethod: 'boarding-pass',
      });
      
      expect(mockActions.setUser).toHaveBeenCalledWith(mockRegistrationResult.user);
      expect(mockActions.updateBalance).toHaveBeenCalledWith(100);
      expect(mockActions.addTransaction).toHaveBeenCalled();
      
      expect(result.current.isRegistered).toBe(true);
      expect(result.current.registeredUser).toEqual(mockRegistrationResult.user);
      expect(result.current.initialCoins).toBe(100);
    });

    it('handles file validation errors', async () => {
      mockValidation.validateBoardingPassFile.mockReturnValue({
        isValid: false,
        error: 'Invalid file type',
      });
      
      const { result } = renderHook(() => useRegistration());
      
      await act(async () => {
        try {
          await result.current.registerWithBoardingPass(mockFile);
        } catch (error) {
          // Expected to throw
        }
      });
      
      expect(result.current.error).toBe('Invalid file type');
      expect(mockApiClient.uploadBoardingPass).not.toHaveBeenCalled();
    });

    it('handles upload failure', async () => {
      const mockUploadResult = {
        success: false,
        extractedData: null,
      };
      
      mockApiClient.uploadBoardingPass.mockResolvedValue(mockUploadResult);
      
      const { result } = renderHook(() => useRegistration());
      
      await act(async () => {
        try {
          await result.current.registerWithBoardingPass(mockFile);
        } catch (error) {
          // Expected to throw
        }
      });
      
      expect(result.current.error).toBe('Could not extract flight information from boarding pass');
      expect(mockApiClient.registerUser).not.toHaveBeenCalled();
    });

    it('handles registration API errors', async () => {
      const mockUploadResult = {
        success: true,
        extractedData: {
          flightNumber: 'CX123',
          arrivalDate: '2024-12-01T10:00:00Z',
          email: 'test@example.com',
        },
      };
      
      mockApiClient.uploadBoardingPass.mockResolvedValue(mockUploadResult);
      mockApiClient.registerUser.mockRejectedValue(new Error('Registration failed'));
      
      const { result } = renderHook(() => useRegistration());
      
      await act(async () => {
        try {
          await result.current.registerWithBoardingPass(mockFile);
        } catch (error) {
          // Expected to throw
        }
      });
      
      expect(result.current.error).toBe('Registration failed');
      expect(result.current.isRegistered).toBe(false);
    });
  });

  describe('registerManually', () => {
    const mockUserData = {
      flightNumber: 'CX123',
      arrivalDate: new Date('2024-12-01T10:00:00Z'),
      email: 'test@example.com',
      preferredLanguage: 'en' as const,
    };

    it('successfully registers manually', async () => {
      const mockRegistrationResult = {
        user: {
          id: '1',
          ...mockUserData,
          walletAddress: '0x123',
          registrationMethod: 'manual' as const,
          createdAt: new Date(),
        },
        initialCoins: 100,
      };
      
      mockApiClient.registerUser.mockResolvedValue(mockRegistrationResult);
      
      const { result } = renderHook(() => useRegistration());
      
      await act(async () => {
        await result.current.registerManually(mockUserData);
      });
      
      expect(mockValidation.validateRegistrationData).toHaveBeenCalledWith(mockUserData);
      expect(mockApiClient.registerUser).toHaveBeenCalledWith({
        ...mockUserData,
        registrationMethod: 'manual',
      });
      
      expect(mockActions.setUser).toHaveBeenCalledWith(mockRegistrationResult.user);
      expect(mockActions.updateBalance).toHaveBeenCalledWith(100);
      expect(mockActions.addTransaction).toHaveBeenCalled();
      
      expect(result.current.isRegistered).toBe(true);
      expect(result.current.registeredUser).toEqual(mockRegistrationResult.user);
      expect(result.current.initialCoins).toBe(100);
    });

    it('handles validation errors', async () => {
      mockValidation.validateRegistrationData.mockReturnValue({
        isValid: false,
        errors: { flightNumber: 'Flight number is required' },
      });
      
      const { result } = renderHook(() => useRegistration());
      
      await act(async () => {
        await result.current.registerManually(mockUserData);
      });
      
      expect(result.current.error).toBe('Flight number is required');
      expect(mockApiClient.registerUser).not.toHaveBeenCalled();
    });

    it('handles registration API errors', async () => {
      mockApiClient.registerUser.mockRejectedValue(new Error('Server error'));
      
      const { result } = renderHook(() => useRegistration());
      
      await act(async () => {
        await result.current.registerManually(mockUserData);
      });
      
      expect(result.current.error).toBe('Server error');
      expect(result.current.isRegistered).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('clears error', () => {
      const { result } = renderHook(() => useRegistration());
      
      // Set an error first
      act(() => {
        result.current.registerManually({});
      });
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBe(null);
    });

    it('resets state', () => {
      const { result } = renderHook(() => useRegistration());
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.isRegistered).toBe(false);
      expect(result.current.registeredUser).toBe(null);
      expect(result.current.initialCoins).toBe(0);
    });
  });
});