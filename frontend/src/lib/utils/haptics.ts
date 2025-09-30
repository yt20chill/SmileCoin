/**
 * Haptic feedback utilities for mobile interactions
 * Provides tactile feedback for various user actions
 */

export type HapticFeedbackType = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'warning' 
  | 'error'
  | 'selection'
  | 'impact';

interface HapticOptions {
  pattern?: number[];
  duration?: number;
  intensity?: number;
}

class HapticManager {
  private isSupported: boolean = false;
  private vibrationAPI: any = null;

  constructor() {
    this.checkSupport();
  }

  private checkSupport(): void {
    // Check for various vibration APIs
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.vibrationAPI = 
        navigator.vibrate ||
        (navigator as any).webkitVibrate ||
        (navigator as any).mozVibrate ||
        (navigator as any).msVibrate;
      
      this.isSupported = !!this.vibrationAPI;
    }
  }

  /**
   * Re-check support (useful for testing)
   */
  public recheckSupport(): void {
    this.checkSupport();
  }

  /**
   * Trigger haptic feedback based on type
   */
  public trigger(type: HapticFeedbackType, options?: HapticOptions): void {
    if (!this.isSupported || !this.vibrationAPI) {
      return;
    }

    try {
      const pattern = this.getPatternForType(type, options);
      this.vibrationAPI.call(navigator, pattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Get vibration pattern for feedback type
   */
  private getPatternForType(type: HapticFeedbackType, options?: HapticOptions): number | number[] {
    if (options?.pattern) {
      return options.pattern;
    }

    switch (type) {
      case 'light':
        return 10;
      
      case 'medium':
        return 25;
      
      case 'heavy':
        return 50;
      
      case 'success':
        return [50, 50, 100]; // Short, pause, long
      
      case 'warning':
        return [25, 25, 25, 25, 25]; // Quick pulses
      
      case 'error':
        return [100, 100, 100]; // Strong pulses
      
      case 'selection':
        return 15; // Very light tap
      
      case 'impact':
        return [75, 25, 75]; // Strong-weak-strong
      
      default:
        return 20;
    }
  }

  /**
   * Check if haptic feedback is supported
   */
  public isHapticSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Stop any ongoing vibration
   */
  public stop(): void {
    if (this.isSupported && this.vibrationAPI) {
      try {
        this.vibrationAPI.call(navigator, 0);
      } catch (error) {
        console.warn('Failed to stop haptic feedback:', error);
      }
    }
  }
}

// Create singleton instance
const hapticManager = new HapticManager();

/**
 * Trigger haptic feedback for coin earning
 */
export const hapticCoinEarn = (): void => {
  hapticManager.trigger('success');
};

/**
 * Trigger haptic feedback for coin spending
 */
export const hapticCoinSpend = (): void => {
  hapticManager.trigger('medium');
};

/**
 * Trigger haptic feedback for QR code scanning
 */
export const hapticQRScan = (): void => {
  hapticManager.trigger('impact');
};

/**
 * Trigger haptic feedback for successful QR scan
 */
export const hapticQRSuccess = (): void => {
  hapticManager.trigger('success');
};

/**
 * Trigger haptic feedback for failed QR scan
 */
export const hapticQRError = (): void => {
  hapticManager.trigger('error');
};

/**
 * Trigger haptic feedback for button selection
 */
export const hapticSelection = (): void => {
  hapticManager.trigger('selection');
};

/**
 * Trigger haptic feedback for achievement unlock
 */
export const hapticAchievement = (): void => {
  hapticManager.trigger('success', {
    pattern: [100, 50, 100, 50, 200] // Celebration pattern
  });
};

/**
 * Trigger haptic feedback for boarding pass scan
 */
export const hapticBoardingPassScan = (): void => {
  hapticManager.trigger('success', {
    pattern: [50, 25, 50, 25, 100] // Success pattern
  });
};

/**
 * Custom haptic feedback with pattern
 */
export const hapticCustom = (pattern: number[]): void => {
  hapticManager.trigger('impact', { pattern });
};

/**
 * Check if haptic feedback is available
 */
export const isHapticAvailable = (): boolean => {
  return hapticManager.isHapticSupported();
};

/**
 * Stop all haptic feedback
 */
export const stopHaptic = (): void => {
  hapticManager.stop();
};

export default hapticManager;