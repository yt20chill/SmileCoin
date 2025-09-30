// Individual reward endpoint

import { NextRequest, NextResponse } from 'next/server';
import { mockData } from '@/lib/mock-data/generators';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const { rewardId } = await params;
    
    // Find reward in mock data
    const reward = mockData.rewards.find(r => r.id === rewardId);
    
    if (!reward) {
      return NextResponse.json(
        { message: 'Reward not found', code: 'REWARD_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    if (!reward.isAvailable) {
      return NextResponse.json(
        { message: 'Reward is no longer available', code: 'REWARD_UNAVAILABLE' },
        { status: 404 }
      );
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return NextResponse.json(reward);
    
  } catch (error) {
    console.error('Get reward error:', error);
    return NextResponse.json(
      { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}