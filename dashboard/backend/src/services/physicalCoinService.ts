import crypto from 'crypto';

export interface DailyProgress {
  date: string;
  coinsReceived: number;
  coinsGiven: number;
  allCoinsGiven: boolean;
  restaurantsVisited: string[];
  completedDaily: boolean;
}

export interface SouvenirProgress {
  userId: string;
  totalDaysCompleted: number;
  consecutiveDays: number;
  currentStreak: number;
  longestStreak: number;
  daysRemaining: number;
  isEligible: boolean;
  voucherGenerated: boolean;
  voucherCode?: string;
  voucherQRCode?: string;
  dailyHistory: DailyProgress[];
  milestones: SouvenirMilestone[];
}

export interface SouvenirMilestone {
  days: number;
  title: string;
  description: string;
  reward: string;
  achieved: boolean;
  achievedDate?: string;
}

export interface SouvenirVoucher {
  voucherCode: string;
  userId: string;
  userName: string;
  userOrigin: string;
  daysCompleted: number;
  generatedDate: string;
  expiryDate: string;
  qrCodeData: string;
  isRedeemed: boolean;
  redeemedDate?: string;
  collectionLocation: string;
}

export class PhysicalCoinService {
  private static readonly REQUIRED_DAYS = 7; // 7 days to earn physical coin
  private static readonly DAILY_COIN_LIMIT = 10; // Daily coins received
  private static readonly VOUCHER_EXPIRY_DAYS = 30; // Voucher valid for 30 days

  /**
   * Track daily coin activity for a user
   */
  static async trackDailyActivity(
    userId: string,
    date: string,
    coinsReceived: number,
    coinsGiven: number,
    restaurantsVisited: string[]
  ): Promise<DailyProgress> {
    const allCoinsGiven = coinsGiven >= coinsReceived;
    const completedDaily = allCoinsGiven && coinsGiven > 0;

    const dailyProgress: DailyProgress = {
      date,
      coinsReceived,
      coinsGiven,
      allCoinsGiven,
      restaurantsVisited,
      completedDaily
    };

    // In production, this would be stored in database
    console.log(`Daily activity tracked for user ${userId}:`, dailyProgress);

    return dailyProgress;
  }

  /**
   * Get souvenir progress for a user
   */
  static async getSouvenirProgress(userId: string): Promise<SouvenirProgress> {
    // Mock data for demo - in production this would come from database
    const mockDailyHistory = this.generateMockDailyHistory();
    const completedDays = mockDailyHistory.filter(day => day.completedDaily);
    const totalDaysCompleted = completedDays.length;
    
    const currentStreak = this.calculateCurrentStreak(mockDailyHistory);
    const longestStreak = this.calculateLongestStreak(mockDailyHistory);
    const daysRemaining = Math.max(0, this.REQUIRED_DAYS - totalDaysCompleted);
    const isEligible = totalDaysCompleted >= this.REQUIRED_DAYS;
    
    const milestones = this.generateMilestones(totalDaysCompleted);

    const progress: SouvenirProgress = {
      userId,
      totalDaysCompleted,
      consecutiveDays: currentStreak,
      currentStreak,
      longestStreak,
      daysRemaining,
      isEligible,
      voucherGenerated: isEligible,
      dailyHistory: mockDailyHistory,
      milestones
    };

    if (isEligible && !progress.voucherGenerated) {
      const voucher = await this.generateSouvenirVoucher(userId, totalDaysCompleted);
      progress.voucherCode = voucher.voucherCode;
      progress.voucherQRCode = voucher.qrCodeData;
      progress.voucherGenerated = true;
    }

    return progress;
  }

  /**
   * Generate souvenir voucher for eligible user
   */
  static async generateSouvenirVoucher(
    userId: string,
    daysCompleted: number,
    userName: string = 'Demo User',
    userOrigin: string = 'United States'
  ): Promise<SouvenirVoucher> {
    const voucherCode = this.generateVoucherCode(userId);
    const generatedDate = new Date().toISOString();
    const expiryDate = new Date(Date.now() + this.VOUCHER_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
    
    const voucherData = {
      voucherCode,
      userId,
      userName,
      userOrigin,
      daysCompleted,
      generatedDate,
      type: 'physical_coin_souvenir'
    };

    const qrCodeData = JSON.stringify(voucherData);

    const voucher: SouvenirVoucher = {
      voucherCode,
      userId,
      userName,
      userOrigin,
      daysCompleted,
      generatedDate,
      expiryDate,
      qrCodeData,
      isRedeemed: false,
      collectionLocation: 'Hong Kong Tourism Board Office, Central'
    };

    // In production, store in database
    console.log(`Souvenir voucher generated for user ${userId}:`, voucher);

    return voucher;
  }

  /**
   * Validate and redeem souvenir voucher
   */
  static async redeemVoucher(voucherCode: string): Promise<{
    success: boolean;
    voucher?: SouvenirVoucher;
    message: string;
  }> {
    try {
      // In production, fetch from database
      const voucher = await this.getVoucherByCode(voucherCode);
      
      if (!voucher) {
        return {
          success: false,
          message: 'Invalid voucher code'
        };
      }

      if (voucher.isRedeemed) {
        return {
          success: false,
          voucher,
          message: 'Voucher has already been redeemed'
        };
      }

      if (new Date() > new Date(voucher.expiryDate)) {
        return {
          success: false,
          voucher,
          message: 'Voucher has expired'
        };
      }

      // Mark as redeemed
      voucher.isRedeemed = true;
      voucher.redeemedDate = new Date().toISOString();

      return {
        success: true,
        voucher,
        message: 'Voucher redeemed successfully'
      };
    } catch (error) {
      console.error('Error redeeming voucher:', error);
      return {
        success: false,
        message: 'Failed to redeem voucher'
      };
    }
  }

  /**
   * Get daily coin distribution for user
   */
  static async getDailyCoinDistribution(userId: string, date: string): Promise<{
    coinsReceived: number;
    distributionTime: string;
    canReceiveCoins: boolean;
  }> {
    // Check if user already received coins today
    const today = new Date(date).toDateString();
    const lastDistribution = await this.getLastCoinDistribution(userId);
    
    const canReceiveCoins = !lastDistribution || 
      new Date(lastDistribution.distributionTime).toDateString() !== today;

    if (canReceiveCoins) {
      const coinsReceived = this.DAILY_COIN_LIMIT;
      const distributionTime = new Date().toISOString();
      
      // In production, record in database and blockchain
      console.log(`Distributed ${coinsReceived} coins to user ${userId} at ${distributionTime}`);
      
      return {
        coinsReceived,
        distributionTime,
        canReceiveCoins: true
      };
    }

    return {
      coinsReceived: 0,
      distributionTime: lastDistribution?.distributionTime || '',
      canReceiveCoins: false
    };
  }

  /**
   * Generate unique voucher code
   */
  private static generateVoucherCode(userId: string): string {
    const timestamp = Date.now().toString();
    const hash = crypto.createHash('sha256').update(userId + timestamp).digest('hex');
    return 'SC-' + hash.substring(0, 12).toUpperCase();
  }

  /**
   * Calculate current consecutive streak
   */
  private static calculateCurrentStreak(dailyHistory: DailyProgress[]): number {
    const sortedHistory = dailyHistory
      .filter(day => day.completedDaily)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let currentDate = new Date();
    
    for (const day of sortedHistory) {
      const dayDate = new Date(day.date);
      const diffDays = Math.floor((currentDate.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
        currentDate = dayDate;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calculate longest streak ever achieved
   */
  private static calculateLongestStreak(dailyHistory: DailyProgress[]): number {
    const completedDays = dailyHistory
      .filter(day => day.completedDaily)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const day of completedDays) {
      const dayDate = new Date(day.date);
      
      if (lastDate) {
        const diffDays = Math.floor((dayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      
      lastDate = dayDate;
    }

    return Math.max(longestStreak, currentStreak);
  }

  /**
   * Generate achievement milestones
   */
  private static generateMilestones(daysCompleted: number): SouvenirMilestone[] {
    const milestones: SouvenirMilestone[] = [
      {
        days: 1,
        title: 'First Steps',
        description: 'Complete your first day of giving all coins',
        reward: 'Digital Badge',
        achieved: daysCompleted >= 1,
        achievedDate: daysCompleted >= 1 ? '2024-01-01' : undefined
      },
      {
        days: 3,
        title: 'Getting Started',
        description: 'Complete 3 days of giving all coins',
        reward: 'Progress Boost',
        achieved: daysCompleted >= 3,
        achievedDate: daysCompleted >= 3 ? '2024-01-03' : undefined
      },
      {
        days: 5,
        title: 'Halfway There',
        description: 'Complete 5 days of giving all coins',
        reward: 'Special Recognition',
        achieved: daysCompleted >= 5,
        achievedDate: daysCompleted >= 5 ? '2024-01-05' : undefined
      },
      {
        days: 7,
        title: 'Physical Coin Earned!',
        description: 'Complete 7 days of giving all coins',
        reward: 'Physical SmileCoin Souvenir',
        achieved: daysCompleted >= 7,
        achievedDate: daysCompleted >= 7 ? '2024-01-07' : undefined
      },
      {
        days: 10,
        title: 'Super Tourist',
        description: 'Complete 10 days of giving all coins',
        reward: 'Premium Souvenir Package',
        achieved: daysCompleted >= 10,
        achievedDate: daysCompleted >= 10 ? '2024-01-10' : undefined
      }
    ];

    return milestones;
  }

  /**
   * Generate mock daily history for demo
   */
  private static generateMockDailyHistory(): DailyProgress[] {
    const history: DailyProgress[] = [];
    const startDate = new Date('2024-01-01');
    
    for (let i = 0; i < 10; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const coinsReceived = 10;
      const coinsGiven = i < 7 ? 10 : Math.floor(Math.random() * 10); // First 7 days complete
      const restaurantsVisited = [
        `restaurant-${Math.floor(Math.random() * 3) + 1}`,
        `restaurant-${Math.floor(Math.random() * 3) + 1}`
      ];
      
      history.push({
        date: date.toISOString().split('T')[0],
        coinsReceived,
        coinsGiven,
        allCoinsGiven: coinsGiven >= coinsReceived,
        restaurantsVisited,
        completedDaily: coinsGiven >= coinsReceived && coinsGiven > 0
      });
    }

    return history;
  }

  /**
   * Mock function to get last coin distribution
   */
  private static async getLastCoinDistribution(userId: string): Promise<{
    distributionTime: string;
  } | null> {
    // Mock implementation - in production, query database
    return null;
  }

  /**
   * Mock function to get voucher by code
   */
  private static async getVoucherByCode(voucherCode: string): Promise<SouvenirVoucher | null> {
    // Mock implementation - in production, query database
    if (voucherCode.startsWith('SC-')) {
      return {
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
    }
    return null;
  }
}