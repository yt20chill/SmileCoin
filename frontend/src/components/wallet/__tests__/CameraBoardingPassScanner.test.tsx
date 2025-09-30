import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CameraBoardingPassScanner } from '../CameraBoardingPassScanner';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'scanBoardingPass': 'Scan Boarding Pass',
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
  hapticBoardingPassScan: jest.fn(),
}));

// Mock useBoardingPassScanner hook
const mockScanBoardingPass = jest.fn();
const mockClearError = jest.fn();

jest.mock('@/lib/hooks/useBoardingPassScanner', () => ({
  useBoardingPassScanner: () => ({
    isScanning: false,
    isProcessing: false,
    error: null,
    lastScanResult: null,
    scanBoardingPass: mockScanBoardingPass,
    clearError: mockClearError,
  }),
}));

// Mock CoinAnimation
jest.mock('../CoinAnimation', () => ({
  CoinAnimation: ({ onComplete }: any) => (
    <div data-testid="coin-animation" onClick={onComplete}>
      Coin Animation
    </div>
  ),
}));

// Mock MediaDevices API
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
});

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
  writable: true,
  value: 1920,
});

Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
  writable: true,
value: 1080,
});

// Mock HTMLCanvasElement
const mockToBlob = jest.fn();
const mockGetContext = jest.fn();

Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  writable: true,
  value: mockToBlob,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: mockGetContext,
});

describe('CameraBoardingPassScanner', () => {
  const mockOnScanComplete = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful camera access
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });
    
    // Mock canvas context
    mockGetContext.mockReturnValue({
      drawImage: jest.fn(),
    });
    
    // Mock toBlob
    mockToBlob.mockImplementation((callback) => {
      const blob = new Blob(['fake-image'], { type: 'image/jpeg' });
      callback(blob);
    });
  });

  it('renders initial camera scanner interface', () => {
    render(<CameraBoardingPassScanner />);
    
    expect(screen.getByText('Scan Boarding Pass')).toBeInTheDocument();
    expect(screen.getByText('Camera Boarding Pass Scanner')).toBeInTheDocument();
    expect(screen.getByText('Take a photo of your boarding pass to earn 10 coins')).toBeInTheDocument();
    expect(screen.getByText('Start Camera')).toBeInTheDocument();
  });

  it('shows close button and calls onClose when clicked', async () => {
    const user = userEvent.setup();
    render(<CameraBoardingPassScanner onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('starts camera when start camera button is clicked', async () => {
    const user = userEvent.setup();
    render(<CameraBoardingPassScanner />);
    
    const startButton = screen.getByText('Start Camera');
    await user.click(startButton);
    
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });
  });

  it('shows camera error when camera access fails', async () => {
    const user = userEvent.setup();
    mockGetUserMedia.mockRejectedValue(new Error('Camera not available'));
    
    render(<CameraBoardingPassScanner />);
    
    const startButton = screen.getByText('Start Camera');
    await user.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('Camera access denied or not available')).toBeInTheDocument();
    });
  });

  it('handles camera functionality', () => {
    render(<CameraBoardingPassScanner />);
    
    // Component should render without camera controls initially
    expect(screen.queryByText('Capture')).not.toBeInTheDocument();
    expect(screen.queryByText('Switch')).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-scanner-class';
    render(<CameraBoardingPassScanner className={customClass} />);
    
    const container = screen.getByText('Scan Boarding Pass').closest('.custom-scanner-class');
    expect(container).toBeInTheDocument();
  });

  it('handles component lifecycle correctly', () => {
    const { unmount } = render(<CameraBoardingPassScanner />);
    
    // Component should unmount without errors
    expect(() => unmount()).not.toThrow();
  });
});