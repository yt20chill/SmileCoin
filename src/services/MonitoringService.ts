import { TransactionIndexer } from './TransactionIndexer';
import { NetworkMonitor, GasPriceAlert, NetworkHealth, TransactionFailure } from './NetworkMonitor';
import { query } from '../utils/database';
import SmileCoinABI from '../contracts/SmileCoin.json';

export interface MonitoringConfig {
  rpcUrl: string;
  contractAddress: string;
  networkName: string;
  gasPriceThresholdGwei?: number;
  healthCheckIntervalMs?: number;
  alertWebhookUrl?: string;
}

export interface SystemMetrics {
  networkHealth: NetworkHealth;
  transactionStats: {
    totalTransactions: number;
    successRate: number;
    averageGasFee: string;
    dailyVolume: string;
  };
  performanceMetrics: {
    averageResponseTime: number;
    uptimePercentage: number;
    blockProductionRate: number;
  };
  alerts: {
    gasPriceAlerts: number;
    networkHealthAlerts: number;
    transactionFailures: number;
  };
}

export class MonitoringService {
  private transactionIndexer: TransactionIndexer;
  private networkMonitor: NetworkMonitor;
  private config: MonitoringConfig;
  private isRunning: boolean = false;

  constructor(config: MonitoringConfig) {
    this.config = config;
    
    this.transactionIndexer = new TransactionIndexer(
      config.rpcUrl,
      config.contractAddress,
      SmileCoinABI.abi
    );

    this.networkMonitor = new NetworkMonitor(
      config.rpcUrl,
      config.networkName,
      {
        gasPriceThresholdGwei: config.gasPriceThresholdGwei,
        healthCheckIntervalMs: config.healthCheckIntervalMs
      }
    );

    this.setupAlertHandlers();
  }

  /**
   * Start the complete monitoring system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Monitoring service is already running');
      return;
    }

    console.log('Starting comprehensive monitoring service...');
    this.isRunning = true;

    try {
      // Start transaction indexing
      await this.transactionIndexer.startIndexing();

      // Start network monitoring
      await this.networkMonitor.startMonitoring();

      console.log('Monitoring service started successfully');
    } catch (error) {
      console.error('Failed to start monitoring service:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the monitoring system
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping monitoring service...');

    this.transactionIndexer.stopIndexing();
    this.networkMonitor.stopMonitoring();

    this.isRunning = false;
    console.log('Monitoring service stopped');
  }

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const [networkHealth, transactionStats, performanceMetrics, alertCounts] = await Promise.all([
      this.networkMonitor.getCurrentNetworkStatus(),
      this.getTransactionStatistics(),
      this.networkMonitor.getPerformanceMetrics(24),
      this.getAlertCounts()
    ]);

    return {
      networkHealth,
      transactionStats,
      performanceMetrics,
      alerts: alertCounts
    };
  }

  /**
   * Get transaction statistics for dashboard
   */
  async getTransactionStatistics(hours: number = 24): Promise<{
    totalTransactions: number;
    successRate: number;
    averageGasFee: string;
    dailyVolume: string;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const statsQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        AVG(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) * 100 as success_rate,
        AVG(transaction_fee::decimal) as avg_gas_fee,
        SUM(CASE WHEN transaction_type = 'restaurant_transfer' THEN amount::decimal ELSE 0 END) as daily_volume
      FROM blockchain_transactions 
      WHERE created_at >= $1
    `;

    const result = await query(statsQuery, [since]);
    const row = result.rows[0];

    return {
      totalTransactions: parseInt(row?.total_transactions || '0'),
      successRate: parseFloat(row?.success_rate || '0'),
      averageGasFee: (row?.avg_gas_fee || '0').toString(),
      dailyVolume: (row?.daily_volume || '0').toString()
    };
  }

  /**
   * Get tourist activity insights
   */
  async getTouristActivityInsights(days: number = 7): Promise<{
    dailyActiveUsers: Array<{ date: string; count: number }>;
    topOriginCountries: Array<{ country: string; tourists: number; totalCoins: string }>;
    coinDistributionTrends: Array<{ date: string; coinsIssued: string; coinsTransferred: string }>;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Daily active users (tourists who received or transferred coins)
    const dailyUsersQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT from_address) as count
      FROM blockchain_transactions 
      WHERE created_at >= $1 
        AND transaction_type IN ('daily_issuance', 'restaurant_transfer')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Top origin countries
    const topCountriesQuery = `
      SELECT 
        metadata->>'originCountry' as country,
        COUNT(DISTINCT from_address) as tourists,
        SUM(amount::decimal) as total_coins
      FROM blockchain_transactions 
      WHERE created_at >= $1 
        AND transaction_type = 'daily_issuance'
        AND metadata->>'originCountry' IS NOT NULL
      GROUP BY metadata->>'originCountry'
      ORDER BY total_coins DESC
      LIMIT 10
    `;

    // Coin distribution trends
    const trendsQuery = `
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN transaction_type = 'daily_issuance' THEN amount::decimal ELSE 0 END) as coins_issued,
        SUM(CASE WHEN transaction_type = 'restaurant_transfer' THEN amount::decimal ELSE 0 END) as coins_transferred
      FROM blockchain_transactions 
      WHERE created_at >= $1 
        AND status = 'confirmed'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const [dailyUsersResult, topCountriesResult, trendsResult] = await Promise.all([
      query(dailyUsersQuery, [since]),
      query(topCountriesQuery, [since]),
      query(trendsQuery, [since])
    ]);

    return {
      dailyActiveUsers: dailyUsersResult.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count)
      })),
      topOriginCountries: topCountriesResult.rows.map((row: any) => ({
        country: row.country,
        tourists: parseInt(row.tourists),
        totalCoins: row.total_coins
      })),
      coinDistributionTrends: trendsResult.rows.map((row: any) => ({
        date: row.date,
        coinsIssued: row.coins_issued,
        coinsTransferred: row.coins_transferred
      }))
    };
  }

  /**
   * Get restaurant performance rankings
   */
  async getRestaurantRankings(limit: number = 20): Promise<Array<{
    restaurantAddress: string;
    restaurantId: string;
    totalCoinsReceived: string;
    uniqueTourists: number;
    averageCoinsPerTourist: string;
    topOriginCountry: string;
  }>> {
    const rankingsQuery = `
      SELECT 
        to_address as restaurant_address,
        metadata->>'restaurantId' as restaurant_id,
        SUM(amount::decimal) as total_coins_received,
        COUNT(DISTINCT from_address) as unique_tourists,
        AVG(amount::decimal) as avg_coins_per_tourist,
        MODE() WITHIN GROUP (ORDER BY metadata->>'originCountry') as top_origin_country
      FROM blockchain_transactions 
      WHERE transaction_type = 'restaurant_transfer' 
        AND status = 'confirmed'
        AND metadata->>'restaurantId' IS NOT NULL
      GROUP BY to_address, metadata->>'restaurantId'
      ORDER BY total_coins_received DESC
      LIMIT $1
    `;

    const result = await query(rankingsQuery, [limit]);
    
    return result.rows.map((row: any) => ({
      restaurantAddress: row.restaurant_address,
      restaurantId: row.restaurant_id,
      totalCoinsReceived: row.total_coins_received,
      uniqueTourists: parseInt(row.unique_tourists),
      averageCoinsPerTourist: row.avg_coins_per_tourist,
      topOriginCountry: row.top_origin_country
    }));
  }

  /**
   * Monitor a specific transaction and update its status
   */
  async monitorTransaction(transactionHash: string): Promise<void> {
    // Monitor with network monitor for failures
    await this.networkMonitor.monitorTransaction(transactionHash);

    // Update status in indexer
    try {
      const receipt = await this.networkMonitor['provider'].waitForTransaction(transactionHash, 1, 300000);
      const status = receipt?.status === 1 ? 'confirmed' : 'failed';
      await this.transactionIndexer.updateTransactionStatus(transactionHash, status);
    } catch (error) {
      await this.transactionIndexer.updateTransactionStatus(transactionHash, 'failed');
    }
  }

  /**
   * Backfill historical data
   */
  async backfillHistoricalData(fromBlock: number, toBlock?: number): Promise<void> {
    console.log('Starting historical data backfill...');
    await this.transactionIndexer.backfillTransactions(fromBlock, toBlock);
    console.log('Historical data backfill completed');
  }

  /**
   * Setup alert handlers for notifications
   */
  private setupAlertHandlers(): void {
    this.networkMonitor.setAlertCallbacks({
      onGasPriceAlert: (alert: GasPriceAlert) => {
        this.handleGasPriceAlert(alert);
      },
      onNetworkHealthAlert: (health: NetworkHealth) => {
        this.handleNetworkHealthAlert(health);
      },
      onTransactionFailure: (failure: TransactionFailure) => {
        this.handleTransactionFailure(failure);
      }
    });
  }

  /**
   * Handle gas price alerts
   */
  private async handleGasPriceAlert(alert: GasPriceAlert): Promise<void> {
    console.warn(`🚨 Gas Price Alert: ${alert.network} gas price is ${alert.currentGasPrice} Gwei (${alert.percentageIncrease.toFixed(2)}% increase)`);
    
    // Store alert in database for tracking
    await this.storeAlert('gas_price', alert);

    // Send webhook notification if configured
    if (this.config.alertWebhookUrl) {
      await this.sendWebhookAlert('gas_price_spike', {
        message: `Gas price spike detected on ${alert.network}`,
        details: alert
      });
    }
  }

  /**
   * Handle network health alerts
   */
  private async handleNetworkHealthAlert(health: NetworkHealth): Promise<void> {
    console.error(`🚨 Network Health Alert: ${health.network} is unhealthy (Response time: ${health.responseTime}ms)`);
    
    await this.storeAlert('network_health', health);

    if (this.config.alertWebhookUrl) {
      await this.sendWebhookAlert('network_unhealthy', {
        message: `Network ${health.network} is experiencing issues`,
        details: health
      });
    }
  }

  /**
   * Handle transaction failure alerts
   */
  private async handleTransactionFailure(failure: TransactionFailure): Promise<void> {
    console.error(`🚨 Transaction Failure: ${failure.transactionHash} failed - ${failure.error}`);
    
    await this.storeAlert('transaction_failure', failure);

    if (this.config.alertWebhookUrl) {
      await this.sendWebhookAlert('transaction_failed', {
        message: `Transaction failed: ${failure.transactionHash}`,
        details: failure
      });
    }
  }

  /**
   * Store alert in database for tracking
   */
  private async storeAlert(alertType: string, alertData: any): Promise<void> {
    const insertQuery = `
      INSERT INTO api_usage (api_key_id, endpoint, method, status_code, response_time_ms, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    // Using api_usage table as a temporary solution for alerts
    // In production, you'd want a dedicated alerts table
    const params = [
      '00000000-0000-0000-0000-000000000000', // Placeholder UUID for system alerts
      `/alerts/${alertType}`,
      'ALERT',
      alertType === 'gas_price' ? 200 : (alertType === 'network_health' ? 503 : 500),
      0
    ];

    await query(insertQuery, params);
  }

  /**
   * Send webhook alert notification
   */
  private async sendWebhookAlert(alertType: string, payload: any): Promise<void> {
    if (!this.config.alertWebhookUrl) {
      return;
    }

    try {
      const response = await fetch(this.config.alertWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertType,
          timestamp: new Date().toISOString(),
          network: this.config.networkName,
          ...payload
        })
      });

      if (!response.ok) {
        console.error('Failed to send webhook alert:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending webhook alert:', error);
    }
  }

  /**
   * Get alert counts for metrics
   */
  private async getAlertCounts(hours: number = 24): Promise<{
    gasPriceAlerts: number;
    networkHealthAlerts: number;
    transactionFailures: number;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // This is a simplified implementation using the api_usage table
    // In production, you'd want dedicated alert tracking
    const alertQuery = `
      SELECT 
        endpoint,
        COUNT(*) as count
      FROM api_usage 
      WHERE created_at >= $1 
        AND method = 'ALERT'
      GROUP BY endpoint
    `;

    const result = await query(alertQuery, [since]);
    
    const counts = {
      gasPriceAlerts: 0,
      networkHealthAlerts: 0,
      transactionFailures: 0
    };

    result.rows.forEach((row: any) => {
      if (row.endpoint.includes('gas_price')) {
        counts.gasPriceAlerts = parseInt(row.count);
      } else if (row.endpoint.includes('network_health')) {
        counts.networkHealthAlerts = parseInt(row.count);
      } else if (row.endpoint.includes('transaction_failure')) {
        counts.transactionFailures = parseInt(row.count);
      }
    });

    return counts;
  }

  /**
   * Get monitoring service status
   */
  getStatus(): {
    isRunning: boolean;
    indexerRunning: boolean;
    monitorRunning: boolean;
    config: MonitoringConfig;
  } {
    return {
      isRunning: this.isRunning,
      indexerRunning: this.transactionIndexer['isListening'],
      monitorRunning: this.networkMonitor['isMonitoring'],
      config: this.config
    };
  }
}