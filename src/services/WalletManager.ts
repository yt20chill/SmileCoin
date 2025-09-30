import { ethers } from 'ethers';
import { encrypt, decrypt } from '../utils/encryption';
import { query, transaction } from '../utils/database';

export interface WalletData {
  id: string;
  userId: string;
  userType: 'tourist' | 'restaurant';
  walletAddress: string;
  encryptedPrivateKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWalletResult {
  address: string;
  privateKey: string;
  userId: string;
  userType: 'tourist' | 'restaurant';
}

export class WalletManager {
  private static wallets = new Map<string, ethers.Wallet>();
  private static walletDataCache = new Map<string, WalletData>();
  private static addressToUserIdCache = new Map<string, string>();
  private static provider: ethers.providers.Provider;
  private static cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Initialize the WalletManager with blockchain provider
   */
  static initialize(rpcUrl: string): void {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Create a deterministic wallet from user ID
   */
  static async createWallet(userId: string, userType: 'tourist' | 'restaurant'): Promise<CreateWalletResult> {
    // Check if wallet already exists
    const existingWallet = await this.loadWalletFromDatabase(userId);
    if (existingWallet) {
      throw new Error(`Wallet already exists for user ${userId}`);
    }

    // Generate deterministic wallet from user ID and seed
    const seed = process.env.WALLET_SEED;
    if (!seed) {
      throw new Error('WALLET_SEED environment variable is required');
    }

    const combinedSeed = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(userId + seed + userType)
    );
    const wallet = new ethers.Wallet(combinedSeed, this.provider);
    
    // Encrypt and store private key
    const encryptedKey = encrypt(wallet.privateKey);
    await this.storeWallet(userId, userType, wallet.address, encryptedKey);
    
    // Cache wallet in memory
    this.wallets.set(userId, wallet);
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      userId,
      userType
    };
  }

  /**
   * Get wallet for a user (from cache or database)
   */
  static async getWallet(userId: string): Promise<ethers.Wallet> {
    // Check memory cache first
    if (this.wallets.has(userId)) {
      return this.wallets.get(userId)!;
    }

    // Load from database
    const walletData = await this.loadWalletFromDatabase(userId);
    if (!walletData) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    // Decrypt private key and create wallet
    const privateKey = decrypt(walletData.encryptedPrivateKey);
    const wallet = new ethers.Wallet(privateKey, this.provider);
    
    // Cache in memory
    this.wallets.set(userId, wallet);
    
    return wallet;
  }

  /**
   * Get wallet address for a user without loading the full wallet
   */
  static async getWalletAddress(userId: string): Promise<string> {
    // Check cache first
    if (this.walletDataCache.has(userId)) {
      return this.walletDataCache.get(userId)!.walletAddress;
    }

    const walletData = await this.loadWalletFromDatabase(userId);
    if (!walletData) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    // Cache the wallet data
    this.walletDataCache.set(userId, walletData);
    this.addressToUserIdCache.set(walletData.walletAddress, userId);

    return walletData.walletAddress;
  }

  /**
   * Fund a wallet with native tokens (MATIC) for gas fees
   */
  static async fundWallet(address: string, amount: string): Promise<string> {
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      throw new Error('ADMIN_PRIVATE_KEY environment variable is required');
    }

    const adminWallet = new ethers.Wallet(adminPrivateKey, this.provider);
    
    // Check admin wallet balance
    const adminBalance = await adminWallet.getBalance();
    const fundingAmount = ethers.utils.parseEther(amount);
    
    if (adminBalance.lt(fundingAmount)) {
      throw new Error('Insufficient admin wallet balance for funding');
    }

    // Send transaction
    const tx = await adminWallet.sendTransaction({
      to: address,
      value: fundingAmount,
      gasLimit: 21000
    });

    return tx.hash;
  }

  /**
   * Validate wallet address format
   */
  static isValidAddress(address: string): boolean {
    return ethers.utils.isAddress(address);
  }

  /**
   * Get wallet balance in ETH/MATIC
   */
  static async getWalletBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  }

  /**
   * Lookup user ID by wallet address
   */
  static async getUserIdByAddress(address: string): Promise<string | null> {
    // Check cache first
    if (this.addressToUserIdCache.has(address)) {
      return this.addressToUserIdCache.get(address)!;
    }

    const result = await query(
      'SELECT user_id FROM wallets WHERE wallet_address = $1',
      [address]
    );
    
    if (result.rows.length > 0) {
      const userId = result.rows[0].user_id;
      this.addressToUserIdCache.set(address, userId);
      return userId;
    }
    
    return null;
  }

  /**
   * Get all wallets for a user type
   */
  static async getWalletsByType(userType: 'tourist' | 'restaurant'): Promise<WalletData[]> {
    const result = await query(
      'SELECT * FROM wallets WHERE user_type = $1 ORDER BY created_at DESC',
      [userType]
    );
    
    return result.rows.map(this.mapRowToWalletData);
  }

  /**
   * Store wallet in database
   */
  private static async storeWallet(
    userId: string,
    userType: 'tourist' | 'restaurant',
    walletAddress: string,
    encryptedPrivateKey: string
  ): Promise<void> {
    await query(
      `INSERT INTO wallets (user_id, user_type, wallet_address, encrypted_private_key)
       VALUES ($1, $2, $3, $4)`,
      [userId, userType, walletAddress, encryptedPrivateKey]
    );
  }

  /**
   * Load wallet data from database
   */
  private static async loadWalletFromDatabase(userId: string): Promise<WalletData | null> {
    // Check cache first
    if (this.walletDataCache.has(userId)) {
      return this.walletDataCache.get(userId)!;
    }

    const result = await query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const walletData = this.mapRowToWalletData(result.rows[0]);
    
    // Cache the data
    this.walletDataCache.set(userId, walletData);
    this.addressToUserIdCache.set(walletData.walletAddress, userId);
    
    return walletData;
  }

  /**
   * Map database row to WalletData interface
   */
  private static mapRowToWalletData(row: any): WalletData {
    return {
      id: row.id,
      userId: row.user_id,
      userType: row.user_type,
      walletAddress: row.wallet_address,
      encryptedPrivateKey: row.encrypted_private_key,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Update wallet data in database (for metadata updates)
   */
  static async updateWallet(userId: string, updates: Partial<Pick<WalletData, 'userType'>>): Promise<void> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    if (updates.userType) {
      setClause.push(`user_type = $${paramIndex++}`);
      values.push(updates.userType);
    }

    if (setClause.length === 0) {
      return;
    }

    values.push(userId);
    
    await query(
      `UPDATE wallets SET ${setClause.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex}`,
      values
    );

    // Invalidate cache
    this.walletDataCache.delete(userId);
  }

  /**
   * Delete wallet from database (for cleanup)
   */
  static async deleteWallet(userId: string): Promise<void> {
    const walletData = await this.loadWalletFromDatabase(userId);
    if (walletData) {
      await query('DELETE FROM wallets WHERE user_id = $1', [userId]);
      
      // Clear from caches
      this.wallets.delete(userId);
      this.walletDataCache.delete(userId);
      this.addressToUserIdCache.delete(walletData.walletAddress);
    }
  }

  /**
   * Get wallet data without private key (safe for API responses)
   */
  static async getWalletInfo(userId: string): Promise<Omit<WalletData, 'encryptedPrivateKey'> | null> {
    const walletData = await this.loadWalletFromDatabase(userId);
    if (!walletData) {
      return null;
    }

    const { encryptedPrivateKey, ...safeWalletData } = walletData;
    return safeWalletData;
  }

  /**
   * Batch load multiple wallets (for performance)
   */
  static async getMultipleWallets(userIds: string[]): Promise<Map<string, WalletData>> {
    const result = new Map<string, WalletData>();
    const uncachedUserIds: string[] = [];

    // Check cache first
    for (const userId of userIds) {
      if (this.walletDataCache.has(userId)) {
        result.set(userId, this.walletDataCache.get(userId)!);
      } else {
        uncachedUserIds.push(userId);
      }
    }

    // Load uncached wallets from database
    if (uncachedUserIds.length > 0) {
      const placeholders = uncachedUserIds.map((_, index) => `$${index + 1}`).join(',');
      const dbResult = await query(
        `SELECT * FROM wallets WHERE user_id IN (${placeholders})`,
        uncachedUserIds
      );

      for (const row of dbResult.rows) {
        const walletData = this.mapRowToWalletData(row);
        result.set(walletData.userId, walletData);
        
        // Cache the data
        this.walletDataCache.set(walletData.userId, walletData);
        this.addressToUserIdCache.set(walletData.walletAddress, walletData.userId);
      }
    }

    return result;
  }

  /**
   * Validate wallet address format and check if it exists in database
   */
  static async validateAndCheckAddress(address: string): Promise<{ isValid: boolean; exists: boolean; userId?: string }> {
    const isValid = this.isValidAddress(address);
    
    if (!isValid) {
      return { isValid: false, exists: false };
    }

    const userId = await this.getUserIdByAddress(address);
    return {
      isValid: true,
      exists: userId !== null,
      userId: userId || undefined
    };
  }

  /**
   * Get wallet statistics
   */
  static async getWalletStats(): Promise<{
    totalWallets: number;
    touristWallets: number;
    restaurantWallets: number;
    cacheStats: {
      walletInstances: number;
      walletDataCache: number;
      addressCache: number;
    };
  }> {
    const result = await query(`
      SELECT 
        COUNT(*) as total_wallets,
        COUNT(CASE WHEN user_type = 'tourist' THEN 1 END) as tourist_wallets,
        COUNT(CASE WHEN user_type = 'restaurant' THEN 1 END) as restaurant_wallets
      FROM wallets
    `);

    const stats = result.rows[0];
    
    return {
      totalWallets: parseInt(stats.total_wallets),
      touristWallets: parseInt(stats.tourist_wallets),
      restaurantWallets: parseInt(stats.restaurant_wallets),
      cacheStats: {
        walletInstances: this.wallets.size,
        walletDataCache: this.walletDataCache.size,
        addressCache: this.addressToUserIdCache.size
      }
    };
  }

  /**
   * Clear all caches (useful for testing)
   */
  static clearCache(): void {
    this.wallets.clear();
    this.walletDataCache.clear();
    this.addressToUserIdCache.clear();
  }

  /**
   * Clear expired cache entries (call periodically)
   */
  static clearExpiredCache(): void {
    // For now, we'll clear all cache entries
    // In a production system, you'd track timestamps and clear only expired entries
    this.walletDataCache.clear();
    this.addressToUserIdCache.clear();
  }

  /**
   * Get comprehensive cache statistics
   */
  static getCacheStats(): {
    walletInstances: { size: number; userIds: string[] };
    walletDataCache: { size: number; userIds: string[] };
    addressCache: { size: number; addresses: string[] };
  } {
    return {
      walletInstances: {
        size: this.wallets.size,
        userIds: Array.from(this.wallets.keys())
      },
      walletDataCache: {
        size: this.walletDataCache.size,
        userIds: Array.from(this.walletDataCache.keys())
      },
      addressCache: {
        size: this.addressToUserIdCache.size,
        addresses: Array.from(this.addressToUserIdCache.keys())
      }
    };
  }
}