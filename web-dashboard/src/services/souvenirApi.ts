import { SouvenirProgress, DailyProgress, SouvenirVoucher, DailyCoinDistribution } from '../types/souvenir';

// Mock API service for souvenir progress
// This will be replaced with real API calls when backend is implemented

export class SouvenirProgressService {
  static async getProgress(): Promise<SouvenirProgress> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock data for demo
    const mockDailyHistory: DailyProgress[] = [
      { date: '2024-01-01', coinsReceived: 10, coinsGiven: 10, allCoinsGiven: true, restaurantsVisited: ['restaurant-1', 'restaurant-2'], completedDaily: true },
      { date: '2024-01-02', coinsReceived: 10, coinsGiven: 10, allCoinsGiven: true, restaurantsVisited: ['restaurant-3'], completedDaily: true },
      { date: '2024-01-03', coinsReceived: 10, coinsGiven: 10, allCoinsGiven: true, restaurantsVisited: ['restaurant-1', 'restaurant-4'], completedDaily: true },
      { date: '2024-01-04', coinsReceived: 10, coinsGiven: 10, allCoinsGiven: true, restaurantsVisited: ['restaurant-2'], completedDaily: true },
      { date: '2024-01-05', coinsReceived: 10, coinsGiven: 10, allCoinsGiven: true, restaurantsVisited: ['restaurant-5'], completedDaily: true },
      { date: '2024-01-06', coinsReceived: 10, coinsGiven: 10, allCoinsGiven: true, restaurantsVisited: ['restaurant-3', 'restaurant-1'], completedDaily: true },
      { date: '2024-01-07', coinsReceived: 10, coinsGiven: 10, allCoinsGiven: true, restaurantsVisited: ['restaurant-4'], completedDaily: true },
      { date: '2024-01-08', coinsReceived: 10, coinsGiven: 7, allCoinsGiven: false, restaurantsVisited: ['restaurant-2'], completedDaily: false },
      { date: '2024-01-09', coinsReceived: 10, coinsGiven: 8, allCoinsGiven: false, restaurantsVisited: ['restaurant-1'], completedDaily: false },
      { date: '2024-01-10', coinsReceived: 10, coinsGiven: 10, allCoinsGiven: true, restaurantsVisited: ['restaurant-3', 'restaurant-5'], completedDaily: true },
    ];

    const completedDays = mockDailyHistory.filter(day => day.completedDaily);
    const totalDaysCompleted = completedDays.length;
    const daysRemaining = Math.max(0, 7 - totalDaysCompleted);
    const isEligible = totalDaysCompleted >= 7;

    const mockProgress: SouvenirProgress = {
      userId: 'demo-user-123',
      totalDaysCompleted,
      consecutiveDays: 7,
      currentStreak: 1, // Current consecutive streak
      longestStreak: 7, // Longest streak ever
      daysRemaining,
      isEligible,
      voucherGenerated: isEligible,
      voucherCode: isEligible ? 'SC-A1B2C3D4E5F6' : undefined,
      voucherQRCode: isEligible ? 'mock-qr-code-data' : undefined,
      dailyHistory: mockDailyHistory,
      milestones: [
        {
          days: 1,
          title: 'First Steps',
          description: 'Complete your first day of giving all coins',
          reward: 'Digital Badge',
          achieved: totalDaysCompleted >= 1,
          achievedDate: totalDaysCompleted >= 1 ? '2024-01-01' : undefined
        },
        {
          days: 3,
          title: 'Getting Started',
          description: 'Complete 3 days of giving all coins',
          reward: 'Progress Boost',
          achieved: totalDaysCompleted >= 3,
          achievedDate: totalDaysCompleted >= 3 ? '2024-01-03' : undefined
        },
        {
          days: 5,
          title: 'Halfway There',
          description: 'Complete 5 days of giving all coins',
          reward: 'Special Recognition',
          achieved: totalDaysCompleted >= 5,
          achievedDate: totalDaysCompleted >= 5 ? '2024-01-05' : undefined
        },
        {
          days: 7,
          title: 'Physical Coin Earned!',
          description: 'Complete 7 days of giving all coins',
          reward: 'Physical SmileCoin Souvenir',
          achieved: totalDaysCompleted >= 7,
          achievedDate: totalDaysCompleted >= 7 ? '2024-01-07' : undefined
        },
        {
          days: 10,
          title: 'Super Tourist',
          description: 'Complete 10 days of giving all coins',
          reward: 'Premium Souvenir Package',
          achieved: totalDaysCompleted >= 10,
          achievedDate: totalDaysCompleted >= 10 ? '2024-01-10' : undefined
        }
      ]
    };

    return mockProgress;
  }

  static async trackDailyActivity(
    date: string,
    coinsReceived: number,
    coinsGiven: number,
    restaurantsVisited: string[]
  ): Promise<DailyProgress> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const allCoinsGiven = coinsGiven >= coinsReceived;
    const completedDaily = allCoinsGiven && coinsGiven > 0;

    return {
      date,
      coinsReceived,
      coinsGiven,
      allCoinsGiven,
      restaurantsVisited,
      completedDaily
    };
  }

  static async getDailyCoinDistribution(date: string): Promise<DailyCoinDistribution> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock logic - user can receive coins once per day
    const today = new Date().toDateString();
    const requestDate = new Date(date).toDateString();
    const canReceiveCoins = requestDate === today;

    return {
      coinsReceived: canReceiveCoins ? 10 : 0,
      distributionTime: canReceiveCoins ? new Date().toISOString() : '',
      canReceiveCoins
    };
  }

  static async generateVoucher(
    userName: string,
    userOrigin: string,
    daysCompleted: number
  ): Promise<SouvenirVoucher> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const voucherCode = 'SC-' + Math.random().toString(36).substring(2, 14).toUpperCase();
    const generatedDate = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    return {
      voucherCode,
      userId: 'demo-user-123',
      userName,
      userOrigin,
      daysCompleted,
      generatedDate,
      expiryDate,
      qrCodeData: JSON.stringify({ voucherCode, type: 'physical_coin_souvenir' }),
      isRedeemed: false,
      collectionLocation: 'Hong Kong Tourism Board Office, Central'
    };
  }

  static async redeemVoucher(voucherCode: string): Promise<{
    success: boolean;
    voucher?: SouvenirVoucher;
    message: string;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Mock validation
    if (!voucherCode.startsWith('SC-')) {
      return {
        success: false,
        message: 'Invalid voucher code format'
      };
    }

    // Mock voucher data
    const mockVoucher: SouvenirVoucher = {
      voucherCode,
      userId: 'demo-user-123',
      userName: 'Demo Tourist',
      userOrigin: 'United States',
      daysCompleted: 7,
      generatedDate: '2024-01-07T00:00:00Z',
      expiryDate: '2024-02-07T00:00:00Z',
      qrCodeData: JSON.stringify({ voucherCode, type: 'physical_coin_souvenir' }),
      isRedeemed: false,
      collectionLocation: 'Hong Kong Tourism Board Office, Central'
    };

    return {
      success: true,
      voucher: mockVoucher,
      message: 'Voucher is valid and ready for redemption'
    };
  }
}