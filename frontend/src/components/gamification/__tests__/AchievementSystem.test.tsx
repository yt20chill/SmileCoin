import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AchievementSystem, AchievementProgress, Achievement } from '../AchievementSystem';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, ...props }: any) => <div {...props}>{children}</div>,
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

const mockAchievement: Achievement = {
  id: 'test-achievement',
  title: 'First Boarding Pass',
  titleZh: '第一張登機證',
  description: 'Scan your first boarding pass',
  descriptionZh: '掃描您的第一張登機證',
  icon: 'boarding-pass',
  category: 'boarding-pass',
  requirement: 1,
  progress: 1,
  isUnlocked: true,
  unlockedAt: new Date(),
  rarity: 'common'
};

const mockUnlockedAchievement: Achievement = {
  ...mockAchievement,
  id: 'unlocked-achievement',
  progress: 1,
  isUnlocked: true,
  unlockedAt: undefined // This will trigger the notification
};

describe('AchievementSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<AchievementSystem achievements={[]} />);
  });

  it('calls onAchievementUnlocked for newly unlocked achievements', () => {
    const onAchievementUnlocked = jest.fn();
    
    render(
      <AchievementSystem 
        achievements={[mockUnlockedAchievement]} 
        onAchievementUnlocked={onAchievementUnlocked}
      />
    );

    expect(onAchievementUnlocked).toHaveBeenCalledWith(mockUnlockedAchievement);
  });

  it('does not call onAchievementUnlocked for already processed achievements', () => {
    const onAchievementUnlocked = jest.fn();
    
    render(
      <AchievementSystem 
        achievements={[mockAchievement]} 
        onAchievementUnlocked={onAchievementUnlocked}
      />
    );

    expect(onAchievementUnlocked).not.toHaveBeenCalled();
  });
});

describe('AchievementProgress', () => {
  it('renders unlocked achievement correctly', () => {
    render(<AchievementProgress achievement={mockAchievement} />);
    
    expect(screen.getByText('First Boarding Pass')).toBeInTheDocument();
    expect(screen.getByText('Scan your first boarding pass')).toBeInTheDocument();
  });

  it('renders locked achievement with progress', () => {
    const lockedAchievement: Achievement = {
      ...mockAchievement,
      isUnlocked: false,
      progress: 0
    };
    
    render(<AchievementProgress achievement={lockedAchievement} showProgress={true} />);
    
    expect(screen.getByText('0/1')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('hides progress when showProgress is false', () => {
    const lockedAchievement: Achievement = {
      ...mockAchievement,
      isUnlocked: false,
      progress: 0
    };
    
    render(<AchievementProgress achievement={lockedAchievement} showProgress={false} />);
    
    expect(screen.queryByText('0/1')).not.toBeInTheDocument();
  });

  it('applies correct rarity styling', () => {
    const legendaryAchievement: Achievement = {
      ...mockAchievement,
      rarity: 'legendary'
    };
    
    const { container } = render(<AchievementProgress achievement={legendaryAchievement} />);
    
    expect(container.querySelector('.text-yellow-500')).toBeInTheDocument();
  });

  it('shows grayscale icon for locked achievements', () => {
    const lockedAchievement: Achievement = {
      ...mockAchievement,
      isUnlocked: false
    };
    
    const { container } = render(<AchievementProgress achievement={lockedAchievement} />);
    
    expect(container.querySelector('.grayscale')).toBeInTheDocument();
  });
});