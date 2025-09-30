// Rewards listing endpoint

import { NextRequest, NextResponse } from 'next/server';
import { mockData } from '@/lib/mock-data/generators';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let rewards = [...mockData.rewards].filter(r => r.isAvailable);
    
    // Filter by category if provided
    if (category) {
      rewards = rewards.filter(r => r.category === category);
    }
    
    // Sort by category and name
    rewards.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 350));
    
    return NextResponse.json(rewards);
    
  } catch (error) {
    console.error('Get rewards error:', error);
    return NextResponse.json(
      { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}