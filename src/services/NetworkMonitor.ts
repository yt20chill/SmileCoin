import { ethers } from 'ethers';
import { query } from '../utils/database';

export interface NetworkHealth {
  network: string;
  blockNumber: number;
  gasPrice: string;
  isHealthy: boolean;
  responseTime: number;
  lastChecked: Date;
}

export interface GasPriceAlert {
  network: string;
  currentGasPrice: string;
  thresholdGasPrice: string;
  percentageIncrease: number;
  timestamp: Date;
}

export interface TransactionFailure {
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  error: string;
  gasUsed: string;
  gasPrice: string;
  timestamp: Date;
}

export class NetworkMonitor {
  private provider: ethers.Provider;
  private networkName: string;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private gasPriceThreshold: bigint;
  private healthCheckInterval: number;

  // Alert callbacks
  private onGasPriceAlert?: (alert: GasPriceAlert) => void;
  private onNetworkHealthAlert?: (health: NetworkHealth) => void;
  private onTransactionFailure?: (failure: TransactionFailure) => void;

  constructor(
    rpcUrl: string,
    networkName: string,
    options: {
      gasPriceThresholdGwei?: number;
      healthCheckIntervalMs?: number;
    } = {}
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.networkName = networkName;
    this.gasPriceThreshold = ethers.parseUnits(
      (options.gasPriceThresholdGwei || 50).toString(),
      'gwei'
    );
    this.healthCheckInterval = options.healthCheckIntervalMs || 30000; // 30 seconds
  }

  /**
   * Start network monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Network monitor is already running');
      return;
    }

    console.log(`Starting network monitoring for ${this.networkName}...`);
    this.isMonitoring = true;

    // Perform initial health check
    await this.performHealthCheck();

    // Set up periodic health checks
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Error during health check:', error);
      }
    }, this.healthCheckInterval);

    console.log(`Network monitoring started for ${this.networkName}`);
  }

  /**
   * Stop network monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log(`Stopping network monitoring for ${this.networkName}...`);
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    console.log(`Network monitoring stopped for ${this.networkName}`);
  }

  /**
   * Set alert callbacks
   */
  setAlertCallbacks(callbacks: {
    onGasPriceAlert?: (alert: GasPriceAlert) => void;
    onNetworkHealthAlert?: (health: NetworkHealth) => void;
    onTransactionFailure?: (failure: TransactionFailure) => void;
  }): void {
    this.onGasPriceAlert = callbacks.onGasPriceAlert;
    this.onNetworkHealthAlert = callbacks.onNetworkHealthAlert;
    this.onTransactionFailure = callbacks.onTransactionFailure;
  }

  /**
   * Perform comprehensive network health check
   */
  private async performHealthCheck(): Promise<NetworkHealth> {
    const startTime = Date.now();
    let isHealthy = true;
    let blockNumber = 0;
    let gasPrice = '0';

    try {
      // Check if we can get the latest block number
      blockNumber = await this.provider.getBlockNumber();
      
      // Check current gas price
      const feeData = await this.provider.getFeeData();
      gasPrice = ethers.formatUnits(feeData.gasPrice || 0n, 'gwei');

      // Check if gas price is above threshold
      if (feeData.gasPrice && feeData.gasPrice > this.gasPriceThreshold) {
        await this.handleGasPriceAlert(feeData.gasPrice);
      }

    } catch (error) {
      console.error(`Network health check failed for ${this.networkName}:`, error);
      isHealthy = false;
    }

    const responseTime = Date.now() - startTime;
    const health: NetworkHealth = {
      network: this.networkName,
      blockNumber,
      gasPrice,
      isHealthy,
      responseTime,
      lastChecked: new Date()
    };

    // Store health data in database
    await this.storeNetworkHealth(health);

    // Trigger alert if network is unhealthy
    if (!isHealthy && this.onNetworkHealthAlert) {
      this.onNetworkHealthAlert(health);
    }

    return health;
  }

  /**
   * Handle gas price alerts
   */
  private async handleGasPriceAlert(currentGasPrice: bigint): Promise<void> {
    // Get historical average gas price for comparison
    const historicalAverage = await this.getHistoricalAverageGasPrice();
    const thresholdGasPrice = this.gasPriceThreshold;
    
    const percentageIncrease = historicalAverage > 0n 
      ? Number((currentGasPrice - historicalAverage) * 100n / historicalAverage)
      : 0;

    const alert: GasPriceAlert = {
      network: this.networkName,
      currentGasPrice: ethers.formatUnits(currentGasPrice, 'gwei'),
      thresholdGasPrice: ethers.formatUnits(thresholdGasPrice, 'gwei'),
      percentageIncrease,
      timestamp: new Date()
    };

    console.warn(`Gas price alert for ${this.networkName}:`, alert);

    if (this.onGasPriceAlert) {
      this.onGasPriceAlert(alert);
    }
  }

  /**
   * Monitor specific transaction for failure
   */
  async monitorTransaction(transactionHash: string): Promise<void> {
    try {
      const receipt = await this.provider.waitForTransaction(transactionHash, 1, 300000); // 5 minute timeout
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      if (receipt.status === 0) {
        // Transaction failed
        const tx = await this.provider.getTransaction(transactionHash);
        if (tx) {
          const failure: TransactionFailure = {
            transactionHash,
            fromAddress: tx.from,
            toAddress: tx.to || '',
            error: 'Transaction reverted',
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: ethers.formatUnits(tx.gasPrice || 0n, 'gwei'),
            timestamp: new Date()
          };

          console.error(`Transaction failed: ${transactionHash}`, failure);

          if (this.onTransactionFailure) {
            this.onTransactionFailure(failure);
          }

          // Store failure in database
          await this.storeTransactionFailure(failure);
        }
      }
    } catch (error) {
      console.error(`Error monitoring transaction ${transactionHash}:`, error);
      
      const failure: TransactionFailure = {
        transactionHash,
        fromAddress: '',
        toAddress: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        gasUsed: '0',
        gasPrice: '0',
        timestamp: new Date()
      };

      if (this.onTransactionFailure) {
        this.onTransactionFailure(failure);
      }

      await this.storeTransactionFailure(failure);
    }
  }

  /**
   * Get current network status
   */
  async getCurrentNetworkStatus(): Promise<NetworkHealth> {
    return await this.performHealthCheck();
  }

  /**
   * Get network health history
   */
  async getNetworkHealthHistory(hours: number = 24): Promise<NetworkHealth[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const selectQuery = `
      SELECT network_name, block_number, gas_price, is_healthy, response_time_ms, created_at
      FROM network_status 
      WHERE network_name = $1 AND created_at >= $2
      ORDER BY created_at DESC
    `;

    const result = await query(selectQuery, [this.networkName, since]);
    
    return result.rows.map((row: any) => ({
      network: row.network_name,
      blockNumber: parseInt(row.block_number),
      gasPrice: row.gas_price,
      isHealthy: row.is_healthy,
      responseTime: row.response_time_ms,
      lastChecked: row.created_at
    }));
  }

  /**
   * Get transaction failure statistics
   */
  async getTransactionFailureStats(hours: number = 24): Promise<{
    totalFailures: number;
    failureRate: number;
    commonErrors: Array<{ error: string; count: number }>;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get total failures
    const failureQuery = `
      SELECT COUNT(*) as total_failures
      FROM blockchain_transactions 
      WHERE status = 'failed' AND created_at >= $1
    `;

    // Get total transactions
    const totalQuery = `
      SELECT COUNT(*) as total_transactions
      FROM blockchain_transactions 
      WHERE created_at >= $1
    `;

    // Get common errors (this would need a separate failures table in a real implementation)
    const errorsQuery = `
      SELECT 
        metadata->>'error' as error,
        COUNT(*) as count
      FROM blockchain_transactions 
      WHERE status = 'failed' AND created_at >= $1
        AND metadata->>'error' IS NOT NULL
      GROUP BY metadata->>'error'
      ORDER BY count DESC
      LIMIT 10
    `;

    const [failureResult, totalResult, errorsResult] = await Promise.all([
      query(failureQuery, [since]),
      query(totalQuery, [since]),
      query(errorsQuery, [since])
    ]);

    const totalFailures = parseInt(failureResult.rows[0]?.total_failures || '0');
    const totalTransactions = parseInt(totalResult.rows[0]?.total_transactions || '0');
    const failureRate = totalTransactions > 0 ? (totalFailures / totalTransactions) * 100 : 0;

    return {
      totalFailures,
      failureRate,
      commonErrors: errorsResult.rows.map((row: any) => ({
        error: row.error,
        count: parseInt(row.count)
      }))
    };
  }

  /**
   * Store network health data in database
   */
  private async storeNetworkHealth(health: NetworkHealth): Promise<void> {
    const insertQuery = `
      INSERT INTO network_status (network_name, block_number, gas_price, is_healthy, response_time_ms)
      VALUES ($1, $2, $3, $4, $5)
    `;

    const params = [
      health.network,
      health.blockNumber,
      health.gasPrice,
      health.isHealthy,
      health.responseTime
    ];

    await query(insertQuery, params);
  }

  /**
   * Store transaction failure data
   */
  private async storeTransactionFailure(failure: TransactionFailure): Promise<void> {
    // Update the transaction status in blockchain_transactions table
    const updateQuery = `
      UPDATE blockchain_transactions 
      SET status = 'failed', 
          metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
      WHERE transaction_hash = $1
    `;

    const metadata = {
      error: failure.error,
      failureTimestamp: failure.timestamp.toISOString()
    };

    await query(updateQuery, [failure.transactionHash, JSON.stringify(metadata)]);
  }

  /**
   * Get historical average gas price
   */
  private async getHistoricalAverageGasPrice(): Promise<bigint> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    const avgQuery = `
      SELECT AVG(gas_price::decimal) as avg_gas_price
      FROM network_status 
      WHERE network_name = $1 AND created_at >= $2
    `;

    const result = await query(avgQuery, [this.networkName, since]);
    const avgGasPrice = result.rows[0]?.avg_gas_price || '0';
    
    return ethers.parseUnits(avgGasPrice.toString(), 'gwei');
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(hours: number = 24): Promise<{
    averageResponseTime: number;
    uptimePercentage: number;
    averageGasPrice: string;
    blockProductionRate: number;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const metricsQuery = `
      SELECT 
        AVG(response_time_ms) as avg_response_time,
        AVG(CASE WHEN is_healthy THEN 1 ELSE 0 END) * 100 as uptime_percentage,
        AVG(gas_price::decimal) as avg_gas_price,
        (MAX(block_number) - MIN(block_number)) / EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) * 3600 as blocks_per_hour
      FROM network_status 
      WHERE network_name = $1 AND created_at >= $2
    `;

    const result = await query(metricsQuery, [this.networkName, since]);
    const row = result.rows[0];

    return {
      averageResponseTime: parseFloat(row?.avg_response_time || '0'),
      uptimePercentage: parseFloat(row?.uptime_percentage || '0'),
      averageGasPrice: (row?.avg_gas_price || '0').toString(),
      blockProductionRate: parseFloat(row?.blocks_per_hour || '0')
    };
  }
}