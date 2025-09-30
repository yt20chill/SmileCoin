import { render, screen, act } from '@testing-library/react';
import { OnboardingAnimation } from '../OnboardingAnimation';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

describe('OnboardingAnimation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders earn animation correctly', () => {
    render(<OnboardingAnimation type="earn" />);

    // The component should render without errors
    expect(screen.getByText('✈️')).toBeInTheDocument();
  });

  it('renders spend animation correctly', () => {
    render(<OnboardingAnimation type="spend" />);

    // The component should render without errors
    expect(screen.getByText('🏪')).toBeInTheDocument();
  });

  it('renders browse animation correctly', () => {
    render(<OnboardingAnimation type="browse" />);

    // Should render merchant icons
    expect(screen.getByText('🏪')).toBeInTheDocument();
    expect(screen.getByText('🍜')).toBeInTheDocument();
    expect(screen.getByText('🛍️')).toBeInTheDocument();
  });

  it('renders initial state for earn type', () => {
    render(<OnboardingAnimation type="earn" />);

    // Initially shows boarding pass
    expect(screen.getByText('✈️')).toBeInTheDocument();
  });

  it('renders initial state for spend type', () => {
    render(<OnboardingAnimation type="spend" />);

    // Initially shows merchant
    expect(screen.getByText('🏪')).toBeInTheDocument();
  });

  it('renders browse animation with all merchant icons', () => {
    render(<OnboardingAnimation type="browse" />);

    // Should always show all merchant icons
    expect(screen.getByText('🏪')).toBeInTheDocument();
    expect(screen.getByText('🍜')).toBeInTheDocument();
    expect(screen.getByText('🛍️')).toBeInTheDocument();
  });

  it('handles demo data prop correctly', () => {
    const demoData = {
      coins: 100,
      merchantName: 'Test Merchant',
      rewardName: 'Test Reward'
    };

    render(<OnboardingAnimation type="earn" demoData={demoData} />);

    // Component should render without errors even with demo data
    // (demo data is used for context but doesn't directly affect rendering)
    expect(screen.getByText('✈️')).toBeInTheDocument();
  });

  it('maintains consistent rendering across animation cycles', () => {
    render(<OnboardingAnimation type="earn" />);

    // Should always have the animation container
    expect(screen.getByText('✈️')).toBeInTheDocument();
    
    // Advance time and verify component still renders
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    // Component should still be rendered (though content may change)
    const container = screen.getByText('✈️').closest('.absolute');
    expect(container).toBeInTheDocument();
  });

  it('handles rapid animation type changes', () => {
    const { rerender } = render(<OnboardingAnimation type="earn" />);

    expect(screen.getByText('✈️')).toBeInTheDocument();

    rerender(<OnboardingAnimation type="spend" />);
    expect(screen.getByText('🏪')).toBeInTheDocument();

    rerender(<OnboardingAnimation type="browse" />);
    expect(screen.getByText('🏪')).toBeInTheDocument();
    expect(screen.getByText('🍜')).toBeInTheDocument();
    expect(screen.getByText('🛍️')).toBeInTheDocument();
  });
});