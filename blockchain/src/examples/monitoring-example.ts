import { MonitoringService } from '../services/MonitoringService';
import { initializeDatabase } from '../utils/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

async function monitoringExample() {
  console.log('🚀 Tourist Rewards Monitoring System Example');
  
  // Initialize database
  initializeDatabase();
  
  // Create monitoring service
  const monitoringService = new MonitoringService({
    rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
    contractAddress: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    networkName: process.env.NETWORK_NAME || 'hardhat',
    gasPriceThresholdGwei: 50,
    healthCheckIntervalMs: 30000,
    alertWebhookUrl: process.env.ALERT_WEBHOOK_URL
  });

  try {
    // Start monitoring
    console.log('📊 Starting monitoring service...');
    await monitoringService.start();
    
    // Wait a bit for initial data collection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get system metrics
    console.log('\n📈 Getting system metrics...');
    const metrics = await monitoringService.getSystemMetrics();
    
    console.log('Network Health:', {
      network: metrics.networkHealth.network,
      blockNumber: metrics.networkHealth.blockNumber,
      gasPrice: metrics.networkHealth.gasPrice,
      isHealthy: metrics.networkHealth.isHealthy,
      responseTime: metrics.networkHealth.responseTime
    });
    
    console.log('Transaction Stats:', metrics.transactionStats);
    console.log('Performance Metrics:', metrics.performanceMetrics);
    console.log('Alerts:', metrics.alerts);
    
    // Get tourist activity insights
    console.log('\n👥 Getting tourist insights...');
    const touristInsights = await monitoringService.getTouristActivityInsights(7);
    
    console.log('Top Origin Countries:');
    touristInsights.topOriginCountries.slice(0, 3).forEach((country, index) => {
      console.log(`  ${index + 1}. ${country.country}: ${country.tourists} tourists, ${country.totalCoins} SMILE`);
    });
    
    // Get restaurant rankings
    console.log('\n🏪 Getting restaurant rankings...');
    const restaurantRankings = await monitoringService.getRestaurantRankings(5);
    
    console.log('Top Restaurants:');
    restaurantRankings.forEach((restaurant, index) => {
      console.log(`  ${index + 1}. ${restaurant.restaurantId}: ${restaurant.totalCoinsReceived} SMILE`);
    });
    
    // Example of monitoring a specific transaction
    console.log('\n🔍 Example: Monitoring a transaction...');
    const exampleTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    // This would normally be a real transaction hash
    console.log(`Starting to monitor transaction: ${exampleTxHash}`);
    // await monitoringService.monitorTransaction(exampleTxHash);
    
    // Example of backfilling historical data
    console.log('\n🔄 Example: Backfilling historical data...');
    console.log('This would backfill transactions from block 0 to current block');
    // await monitoringService.backfillHistoricalData(0);
    
    console.log('\n✅ Monitoring example completed successfully!');
    console.log('\n💡 Tips:');
    console.log('  - Use the CLI tool: npm run monitoring status');
    console.log('  - Check the API endpoints at /api/monitoring/*');
    console.log('  - Set up webhook alerts with ALERT_WEBHOOK_URL');
    console.log('  - Monitor gas prices and network health automatically');
    
  } catch (error) {
    console.error('❌ Error in monitoring example:', error);
  } finally {
    // Stop monitoring
    console.log('\n🛑 Stopping monitoring service...');
    monitoringService.stop();
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  monitoringExample().catch(console.error);
}

export { monitoringExample };