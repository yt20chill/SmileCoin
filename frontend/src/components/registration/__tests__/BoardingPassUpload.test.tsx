import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardingPassUpload } from '../BoardingPassUpload';

describe('BoardingPassUpload', () => {
  const mockOnUpload = jest.fn();

  const defaultProps = {
    onUpload: mockOnUpload,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload area by default', () => {
    render(<BoardingPassUpload {...defaultProps} />);
    
    expect(screen.getByText('auth.uploadBoardingPass')).toBeInTheDocument();
    expect(screen.getByText('PNG, JPG, WEBP up to 5MB')).toBeInTheDocument();
  });

  it('handles file selection via input', async () => {
    const user = userEvent.setup();
    render(<BoardingPassUpload {...defaultProps} />);
    
    const file = new File(['boarding pass'], 'boarding-pass.jpg', {
      type: 'image/jpeg',
    });
    
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (hiddenInput) {
      await user.upload(hiddenInput, file);
      
      // Should show file preview
      await waitFor(() => {
        expect(screen.getByText('boarding-pass.jpg')).toBeInTheDocument();
      });
      expect(screen.getByText('Valid file')).toBeInTheDocument();
      
      // Should show process button
      const processButton = screen.getByText('Process Boarding Pass');
      expect(processButton).toBeInTheDocument();
      
      // Click process button
      await user.click(processButton);
      expect(mockOnUpload).toHaveBeenCalledWith(file);
    }
  });

  it('handles drag and drop', async () => {
    render(<BoardingPassUpload {...defaultProps} />);
    
    const file = new File(['boarding pass'], 'boarding-pass.jpg', {
      type: 'image/jpeg',
    });
    
    const dropZone = screen.getByText('auth.uploadBoardingPass').closest('div');
    
    if (dropZone) {
      // Simulate drag over
      fireEvent.dragOver(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });
      
      // Should show drag over state
      expect(screen.getByText('Drop your boarding pass here')).toBeInTheDocument();
      
      // Simulate drop
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });
      
      // Should show file preview
      await waitFor(() => {
        expect(screen.getByText('boarding-pass.jpg')).toBeInTheDocument();
      });
    }
  });

  it('validates file type and shows error for invalid files', async () => {
    const user = userEvent.setup();
    render(<BoardingPassUpload {...defaultProps} />);
    
    const file = new File(['document'], 'document.pdf', {
      type: 'application/pdf',
    });
    
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (hiddenInput) {
      await user.upload(hiddenInput, file);
      
      // Should show validation error (translation key)
      await waitFor(() => {
        expect(screen.getByText(/invalid/i)).toBeInTheDocument();
      });
      expect(mockOnUpload).not.toHaveBeenCalled();
    }
  });

  it('validates file size and shows error for large files', async () => {
    const user = userEvent.setup();
    render(<BoardingPassUpload {...defaultProps} />);
    
    // Create a large file (6MB)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (hiddenInput) {
      await user.upload(hiddenInput, largeFile);
      
      // Should show file size error (translation key)
      await waitFor(() => {
        expect(screen.getByText(/large/i)).toBeInTheDocument();
      });
      expect(mockOnUpload).not.toHaveBeenCalled();
    }
  });

  it('allows removing selected file', async () => {
    const user = userEvent.setup();
    render(<BoardingPassUpload {...defaultProps} />);
    
    const file = new File(['boarding pass'], 'boarding-pass.jpg', {
      type: 'image/jpeg',
    });
    
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (hiddenInput) {
      await user.upload(hiddenInput, file);
      
      // Should show file preview
      expect(screen.getByText('boarding-pass.jpg')).toBeInTheDocument();
      
      // Click remove button
      const removeButton = screen.getByRole('button', { name: '' }); // X button
      await user.click(removeButton);
      
      // Should return to upload state
      expect(screen.getByText('auth.uploadBoardingPass')).toBeInTheDocument();
      expect(screen.queryByText('boarding-pass.jpg')).not.toBeInTheDocument();
    }
  });

  it('displays external error message', () => {
    const errorMessage = 'Upload failed';
    render(<BoardingPassUpload {...defaultProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles drag leave event', () => {
    render(<BoardingPassUpload {...defaultProps} />);
    
    const dropZone = screen.getByText('auth.uploadBoardingPass').closest('div');
    
    if (dropZone) {
      // Simulate drag over then drag leave
      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);
      
      // Should return to normal state
      expect(screen.getByText('auth.uploadBoardingPass')).toBeInTheDocument();
    }
  });
});