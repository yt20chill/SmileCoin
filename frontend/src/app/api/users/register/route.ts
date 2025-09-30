// User registration endpoint

import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/lib/types';

// Mock blockchain service delay
const BLOCKCHAIN_DELAY = 1000;

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateWalletAddress(): string {
  return '0x' + Math.random().toString(16).substring(2, 42);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.preferredLanguage) {
      return NextResponse.json(
        { message: 'Preferred language is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    
    // Simulate blockchain interaction delay
    await new Promise(resolve => setTimeout(resolve, BLOCKCHAIN_DELAY));
    
    // Simulate occasional blockchain errors (5% chance)
    if (Math.random() < 0.05) {
      return NextResponse.json(
        { 
          message: 'Blockchain service temporarily unavailable', 
          code: 'BLOCKCHAIN_UNAVAILABLE',
          transactionId: generateId()
        },
        { status: 503 }
      );
    }
    
    // Create new user
    const user: User = {
      id: generateId(),
      email: body.email,
      fullName: body.fullName || 'Tourist User', // Default name if not provided
      flightNumber: body.flightNumber,
      arrivalDate: body.arrivalDate ? new Date(body.arrivalDate) : new Date(),
      walletAddress: generateWalletAddress(),
      preferredLanguage: body.preferredLanguage,
      registrationMethod: body.registrationMethod || 'manual',
      scannedBoardingPasses: [], // Initialize empty array
      createdAt: new Date(),
    };
    
    // Initial coin bonus for registration
    const initialCoins = 100;
    
    return NextResponse.json({
      user,
      initialCoins,
      message: 'Registration successful',
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}