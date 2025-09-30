import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/environment';
import { CreateUserRequest, JwtPayload } from '../types';
import { sessionService } from './sessionService';

export class AuthService {
  private readonly JWT_SECRET = config.jwtSecret;
  private readonly JWT_EXPIRES_IN = config.jwtExpiresIn;

  /**
   * Register a new user with privacy-first approach (no email/password)
   */
  async registerUser(userData: CreateUserRequest) {
    const { originCountry, arrivalDate, departureDate, walletAddress } = userData;

    // Validate dates
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);
    
    if (arrival >= departure) {
      throw new Error('Departure date must be after arrival date');
    }

    if (arrival < new Date()) {
      throw new Error('Arrival date cannot be in the past');
    }

    // Check if wallet address already exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (existingUser) {
      throw new Error('Wallet address already registered');
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        originCountry,
        arrivalDate: arrival,
        departureDate: departure,
        walletAddress,
      }
    });

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      walletAddress: user.walletAddress,
    });

    // Store session in Redis
    await sessionService.createSession(user.id, token);

    return {
      user: {
        id: user.id,
        originCountry: user.originCountry,
        arrivalDate: user.arrivalDate,
        departureDate: user.departureDate,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Login user using wallet address (no password required)
   */
  async loginUser(walletAddress: string) {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        dailyRewards: {
          orderBy: { rewardDate: 'desc' },
          take: 1,
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate new JWT token
    const token = this.generateToken({
      userId: user.id,
      walletAddress: user.walletAddress,
    });

    // Store session in Redis
    await sessionService.createSession(user.id, token);

    return {
      user: {
        id: user.id,
        originCountry: user.originCountry,
        arrivalDate: user.arrivalDate,
        departureDate: user.departureDate,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
        lastDailyReward: user.dailyRewards[0] || null,
        recentTransactions: user.transactions,
      },
      token,
    };
  }

  /**
   * Logout user and invalidate session
   */
  async logoutUser(userId: string) {
    await sessionService.destroySession(userId);
    return { message: 'Logged out successfully' };
  }

  /**
   * Get user profile with statistics
   */
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dailyRewards: {
          orderBy: { rewardDate: 'desc' },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            restaurant: {
              select: {
                name: true,
                googlePlaceId: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate statistics
    const totalCoinsGiven = user.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalDaysActive = user.dailyRewards.filter(dr => dr.allCoinsGiven).length;
    const currentStreak = this.calculateCurrentStreak(user.dailyRewards);
    const daysUntilDeparture = Math.ceil(
      (user.departureDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check physical coin eligibility
    const isEligibleForPhysicalCoin = this.checkPhysicalCoinEligibility(
      user.dailyRewards,
      user.arrivalDate,
      user.departureDate
    );

    return {
      id: user.id,
      originCountry: user.originCountry,
      arrivalDate: user.arrivalDate,
      departureDate: user.departureDate,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
      statistics: {
        totalCoinsGiven,
        totalDaysActive,
        currentStreak,
        daysUntilDeparture: Math.max(0, daysUntilDeparture),
        isEligibleForPhysicalCoin,
        totalTransactions: user.transactions.length,
        uniqueRestaurantsVisited: new Set(user.transactions.map(tx => tx.restaurantId)).size,
      },
      recentTransactions: user.transactions.slice(0, 10),
      dailyRewards: user.dailyRewards.slice(0, 30), // Last 30 days
    };
  }

  /**
   * Verify JWT token and get user info
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JwtPayload;
      
      // Check if session exists in Redis
      const sessionExists = await sessionService.isSessionValid(decoded.userId);
      if (!sessionExists) {
        throw new Error('Session expired');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh user session
   */
  async refreshSession(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const token = this.generateToken({
      userId: user.id,
      walletAddress: user.walletAddress,
    });

    await sessionService.createSession(user.id, token);

    return { token };
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: { userId: string; walletAddress: string }): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as any);
  }



  /**
   * Calculate current streak of consecutive days with all coins given
   */
  private calculateCurrentStreak(dailyRewards: any[]): number {
    let streak = 0;
    const sortedRewards = dailyRewards.sort((a, b) => 
      new Date(b.rewardDate).getTime() - new Date(a.rewardDate).getTime()
    );

    for (const reward of sortedRewards) {
      if (reward.allCoinsGiven) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Check if user is eligible for physical coin souvenir
   */
  private checkPhysicalCoinEligibility(
    dailyRewards: any[],
    arrivalDate: Date,
    departureDate: Date
  ): boolean {
    const totalDays = Math.ceil(
      (departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const completeDays = dailyRewards.filter(dr => dr.allCoinsGiven).length;
    
    // User must give all coins every day until departure
    return completeDays >= totalDays && new Date() >= departureDate;
  }
}

export const authService = new AuthService();