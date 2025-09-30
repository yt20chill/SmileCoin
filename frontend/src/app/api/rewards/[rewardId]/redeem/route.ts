// Reward redemption endpoint

import { NextRequest, NextResponse } from 'next/server';
import { mockData } from '@/lib/mock-data/generators';
import type { Transaction, Voucher } from '@/lib/types';

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateVoucherCode(): string {
  return 'SMC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const { rewardId } = await params;
    const { userId } = await request.json();
    
    // Validate input
    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    
    // Check if reward exists and is available
    const reward = mockData.rewards.find(r => r.id === rewardId);
    if (!reward || !reward.isAvailable) {
      return NextResponse.json(
        { message: 'Reward not found or unavailable', code: 'REWARD_NOT_FOUND' },
        { status: 404 }
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
    
    // Rewards are now FREE - no coin balance check needed
    // This aligns with Requirement 5: rewards are free and coins are only for rating merchants
    
    // Simulate instant redemption (no blockchain needed for free rewards)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate voucher code and create voucher object
    const voucherCode = generateVoucherCode();
    const claimedAt = new Date();
    const expiresAt = new Date(claimedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const voucher = {
      id: generateId(),
      code: voucherCode,
      rewardId: reward.id,
      rewardName: reward.name,
      rewardNameZh: reward.nameZh,
      userId,
      claimedAt,
      expiresAt,
      isUsed: false,
      voucherType: reward.voucherType,
      discountPercentage: reward.discountPercentage,
      redemptionInstructions: reward.redemptionInstructions,
      redemptionInstructionsZh: reward.redemptionInstructionsZh,
    };
    
    return NextResponse.json({
      success: true,
      voucher,
      voucherCode,
      reward,
      message: 'Voucher claimed successfully! No Smile Coins required.',
      redemptionInstructions: reward.redemptionInstructions,
    });
    
  } catch (error) {
    console.error('Redeem reward error:', error);
    return NextResponse.json(
      { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}