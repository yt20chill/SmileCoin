// IndexedDB configuration using Dexie.js for offline data persistence

import Dexie, { type EntityTable } from 'dexie';
import type { 
  User, 
  Transaction, 
  Merchant, 
  Offer, 
  Reward, 
  Rating 
} from '../types';

export interface SmileTravelDB extends Dexie {
  users: EntityTable<User, 'id'>;
  transactions: EntityTable<Transaction, 'id'>;
  merchants: EntityTable<Merchant, 'id'>;
  offers: EntityTable<Offer, 'id'>;
  rewards: EntityTable<Reward, 'id'>;
  ratings: EntityTable<Rating, 'id'>;
}

export const db = new Dexie('SmileTravelDB') as SmileTravelDB;

// Define schemas
db.version(1).stores({
  users: '++id, email, walletAddress, preferredLanguage, createdAt',
  transactions: '++id, type, amount, merchantId, rewardId, timestamp, status',
  merchants: '++id, name, category, rating, isActive',
  offers: '++id, merchantId, discountPercentage, validUntil, isActive',
  rewards: '++id, name, category, coinsRequired, isAvailable',
  ratings: '++id, userId, merchantId, coinsSpent, timestamp',
});

// Database utility functions
export class DatabaseService {
  // User operations
  static async saveUser(user: User): Promise<void> {
    await db.users.put(user);
  }

  static async getUser(id: string): Promise<User | undefined> {
    return await db.users.get(id);
  }

  static async getCurrentUser(): Promise<User | undefined> {
    return await db.users.orderBy('createdAt').last();
  }

  // Transaction operations
  static async addTransaction(transaction: Transaction): Promise<void> {
    await db.transactions.add(transaction);
  }

  static async getTransactions(userId?: string): Promise<Transaction[]> {
    if (userId) {
      // Note: We'd need to add userId to transaction schema for this to work
      return await db.transactions.orderBy('timestamp').reverse().toArray();
    }
    return await db.transactions.orderBy('timestamp').reverse().toArray();
  }

  static async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    return await db.transactions
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  // Merchant operations
  static async saveMerchants(merchants: Merchant[]): Promise<void> {
    await db.merchants.bulkPut(merchants);
  }

  static async getMerchants(): Promise<Merchant[]> {
    return await db.merchants.where('isActive').equals(1).toArray();
  }

  static async getMerchant(id: string): Promise<Merchant | undefined> {
    return await db.merchants.get(id);
  }

  // Offer operations
  static async saveOffers(offers: Offer[]): Promise<void> {
    await db.offers.bulkPut(offers);
  }

  static async getActiveOffers(): Promise<Offer[]> {
    const now = new Date();
    return await db.offers
      .where('isActive')
      .equals(1)
      .and(offer => offer.validUntil > now)
      .toArray();
  }

  static async getOffersByMerchant(merchantId: string): Promise<Offer[]> {
    return await db.offers
      .where('merchantId')
      .equals(merchantId)
      .and(offer => offer.isActive && offer.validUntil > new Date())
      .toArray();
  }

  // Reward operations
  static async saveRewards(rewards: Reward[]): Promise<void> {
    await db.rewards.bulkPut(rewards);
  }

  static async getAvailableRewards(): Promise<Reward[]> {
    return await db.rewards.where('isAvailable').equals(1).toArray();
  }

  static async getReward(id: string): Promise<Reward | undefined> {
    return await db.rewards.get(id);
  }

  // Rating operations
  static async addRating(rating: Rating): Promise<void> {
    await db.ratings.add(rating);
  }

  static async getRatingsByMerchant(merchantId: string): Promise<Rating[]> {
    return await db.ratings.where('merchantId').equals(merchantId).toArray();
  }

  static async getUserRatings(userId: string): Promise<Rating[]> {
    return await db.ratings.where('userId').equals(userId).toArray();
  }

  // Cache management
  static async clearCache(): Promise<void> {
    await Promise.all([
      db.merchants.clear(),
      db.offers.clear(),
      db.rewards.clear(),
    ]);
  }

  static async clearAllData(): Promise<void> {
    await Promise.all([
      db.users.clear(),
      db.transactions.clear(),
      db.merchants.clear(),
      db.offers.clear(),
      db.rewards.clear(),
      db.ratings.clear(),
    ]);
  }

  // Sync status tracking
  static async getLastSyncTime(): Promise<Date | null> {
    const lastTransaction = await db.transactions.orderBy('timestamp').last();
    return lastTransaction?.timestamp || null;
  }
}

// Initialize database
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Export database instance
export default db;