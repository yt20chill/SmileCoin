// Wallet balance endpoint

import { NextRequest, NextResponse } from 'next/server';
import { mockData } from '@/lib/mock-data/generators';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Check if user exists
    const user = mockData.users.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Calculate balance from transactions
    const userTransactions = mockData.transactions.filter(t => 
      t.status === 'completed'
    );
    
    let balance = 100; // Initial registration bonus
    
    for (const transaction of userTransactions) {
      switch (transaction.type) {
        case 'earn':
          balance += transaction.amount;
          break;
        case 'spend':
        case 'expire':
          balance -= transaction.amount;
          break;
      }
    }
    
    // Ensure balance doesn't go negative
    balance = Math.max(0, balance);
    
    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate occasional blockchain errors (3% chance)
    if (Math.random() < 0.03) {
      return NextResponse.json(
        { 
          message: 'Unable to fetch balance from blockchain', 
          code: 'BLOCKCHAIN_ERROR',
          transactionId: `tx_${Date.now()}`
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json({
      balance,
      lastUpdated: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Get balance error:', error);
    return NextResponse.json(
      { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}