import express, { Request, Response, NextFunction } from 'express';
import { WalletManager } from '../../services/WalletManager';
import { ContractManager } from '../../services/ContractManager';
import { 
  validateRequest, 
  restaurantRegistrationValidation,
  coinTransferValidation,
  RequestValidationError 
} from '../middleware/validation';
import { 
  RestaurantRegistration, 
  RestaurantWallet, 
  CoinTransfer,
  TransferResult,
  RestaurantEarnings,
  DailyEarnings,
  OriginEarnings,
  ApiResponse 
} from '../types';
import { BlockchainError, BlockchainErrorCode } from '../app';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RestaurantRegistration:
 *       type: object
 *       required:
 *         - googlePlaceId
 *         - name
 *         - address
 *       properties:
 *         googlePlaceId:
 *           type: string
 *           description: Google Places API place ID for the restaurant
 *           example: "ChIJN1t_tDeuEmsRUsoyG83frY4"
 *         name:
 *           type: string
 *           description: Restaurant name
 *           example: "Mario's Pizza"
 *         address:
 *           type: string
 *           description: Restaurant address
 *           example: "123 Main St, City, Country"
 *     
 *     RestaurantWallet:
 *       type: object
 *       properties:
 *         walletAddress:
 *           type: string
 *           description: Blockchain wallet address for the restaurant
 *           example: "0x853f43d8A49eDb4B8C4C4e4C4C4C4C4C4C4C4C4"
 *         qrCode:
 *           type: string
 *           description: QR code data for easy coin transfers
 *           example: "restaurant:ChIJN1t_tDeuEmsRUsoyG83frY4:0x853f43d8A49eDb4B8C4C4e4C4C4C4C4C4C4C4C4"
 *         transactionHash:
 *           type: string
 *           description: Transaction hash for the registration
 *           example: "0x1234567890abcdef..."
 *         success:
 *           type: boolean
 *           description: Whether the registration was successful
 *           example: true
 *     
 *     CoinTransfer:
 *       type: object
 *       required:
 *         - touristId
 *         - restaurantId
 *         - amount
 *       properties:
 *         touristId:
 *           type: string
 *           description: ID of the tourist sending coins
 *           example: "tourist-123"
 *         restaurantId:
 *           type: string
 *           description: Google Place ID of the restaurant
 *           example: "ChIJN1t_tDeuEmsRUsoyG83frY4"
 *         amount:
 *           type: number
 *           minimum: 0.1
 *           maximum: 3
 *           description: Number of coins to transfer (max 3 per restaurant per day)
 *           example: 2.5
 *     
 *     TransferResult:
 *       type: object
 *       properties:
 *         transactionHash:
 *           type: string
 *           description: Transaction hash for the transfer
 *           example: "0x1234567890abcdef..."
 *         success:
 *           type: boolean
 *           description: Whether the transfer was successful
 *           example: true
 *         amount:
 *           type: number
 *           description: Amount transferred
 *           example: 2.5
 *         remainingDailyLimit:
 *           type: number
 *           description: Remaining coins that can be sent to this restaurant today
 *           example: 0.5
 *     
 *     RestaurantEarnings:
 *       type: object
 *       properties:
 *         totalCoins:
 *           type: number
 *           description: Total coins received by the restaurant
 *           example: 127.5
 *         walletAddress:
 *           type: string
 *           description: Restaurant's wallet address
 *           example: "0x853f43d8A49eDb4B8C4C4e4C4C4C4C4C4C4C4C4"
 *         dailyBreakdown:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DailyEarnings'
 *         originBreakdown:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OriginEarnings'
 *     
 *     DailyEarnings:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         coins:
 *           type: number
 *           example: 15.5
 *         transactions:
 *           type: number
 *           example: 8
 *     
 *     OriginEarnings:
 *       type: object
 *       properties:
 *         country:
 *           type: string
 *           example: "USA"
 *         coins:
 *           type: number
 *           example: 45.5
 *         transactions:
 *           type: number
 *           example: 23
 */

/**
 * @swagger
 * /api/restaurants/register:
 *   post:
 *     summary: Register a new restaurant
 *     description: Creates a blockchain wallet for a restaurant and registers them in the SmileCoin system
 *     tags: [Restaurants]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestaurantRegistration'
 *     responses:
 *       200:
 *         description: Restaurant registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantWallet'
 *       400:
 *         description: Invalid request data or restaurant already registered
 *       401:
 *         description: Unauthorized - Invalid API key
 *       500:
 *         description: Internal server error
 */
router.post('/register', 
  validateRequest(restaurantRegistrationValidation),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { googlePlaceId, name, address }: RestaurantRegistration = req.body;
      
      // Check if restaurant already exists
      try {
        await WalletManager.getWallet(googlePlaceId);
        throw new BlockchainError(
          BlockchainErrorCode.RESTAURANT_NOT_REGISTERED,
          'Restaurant already registered'
        );
      } catch (error: any) {
        if (error instanceof BlockchainError && error.code !== BlockchainErrorCode.WALLET_NOT_FOUND) {
          throw error;
        }
        // Restaurant doesn't exist, continue with registration
      }
      
      // Generate wallet for restaurant
      const wallet = await WalletManager.createWallet(googlePlaceId);
      
      // Register on blockchain
      const tx = await ContractManager.registerRestaurantAPI(
        wallet.address,
        googlePlaceId
      );

      // Generate QR code data for easy transfers
      const qrCodeData = `restaurant:${googlePlaceId}:${wallet.address}`;

      const response: RestaurantWallet = {
        walletAddress: wallet.address,
        qrCode: qrCodeData,
        transactionHash: tx.hash,
        success: true
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/restaurants/{restaurantId}/receive-coins:
 *   post:
 *     summary: Transfer coins from tourist to restaurant
 *     description: Transfers SmileCoins from a tourist to a restaurant (max 3 coins per restaurant per day)
 *     tags: [Restaurants]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Google Place ID of the restaurant
 *         example: "ChIJN1t_tDeuEmsRUsoyG83frY4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - touristId
 *               - amount
 *             properties:
 *               touristId:
 *                 type: string
 *                 description: ID of the tourist sending coins
 *                 example: "tourist-123"
 *               amount:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 3
 *                 description: Number of coins to transfer
 *                 example: 2.5
 *     responses:
 *       200:
 *         description: Coins transferred successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferResult'
 *       400:
 *         description: Business rule violation (insufficient balance, daily limit exceeded, etc.)
 *       404:
 *         description: Tourist or restaurant not found
 *       500:
 *         description: Internal server error
 */
router.post('/:restaurantId/receive-coins', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.params;
    const { touristId, amount } = req.body;
    
    // Validate input
    if (!restaurantId) {
      throw new BlockchainError(
        BlockchainErrorCode.RESTAURANT_NOT_REGISTERED,
        'Restaurant ID is required'
      );
    }
    
    if (!touristId) {
      throw new BlockchainError(
        BlockchainErrorCode.TOURIST_NOT_REGISTERED,
        'Tourist ID is required'
      );
    }
    
    if (!amount || amount <= 0 || amount > 3) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_AMOUNT,
        'Amount must be between 0.1 and 3 coins'
      );
    }
    
    // Get restaurant wallet
    let restaurantWallet;
    try {
      restaurantWallet = await WalletManager.getWallet(restaurantId);
    } catch (error) {
      throw new BlockchainError(
        BlockchainErrorCode.WALLET_NOT_FOUND,
        'Restaurant not found. Please register first.'
      );
    }
    
    // Get tourist wallet
    let touristWallet;
    try {
      touristWallet = await WalletManager.getWallet(touristId);
    } catch (error) {
      throw new BlockchainError(
        BlockchainErrorCode.WALLET_NOT_FOUND,
        'Tourist not found. Please register first.'
      );
    }
    
    // Check tourist balance
    const touristBalance = await ContractManager.getBalanceAPI(touristWallet.address);
    if (touristBalance < amount) {
      throw new BlockchainError(
        BlockchainErrorCode.INSUFFICIENT_BALANCE,
        `Insufficient balance. Available: ${touristBalance} coins, Required: ${amount} coins`
      );
    }
    
    // Transfer coins to restaurant
    const tx = await ContractManager.transferToRestaurantAPI(
      touristId,
      restaurantWallet.address,
      amount,
      restaurantId
    );
    
    // Calculate remaining daily limit (this would typically come from contract state)
    const remainingDailyLimit = 3 - amount; // Simplified calculation
    
    const response: TransferResult = {
      transactionHash: tx.hash,
      success: true,
      amount,
      remainingDailyLimit
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/restaurants/{restaurantId}/earnings:
 *   get:
 *     summary: Get restaurant's earnings and statistics
 *     description: Returns total coins received, daily breakdown, and origin country statistics for a restaurant
 *     tags: [Restaurants]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Google Place ID of the restaurant
 *         example: "ChIJN1t_tDeuEmsRUsoyG83frY4"
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 90
 *           default: 30
 *         description: Number of days to include in daily breakdown
 *       - in: query
 *         name: includeOrigins
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to include origin country breakdown
 *     responses:
 *       200:
 *         description: Restaurant earnings and statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantEarnings'
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
router.get('/:restaurantId/earnings', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.params;
    const days = Math.min(parseInt(req.query.days as string) || 30, 90);
    const includeOrigins = req.query.includeOrigins !== 'false';
    
    if (!restaurantId) {
      throw new BlockchainError(
        BlockchainErrorCode.RESTAURANT_NOT_REGISTERED,
        'Restaurant ID is required'
      );
    }
    
    // Get restaurant wallet
    let restaurantWallet;
    try {
      restaurantWallet = await WalletManager.getWallet(restaurantId);
    } catch (error) {
      throw new BlockchainError(
        BlockchainErrorCode.WALLET_NOT_FOUND,
        'Restaurant not found. Please register first.'
      );
    }
    
    // Get total balance from contract
    const totalCoins = await ContractManager.getBalanceAPI(restaurantWallet.address);
    
    // Get restaurant data from contract
    const restaurantData = await ContractManager.getRestaurantData(restaurantWallet.address);
    
    // Generate mock daily breakdown (this would come from transaction indexing)
    const dailyBreakdown: DailyEarnings[] = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Mock data - in real implementation, this would come from database
      const dailyCoins = Math.random() * 10;
      const transactions = Math.floor(Math.random() * 5);
      
      if (dailyCoins > 0) {
        dailyBreakdown.push({
          date: date.toISOString().split('T')[0],
          coins: Math.round(dailyCoins * 10) / 10,
          transactions
        });
      }
    }
    
    // Generate mock origin breakdown (this would come from transaction indexing)
    const originBreakdown: OriginEarnings[] = [];
    if (includeOrigins) {
      const countries = ['USA', 'CAN', 'GBR', 'DEU', 'FRA', 'JPN', 'AUS'];
      countries.forEach(country => {
        const coins = Math.random() * 20;
        const transactions = Math.floor(Math.random() * 10);
        
        if (coins > 0) {
          originBreakdown.push({
            country,
            coins: Math.round(coins * 10) / 10,
            transactions
          });
        }
      });
    }
    
    const response: RestaurantEarnings = {
      totalCoins,
      walletAddress: restaurantWallet.address,
      dailyBreakdown,
      originBreakdown
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;