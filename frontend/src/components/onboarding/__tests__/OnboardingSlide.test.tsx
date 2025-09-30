import { render, screen } from '@testing-library/react';
import { OnboardingSlide } from '../OnboardingSlide';
import { OnboardingSlide as OnboardingSlideType } from '@/lib/types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>
    }
}));

// Mock OnboardingAnimation component
jest.mock('../OnboardingAnimation', () => ({
    OnboardingAnimation: ({ type, demoData }: any) => (
        <div data-testid="onboarding-animation" data-type={type}>
            {demoData && <span data-testid="demo-data">{JSON.stringify(demoData)}</span>}
        </div>
    )
}));

describe('OnboardingSlide', () => {
    const mockSlide: OnboardingSlideType = {
        id: 'test-slide',
        title: 'Test Slide Title',
        titleZh: 'Test Slide Title ZH',
        description: 'This is a test slide description',
        descriptionZh: 'This is a test slide description ZH',
        icon: '🎉',
        animation: 'earn',
        demoData: {
            coins: 100,
            merchantName: 'Test Merchant'
        }
    };

    const defaultProps = {
        slide: mockSlide,
        isActive: true,
        onNext: jest.fn(),
        onPrevious: jest.fn(),
        onSkip: jest.fn(),
        currentSlide: 1,
        totalSlides: 5
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders slide content correctly', () => {
        render(<OnboardingSlide {...defaultProps} />);

        expect(screen.getByText('Test Slide Title')).toBeInTheDocument();
        expect(screen.getByText('This is a test slide description')).toBeInTheDocument();
        expect(screen.getByText('🎉')).toBeInTheDocument();
        expect(screen.getByText('1 of 5')).toBeInTheDocument();
    });

    it('renders animation when slide is active', () => {
        render(<OnboardingSlide {...defaultProps} />);

        const animation = screen.getByTestId('onboarding-animation');
        expect(animation).toBeInTheDocument();
        expect(animation).toHaveAttribute('data-type', 'earn');
    });

    it('does not render animation when slide is not active', () => {
        render(<OnboardingSlide {...defaultProps} isActive={false} />);

        expect(screen.queryByTestId('onboarding-animation')).not.toBeInTheDocument();
    });

    it('displays demo data when provided', () => {
        render(<OnboardingSlide {...defaultProps} />);

        expect(screen.getByText('100 Smile Coins')).toBeInTheDocument();
        expect(screen.getByText('Rating: Test Merchant')).toBeInTheDocument();
    });

    it('does not display demo data section when no demo data provided', () => {
        const slideWithoutDemo: OnboardingSlideType = {
            ...mockSlide,
            demoData: undefined
        };

        render(<OnboardingSlide {...defaultProps} slide={slideWithoutDemo} />);

        expect(screen.queryByText('Smile Coins')).not.toBeInTheDocument();
    });

    it('displays correct slide counter', () => {
        render(<OnboardingSlide {...defaultProps} currentSlide={3} totalSlides={5} />);

        expect(screen.getByText('3 of 5')).toBeInTheDocument();
    });

    it('renders slide without demo data correctly', () => {
        const simpleSlide: OnboardingSlideType = {
            id: 'simple-slide',
            title: 'Simple Slide',
            titleZh: 'Simple Slide ZH',
            description: 'Simple description',
            descriptionZh: 'Simple description ZH',
            icon: '🚀',
            animation: 'browse'
        };

        render(<OnboardingSlide {...defaultProps} slide={simpleSlide} />);

        expect(screen.getByText('Simple Slide')).toBeInTheDocument();
        expect(screen.getByText('Simple description')).toBeInTheDocument();
        expect(screen.getByText('🚀')).toBeInTheDocument();
        expect(screen.queryByText('Smile Coins')).not.toBeInTheDocument();
    });

    it('passes correct animation type to OnboardingAnimation', () => {
        const spendSlide: OnboardingSlideType = {
            ...mockSlide,
            animation: 'spend'
        };

        render(<OnboardingSlide {...defaultProps} slide={spendSlide} />);

        const animation = screen.getByTestId('onboarding-animation');
        expect(animation).toHaveAttribute('data-type', 'spend');
    });

    it('passes demo data to OnboardingAnimation', () => {
        render(<OnboardingSlide {...defaultProps} />);

        const demoData = screen.getByTestId('demo-data');
        expect(demoData).toHaveTextContent(JSON.stringify(mockSlide.demoData));
    });
});