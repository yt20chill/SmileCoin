import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnboarding } from '../useOnboarding';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with proper state structure', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useOnboarding());

    // Wait for the effect to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // After initialization, should default to showing onboarding for new users (Requirements 1.1, 1.2, 1.4)
    expect(result.current.hasCompletedOnboarding).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.checkOnboardingStatus).toBe('function');
  });

  it('detects completed onboarding from localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('true');
    
    const { result } = renderHook(() => useOnboarding());

    // Wait for the effect to run
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasCompletedOnboarding).toBe(true);
    expect(result.current.error).toBe(null);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('smile-travel-onboarding-completed');
  });

  it('defaults to showing onboarding for new users (empty localStorage)', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useOnboarding());

    // Wait for the effect to run
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should default to false (show onboarding) for new users (Requirements 1.1, 1.2, 1.4)
    expect(result.current.hasCompletedOnboarding).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('completes onboarding and updates localStorage', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useOnboarding());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Complete onboarding
    act(() => {
      result.current.completeOnboarding();
    });

    expect(result.current.hasCompletedOnboarding).toBe(true);
    expect(result.current.error).toBe(null);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('smile-travel-onboarding-completed', 'true');
  });

  it('skips onboarding and updates localStorage', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useOnboarding());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Skip onboarding
    act(() => {
      result.current.skipOnboarding();
    });

    expect(result.current.hasCompletedOnboarding).toBe(true);
    expect(result.current.error).toBe(null);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('smile-travel-onboarding-completed', 'true');
  });

  it('resets onboarding and updates localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('true');
    
    const { result } = renderHook(() => useOnboarding());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Reset onboarding
    act(() => {
      result.current.resetOnboarding();
    });

    expect(result.current.hasCompletedOnboarding).toBe(false);
    expect(result.current.error).toBe(null);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('smile-travel-onboarding-completed');
  });

  it('handles localStorage errors gracefully during initialization', async () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { result } = renderHook(() => useOnboarding());

    // Wait for the effect to run
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should default to showing onboarding when localStorage fails (Requirements 1.2, 1.4)
    expect(result.current.hasCompletedOnboarding).toBe(false);
    expect(result.current.error).toBe('Storage unavailable - showing onboarding');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to check onboarding status:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('handles localStorage errors gracefully during completion', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { result } = renderHook(() => useOnboarding());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Try to complete onboarding
    act(() => {
      result.current.completeOnboarding();
    });

    expect(result.current.error).toBe('Failed to save onboarding status');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to save onboarding completion:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('handles localStorage errors gracefully during reset', async () => {
    localStorageMock.getItem.mockReturnValue('true');
    localStorageMock.removeItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { result } = renderHook(() => useOnboarding());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Try to reset onboarding
    act(() => {
      result.current.resetOnboarding();
    });

    expect(result.current.error).toBe('Failed to reset onboarding status');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to reset onboarding:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('handles different localStorage values correctly', async () => {
    // Test with 'false' string value - should still show onboarding
    localStorageMock.getItem.mockReturnValue('false');
    
    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasCompletedOnboarding).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('handles empty string localStorage value correctly', async () => {
    localStorageMock.getItem.mockReturnValue('');
    
    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Empty string should default to showing onboarding
    expect(result.current.hasCompletedOnboarding).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('provides checkOnboardingStatus function for manual status checking', async () => {
    localStorageMock.getItem.mockReturnValue('true');
    
    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.checkOnboardingStatus).toBe('function');
    
    // Change localStorage value and manually check
    localStorageMock.getItem.mockReturnValue(null);
    
    await act(async () => {
      await result.current.checkOnboardingStatus();
    });

    expect(result.current.hasCompletedOnboarding).toBe(false);
  });

  it('exposes error state for UI feedback', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(null);
    expect(typeof result.current.error).toBe('object'); // null is object type
  });

  it('only returns true for explicit "true" value in localStorage', async () => {
    // Test various truthy values that should NOT trigger completed onboarding
    const falsyValues = ['1', 'yes', 'TRUE', 'True', 'completed', 'done'];
    
    for (const value of falsyValues) {
      localStorageMock.getItem.mockReturnValue(value);
      
      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCompletedOnboarding).toBe(false);
    }
  });
});