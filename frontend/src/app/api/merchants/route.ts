// Merchants listing endpoint

import { NextRequest, NextResponse } from 'next/server';
import { mockData } from '@/lib/mock-data/generators';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    
    let merchants = [...mockData.merchants].filter(m => m.isActive);
    
    // Filter by category if provided
    if (category) {
      merchants = merchants.filter(m => 
        m.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // Filter by location if provided (simple text search)
    if (location) {
      merchants = merchants.filter(m => 
        m.location.address.toLowerCase().includes(location.toLowerCase()) ||
        m.location.addressZh.includes(location)
      );
    }
    
    // Sort by rating (highest first)
    merchants.sort((a, b) => b.rating - a.rating);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return NextResponse.json(merchants);
    
  } catch (error) {
    console.error('Get merchants error:', error);
    return NextResponse.json(
      { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}