// Validation utility functions

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidFlightNumber(flightNumber: string): boolean {
  // Basic flight number validation (2-3 letters followed by 1-4 digits)
  const flightRegex = /^[A-Z]{2,3}\d{1,4}$/i;
  return flightRegex.test(flightNumber);
}

export function isValidImageFile(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  return allowedTypes.includes(file.type) && file.size <= maxSize;
}

export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 3;
}

export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function isValidLanguage(lang: string): lang is 'en' | 'zh-TW' {
  return ['en', 'zh-TW'].includes(lang);
}

export function validateTransactionAmount(amount: number, balance: number): {
  isValid: boolean;
  error?: string;
} {
  if (amount <= 0) {
    return { isValid: false, error: 'Amount must be positive' };
  }
  
  if (amount > balance) {
    return { isValid: false, error: 'Insufficient balance' };
  }
  
  return { isValid: true };
}

export function validateRedemption(coinsRequired: number, userBalance: number): {
  isValid: boolean;
  error?: string;
} {
  if (coinsRequired <= 0) {
    return { isValid: false, error: 'Invalid reward' };
  }
  
  if (userBalance < coinsRequired) {
    const shortfall = coinsRequired - userBalance;
    return { 
      isValid: false, 
      error: `Need ${shortfall} more coins to redeem this reward` 
    };
  }
  
  return { isValid: true };
}

export function validateRegistrationData(data: {
  flightNumber?: string;
  arrivalDate?: Date | string;
  email?: string;
  preferredLanguage?: string;
}): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Flight number validation
  if (!data.flightNumber?.trim()) {
    errors.flightNumber = 'Flight number is required';
  } else if (!isValidFlightNumber(data.flightNumber)) {
    errors.flightNumber = 'Invalid flight number format';
  }

  // Arrival date validation
  if (!data.arrivalDate) {
    errors.arrivalDate = 'Arrival date is required';
  } else {
    const arrivalDate = typeof data.arrivalDate === 'string' 
      ? new Date(data.arrivalDate) 
      : data.arrivalDate;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (arrivalDate < today) {
      errors.arrivalDate = 'Arrival date cannot be in the past';
    }
  }

  // Email validation (optional but must be valid if provided)
  if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Language validation
  if (data.preferredLanguage && !isValidLanguage(data.preferredLanguage)) {
    errors.preferredLanguage = 'Invalid language selection';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateBoardingPassFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File too large. Maximum size is 5MB.',
    };
  }

  return { isValid: true };
}

export function validateBoardingPassName(extractedName: string, registeredName: string): {
  isValid: boolean;
  confidence: number;
  error?: string;
} {
  if (!extractedName || !registeredName) {
    return {
      isValid: false,
      confidence: 0,
      error: 'Both names are required for validation'
    };
  }

  // Normalize names for comparison
  const normalizeForComparison = (name: string) => 
    name.toLowerCase().replace(/[^a-z]/g, '');

  const normalizedExtracted = normalizeForComparison(extractedName);
  const normalizedRegistered = normalizeForComparison(registeredName);

  // Exact match
  if (normalizedExtracted === normalizedRegistered) {
    return { isValid: true, confidence: 1.0 };
  }

  // Calculate similarity using Levenshtein distance
  const calculateSimilarity = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1.0 : 1 - (distance / maxLength);
  };

  const similarity = calculateSimilarity(normalizedExtracted, normalizedRegistered);

  // Check for exact word matches
  const extractedWords = extractedName.toLowerCase().split(/\s+/);
  const registeredWords = registeredName.toLowerCase().split(/\s+/);
  const hasExactWordMatch = extractedWords.some(word => 
    registeredWords.some(regWord => word === regWord && word.length > 2)
  );

  // Boost confidence if there's an exact word match
  const finalConfidence = hasExactWordMatch ? Math.max(similarity, 0.85) : similarity;
  const isValid = finalConfidence >= 0.8;

  return {
    isValid,
    confidence: finalConfidence,
    error: isValid ? undefined : 'Passenger name does not match registered name'
  };
}

export function validateBoardingPassDuplicate(
  boardingPassId: string, 
  scannedPasses: string[]
): {
  isValid: boolean;
  error?: string;
} {
  if (scannedPasses.includes(boardingPassId)) {
    return {
      isValid: false,
      error: 'This boarding pass has already been scanned'
    };
  }

  return { isValid: true };
}