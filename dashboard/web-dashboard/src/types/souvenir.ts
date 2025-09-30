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

export interface DailyCoinDistribution {
  coinsReceived: number;
  distributionTime: string;
  canReceiveCoins: boolean;
}