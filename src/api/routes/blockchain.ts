import express, { Request, Response, NextFunction } from 'express';
import { ContractManager } from '../../services/ContractManager';
import { 
  TransactionStatus,
  NetworkStatus,
  ApiResponse 
} from '../types';
import { BlockchainError, BlockchainErrorCode } from '../app';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TransactionStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, confirmed, failed]
 *           description: Current status of the transaction
 *           example: "confirmed"
 *         blockNumber:
 *           type: number
 *           description: Block number where transaction was mined (if confirmed)
 *           example: 12345678
 *         gasUsed:
 *           type: number
 *           description: Amount of gas used by the transaction
 *           example: 21000
 *         explorerUrl:
 *           type: string
 *           description: URL to view transaction on blockchain explorer
 *           example: "https://polygonscan.com/tx/0x1234567890abcdef..."
 *         confirmations:
 *           type: number
 *           description: Number of confirmations (if confirmed)
 *           example: 15
 *     
 *     NetworkStatus:
 *       type: object
 *       properties:
 *         network:
 *           type: string
 *           description: Name of the blockchain network
 *           example: "polygon-mumbai"
 *         blockNumber:
 *           type: number
 *           description: Latest block number
 *           example: 12345678
 *         gasPrice:
 *           type: string
 *           description: Current gas price in wei
 *           example: "30000000000"
 *         isHealthy:
 *           type: boolean
 *           description: Whether the network is operating normally
 *           example: true
 *         lastBlockTime:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the last block
 *           example: "2024-01-15T14:30:00Z"
 */

/**
 * @swagger
 * /api/blockchain/transaction/{hash}:
 *   get:
 *     summary: Get transaction status
 *     description: Returns the current status and details of a blockchain transaction
 *     tags: [Blockchain]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{64}$'
 *         description: Transaction hash
 *         example: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
 *     responses:
 *       200:
 *         description: Transaction status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionStatus'
 *       400:
 *         description: Invalid transaction hash format
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 */
router.get('/transaction/:hash', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { hash } = req.params;
    
    // Validate transaction hash format
    if (!hash || !/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_AMOUNT,
        'Invalid transaction hash format. Must be a 64-character hexadecimal string starting with 0x'
      );
    }
    
    // Get transaction status from blockchain
    const txStatus = await ContractManager.getTransactionStatus(hash);
    
    if (!txStatus) {
      throw new BlockchainError(
        BlockchainErrorCode.TRANSACTION_FAILED,
        'Transaction not found'
      );
    }
    
    // Generate explorer URL based on network
    const network = process.env.BLOCKCHAIN_NETWORK || 'polygon-mumbai';
    let explorerUrl: string;
    
    switch (network) {
      case 'polygon':
      case 'polygon-mainnet':
        explorerUrl = `https://polygonscan.com/tx/${hash}`;
        break;
      case 'polygon-mumbai':
        explorerUrl = `https://mumbai.polygonscan.com/tx/${hash}`;
        break;
      case 'ethereum':
        explorerUrl = `https://etherscan.io/tx/${hash}`;
        break;
      case 'bsc':
        explorerUrl = `https://bscscan.com/tx/${hash}`;
        break;
      default:
        explorerUrl = `https://mumbai.polygonscan.com/tx/${hash}`;
    }
    
    const response: TransactionStatus = {
      status: txStatus.status,
      blockNumber: txStatus.blockNumber,
      gasUsed: txStatus.gasUsed ? parseInt(txStatus.gasUsed.toString()) : undefined,
      explorerUrl,
      confirmations: txStatus.confirmations
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/blockchain/network/status:
 *   get:
 *     summary: Get blockchain network status
 *     description: Returns the current status and health of the blockchain network
 *     tags: [Blockchain]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Network status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NetworkStatus'
 *       503:
 *         description: Network is unhealthy or unreachable
 *       500:
 *         description: Internal server error
 */
router.get('/network/status', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get network status from blockchain
    const networkStatus = await ContractManager.getNetworkStatus();
    
    if (!networkStatus.isHealthy) {
      res.status(503);
    }
    
    const response: NetworkStatus = {
      network: process.env.BLOCKCHAIN_NETWORK || 'polygon-mumbai',
      blockNumber: networkStatus.blockNumber,
      gasPrice: networkStatus.gasPrice,
      isHealthy: networkStatus.isHealthy,
      lastBlockTime: networkStatus.lastBlockTime
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/blockchain/gas/estimate:
 *   post:
 *     summary: Estimate gas cost for operations
 *     description: Returns estimated gas costs for common SmileCoin operations
 *     tags: [Blockchain]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [register_tourist, register_restaurant, issue_daily_coins, transfer_coins]
 *                 description: Type of operation to estimate gas for
 *                 example: "issue_daily_coins"
 *               amount:
 *                 type: number
 *                 description: Amount of coins (for transfer operations)
 *                 example: 2.5
 *     responses:
 *       200:
 *         description: Gas estimation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 operation:
 *                   type: string
 *                   example: "issue_daily_coins"
 *                 estimatedGas:
 *                   type: number
 *                   description: Estimated gas units
 *                   example: 85000
 *                 gasPrice:
 *                   type: string
 *                   description: Current gas price in wei
 *                   example: "30000000000"
 *                 estimatedCostWei:
 *                   type: string
 *                   description: Estimated cost in wei
 *                   example: "2550000000000000"
 *                 estimatedCostUSD:
 *                   type: number
 *                   description: Estimated cost in USD
 *                   example: 0.0034
 *       400:
 *         description: Invalid operation type
 *       500:
 *         description: Internal server error
 */
router.post('/gas/estimate', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { operation, amount } = req.body;
    
    if (!operation) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_AMOUNT,
        'Operation type is required'
      );
    }
    
    const validOperations = ['register_tourist', 'register_restaurant', 'issue_daily_coins', 'transfer_coins'];
    if (!validOperations.includes(operation)) {
      throw new BlockchainError(
        BlockchainErrorCode.INVALID_AMOUNT,
        `Invalid operation. Must be one of: ${validOperations.join(', ')}`
      );
    }
    
    // Get current gas price
    const networkStatus = await ContractManager.getNetworkStatus();
    const gasPrice = networkStatus.gasPrice;
    
    // Estimate gas based on operation type
    let estimatedGas: number;
    switch (operation) {
      case 'register_tourist':
        estimatedGas = 120000; // Typical gas for tourist registration
        break;
      case 'register_restaurant':
        estimatedGas = 100000; // Typical gas for restaurant registration
        break;
      case 'issue_daily_coins':
        estimatedGas = 85000; // Typical gas for minting coins
        break;
      case 'transfer_coins':
        estimatedGas = 65000; // Typical gas for token transfer
        break;
      default:
        estimatedGas = 100000; // Default estimate
    }
    
    // Calculate estimated cost
    const estimatedCostWei = (BigInt(estimatedGas) * BigInt(gasPrice)).toString();
    
    // Convert to USD (mock conversion - in production, use real price feed)
    const maticPriceUSD = 0.85; // Mock MATIC price
    const estimatedCostMatic = parseFloat(estimatedCostWei) / 1e18;
    const estimatedCostUSD = estimatedCostMatic * maticPriceUSD;
    
    const response = {
      operation,
      estimatedGas,
      gasPrice,
      estimatedCostWei,
      estimatedCostUSD: Math.round(estimatedCostUSD * 10000) / 10000 // Round to 4 decimal places
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/blockchain/contract/info:
 *   get:
 *     summary: Get SmileCoin contract information
 *     description: Returns information about the deployed SmileCoin contract
 *     tags: [Blockchain]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Contract information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contractAddress:
 *                   type: string
 *                   description: Address of the SmileCoin contract
 *                   example: "0x1234567890abcdef1234567890abcdef12345678"
 *                 network:
 *                   type: string
 *                   description: Network where contract is deployed
 *                   example: "polygon-mumbai"
 *                 totalSupply:
 *                   type: string
 *                   description: Total supply of SmileCoins
 *                   example: "1000000000000000000000"
 *                 totalTourists:
 *                   type: number
 *                   description: Number of registered tourists
 *                   example: 1247
 *                 totalRestaurants:
 *                   type: number
 *                   description: Number of registered restaurants
 *                   example: 89
 *                 dailyCoinsIssued:
 *                   type: string
 *                   description: Total daily coins issued today
 *                   example: "12470000000000000000000"
 *                 explorerUrl:
 *                   type: string
 *                   description: URL to view contract on blockchain explorer
 *                   example: "https://mumbai.polygonscan.com/address/0x1234567890abcdef1234567890abcdef12345678"
 *       500:
 *         description: Internal server error
 */
router.get('/contract/info', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const network = process.env.BLOCKCHAIN_NETWORK || 'polygon-mumbai';
    
    if (!contractAddress) {
      throw new BlockchainError(
        BlockchainErrorCode.NETWORK_ERROR,
        'Contract address not configured'
      );
    }
    
    // Get contract information
    const contractInfo = await ContractManager.getContractInfo();
    
    // Generate explorer URL
    let explorerUrl: string;
    switch (network) {
      case 'polygon':
      case 'polygon-mainnet':
        explorerUrl = `https://polygonscan.com/address/${contractAddress}`;
        break;
      case 'polygon-mumbai':
        explorerUrl = `https://mumbai.polygonscan.com/address/${contractAddress}`;
        break;
      case 'ethereum':
        explorerUrl = `https://etherscan.io/address/${contractAddress}`;
        break;
      case 'bsc':
        explorerUrl = `https://bscscan.com/address/${contractAddress}`;
        break;
      default:
        explorerUrl = `https://mumbai.polygonscan.com/address/${contractAddress}`;
    }
    
    const response = {
      contractAddress,
      network,
      totalSupply: contractInfo.totalSupply,
      totalTourists: contractInfo.totalTourists,
      totalRestaurants: contractInfo.totalRestaurants,
      dailyCoinsIssued: contractInfo.dailyCoinsIssued,
      explorerUrl
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;