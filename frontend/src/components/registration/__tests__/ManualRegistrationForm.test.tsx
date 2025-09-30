import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualRegistrationForm } from '../ManualRegistrationForm';

describe('ManualRegistrationForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnBack = jest.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onBack: mockOnBack,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<ManualRegistrationForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/auth\.flightNumber/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth\.arrivalDate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth\.email/i)).toBeInTheDocument();
    expect(screen.getByText('Preferred Language')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  it('handles form submission with valid data', async () => {
    const user = userEvent.setup();
    render(<ManualRegistrationForm {...defaultProps} />);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/auth\.flightNumber/i), 'CX123');
    
    const dateInput = screen.getByLabelText(/auth\.arrivalDate/i);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    await user.type(dateInput, tomorrowString);
    
    await user.type(screen.getByLabelText(/auth\.email/i), 'test@example.com');
    
    // Submit form
    const registerButton = screen.getByText('auth.register');
    await user.click(registerButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        flightNumber: 'CX123',
        arrivalDate: expect.any(Date),
        email: 'test@example.com',
        preferredLanguage: 'en',
      });
    });
  });

  it('validates required fields and shows errors', async () => {
    const user = userEvent.setup();
    render(<ManualRegistrationForm {...defaultProps} />);
    
    // Try to submit empty form
    const registerButton = screen.getByText('auth.register');
    await user.click(registerButton);
    
    // Should show validation errors
    expect(screen.getByText('Flight number is required')).toBeInTheDocument();
    expect(screen.getByText('Arrival date is required')).toBeInTheDocument();
  });

  it('validates flight number format', async () => {
    const user = userEvent.setup();
    render(<ManualRegistrationForm {...defaultProps} />);
    
    // Enter invalid flight number
    await user.type(screen.getByLabelText(/auth\.flightNumber/i), 'INVALID');
    
    // Submit form
    const registerButton = screen.getByText('auth.register');
    await user.click(registerButton);
    
    expect(screen.getByText('errors.invalidFlightNumber')).toBeInTheDocument();
  });

  it('validates arrival date is not in the past', async () => {
    const user = userEvent.setup();
    render(<ManualRegistrationForm {...defaultProps} />);
    
    // Fill required flight number
    await user.type(screen.getByLabelText(/auth\.flightNumber/i), 'CX123');
    
    // Enter past date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    const dateInput = screen.getByLabelText(/auth\.arrivalDate/i);
    await user.type(dateInput, yesterdayString);
    
    // Submit form
    const registerButton = screen.getByText('auth.register');
    await user.click(registerButton);
    
    expect(screen.getByText('Arrival date cannot be in the past')).toBeInTheDocument();
  });

  it('validates email format when provided', async () => {
    const user = userEvent.setup();
    render(<ManualRegistrationForm {...defaultProps} />);
    
    // Fill required fields
    await user.type(screen.getByLabelText(/auth\.flightNumber/i), 'CX123');
    
    const dateInput = screen.getByLabelText(/auth\.arrivalDate/i);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    await user.type(dateInput, tomorrowString);
    
    // Enter invalid email
    await user.type(screen.getByLabelText(/auth\.email/i), 'invalid-email');
    
    // Submit form
    const registerButton = screen.getByText('auth.register');
    await user.click(registerButton);
    
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('allows email to be optional', async () => {
    const user = userEvent.setup();
    render(<ManualRegistrationForm {...defaultProps} />);
    
    // Fill only required fields
    await user.type(screen.getByLabelText(/auth\.flightNumber/i), 'CX123');
    
    const dateInput = screen.getByLabelText(/auth\.arrivalDate/i);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    await user.type(dateInput, tomorrowString);
    
    // Submit form without email
    const registerButton = screen.getByText('auth.register');
    await user.click(registerButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        flightNumber: 'CX123',
        arrivalDate: expect.any(Date),
        email: undefined,
        preferredLanguage: 'en',
      });
    });
  });

  it('handles language selection', async () => {
    const user = userEvent.setup();
    render(<ManualRegistrationForm {...defaultProps} />);
    
    // Select Chinese language
    const chineseButton = screen.getByText('中文');
    await user.click(chineseButton);
    
    // Fill required fields
    await user.type(screen.getByLabelText(/auth\.flightNumber/i), 'CX123');
    
    const dateInput = screen.getByLabelText(/auth\.arrivalDate/i);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    await user.type(dateInput, tomorrowString);
    
    // Submit form
    const registerButton = screen.getByText('auth.register');
    await user.click(registerButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        flightNumber: 'CX123',
        arrivalDate: expect.any(Date),
        email: undefined,
        preferredLanguage: 'zh-TW',
      });
    });
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<ManualRegistrationForm {...defaultProps} />);
    
    const backButton = screen.getByText('common.back');
    await user.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('clears field errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<ManualRegistrationForm {...defaultProps} />);
    
    // Submit empty form to trigger errors
    const registerButton = screen.getByText('auth.register');
    await user.click(registerButton);
    
    // Should show error
    expect(screen.getByText('Flight number is required')).toBeInTheDocument();
    
    // Start typing in flight number field
    await user.type(screen.getByLabelText(/auth\.flightNumber/i), 'C');
    
    // Error should be cleared
    expect(screen.queryByText('Flight number is required')).not.toBeInTheDocument();
  });

  it('converts flight number to uppercase', async () => {
    const user = userEvent.setup();
    render(<ManualRegistrationForm {...defaultProps} />);
    
    // Fill form with lowercase flight number
    await user.type(screen.getByLabelText(/auth\.flightNumber/i), 'cx123');
    
    const dateInput = screen.getByLabelText(/auth\.arrivalDate/i);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    await user.type(dateInput, tomorrowString);
    
    // Submit form
    const registerButton = screen.getByText('auth.register');
    await user.click(registerButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        flightNumber: 'CX123', // Should be uppercase
        arrivalDate: expect.any(Date),
        email: undefined,
        preferredLanguage: 'en',
      });
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    
    // Mock onSubmit to be slow
    const slowOnSubmit = jest.fn().mockImplementation(() => {
      return new Promise(resolve => setTimeout(resolve, 100));
    });
    
    render(<ManualRegistrationForm {...defaultProps} onSubmit={slowOnSubmit} />);
    
    // Fill form
    await user.type(screen.getByLabelText(/auth\.flightNumber/i), 'CX123');
    
    const dateInput = screen.getByLabelText(/auth\.arrivalDate/i);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    await user.type(dateInput, tomorrowString);
    
    // Submit form
    const registerButton = screen.getByText('auth.register');
    await user.click(registerButton);
    
    // Form should be disabled during submission
    expect(screen.getByText('Registering...')).toBeInTheDocument();
    expect(screen.getByLabelText(/auth\.flightNumber/i)).toBeDisabled();
    expect(screen.getByLabelText(/auth\.arrivalDate/i)).toBeDisabled();
  });
});