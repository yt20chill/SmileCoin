import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardingPassScanner } from '../BoardingPassScanner';
import { useBoardingPassScanner } from '@/lib/hooks/useBoardingPassScanner';

// Mock dependencies
jest.mock('@/lib/hooks/useBoardingPassScanner');
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockUseBoardingPassScanner = useBoardingPassScanner as jest.MockedFunction<typeof useBoardingPassScanner>;

// Mock file for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('BoardingPassScanner', () => {
  const mockScanBoardingPass = jest.fn();
  const mockClearError = jest.fn();
  const mockOnScanComplete = jest.fn();

  const defaultHookReturn = {
    isScanning: false,
    isProcessing: false,
    error: null,
    lastScanResult: null,
    scanHistory: [],
    totalCoinsEarned: 0,
    scanBoardingPass: mockScanBoardingPass,
    loadScanHistory: jest.fn(),
    clearError: mockClearError,
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBoardingPassScanner.mockReturnValue(defaultHookReturn);
  });

  it('renders upload interface initially', () => {
    render(<BoardingPassScanner />);
    
    expect(screen.getByText('scanBoardingPass')).toBeInTheDocument();
    expect(screen.getByText('Upload boarding pass to earn 10 coins')).toBeInTheDocument();
    expect(screen.getByText('PNG, JPG, WEBP up to 5MB')).toBeInTheDocument();
  });

  it('handles file selection via input', async () => {
    const user = userEvent.setup();
    render(<BoardingPassScanner />);
    
    const fileInput = screen.getByRole('button', { name: /upload boarding pass/i });
    const mockFile = createMockFile('boarding-pass.jpg', 1024 * 1024, 'image/jpeg');
    
    // Mock the file input
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(hiddenInput, mockFile);
    
    await waitFor(() => {
      expect(screen.getByText('boarding-pass.jpg')).toBeInTheDocument();
      expect(screen.getByText('1.00 MB')).toBeInTheDocument();
      expect(screen.getByText('Valid file')).toBeInTheDocument();
    });
  });

  it('handles drag and drop file selection', async () => {
    render(<BoardingPassScanner />);
    
    const dropZone = screen.getByText('Upload boarding pass to earn 10 coins').closest('div');
    const mockFile = createMockFile('boarding-pass.jpg', 1024 * 1024, 'image/jpeg');
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [mockFile],
      },
    });
    
    fireEvent(dropZone!, dropEvent);
    
    await waitFor(() => {
      expect(screen.getByText('boarding-pass.jpg')).toBeInTheDocument();
    });
  });

  it('validates file type', async () => {
    const user = userEvent.setup();
    render(<BoardingPassScanner />);
    
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = createMockFile('document.pdf', 1024 * 1024, 'application/pdf');
    
    await user.upload(hiddenInput, invalidFile);
    
    await waitFor(() => {
      expect(screen.getByText(/invalidFile/)).toBeInTheDocument();
    });
  });

  it('validates file size', async () => {
    const user = userEvent.setup();
    render(<BoardingPassScanner />);
    
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg'); // 10MB
    
    await user.upload(hiddenInput, largeFile);
    
    await waitFor(() => {
      expect(screen.getByText(/fileTooLarge/)).toBeInTheDocument();
    });
  });

  it('handles successful boarding pass scan', async () => {
    const user = userEvent.setup();
    const mockSuccessResult = {
      success: true,
      coinsEarned: 10,
      boardingPass: {
        id: 'bp-1',
        passengerName: 'John Smith',
        flightNumber: 'CX123',
      },
      message: 'Successfully scanned boarding pass!'
    };
    
    mockScanBoardingPass.mockResolvedValue(mockSuccessResult);
    
    render(<BoardingPassScanner onScanComplete={mockOnScanComplete} />);
    
    // Upload file
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('boarding-pass.jpg', 1024 * 1024, 'image/jpeg');
    await user.upload(hiddenInput, mockFile);
    
    // Click scan button
    const scanButton = await screen.findByRole('button', { name: /scan for 10 coins/i });
    await user.click(scanButton);
    
    await waitFor(() => {
      expect(mockScanBoardingPass).toHaveBeenCalledWith(mockFile);
      expect(mockOnScanComplete).toHaveBeenCalledWith(10);
    });
  });

  it('handles scan failure', async () => {
    const user = userEvent.setup();
    const mockFailureResult = {
      success: false,
      message: 'Name mismatch detected',
      error: 'Name mismatch detected'
    };
    
    mockScanBoardingPass.mockResolvedValue(mockFailureResult);
    
    render(<BoardingPassScanner />);
    
    // Upload file
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('boarding-pass.jpg', 1024 * 1024, 'image/jpeg');
    await user.upload(hiddenInput, mockFile);
    
    // Click scan button
    const scanButton = await screen.findByRole('button', { name: /scan for 10 coins/i });
    await user.click(scanButton);
    
    await waitFor(() => {
      expect(mockScanBoardingPass).toHaveBeenCalledWith(mockFile);
      expect(mockOnScanComplete).not.toHaveBeenCalled();
    });
  });

  it('shows processing state during scan', () => {
    mockUseBoardingPassScanner.mockReturnValue({
      ...defaultHookReturn,
      isProcessing: true,
    });
    
    render(<BoardingPassScanner />);
    
    // Upload file first
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('boarding-pass.jpg', 1024 * 1024, 'image/jpeg');
    
    fireEvent.change(hiddenInput, { target: { files: [mockFile] } });
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
  });

  it('displays success result', () => {
    const mockSuccessResult = {
      success: true,
      coinsEarned: 10,
      message: 'Successfully scanned boarding pass!'
    };
    
    mockUseBoardingPassScanner.mockReturnValue({
      ...defaultHookReturn,
      lastScanResult: mockSuccessResult,
    });
    
    render(<BoardingPassScanner />);
    
    expect(screen.getByText('Successfully scanned boarding pass!')).toBeInTheDocument();
    expect(screen.getByText('+10 Smile Coins earned!')).toBeInTheDocument();
  });

  it('displays error from hook', () => {
    mockUseBoardingPassScanner.mockReturnValue({
      ...defaultHookReturn,
      error: 'Network connection failed',
    });
    
    render(<BoardingPassScanner />);
    
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
  });

  it('allows file removal', async () => {
    const user = userEvent.setup();
    render(<BoardingPassScanner />);
    
    // Upload file
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile('boarding-pass.jpg', 1024 * 1024, 'image/jpeg');
    await user.upload(hiddenInput, mockFile);
    
    // Remove file
    const removeButton = await screen.findByRole('button', { name: '' }); // X button
    await user.click(removeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('boarding-pass.jpg')).not.toBeInTheDocument();
      expect(screen.getByText('Upload boarding pass to earn 10 coins')).toBeInTheDocument();
    });
    
    expect(mockClearError).toHaveBeenCalled();
  });

  it('handles drag over and drag leave events', () => {
    render(<BoardingPassScanner />);
    
    const dropZone = screen.getByText('Upload boarding pass to earn 10 coins').closest('div');
    
    // Drag over
    fireEvent.dragOver(dropZone!, { dataTransfer: { files: [] } });
    expect(screen.getByText('Drop your boarding pass here')).toBeInTheDocument();
    
    // Drag leave
    fireEvent.dragLeave(dropZone!, { dataTransfer: { files: [] } });
    expect(screen.getByText('Upload boarding pass to earn 10 coins')).toBeInTheDocument();
  });
});