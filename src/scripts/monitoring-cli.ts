#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { MonitoringService } from '../services/MonitoringService';
import { initializeDatabase } from '../utils/database';

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const program = new Command();

program
  .name('monitoring-cli')
  .description('CLI for managing the Tourist Rewards blockchain monitoring system')
  .version('1.0.0');

// Initialize monitoring service
function createMonitoringService(): MonitoringService {
  const requiredEnvVars = ['RPC_URL', 'CONTRACT_ADDRESS'];
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  return new MonitoringService({
    rpcUrl: process.env.RPC_URL!,
    contractAddress: process.env.CONTRACT_ADDRESS!,
    networkName: process.env.NETWORK_NAME || 'hardhat',
    gasPriceThresholdGwei: parseInt(process.env.GAS_PRICE_THRESHOLD_GWEI || '50'),
    healthCheckIntervalMs: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '30000'),
    alertWebhookUrl: process.env.ALERT_WEBHOOK_URL
  });
}

// Start monitoring command
program
  .command('start')
  .description('Start the monitoring service')
  .option('-d, --daemon', 'Run as daemon process')
  .action(async (options) => {
    try {
      console.log('🚀 Starting Tourist Rewards monitoring service...');
      
      // Initialize database
      initializeDatabase();
      
      const monitoringService = createMonitoringService();
      await monitoringService.start();
      
      console.log('✅ Monitoring service started successfully');
      
      if (options.daemon) {
        console.log('🔄 Running in daemon mode. Press Ctrl+C to stop.');
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
          console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
          monitoringService.stop();
          process.exit(0);
        });
        
        process.on('SIGTERM', () => {
          console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
          monitoringService.stop();
          process.exit(0);
        });
        
        // Keep the process alive
        setInterval(() => {
          // Do nothing, just keep alive
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Failed to start monitoring service:', error);
      process.exit(1);
    }
  });

// Stop monitoring command
program
  .command('stop')
  .description('Stop the monitoring service')
  .action(async () => {
    try {
      console.log('🛑 Stopping monitoring service...');
      
      const monitoringService = createMonitoringService();
      monitoringService.stop();
      
      console.log('✅ Monitoring service stopped');
    } catch (error) {
      console.error('❌ Failed to stop monitoring service:', error);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Get monitoring service status')
  .action(async () => {
    try {
      const monitoringService = createMonitoringService();
      const status = monitoringService.getStatus();
      
      console.log('📊 Monitoring Service Status:');
      console.log(`  Running: ${status.isRunning ? '✅' : '❌'}`);
      console.log(`  Indexer: ${status.indexerRunning ? '✅' : '❌'}`);
      console.log(`  Monitor: ${status.monitorRunning ? '✅' : '❌'}`);
      console.log(`  Network: ${status.config.networkName}`);
      console.log(`  Contract: ${status.config.contractAddress}`);
      console.log(`  Gas Threshold: ${status.config.gasPriceThresholdGwei} Gwei`);
    } catch (error) {
      console.error('❌ Failed to get status:', error);
      process.exit(1);
    }
  });

// Metrics command
program
  .command('metrics')
  .description('Get system metrics')
  .option('-h, --hours <hours>', 'Hours to look back', '24')
  .action(async (options) => {
    try {
      initializeDatabase();
      
      const monitoringService = createMonitoringService();
      const metrics = await monitoringService.getSystemMetrics();
      
      console.log('📈 System Metrics:');
      console.log('\n🌐 Network Health:');
      console.log(`  Network: ${metrics.networkHealth.network}`);
      console.log(`  Block Number: ${metrics.networkHealth.blockNumber}`);
      console.log(`  Gas Price: ${metrics.networkHealth.gasPrice} Gwei`);
      console.log(`  Healthy: ${metrics.networkHealth.isHealthy ? '✅' : '❌'}`);
      console.log(`  Response Time: ${metrics.networkHealth.responseTime}ms`);
      
      console.log('\n💰 Transaction Stats:');
      console.log(`  Total Transactions: ${metrics.transactionStats.totalTransactions}`);
      console.log(`  Success Rate: ${metrics.transactionStats.successRate.toFixed(2)}%`);
      console.log(`  Average Gas Fee: ${metrics.transactionStats.averageGasFee} ETH`);
      console.log(`  Daily Volume: ${metrics.transactionStats.dailyVolume} SMILE`);
      
      console.log('\n⚡ Performance:');
      console.log(`  Average Response Time: ${metrics.performanceMetrics.averageResponseTime.toFixed(2)}ms`);
      console.log(`  Uptime: ${metrics.performanceMetrics.uptimePercentage.toFixed(2)}%`);
      console.log(`  Block Production Rate: ${metrics.performanceMetrics.blockProductionRate.toFixed(2)} blocks/hour`);
      
      console.log('\n🚨 Alerts (last 24h):');
      console.log(`  Gas Price Alerts: ${metrics.alerts.gasPriceAlerts}`);
      console.log(`  Network Health Alerts: ${metrics.alerts.networkHealthAlerts}`);
      console.log(`  Transaction Failures: ${metrics.alerts.transactionFailures}`);
    } catch (error) {
      console.error('❌ Failed to get metrics:', error);
      process.exit(1);
    }
  });

// Backfill command
program
  .command('backfill')
  .description('Backfill historical transaction data')
  .requiredOption('-f, --from-block <block>', 'Starting block number')
  .option('-t, --to-block <block>', 'Ending block number (optional)')
  .action(async (options) => {
    try {
      console.log('🔄 Starting historical data backfill...');
      
      initializeDatabase();
      
      const fromBlock = parseInt(options.fromBlock);
      const toBlock = options.toBlock ? parseInt(options.toBlock) : undefined;
      
      if (isNaN(fromBlock)) {
        console.error('❌ Invalid from-block number');
        process.exit(1);
      }
      
      if (toBlock && isNaN(toBlock)) {
        console.error('❌ Invalid to-block number');
        process.exit(1);
      }
      
      const monitoringService = createMonitoringService();
      await monitoringService.backfillHistoricalData(fromBlock, toBlock);
      
      console.log('✅ Backfill completed successfully');
    } catch (error) {
      console.error('❌ Backfill failed:', error);
      process.exit(1);
    }
  });

// Insights command
program
  .command('insights')
  .description('Get tourist and restaurant insights')
  .option('-d, --days <days>', 'Days to look back', '7')
  .action(async (options) => {
    try {
      initializeDatabase();
      
      const days = parseInt(options.days);
      const monitoringService = createMonitoringService();
      
      const [touristInsights, restaurantRankings] = await Promise.all([
        monitoringService.getTouristActivityInsights(days),
        monitoringService.getRestaurantRankings(10)
      ]);
      
      console.log(`📊 Tourist & Restaurant Insights (last ${days} days):`);
      
      console.log('\n👥 Top Origin Countries:');
      touristInsights.topOriginCountries.slice(0, 5).forEach((country, index) => {
        console.log(`  ${index + 1}. ${country.country}: ${country.tourists} tourists, ${country.totalCoins} SMILE`);
      });
      
      console.log('\n🏪 Top Restaurants:');
      restaurantRankings.slice(0, 5).forEach((restaurant, index) => {
        console.log(`  ${index + 1}. ${restaurant.restaurantId}: ${restaurant.totalCoinsReceived} SMILE from ${restaurant.uniqueTourists} tourists`);
      });
      
      console.log('\n📈 Recent Activity:');
      const recentActivity = touristInsights.dailyActiveUsers.slice(0, 3);
      recentActivity.forEach(day => {
        console.log(`  ${day.date}: ${day.count} active tourists`);
      });
    } catch (error) {
      console.error('❌ Failed to get insights:', error);
      process.exit(1);
    }
  });

// Health check command
program
  .command('health')
  .description('Perform network health check')
  .action(async () => {
    try {
      const monitoringService = createMonitoringService();
      const networkMonitor = monitoringService['networkMonitor'];
      const health = await networkMonitor.getCurrentNetworkStatus();
      
      console.log('🏥 Network Health Check:');
      console.log(`  Network: ${health.network}`);
      console.log(`  Status: ${health.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
      console.log(`  Block Number: ${health.blockNumber}`);
      console.log(`  Gas Price: ${health.gasPrice} Gwei`);
      console.log(`  Response Time: ${health.responseTime}ms`);
      console.log(`  Last Checked: ${health.lastChecked.toISOString()}`);
      
      if (!health.isHealthy) {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    }
  });

// Transaction command
program
  .command('transaction <hash>')
  .description('Get transaction details')
  .action(async (hash) => {
    try {
      initializeDatabase();
      
      const monitoringService = createMonitoringService();
      const transactionIndexer = monitoringService['transactionIndexer'];
      const transaction = await transactionIndexer.getTransaction(hash);
      
      if (!transaction) {
        console.log('❌ Transaction not found');
        process.exit(1);
      }
      
      console.log('🔍 Transaction Details:');
      console.log(`  Hash: ${transaction.transaction_hash}`);
      console.log(`  Block: ${transaction.block_number}`);
      console.log(`  From: ${transaction.from_address}`);
      console.log(`  To: ${transaction.to_address}`);
      console.log(`  Amount: ${transaction.amount} SMILE`);
      console.log(`  Type: ${transaction.transaction_type}`);
      console.log(`  Status: ${transaction.status}`);
      console.log(`  Gas Used: ${transaction.gas_used}`);
      console.log(`  Gas Price: ${transaction.gas_price} wei`);
      console.log(`  Fee: ${transaction.transaction_fee} ETH`);
      console.log(`  Created: ${transaction.created_at}`);
      
      if (transaction.metadata) {
        console.log('  Metadata:');
        const metadata = JSON.parse(transaction.metadata);
        Object.entries(metadata).forEach(([key, value]) => {
          console.log(`    ${key}: ${value}`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to get transaction:', error);
      process.exit(1);
    }
  });

program.parse();