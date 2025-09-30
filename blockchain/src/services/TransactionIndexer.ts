import { ethers } from 'ethers';
import { query, transaction } from '../utils/database';
import { ContractManager } from './ContractManager';

export interface TransactionEvent {
  transactionHash: string;
  blockNumber: number;
  fromAddress: string;
  toAddress: string;
  amount: string;
  gasUsed: bigint;
  gasPrice: bigint;
  transactionFee: string;
  transactionType: 'daily_issuance' | 'restaurant_transfer' | 'expiration';
  metadata: any;
}

export class TransactionIndexer {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private isListening: boolean = false;

  constructor(rpcUrl: string, contractAddress: string, contractABI: any) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new ethers.Contract(contractAddress, contractABI, this.provider);
  }

  /**
   * Start listening to blockchain events and indexing transactions
   */
  async startIndexing(): Promise<void> {
    if (this.isListening) {
      console.log('Transaction indexer is already running');
      return;
    }

    console.log('Starting transaction indexing service...');
    this.isListening = true;

    // Listen to DailyCoinsIssued events
    this.contract.on('DailyCoinsIssued', async (tourist, amount, originCountry, event) => {
      try {
        await this.indexDailyCoinsIssuedEvent(tourist, amount, originCountry, event);
      } catch (error) {
        console.error('Error indexing DailyCoinsIssued event:', error);
      }
    });

    // Listen to CoinsTransferred events
    this.contract.on('CoinsTransferred', async (from, to, amount, restaurantId, event) => {
      try {
        await this.indexCoinsTransferredEvent(from, to, amount, restaurantId, event);
      } catch (error) {
        console.error('Error indexing CoinsTransferred event:', error);
      }
    });

    // Listen to CoinsExpired events
    this.contract.on('CoinsExpired', async (tourist, amount, event) => {
      try {
        await this.indexCoinsExpiredEvent(tourist, amount, event);
      } catch (error) {
        console.error('Error indexing CoinsExpired event:', error);
      }
    });

    console.log('Transaction indexer started successfully');
  }

  /**
   * Stop listening to blockchain events
   */
  stopIndexing(): void {
    if (!this.isListening) {
      return;
    }

    console.log('Stopping transaction indexing service...');
    this.contract.removeAllListeners();
    this.isListening = false;
    console.log('Transaction indexer stopped');
  }

  /**
   * Index a DailyCoinsIssued event
   */
  private async indexDailyCoinsIssuedEvent(
    tourist: string,
    amount: bigint,
    originCountry: string,
    event: ethers.EventLog
  ): Promise<void> {
    const receipt = await event.getTransactionReceipt();
    const tx = await event.getTransaction();

    const transactionData: TransactionEvent = {
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      fromAddress: '0x0000000000000000000000000000000000000000', // Minting from zero address
      toAddress: tourist,
      amount: ethers.formatEther(amount),
      gasUsed: receipt.gasUsed,
      gasPrice: tx.gasPrice || 0n,
      transactionFee: ethers.formatEther((receipt.gasUsed * (tx.gasPrice || 0n))),
      transactionType: 'daily_issuance',
      metadata: {
        originCountry,
        touristAddress: tourist,
        eventType: 'DailyCoinsIssued'
      }
    };

    await this.storeTransaction(transactionData);
    console.log(`Indexed daily coins issuance: ${event.transactionHash}`);
  }

  /**
   * Index a CoinsTransferred event
   */
  private async indexCoinsTransferredEvent(
    from: string,
    to: string,
    amount: bigint,
    restaurantId: string,
    event: ethers.EventLog
  ): Promise<void> {
    const receipt = await event.getTransactionReceipt();
    const tx = await event.getTransaction();

    // Get tourist origin country from contract
    const touristData = await this.contract.tourists(from);

    const transactionData: TransactionEvent = {
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      fromAddress: from,
      toAddress: to,
      amount: ethers.formatEther(amount),
      gasUsed: receipt.gasUsed,
      gasPrice: tx.gasPrice || 0n,
      transactionFee: ethers.formatEther((receipt.gasUsed * (tx.gasPrice || 0n))),
      transactionType: 'restaurant_transfer',
      metadata: {
        restaurantId,
        originCountry: touristData.originCountry,
        touristAddress: from,
        restaurantAddress: to,
        eventType: 'CoinsTransferred'
      }
    };

    await this.storeTransaction(transactionData);
    console.log(`Indexed restaurant transfer: ${event.transactionHash}`);
  }

  /**
   * Index a CoinsExpired event
   */
  private async indexCoinsExpiredEvent(
    tourist: string,
    amount: bigint,
    event: ethers.EventLog
  ): Promise<void> {
    const receipt = await event.getTransactionReceipt();
    const tx = await event.getTransaction();

    // Get tourist origin country from contract
    const touristData = await this.contract.tourists(tourist);

    const transactionData: TransactionEvent = {
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      fromAddress: tourist,
      toAddress: '0x0000000000000000000000000000000000000000', // Burning to zero address
      amount: ethers.formatEther(amount),
      gasUsed: receipt.gasUsed,
      gasPrice: tx.gasPrice || 0n,
      transactionFee: ethers.formatEther((receipt.gasUsed * (tx.gasPrice || 0n))),
      transactionType: 'expiration',
      metadata: {
        originCountry: touristData.originCountry,
        touristAddress: tourist,
        eventType: 'CoinsExpired'
      }
    };

    await this.storeTransaction(transactionData);
    console.log(`Indexed coin expiration: ${event.transactionHash}`);
  }

  /**
   * Store transaction data in database
   */
  private async storeTransaction(transactionData: TransactionEvent): Promise<void> {
    const insertQuery = `
      INSERT INTO blockchain_transactions (
        transaction_hash, block_number, from_address, to_address, amount,
        gas_used, gas_price, transaction_fee, status, transaction_type, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (transaction_hash) DO UPDATE SET
        status = EXCLUDED.status,
        confirmed_at = NOW()
    `;

    const params = [
      transactionData.transactionHash,
      transactionData.blockNumber,
      transactionData.fromAddress,
      transactionData.toAddress,
      transactionData.amount,
      transactionData.gasUsed.toString(),
      transactionData.gasPrice.toString(),
      transactionData.transactionFee,
      'confirmed',
      transactionData.transactionType,
      JSON.stringify(transactionData.metadata)
    ];

    await query(insertQuery, params);
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionHash: string,
    status: 'pending' | 'confirmed' | 'failed'
  ): Promise<void> {
    const updateQuery = `
      UPDATE blockchain_transactions 
      SET status = $1, confirmed_at = CASE WHEN $1 = 'confirmed' THEN NOW() ELSE confirmed_at END
      WHERE transaction_hash = $2
    `;

    await query(updateQuery, [status, transactionHash]);
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(transactionHash: string): Promise<any> {
    const selectQuery = `
      SELECT * FROM blockchain_transactions 
      WHERE transaction_hash = $1
    `;

    const result = await query(selectQuery, [transactionHash]);
    return result.rows[0] || null;
  }

  /**
   * Get transactions by address (tourist or restaurant)
   */
  async getTransactionsByAddress(
    address: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    const selectQuery = `
      SELECT * FROM blockchain_transactions 
      WHERE from_address = $1 OR to_address = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(selectQuery, [address, limit, offset]);
    return result.rows;
  }

  /**
   * Get transactions by type
   */
  async getTransactionsByType(
    transactionType: 'daily_issuance' | 'restaurant_transfer' | 'expiration',
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    const selectQuery = `
      SELECT * FROM blockchain_transactions 
      WHERE transaction_type = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(selectQuery, [transactionType, limit, offset]);
    return result.rows;
  }

  /**
   * Get restaurant earnings breakdown by origin country
   */
  async getRestaurantEarningsByOrigin(restaurantAddress: string): Promise<any[]> {
    const selectQuery = `
      SELECT 
        metadata->>'originCountry' as origin_country,
        SUM(amount::decimal) as total_coins,
        COUNT(*) as transaction_count
      FROM blockchain_transactions 
      WHERE to_address = $1 
        AND transaction_type = 'restaurant_transfer'
        AND status = 'confirmed'
      GROUP BY metadata->>'originCountry'
      ORDER BY total_coins DESC
    `;

    const result = await query(selectQuery, [restaurantAddress]);
    return result.rows;
  }

  /**
   * Get daily transaction statistics
   */
  async getDailyTransactionStats(date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const statsQuery = `
      SELECT 
        transaction_type,
        COUNT(*) as transaction_count,
        SUM(amount::decimal) as total_amount,
        AVG(transaction_fee::decimal) as avg_gas_fee
      FROM blockchain_transactions 
      WHERE created_at >= $1 AND created_at <= $2
        AND status = 'confirmed'
      GROUP BY transaction_type
    `;

    const result = await query(statsQuery, [startOfDay, endOfDay]);
    return result.rows;
  }

  /**
   * Backfill historical transactions from a specific block
   */
  async backfillTransactions(fromBlock: number, toBlock?: number): Promise<void> {
    console.log(`Starting backfill from block ${fromBlock}${toBlock ? ` to ${toBlock}` : ''}`);

    const currentBlock = toBlock || await this.provider.getBlockNumber();
    
    // Get historical DailyCoinsIssued events
    const dailyCoinsFilter = this.contract.filters.DailyCoinsIssued();
    const dailyCoinsEvents = await this.contract.queryFilter(dailyCoinsFilter, fromBlock, currentBlock);

    for (const event of dailyCoinsEvents) {
      if (event instanceof ethers.EventLog) {
        await this.indexDailyCoinsIssuedEvent(
          event.args[0], // tourist
          event.args[1], // amount
          event.args[2], // originCountry
          event
        );
      }
    }

    // Get historical CoinsTransferred events
    const transferFilter = this.contract.filters.CoinsTransferred();
    const transferEvents = await this.contract.queryFilter(transferFilter, fromBlock, currentBlock);

    for (const event of transferEvents) {
      if (event instanceof ethers.EventLog) {
        await this.indexCoinsTransferredEvent(
          event.args[0], // from
          event.args[1], // to
          event.args[2], // amount
          event.args[3], // restaurantId
          event
        );
      }
    }

    // Get historical CoinsExpired events
    const expiredFilter = this.contract.filters.CoinsExpired();
    const expiredEvents = await this.contract.queryFilter(expiredFilter, fromBlock, currentBlock);

    for (const event of expiredEvents) {
      if (event instanceof ethers.EventLog) {
        await this.indexCoinsExpiredEvent(
          event.args[0], // tourist
          event.args[1], // amount
          event
        );
      }
    }

    console.log(`Backfill completed. Processed ${dailyCoinsEvents.length + transferEvents.length + expiredEvents.length} events`);
  }
}