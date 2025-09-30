import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { QuickActions } from '../QuickActions';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'quickActions': 'Quick Actions',
      'scanBoardingPassAction': 'Scan Boarding Pass',
      'rateMerchantAction': 'Rate Merchant',
      'myVouchersAction': 'My Vouchers',
      'scanBoardingPassDescription': 'Earn 10 coins',
      'rateMerchantDescription': 'Spend coins to rate',
      'myVouchersDescription': 'View your rewards',
    };
    return translations[key] || key;
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock haptics
jest.mock('@/lib/utils/haptics', () => ({
  hapticSelection: jest.fn(),
}));

// Mock FullscreenBoardingPassScanner
jest.mock('../FullscreenBoardingPassScanner', () => ({
  FullscreenBoardingPassScanner: ({ onScanComplete, onClose }: any) => (
    <div data-testid="fullscreen-boarding-scanner">
      <button onClick={() => onScanComplete(10)}>Complete Scan</button>
      <button onClick={onClose}>Close Scanner</button>
    </div>
  ),
}));

// Mock FullscreenMerchantQRScanner
jest.mock('../FullscreenMerchantQRScanner', () => ({
  FullscreenMerchantQRScanner: ({ onScanComplete, onClose }: any) => (
    <div data-testid="fullscreen-merchant-scanner">
      <h3>Scan Merchant QR Code</h3>
      <button onClick={() => onScanComplete('merchant-1')}>Complete Merchant Scan</button>
      <button onClick={onClose}>Close Merchant Scanner</button>
    </div>
  ),
}));

const mockPush = jest.fn();

describe('QuickActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders all quick action buttons', () => {
    render(<QuickActions />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Scan Pass')).toBeInTheDocument();
    expect(screen.getByText('Rate Shop')).toBeInTheDocument();
    expect(screen.getByText('Vouchers')).toBeInTheDocument();
  });

  it('displays correct descriptions for each action', () => {
    render(<QuickActions />);
    
    expect(screen.getByText('+10 Coins')).toBeInTheDocument();
    expect(screen.getByText('Scan QR')).toBeInTheDocument();
    expect(screen.getByText('Rewards')).toBeInTheDocument();
  });

  it('shows fullscreen boarding pass scanner when scan boarding pass is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActions />);
    
    const scanButton = screen.getByText('Scan Pass');
    await user.click(scanButton);
    
    expect(screen.getByTestId('fullscreen-boarding-scanner')).toBeInTheDocument();
    expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
  });

  it('shows fullscreen merchant QR scanner when rate merchant is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActions />);
    
    const rateButton = screen.getByText('Rate Shop');
    await user.click(rateButton);
    
    expect(screen.getByTestId('fullscreen-merchant-scanner')).toBeInTheDocument();
  });

  it('navigates to rewards page when my vouchers is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActions />);
    
    const vouchersButton = screen.getByText('Vouchers');
    await user.click(vouchersButton);
    
    expect(mockPush).toHaveBeenCalledWith('/rewards');
  });

  it('calls onScanComplete when camera scanner completes', async () => {
    const user = userEvent.setup();
    const mockOnScanComplete = jest.fn();
    render(<QuickActions onScanComplete={mockOnScanComplete} />);
    
    // Open scanner
    const scanButton = screen.getByText('Scan Pass');
    await user.click(scanButton);
    
    // Complete scan
    const completeButton = screen.getByText('Complete Scan');
    await user.click(completeButton);
    
    expect(mockOnScanComplete).toHaveBeenCalledWith(10);
  });

  it('closes fullscreen scanner and returns to quick actions', async () => {
    const user = userEvent.setup();
    render(<QuickActions />);
    
    // Open scanner
    const scanButton = screen.getByText('Scan Pass');
    await user.click(scanButton);
    
    expect(screen.getByTestId('fullscreen-boarding-scanner')).toBeInTheDocument();
    
    // Close scanner
    const closeButton = screen.getByText('Close Scanner');
    await user.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByTestId('fullscreen-boarding-scanner')).not.toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });
  });

  it('has proper mobile-friendly button styling', () => {
    render(<QuickActions />);
    
    // Check that buttons have proper styling
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
    
    buttons.forEach(button => {
      expect(button).toHaveClass('w-full', 'p-4', 'rounded-2xl');
    });
  });

  it('displays icons for each action', () => {
    render(<QuickActions />);
    
    // Check that SVG elements are present by looking for specific classes
    const cameraIcon = document.querySelector('.lucide-camera');
    const qrIcon = document.querySelector('.lucide-qr-code');
    const giftIcon = document.querySelector('.lucide-gift');
    
    expect(cameraIcon).toBeInTheDocument();
    expect(qrIcon).toBeInTheDocument();
    expect(giftIcon).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const customClass = 'custom-test-class';
    render(<QuickActions className={customClass} />);
    
    const container = screen.getByText('Quick Actions').closest('.custom-test-class');
    expect(container).toBeInTheDocument();
  });

  it('handles scanner completion and closes automatically', async () => {
    const user = userEvent.setup();
    const mockOnScanComplete = jest.fn();
    render(<QuickActions onScanComplete={mockOnScanComplete} />);
    
    // Open scanner
    await user.click(screen.getByText('Scan Pass'));
    
    // Complete scan
    await user.click(screen.getByText('Complete Scan'));
    
    // Should close scanner and return to quick actions
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.queryByTestId('fullscreen-boarding-scanner')).not.toBeInTheDocument();
    });
    
    expect(mockOnScanComplete).toHaveBeenCalledWith(10);
  });
});