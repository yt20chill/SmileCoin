import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingCarousel } from '../OnboardingCarousel';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'skip': 'Skip',
      'next': 'Next',
      'previous': 'Previous',
      'getStarted': 'Get Started',
      'slideIndicator': 'Slide {current} of {total}',
      'slides.welcome.title': 'Welcome to Hong Kong!',
      'slides.welcome.description': 'Discover the gamified tourism experience with Smile Coins.',
      'slides.earnCoins.title': 'Earn Smile Coins',
      'slides.earnCoins.description': 'Register with your boarding pass and start earning.',
      'slides.rateMerchants.title': 'Rate Your Experience',
      'slides.rateMerchants.description': 'Spend 1-3 Smile Coins to rate merchants.',
      'slides.explore.title': 'Start Exploring!',
      'slides.explore.description': 'Ready to begin your gamified Hong Kong adventure?'
    };
    return translations[key] || key;
  }
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

describe('OnboardingCarousel', () => {
  const mockOnComplete = jest.fn();
  const mockOnSkip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the first slide correctly', () => {
    render(
      <OnboardingCarousel onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    expect(screen.getByText('Welcome to Hong Kong!')).toBeInTheDocument();
    expect(screen.getByText('Discover the gamified tourism experience with Smile Coins.')).toBeInTheDocument();
    expect(screen.getByText('Skip')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('shows progress indicators for all slides', () => {
    render(
      <OnboardingCarousel onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Should have 5 progress indicators (dots)
    const progressDots = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Slide')
    );
    expect(progressDots).toHaveLength(5);
  });

  it('navigates to next slide when Next button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <OnboardingCarousel onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Earn Smile Coins')).toBeInTheDocument();
    });
  });

  it('shows Previous button after navigating to second slide', async () => {
    const user = userEvent.setup();
    render(
      <OnboardingCarousel onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });
  });

  it('navigates back to previous slide when Previous button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <OnboardingCarousel onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Go to second slide
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Earn Smile Coins')).toBeInTheDocument();
    });

    // Go back to first slide
    const previousButton = screen.getByText('Previous');
    await user.click(previousButton);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Hong Kong!')).toBeInTheDocument();
    });
  });

  it('shows "Get Started" button on the last slide', async () => {
    const user = userEvent.setup();
    render(
      <OnboardingCarousel onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Navigate to the last slide (5 clicks)
    const nextButton = screen.getByText('Next');
    for (let i = 0; i < 4; i++) {
      await user.click(nextButton);
      await waitFor(() => {});
    }

    await waitFor(() => {
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });
  });

  it('calls onComplete when Get Started is clicked on last slide', async () => {
    const user = userEvent.setup();
    render(
      <OnboardingCarousel onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Navigate to the last slide
    const nextButton = screen.getByText('Next');
    for (let i = 0; i < 4; i++) {
      await user.click(nextButton);
      await waitFor(() => {});
    }

    const getStartedButton = await screen.findByText('Get Started');
    await user.click(getStartedButton);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when Skip button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <OnboardingCarousel onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    const skipButton = screen.getByText('Skip');
    await user.click(skipButton);

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('allows navigation via progress indicators', async () => {
    const user = userEvent.setup();
    render(
      <OnboardingCarousel onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Click on the third progress indicator (index 2)
    const progressDots = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-label')?.includes('Slide')
    );
    
    await user.click(progressDots[2]);

    await waitFor(() => {
      expect(screen.getByText('Rate Your Experience')).toBeInTheDocument();
    });
  });

  it('displays slide counter correctly', () => {
    render(
      <OnboardingCarousel onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    expect(screen.getByText('1 of 4')).toBeInTheDocument();
  });

  it('renders all slide content correctly', async () => {
    const user = userEvent.setup();
    render(
      <OnboardingCarousel onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    const expectedSlides = [
      'Welcome to Hong Kong!',
      'Earn Smile Coins',
      'Rate Your Experience',
      'Start Exploring!'
    ];

    // Check each slide
    for (let i = 0; i < expectedSlides.length; i++) {
      await waitFor(() => {
        expect(screen.getByText(expectedSlides[i])).toBeInTheDocument();
      });

      if (i < expectedSlides.length - 1) {
        const nextButton = screen.getByText('Next');
        await user.click(nextButton);
      }
    }
  });
});