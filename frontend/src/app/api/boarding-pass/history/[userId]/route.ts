// Boarding pass scanning history endpoint

import { NextRequest, NextResponse } from 'next/server';

// Mock boarding pass history data
const mockBoardingPassHistory = new Map<string, any[]>();

// Initialize with some mock data
mockBoardingPassHistory.set('user-1', [
  {
    id: 'johnsmith-cx123-2024-01-15',
    passengerName: 'John Smith',
    flightNumber: 'CX123',
    airline: 'Cathay Pacific',
    date: new Date('2024-01-15'),
    imageUrl: 'boarding-pass-johnsmith-cx123-2024-01-15',
    isScanned: true,
    coinsAwarded: 10,
    scannedAt: new Date('2024-01-15T10:30:00Z'),
    userId: 'user-1'
  },
  {
    id: 'johnsmith-sq456-2024-01-10',
    passengerName: 'John Smith',
    flightNumber: 'SQ456',
    airline: 'Singapore Airlines',
    date: new Date('2024-01-10'),
    imageUrl: 'boarding-pass-johnsmith-sq456-2024-01-10',
    isScanned: true,
    coinsAwarded: 10,
    scannedAt: new Date('2024-01-10T14:20:00Z'),
    userId: 'user-1'
  }
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }
    
    // Get boarding pass history for user
    const userHistory = mockBoardingPassHistory.get(userId) || [];
    
    // Sort by scan date (most recent first)
    const sortedHistory = userHistory.sort((a, b) => 
      new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
    );
    
    // Calculate total coins earned from boarding passes
    const totalCoinsEarned = userHistory.reduce((total, bp) => total + bp.coinsAwarded, 0);
    
    return NextResponse.json({
      success: true,
      boardingPasses: sortedHistory,
      totalScanned: userHistory.length,
      totalCoinsEarned,
      message: `Retrieved ${userHistory.length} boarding pass records`
    });
    
  } catch (error) {
    console.error('Boarding pass history error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error while retrieving boarding pass history',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}