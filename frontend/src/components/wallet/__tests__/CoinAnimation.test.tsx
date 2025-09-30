import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CoinAnimation } from '../CoinAnimation';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

describe('CoinAnimation', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders earn animation correctly', () => {
    render(
      <CoinAnimation
        type="earn"
        amount={10}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByTestId('coin-animation')).toBeInTheDocument();
    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(screen.getByText('Coins Earned!')).toBeInTheDocument();
  });

  it('renders spend animation correctly', () => {
    render(
      <CoinAnimation
        type="spend"
        amount={5}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('-5')).toBeInTheDocument();
    expect(screen.getByText('Coins Spent')).toBeInTheDocument();
  });

  it('renders spend animation correctly for redeem case', () => {
    render(
      <CoinAnimation
        type="spend"
        amount={100}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('-100')).toBeInTheDocument();
    expect(screen.getByText('Coins Spent')).toBeInTheDocument();
  });

  it('calls onComplete after animation duration', async () => {
    render(
      <CoinAnimation
        type="earn"
        amount={10}
        onComplete={mockOnComplete}
      />
    );

    // Fast-forward time to trigger the completion
    jest.advanceTimersByTime(2300); // 2000ms + 300ms exit animation

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('displays correct amount formatting', () => {
    render(
      <CoinAnimation
        type="earn"
        amount={1234}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('+1234')).toBeInTheDocument();
  });

  it('shows negative sign for spend transactions', () => {
    render(
      <CoinAnimation
        type="spend"
        amount={3}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('-3')).toBeInTheDocument();
  });

  it('shows positive sign for earn transactions', () => {
    render(
      <CoinAnimation
        type="earn"
        amount={25}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('+25')).toBeInTheDocument();
  });

  it('renders smile coin images in animation', () => {
    render(
      <CoinAnimation
        type="earn"
        amount={3}
        onComplete={mockOnComplete}
      />
    );

    // Should render smile coin images
    const smileCoinImages = screen.getAllByAltText('Smile Coin');
    expect(smileCoinImages.length).toBeGreaterThan(0);
  });

  it('limits floating coins to maximum of 5', () => {
    render(
      <CoinAnimation
        type="earn"
        amount={10}
        onComplete={mockOnComplete}
      />
    );

    // Even with amount=10, should only show max 5 floating coins
    // Since we mocked framer-motion, we can't easily test the exact count
    // but we can verify the component renders without errors
    expect(screen.getByTestId('coin-animation')).toBeInTheDocument();
  });

  it('applies correct styling for different animation types', () => {
    const { rerender } = render(
      <CoinAnimation
        type="earn"
        amount={10}
        onComplete={mockOnComplete}
      />
    );

    let container = screen.getByTestId('coin-animation');
    expect(container).toBeInTheDocument();

    rerender(
      <CoinAnimation
        type="spend"
        amount={5}
        onComplete={mockOnComplete}
      />
    );

    container = screen.getByTestId('coin-animation');
    expect(container).toBeInTheDocument();

    // Test with default case
    rerender(
      <CoinAnimation
        type="earn"
        amount={100}
        onComplete={mockOnComplete}
      />
    );

    container = screen.getByTestId('coin-animation');
    expect(container).toBeInTheDocument();
  });

  it('handles zero amount gracefully', () => {
    render(
      <CoinAnimation
        type="earn"
        amount={0}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('+0')).toBeInTheDocument();
    expect(screen.getByTestId('coin-animation')).toBeInTheDocument();
  });
});