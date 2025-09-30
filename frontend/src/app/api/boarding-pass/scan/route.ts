// Boarding pass scanning and coin earning endpoint

import { NextRequest, NextResponse } from 'next/server';

// Mock OCR processing delay
const OCR_PROCESSING_DELAY = 1500;

// Mock passenger names for demonstration
const MOCK_PASSENGER_NAMES = [
  'John Smith',
  'Mary Johnson', 
  'David Wilson',
  'Sarah Brown',
  'Michael Davis',
  'Lisa Anderson',
  'Robert Taylor',
  'Jennifer Martinez',
  'William Garcia',
  'Elizabeth Rodriguez'
];

// Mock flight data
const MOCK_FLIGHT_DATA = [
  { flightNumber: 'CX123', airline: 'Cathay Pacific' },
  { flightNumber: 'SQ456', airline: 'Singapore Airlines' },
  { flightNumber: 'BA789', airline: 'British Airways' },
  { flightNumber: 'EK101', airline: 'Emirates' },
  { flightNumber: 'QF202', airline: 'Qantas' },
];

// In-memory storage for scanned boarding passes (in production, use database)
const scannedBoardingPasses = new Map<string, Set<string>>();

function getRandomPassengerName(): string {
  return MOCK_PASSENGER_NAMES[Math.floor(Math.random() * MOCK_PASSENGER_NAMES.length)];
}

function getRandomFlightData() {
  return MOCK_FLIGHT_DATA[Math.floor(Math.random() * MOCK_FLIGHT_DATA.length)];
}

function generateBoardingPassId(passengerName: string, flightNumber: string, date: string): string {
  return `${passengerName.replace(/\s+/g, '')}-${flightNumber}-${date}`.toLowerCase();
}

function normalizeNameForComparison(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

function validateNameMatch(extractedName: string, registeredName: string): { isValid: boolean; confidence: number } {
  const normalizedExtracted = normalizeNameForComparison(extractedName);
  const normalizedRegistered = normalizeNameForComparison(registeredName);
  
  // Exact match
  if (normalizedExtracted === normalizedRegistered) {
    return { isValid: true, confidence: 1.0 };
  }
  
  // Check if names contain each other (for partial matches)
  const extractedWords = normalizedExtracted.split('');
  const registeredWords = normalizedRegistered.split('');
  
  // Simple similarity check - at least 80% character overlap
  const commonChars = extractedWords.filter(char => registeredWords.includes(char)).length;
  const maxLength = Math.max(extractedWords.length, registeredWords.length);
  const similarity = commonChars / maxLength;
  
  return {
    isValid: similarity >= 0.8,
    confidence: similarity
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('boardingPass') as File;
    const userId = formData.get('userId') as string;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No boarding pass file provided', code: 'MISSING_FILE' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Please upload a valid image.', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File too large. Maximum size is 5MB.', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }
    
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, OCR_PROCESSING_DELAY));
    
    // Simulate OCR failure (5% chance)
    if (Math.random() < 0.05) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Could not extract passenger information from boarding pass',
          code: 'OCR_FAILED'
        },
        { status: 422 }
      );
    }
    
    // Mock extraction of passenger name and flight info
    const extractedName = getRandomPassengerName();
    const flightData = getRandomFlightData();
    const scanDate = new Date().toISOString().split('T')[0];
    
    // Generate unique boarding pass ID
    const boardingPassId = generateBoardingPassId(extractedName, flightData.flightNumber, scanDate);
    
    // Check for duplicate boarding pass
    const userScannedPasses = scannedBoardingPasses.get(userId) || new Set();
    if (userScannedPasses.has(boardingPassId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'This boarding pass has already been scanned',
          code: 'DUPLICATE_BOARDING_PASS'
        },
        { status: 409 }
      );
    }
    
    // For demo purposes, we'll assume the extracted name matches the registered name
    // In a real implementation, you would fetch the user's registered name from the database
    const mockRegisteredName = extractedName; // This simulates a successful match
    
    // Validate name match
    const nameValidation = validateNameMatch(extractedName, mockRegisteredName);
    
    if (!nameValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Passenger name on boarding pass does not match registered name',
          code: 'NAME_MISMATCH',
          extractedName,
          confidence: nameValidation.confidence
        },
        { status: 422 }
      );
    }
    
    // Award coins (always 10 for successful boarding pass scan)
    const coinsEarned = 10;
    
    // Record the scanned boarding pass
    userScannedPasses.add(boardingPassId);
    scannedBoardingPasses.set(userId, userScannedPasses);
    
    // Create boarding pass record
    const boardingPass = {
      id: boardingPassId,
      passengerName: extractedName,
      flightNumber: flightData.flightNumber,
      airline: flightData.airline,
      date: new Date(),
      imageUrl: `boarding-pass-${boardingPassId}`, // Mock image URL
      isScanned: true,
      coinsAwarded: coinsEarned,
      scannedAt: new Date(),
      userId
    };
    
    // Create transaction record
    const transaction = {
      id: `bp-${boardingPassId}`,
      type: 'earn',
      amount: coinsEarned,
      description: `Boarding pass scan: ${flightData.flightNumber}`,
      boardingPassId,
      timestamp: new Date(),
      status: 'completed'
    };
    
    return NextResponse.json({
      success: true,
      coinsEarned,
      boardingPass,
      transaction,
      message: `Successfully scanned boarding pass! Earned ${coinsEarned} Smile Coins.`,
      nameValidation: {
        extractedName,
        confidence: nameValidation.confidence
      }
    });
    
  } catch (error) {
    console.error('Boarding pass scan error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error during boarding pass processing',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}