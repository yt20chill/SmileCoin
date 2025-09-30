import {
  hapticCoinEarn,
  hapticCoinSpend,
  hapticQRScan,
  hapticQRSuccess,
  hapticQRError,
  hapticSelection,
  hapticAchievement,
  hapticBoardingPassScan,
  hapticCustom,
  isHapticAvailable,
  stopHaptic
} from '../haptics';

// Mock navigator.vibrate
const mockVibrate = jest.fn();

// Setup navigator mock
const mockNavigator = {
  vibrate: mockVibrate
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

// Mock window for server-side check
Object.defineProperty(global, 'window', {
  value: {},
  writable: true,
});

// Import the haptic manager to access recheckSupport
import hapticManager from '../haptics';

describe('Haptic Feedback Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVibrate.mockReturnValue(true);
    // Re-check support after mocks are set up
    hapticManager.recheckSupport();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic haptic functions', () => {
    it('triggers coin earn haptic feedback', () => {
      hapticCoinEarn();
      expect(mockVibrate).toHaveBeenCalledWith([50, 50, 100]);
    });

    it('triggers coin spend haptic feedback', () => {
      hapticCoinSpend();
      expect(mockVibrate).toHaveBeenCalledWith(25);
    });

    it('triggers QR scan haptic feedback', () => {
      hapticQRScan();
      expect(mockVibrate).toHaveBeenCalledWith([75, 25, 75]);
    });

    it('triggers QR success haptic feedback', () => {
      hapticQRSuccess();
      expect(mockVibrate).toHaveBeenCalledWith([50, 50, 100]);
    });

    it('triggers QR error haptic feedback', () => {
      hapticQRError();
      expect(mockVibrate).toHaveBeenCalledWith([100, 100, 100]);
    });

    it('triggers selection haptic feedback', () => {
      hapticSelection();
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('triggers achievement haptic feedback', () => {
      hapticAchievement();
      expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100, 50, 200]);
    });

    it('triggers boarding pass scan haptic feedback', () => {
      hapticBoardingPassScan();
      expect(mockVibrate).toHaveBeenCalledWith([50, 25, 50, 25, 100]);
    });
  });

  describe('Custom haptic feedback', () => {
    it('triggers custom haptic pattern', () => {
      const customPattern = [10, 20, 30];
      hapticCustom(customPattern);
      expect(mockVibrate).toHaveBeenCalledWith(customPattern);
    });
  });

  describe('Haptic availability', () => {
    it('returns true when vibration is supported', () => {
      expect(isHapticAvailable()).toBe(true);
    });

    it('returns false when vibration is not supported', () => {
      // Remove vibrate from navigator
      const originalVibrate = mockNavigator.vibrate;
      delete (mockNavigator as any).vibrate;
      hapticManager.recheckSupport();

      expect(isHapticAvailable()).toBe(false);
      
      // Restore
      mockNavigator.vibrate = originalVibrate;
      hapticManager.recheckSupport();
    });
  });

  describe('Stop haptic feedback', () => {
    it('stops haptic feedback', () => {
      stopHaptic();
      expect(mockVibrate).toHaveBeenCalledWith(0);
    });

    it('handles stop when vibration is not supported', () => {
      const originalVibrate = mockNavigator.vibrate;
      delete (mockNavigator as any).vibrate;
      hapticManager.recheckSupport();

      expect(() => stopHaptic()).not.toThrow();
      
      // Restore
      mockNavigator.vibrate = originalVibrate;
      hapticManager.recheckSupport();
    });
  });

  describe('Error handling', () => {
    it('handles vibration API errors gracefully', () => {
      mockVibrate.mockImplementation(() => {
        throw new Error('Vibration failed');
      });

      // Should not throw
      expect(() => hapticCoinEarn()).not.toThrow();
    });

    it('handles missing navigator gracefully', () => {
      // Mock window as undefined (server-side)
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => hapticCoinEarn()).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Browser compatibility', () => {
    it('works with webkit prefixed vibrate', () => {
      const mockWebkitVibrate = jest.fn();
      const originalVibrate = mockNavigator.vibrate;
      
      delete (mockNavigator as any).vibrate;
      (mockNavigator as any).webkitVibrate = mockWebkitVibrate;
      hapticManager.recheckSupport();

      hapticCoinEarn();
      expect(mockWebkitVibrate).toHaveBeenCalled();
      
      // Restore
      mockNavigator.vibrate = originalVibrate;
      delete (mockNavigator as any).webkitVibrate;
      hapticManager.recheckSupport();
    });

    it('works with moz prefixed vibrate', () => {
      const mockMozVibrate = jest.fn();
      const originalVibrate = mockNavigator.vibrate;
      
      delete (mockNavigator as any).vibrate;
      (mockNavigator as any).mozVibrate = mockMozVibrate;
      hapticManager.recheckSupport();

      hapticCoinEarn();
      expect(mockMozVibrate).toHaveBeenCalled();
      
      // Restore
      mockNavigator.vibrate = originalVibrate;
      delete (mockNavigator as any).mozVibrate;
      hapticManager.recheckSupport();
    });

    it('works with ms prefixed vibrate', () => {
      const mockMsVibrate = jest.fn();
      const originalVibrate = mockNavigator.vibrate;
      
      delete (mockNavigator as any).vibrate;
      (mockNavigator as any).msVibrate = mockMsVibrate;
      hapticManager.recheckSupport();

      hapticCoinEarn();
      expect(mockMsVibrate).toHaveBeenCalled();
      
      // Restore
      mockNavigator.vibrate = originalVibrate;
      delete (mockNavigator as any).msVibrate;
      hapticManager.recheckSupport();
    });
  });
});