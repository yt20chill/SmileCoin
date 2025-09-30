import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressIndicators, EngagementMetrics } from '../ProgressIndicators';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: any) => {
    if (key === 'current_streak' && values) {
      return `${values.days} day streak`;
    }
    return key;
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock Progress component
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div className={className} data-testid="progress-bar" data-value={value} />
  ),
}));

const mockMetrics: EngagementMetrics = {
  totalCoinsEarned: 150,
  totalCoinsSpent: 50,
  currentBalance: 100,
  boardingPassesScanned: 3,
  merchantsRated: 5,
  rewardsRedeemed: 2,
  daysActive: 7,
  currentStreak: 3,
  level: 2,
  experiencePoints: 750,
  nextLevelXP: 1000
};

describe('ProgressIndicators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ProgressIndicators metrics={mockMetrics} />);
  });

  it('displays level information', () => {
    render(<ProgressIndicators metrics={mockMetrics} />);
    
    expect(screen.getByText('Level 2')).toBeInTheDocument();
  });

  it('displays basic metrics', () => {
    render(<ProgressIndicators metrics={mockMetrics} />);
    
    // Check that some metrics are displayed
    expect(screen.getByText('100')).toBeInTheDocument(); // Current balance
    expect(screen.getByText('150')).toBeInTheDocument(); // Total earned
  });

  it('shows detailed stats when enabled', () => {
    render(<ProgressIndicators metrics={mockMetrics} showDetailed={true} />);
    
    expect(screen.getByText('detailed_stats')).toBeInTheDocument();
  });

  it('hides detailed stats by default', () => {
    render(<ProgressIndicators metrics={mockMetrics} />);
    
    expect(screen.queryByText('detailed_stats')).not.toBeInTheDocument();
  });

  it('displays streak indicator when streak is active', () => {
    render(<ProgressIndicators metrics={mockMetrics} />);
    
    expect(screen.getByText('active_streak')).toBeInTheDocument();
  });

  it('does not show streak indicator when streak is 0', () => {
    const metricsNoStreak = { ...mockMetrics, currentStreak: 0 };
    render(<ProgressIndicators metrics={metricsNoStreak} />);
    
    expect(screen.queryByText('active_streak')).not.toBeInTheDocument();
  });
});