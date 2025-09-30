// Merchant rating endpoint

import { NextRequest, NextResponse } from 'next/server';
import { mockData } from '@/lib/mock-data/generators';
import type { Transaction, Rating } from '@/lib/types';

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;
    const { userId, rating, comment, qrCodeScanned } = await request.json();
    
    // Validate input
    if (!userId || !rating || rating < 1 || rating > 3) {
      return NextResponse.json(
        { message: 'Invalid rating data. Rating must be between 1-3 coins.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate QR code
    if (!qrCodeScanned) {
      return NextResponse.json(
        { message: 'QR code scan required for rating', code: 'QR_CODE_REQUIRED' },
        { status: 400 }
      );
    }
    
    // Check if merchant exists
    const merchant = mockData.merchants.find(m => m.id === merchantId);
    if (!merchant || !merchant.isActive) {
      return NextResponse.json(
        { message: 'Merchant not found or inactive', code: 'MERCHANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate QR code matches merchant
    const expectedQRCode = `SMILE_${merchantId.toUpperCase()}_RATING_ACCESS`;
    if (qrCodeScanned !== expectedQRCode) {
      return NextResponse.json(
        { message: 'Invalid QR code for this merchant', code: 'INVALID_QR_CODE' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const user = mockData.users.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Calculate current balance
    const userTransactions = mockData.transactions.filter(t => t.status === 'completed');
    let currentBalance = 100; // Initial bonus
    
    for (const transaction of userTransactions) {
      switch (transaction.type) {
        case 'earn':
          currentBalance += transaction.amount;
          break;
        case 'spend':
        case 'expire':
          currentBalance -= transaction.amount;
          break;
      }
    }
    
    // Check if user has enough coins
    if (currentBalance < rating) {
      return NextResponse.json(
        { message: 'Insufficient Smile Coins for this rating', code: 'INSUFFICIENT_BALANCE' },
        { status: 400 }
      );
    }
    
    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate occasional blockchain errors (5% chance)
    if (Math.random() < 0.05) {
      return NextResponse.json(
        { 
          message: 'Blockchain transaction failed', 
          code: 'BLOCKCHAIN_TX_FAILED',
          transactionId: generateId()
        },
        { status: 503 }
      );
    }
    
    // Create transaction record
    const transaction: Transaction = {
      id: generateId(),
      type: 'spend',
      amount: rating,
      description: `Rated ${merchant.name}`,
      merchantId,
      timestamp: new Date(),
      status: 'completed',
    };
    
    // Create rating record
    const ratingRecord: Rating = {
      id: generateId(),
      userId,
      merchantId,
      coinsSpent: rating,
      comment,
      qrCodeScanned,
      timestamp: new Date(),
    };
    
    // Add to mock data
    mockData.transactions.push(transaction);
    mockData.ratings.push(ratingRecord);
    
    // Update merchant rating (simplified calculation)
    const merchantRatings = mockData.ratings.filter(r => r.merchantId === merchantId);
    const avgRating = merchantRatings.reduce((sum, r) => sum + r.coinsSpent, 0) / merchantRatings.length;
    merchant.rating = Math.round(avgRating * 10) / 10;
    merchant.totalRatings = merchantRatings.length;
    
    const newBalance = currentBalance - rating;
    
    return NextResponse.json({
      success: true,
      newBalance,
      transaction,
      rating: ratingRecord,
      message: 'Rating submitted successfully',
    });
    
  } catch (error) {
    console.error('Rate merchant error:', error);
    return NextResponse.json(
      { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}