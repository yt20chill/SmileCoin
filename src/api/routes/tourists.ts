import express, { Request, Response, NextFunction } from 'express';
import { WalletManager } from '../../services/WalletManager';
import { ContractManager } from '../../services/ContractManager';
import { 
  validateRequest, 
  touristRegistrationValidation,
  RequestValidationError 
} from '../middleware/validation';
import { 
  TouristRegistration, 
  TouristWallet, 
  CoinIssuance, 
  TouristBalance,
  ApiResponse 
} from '../types';
import { BlockchainError, BlockchainErrorCode } from '../app';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TouristRegistration:
 *       type: object
 *       required:
 *         - touristId
 *         - originCountry
 *         - arrivalDate
 *         - departureDate
 *       properties:
 *         touristId:
 *           type: string
 *           description: Unique identifier for the tourist
 *           example: "tourist-123"
 *         originCountry:
 *           type: string
 *           description: Tourist's origin country code (ISO 3166-1 alpha-2/3)
 *           example: "USA"
 *         arrivalDate:
 *           type: string
 *           format: date
 *           description: Tourist's arrival date
 *           example: "2024-01-15"
 *         departureDate:
 *           type: string
 *           format: date
 *           description: Tourist's departure date
 *           example: "2024-01-22"
 *     
 *     TouristWallet:
 *       type: object
 *       properties:
 *         walletAddress:
 *           type: string
 *           description: Blockchain wallet address for the tourist
 *           example: "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4"
 *         transactionHash:
 *           type: string
 *           description: Transaction hash for the registration
 *           example: "0x1234567890abcdef..."
 *         success:
 *           type: boolean
 *           description: Whether the registration was successful
 *           example: true
 *     
 *     CoinIssuance:
 *       type: object
 *       properties:
 *         transactionHash:
 *           type: string
 *           description: Transaction hash for the coin issuance
 *           example: "0x1234567890abcdef..."
 *         amount:
 *           type: number
 *           description: Number of coins issued
 *           example: 10
 *         expirationDate:
 *           type: string
 *           format: date-time
 *           description: When the coins will expire
 *           example: "2024-01-29T12:00:00Z"
 *     
 *     TouristBalance:
 *       type: object
 *       properties:
 *         balance:
 *           type: number
 *           description: Current coin balance
 *           example: 7.5
 *         walletAddress:
 *           type: string
 *           description: Tourist's wallet address
 *           example: "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4"
 *         transactions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Transaction'
 *     
 *     Transaction:
 *       type: object
 *       properties:
 *         hash:
 *           type: string
 *           example: "0x1234567890abcdef..."
 *         from:
 *           type: string
 *           example: "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4"
 *         to:
 *           type: string
 *           example: "0x853f43d8A49eDb4B8C4C4e4C4C4C4C4C4C4C4C4"
 *         amount:
 *           type: number
 *           example: 3
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T14:30:00Z"
 *         status:
 *           type: string
 *           enum: [pending, confirmed, failed]
 *           example: "confirmed"
 *         type:
 *           type: string
 *           enum: [daily_issuance, restaurant_transfer, expiration]
 *           example: "restaurant_transfer"
 */

/**
 * @swagger
 * /api/tourists/register:
 *   post:
 *     summary: Register a new tourist
 *     description: Creates a blockchain wallet for a tourist and registers them in the SmileCoin system
 *     tags: [Tourists]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TouristRegistration'
 *     responses:
 *       200:
 *         description: Tourist registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TouristWallet'
 *       400:
 *         description: Invalid request data or business rule violation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     message:
 *                       type: string
 *                     details:
 *                       type: object
 *       401:
 *         description: Unauthorized - Invalid API key
 *       500:
 *         description: Internal server error
 */
router.post('/register', 
  validateRequest(touristRegistrationValidation),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { touristId, originCountry, arrivalDate, departureDate }: TouristRegistration = req.body;
      
      // Check if tourist already exists
      try {
        await WalletManager.getWallet(touristId);
        throw new BlockchainError(
          BlockchainErrorCode.TOURIST_NOT_REGISTERED,
          'Tourist already registered'
        );
      } catch (error: any) {
        if (error instanceof BlockchainError && error.code !== BlockchainErrorCode.WALLET_NOT_FOUND) {
          throw error;
        }
        // Tourist doesn't exist, continue with registration
      }
      
      // Generate wallet for tourist
      const wallet = await WalletManager.createWallet(touristId);
      
      // Fund wallet with small amount of MATIC for gas fees
      await WalletManager.fundWallet(wallet.address, '0.01');
      
      // Register on blockchain
      const tx = await ContractManager.registerTouristAPI(
        wallet.address,
        originCountry,
        new Date(arrivalDate).getTime() / 1000,
        new Date(departureDate).getTime() / 1000
      );

      const response: TouristWallet = {
        walletAddress: wallet.address,
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
 * /api/tourists/{touristId}/daily-coins:
 *   post:
 *     summary: Issue daily coins to a tourist
 *     description: Mints 10 SmileCoins for a registered tourist (once per day)
 *     tags: [Tourists]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: touristId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier for the tourist
 *         example: "tourist-123"
 *     responses:
 *       200:
 *         description: Daily coins issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CoinIssuance'
 *       400:
 *         description: Business rule violation (already issued today, tourist not arrived, etc.)
 *       404:
 *         description: Tourist not found
 *       500:
 *         description: Internal server error
 */
router.post('/:touristId/daily-coins', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { touristId } = req.params;
    
    if (!touristId) {
      throw new BlockchainError(
        BlockchainErrorCode.TOURIST_NOT_REGISTERED,
        'Tourist ID is required'
      );
    }
    
    // Get tourist wallet
    let wallet;
    try {
      wallet = await WalletManager.getWallet(touristId);
    } catch (error) {
      throw new BlockchainError(
        BlockchainErrorCode.WALLET_NOT_FOUND,
        'Tourist not found. Please register first.'
      );
    }
    
    // Issue daily coins
    const tx = await ContractManager.issueDailyCoinsAPI(wallet.address);
    
    const response: CoinIssuance = {
      transactionHash: tx.hash,
      amount: 10,
      expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tourists/{touristId}/balance:
 *   get:
 *     summary: Get tourist's coin balance and transaction history
 *     description: Returns the current SmileCoin balance and transaction history for a tourist
 *     tags: [Tourists]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: touristId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier for the tourist
 *         example: "tourist-123"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of transactions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of transactions to skip
 *     responses:
 *       200:
 *         description: Tourist balance and transaction history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TouristBalance'
 *       404:
 *         description: Tourist not found
 *       500:
 *         description: Internal server error
 */
router.get('/:touristId/balance', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { touristId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (!touristId) {
      throw new BlockchainError(
        BlockchainErrorCode.TOURIST_NOT_REGISTERED,
        'Tourist ID is required'
      );
    }
    
    // Get tourist wallet
    let wallet;
    try {
      wallet = await WalletManager.getWallet(touristId);
    } catch (error) {
      throw new BlockchainError(
        BlockchainErrorCode.WALLET_NOT_FOUND,
        'Tourist not found. Please register first.'
      );
    }
    
    // Get balance from contract
    const balance = await ContractManager.getBalanceAPI(wallet.address);
    
    // Get transaction history (this would typically come from a database)
    // For now, we'll return a mock response
    const transactions = [
      // This would be populated from the blockchain transaction indexing system
    ];
    
    const response: TouristBalance = {
      balance,
      walletAddress: wallet.address,
      transactions
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;