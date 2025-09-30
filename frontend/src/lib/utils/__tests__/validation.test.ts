import {
  isValidEmail,
  isValidFlightNumber,
  isValidImageFile,
  validateRegistrationData,
  validateBoardingPassFile,
  validateBoardingPassName,
  validateBoardingPassDuplicate,
} from '../validation';

describe('Validation Functions', () => {
  describe('isValidEmail', () => {
    it('validates correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test.example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidFlightNumber', () => {
    it('validates correct flight numbers', () => {
      expect(isValidFlightNumber('CX123')).toBe(true);
      expect(isValidFlightNumber('BA456')).toBe(true);
      expect(isValidFlightNumber('SQ1234')).toBe(true);
      expect(isValidFlightNumber('AA1')).toBe(true);
    });

    it('rejects invalid flight numbers', () => {
      expect(isValidFlightNumber('123')).toBe(false);
      expect(isValidFlightNumber('ABCD123')).toBe(false);
      expect(isValidFlightNumber('CX')).toBe(false);
      expect(isValidFlightNumber('CX12345')).toBe(false);
      expect(isValidFlightNumber('')).toBe(false);
    });
  });

  describe('isValidImageFile', () => {
    it('validates correct image files', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(jpegFile, 'size', { value: 1024 * 1024 }); // 1MB
      expect(isValidImageFile(jpegFile)).toBe(true);

      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(pngFile, 'size', { value: 2 * 1024 * 1024 }); // 2MB
      expect(isValidImageFile(pngFile)).toBe(true);

      const webpFile = new File([''], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(webpFile, 'size', { value: 3 * 1024 * 1024 }); // 3MB
      expect(isValidImageFile(webpFile)).toBe(true);
    });

    it('rejects files with invalid types', () => {
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(pdfFile, 'size', { value: 1024 * 1024 });
      expect(isValidImageFile(pdfFile)).toBe(false);

      const txtFile = new File([''], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(txtFile, 'size', { value: 1024 });
      expect(isValidImageFile(txtFile)).toBe(false);
    });

    it('rejects files that are too large', () => {
      const largeFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB
      expect(isValidImageFile(largeFile)).toBe(false);
    });
  });

  describe('validateRegistrationData', () => {
    const validData = {
      flightNumber: 'CX123',
      arrivalDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      email: 'test@example.com',
      preferredLanguage: 'en' as const,
    };

    it('validates correct registration data', () => {
      const result = validateRegistrationData(validData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('validates data without optional email', () => {
      const dataWithoutEmail = { ...validData };
      delete dataWithoutEmail.email;
      
      const result = validateRegistrationData(dataWithoutEmail);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('rejects missing flight number', () => {
      const invalidData = { ...validData, flightNumber: '' };
      const result = validateRegistrationData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.flightNumber).toBe('Flight number is required');
    });

    it('rejects invalid flight number format', () => {
      const invalidData = { ...validData, flightNumber: 'INVALID' };
      const result = validateRegistrationData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.flightNumber).toBe('Invalid flight number format');
    });

    it('rejects missing arrival date', () => {
      const invalidData = { ...validData };
      delete invalidData.arrivalDate;
      
      const result = validateRegistrationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.arrivalDate).toBe('Arrival date is required');
    });

    it('rejects past arrival date', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const invalidData = { ...validData, arrivalDate: pastDate };
      
      const result = validateRegistrationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.arrivalDate).toBe('Arrival date cannot be in the past');
    });

    it('rejects invalid email format', () => {
      const invalidData = { ...validData, email: 'invalid-email' };
      const result = validateRegistrationData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Please enter a valid email address');
    });

    it('rejects invalid language', () => {
      const invalidData = { ...validData, preferredLanguage: 'invalid' };
      const result = validateRegistrationData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.preferredLanguage).toBe('Invalid language selection');
    });

    it('handles string date format', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dataWithStringDate = {
        ...validData,
        arrivalDate: tomorrow.toISOString(),
      };
      
      const result = validateRegistrationData(dataWithStringDate);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateBoardingPassFile', () => {
    it('validates correct boarding pass files', () => {
      const jpegFile = new File([''], 'boarding-pass.jpg', { type: 'image/jpeg' });
      Object.defineProperty(jpegFile, 'size', { value: 2 * 1024 * 1024 }); // 2MB
      
      const result = validateBoardingPassFile(jpegFile);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects files with invalid type', () => {
      const pdfFile = new File([''], 'boarding-pass.pdf', { type: 'application/pdf' });
      Object.defineProperty(pdfFile, 'size', { value: 1024 * 1024 });
      
      const result = validateBoardingPassFile(pdfFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
    });

    it('rejects files that are too large', () => {
      const largeFile = new File([''], 'boarding-pass.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB
      
      const result = validateBoardingPassFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File too large. Maximum size is 5MB.');
    });
  });

  describe('validateBoardingPassName', () => {
    it('validates exact name matches', () => {
      const result = validateBoardingPassName('John Smith', 'John Smith');
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.error).toBeUndefined();
    });

    it('validates case-insensitive matches', () => {
      const result = validateBoardingPassName('JOHN SMITH', 'john smith');
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it('validates names with punctuation differences', () => {
      const result = validateBoardingPassName('John-Smith', 'John Smith');
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it('validates similar names with high confidence', () => {
      const result = validateBoardingPassName('Jon Smith', 'John Smith');
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('validates names with exact word matches', () => {
      const result = validateBoardingPassName('John Michael Smith', 'John Smith');
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('rejects completely different names', () => {
      const result = validateBoardingPassName('John Smith', 'Mary Johnson');
      expect(result.isValid).toBe(false);
      expect(result.confidence).toBeLessThan(0.8);
      expect(result.error).toBe('Passenger name does not match registered name');
    });

    it('rejects names with low similarity', () => {
      const result = validateBoardingPassName('Alexander', 'Smith');
      expect(result.isValid).toBe(false);
      expect(result.confidence).toBeLessThan(0.8);
    });

    it('handles empty names', () => {
      const result = validateBoardingPassName('', 'John Smith');
      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.error).toBe('Both names are required for validation');
    });

    it('handles missing registered name', () => {
      const result = validateBoardingPassName('John Smith', '');
      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.error).toBe('Both names are required for validation');
    });

    it('calculates confidence correctly for partial matches', () => {
      const result = validateBoardingPassName('John', 'Johnson');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(1);
    });
  });

  describe('validateBoardingPassDuplicate', () => {
    it('validates new boarding pass ID', () => {
      const scannedPasses = ['bp-1', 'bp-2', 'bp-3'];
      const result = validateBoardingPassDuplicate('bp-4', scannedPasses);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects duplicate boarding pass ID', () => {
      const scannedPasses = ['bp-1', 'bp-2', 'bp-3'];
      const result = validateBoardingPassDuplicate('bp-2', scannedPasses);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This boarding pass has already been scanned');
    });

    it('validates against empty scanned passes list', () => {
      const result = validateBoardingPassDuplicate('bp-1', []);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('handles case-sensitive boarding pass IDs', () => {
      const scannedPasses = ['BP-1', 'bp-2'];
      const result = validateBoardingPassDuplicate('bp-1', scannedPasses);
      
      expect(result.isValid).toBe(true); // Different case should be treated as different ID
    });
  });
});