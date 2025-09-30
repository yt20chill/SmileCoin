// Individual merchant endpoint

import { NextRequest, NextResponse } from 'next/server';
import { mockData } from '@/lib/mock-data/generators';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;
    
    // Find merchant in mock data
    const merchant = mockData.merchants.find(m => m.id === merchantId);
    
    if (!merchant) {
      return NextResponse.json(
        { message: 'Merchant not found', code: 'MERCHANT_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    if (!merchant.isActive) {
      return NextResponse.json(
        { message: 'Merchant is not currently active', code: 'MERCHANT_INACTIVE' },
        { status: 404 }
      );
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return NextResponse.json(merchant);
    
  } catch (error) {
    console.error('Get merchant error:', error);
    return NextResponse.json(
      { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}