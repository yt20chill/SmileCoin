// Individual offer endpoint

import { NextRequest, NextResponse } from 'next/server';
import { mockData } from '@/lib/mock-data/generators';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await params;
    
    // Find offer in mock data
    const offer = mockData.offers.find(o => o.id === offerId);
    
    if (!offer) {
      return NextResponse.json(
        { message: 'Offer not found', code: 'OFFER_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    if (!offer.isActive || new Date(offer.validUntil) <= new Date()) {
      return NextResponse.json(
        { message: 'Offer is no longer available', code: 'OFFER_EXPIRED' },
        { status: 404 }
      );
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return NextResponse.json(offer);
    
  } catch (error) {
    console.error('Get offer error:', error);
    return NextResponse.json(
      { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}