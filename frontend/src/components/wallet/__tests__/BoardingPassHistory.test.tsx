import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardingPassHistory } from '../BoardingPassHistory';
import { useBoardingPassScanner } from '@/lib/hooks/useBoardingPassScanner';

// Mock dependencies
jest.mock('@/lib/hooks/useBoardingPassScanner');
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

const mockUseBoardingPassScanner = useBoardingPassScanner as jest.MockedFunction<typeof useBoardingPassScanner>;

describe('BoardingPassHistory', () => {
  const mockLoadScanHistory = jest.fn();

  const defaultHookReturn = {
    isScanning: false,
    isProcessing: false,
    error: null,
    lastScanResult: null,
    scanHistory: [],
    totalCoinsEarned: 0,
    scanBoardingPass: jest.fn(),
    loadScanHistory: mockLoadScanHistory,
    clearError: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBoardingPassScanner.mockReturnValue(defaultHookReturn);
  });

  it('renders loading state initially', () => {
    mockUseBoardingPassScanner.mockReturnValue({
      ...defaultHookReturn,
      isProcessing: true,
    });

    render(<BoardingPassHistory />);
    
    expect(screen.getByText('Boarding Pass History')).toBeInTheDocument();
    expect(screen.getByRole('generic', { name: /loading/i })).toBeInTheDocument();
  });

  it('calls loadScanHistory on mount', () => {
    render(<BoardingPassHistory />);
    
    expect(mockLoadScanHistory).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no boarding passes', () => {
    render(<BoardingPassHistory />);
    
    expect(screen.getByText('No boarding passes scanned yet')).toBeInTheDocument();
    expect(screen.getByText('Upload your boarding pass to start earning Smile Coins!')).toBeInTheDocument();
  });

  it('renders boarding pass history with summary stats', () => {
    const mockHistory = [
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
      },
      {
        id: 'bp-2',
        passengerName: 'John Smith',
        flightNumber: 'SQ456',
        date: new Date('2024-01-10'),
        imageUrl: 'mock-url-2',
        isScanned: true,
        coinsAwarded: 10,
        scannedAt: new Date('2024-01-10T14:20:00Z'),
        userId: 'user-1'
      }
    ];

    mockUseBoardingPassScanner.mockReturnValue({
      ...defaultHookReturn,
      scanHistory: mockHistory,
      totalCoinsEarned: 20,
    });

    render(<BoardingPassHistory />);
    
    // Check summary stats
    expect(screen.getByText('2')).toBeInTheDocument(); // Passes Scanned
    expect(screen.getByText('Passes Scanned')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument(); // Total Coins Earned
    expect(screen.getByText('Total Coins Earned')).toBeInTheDocument();
    
    // Check boarding pass items
    expect(screen.getByText('CX123')).toBeInTheDocument();
    expect(screen.getByText('SQ456')).toBeInTheDocument();
    expect(screen.getAllByText('John Smith')).toHaveLength(2);
    expect(screen.getAllByText('+10')).toHaveLength(2);
  });

  it('renders boarding pass items with correct information', () => {
    const mockBoardingPass = {
      id: 'bp-1',
      passengerName: 'John Smith',
      flightNumber: 'CX123',
      date: new Date('2024-01-15'),
      imageUrl: 'mock-url-1',
      isScanned: true,
      coinsAwarded: 10,
      scannedAt: new Date('2024-01-15T10:30:00Z'),
      userId: 'user-1'
    };

    mockUseBoardingPassScanner.mockReturnValue({
      ...defaultHookReturn,
      scanHistory: [mockBoardingPass],
      totalCoinsEarned: 10,
    });

    render(<BoardingPassHistory />);
    
    expect(screen.getByText('CX123')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('1/15/2024')).toBeInTheDocument(); // Date formatted
    expect(screen.getByText('2 hours ago')).toBeInTheDocument(); // Scanned time
    expect(screen.getByText('+10')).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    const user = userEvent.setup();
    render(<BoardingPassHistory />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);
    
    expect(mockLoadScanHistory).toHaveBeenCalledTimes(2); // Once on mount, once on click
  });

  it('disables refresh button when processing', () => {
    mockUseBoardingPassScanner.mockReturnValue({
      ...defaultHookReturn,
      isProcessing: true,
    });

    render(<BoardingPassHistory />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDisabled();
  });

  it('shows loading spinner in refresh button when processing', () => {
    mockUseBoardingPassScanner.mockReturnValue({
      ...defaultHookReturn,
      isProcessing: true,
      scanHistory: [
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
    });

    render(<BoardingPassHistory />);
    
    const refreshButton = screen.getByRole('button');
    expect(refreshButton).toHaveClass('animate-spin'); // Loading spinner
  });

  it('displays error message when error occurs', () => {
    mockUseBoardingPassScanner.mockReturnValue({
      ...defaultHookReturn,
      error: 'Failed to load boarding pass history',
    });

    render(<BoardingPassHistory />);
    
    expect(screen.getByText('Failed to load boarding pass history')).toBeInTheDocument();
  });

  it('renders boarding pass items with animation delay', () => {
    const mockHistory = [
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
      },
      {
        id: 'bp-2',
        passengerName: 'John Smith',
        flightNumber: 'SQ456',
        date: new Date('2024-01-10'),
        imageUrl: 'mock-url-2',
        isScanned: true,
        coinsAwarded: 10,
        scannedAt: new Date('2024-01-10T14:20:00Z'),
        userId: 'user-1'
      }
    ];

    mockUseBoardingPassScanner.mockReturnValue({
      ...defaultHookReturn,
      scanHistory: mockHistory,
      totalCoinsEarned: 20,
    });

    render(<BoardingPassHistory />);
    
    // Both items should be rendered
    expect(screen.getByText('CX123')).toBeInTheDocument();
    expect(screen.getByText('SQ456')).toBeInTheDocument();
  });

  it('handles boarding pass without scanned date', () => {
    const mockBoardingPass = {
      id: 'bp-1',
      passengerName: 'John Smith',
      flightNumber: 'CX123',
      date: new Date('2024-01-15'),
      imageUrl: 'mock-url-1',
      isScanned: true,
      coinsAwarded: 10,
      scannedAt: undefined, // No scanned date
      userId: 'user-1'
    };

    mockUseBoardingPassScanner.mockReturnValue({
      ...defaultHookReturn,
      scanHistory: [mockBoardingPass],
      totalCoinsEarned: 10,
    });

    render(<BoardingPassHistory />);
    
    expect(screen.getByText('CX123')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    // Should not show scanned time when scannedAt is undefined
    expect(screen.queryByText('2 hours ago')).not.toBeInTheDocument();
  });
});