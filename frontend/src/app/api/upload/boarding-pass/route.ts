// Boarding pass upload and processing endpoint

import { NextRequest, NextResponse } from 'next/server';

// Mock OCR processing delay
const OCR_PROCESSING_DELAY = 2000;

// Mock flight data for demonstration
const MOCK_FLIGHT_DATA = [
  {
    flightNumber: 'CX123',
    airline: 'Cathay Pacific',
    arrivalDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    email: null,
  },
  {
    flightNumber: 'SQ456',
    airline: 'Singapore Airlines', 
    arrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    email: 'passenger@example.com',
  },
  {
    flightNumber: 'BA789',
    airline: 'British Airways',
    arrivalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    email: null,
  },
];

function getRandomFlightData() {
  return MOCK_FLIGHT_DATA[Math.floor(Math.random() * MOCK_FLIGHT_DATA.length)];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('boardingPass') as File;
    
    if (!file) {
      return NextResponse.json(
        { message: 'No boarding pass file provided', code: 'MISSING_FILE' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Please upload a valid image.', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'File too large. Maximum size is 5MB.', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }
    
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, OCR_PROCESSING_DELAY));
    
    // Simulate OCR failure (10% chance)
    if (Math.random() < 0.1) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Could not extract flight information from boarding pass',
          code: 'OCR_FAILED'
        },
        { status: 422 }
      );
    }
    
    // Simulate successful OCR extraction
    const extractedData = getRandomFlightData();
    
    return NextResponse.json({
      success: true,
      extractedData: {
        flightNumber: extractedData.flightNumber,
        airline: extractedData.airline,
        arrivalDate: extractedData.arrivalDate.toISOString(),
        email: extractedData.email,
      },
      message: 'Boarding pass processed successfully',
    });
    
  } catch (error) {
    console.error('Boarding pass upload error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error during file processing',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}