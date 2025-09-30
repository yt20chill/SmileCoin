import express from 'express';
import { MonitoringService } from '../../services/MonitoringService';
import { TransactionIndexer } from '../../services/TransactionIndexer';
import { NetworkMonitor } from '../../services/NetworkMonitor';

const router = express.Router();

// Global monitoring service instance (would be initialized in app.ts)
let monitoringService: MonitoringService;

/**
 * Initialize monitoring service
 */
export function initializeMonitoring(config: {
  rpcUrl: string;
  contractAddress: string;
  networkName: string;
  gasPriceThresholdGwei?: number;
  healthCheckIntervalMs?: number;
  alertWebhookUrl?: string;
}): void {
  monitoringService = new MonitoringService(config);
}

/**
 * GET /api/monitoring/status
 * Get monitoring service status
 */
router.get('/status', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const status = monitoringService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get monitoring status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/monitoring/start
 * Start monitoring service
 */
router.post('/start', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    await monitoringService.start();
    res.json({
      success: true,
      message: 'Monitoring service started successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to start monitoring service',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/monitoring/stop
 * Stop monitoring service
 */
router.post('/stop', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    monitoringService.stop();
    res.json({
      success: true,
      message: 'Monitoring service stopped successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to stop monitoring service',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/monitoring/metrics
 * Get comprehensive system metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const metrics = await monitoringService.getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get system metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/monitoring/network/health
 * Get current network health status
 */
router.get('/network/health', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const networkMonitor = monitoringService['networkMonitor'];
    const health = await networkMonitor.getCurrentNetworkStatus();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get network health',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/monitoring/network/history
 * Get network health history
 */
router.get('/network/history', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const hours = parseInt(req.query.hours as string) || 24;
    const networkMonitor = monitoringService['networkMonitor'];
    const history = await networkMonitor.getNetworkHealthHistory(hours);
    
    res.json({
      hours,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get network history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/monitoring/transactions/stats
 * Get transaction statistics
 */
router.get('/transactions/stats', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const hours = parseInt(req.query.hours as string) || 24;
    const stats = await monitoringService.getTransactionStatistics(hours);
    
    res.json({
      hours,
      ...stats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get transaction statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/monitoring/transactions/failures
 * Get transaction failure statistics
 */
router.get('/transactions/failures', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const hours = parseInt(req.query.hours as string) || 24;
    const networkMonitor = monitoringService['networkMonitor'];
    const failureStats = await networkMonitor.getTransactionFailureStats(hours);
    
    res.json({
      hours,
      ...failureStats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get transaction failure statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/monitoring/insights/tourists
 * Get tourist activity insights
 */
router.get('/insights/tourists', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const days = parseInt(req.query.days as string) || 7;
    const insights = await monitoringService.getTouristActivityInsights(days);
    
    res.json({
      days,
      ...insights
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get tourist insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/monitoring/insights/restaurants
 * Get restaurant performance rankings
 */
router.get('/insights/restaurants', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const rankings = await monitoringService.getRestaurantRankings(limit);
    
    res.json({
      limit,
      restaurants: rankings
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get restaurant rankings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/monitoring/transactions/:hash
 * Get specific transaction details
 */
router.get('/transactions/:hash', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const { hash } = req.params;
    const transactionIndexer = monitoringService['transactionIndexer'];
    const transaction = await transactionIndexer.getTransaction(hash);
    
    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get transaction details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/monitoring/transactions/address/:address
 * Get transactions for a specific address
 */
router.get('/transactions/address/:address', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const transactionIndexer = monitoringService['transactionIndexer'];
    const transactions = await transactionIndexer.getTransactionsByAddress(address, limit, offset);
    
    res.json({
      address,
      limit,
      offset,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get transactions for address',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/monitoring/transactions/type/:type
 * Get transactions by type
 */
router.get('/transactions/type/:type', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const { type } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (!['daily_issuance', 'restaurant_transfer', 'expiration'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid transaction type',
        validTypes: ['daily_issuance', 'restaurant_transfer', 'expiration']
      });
    }

    const transactionIndexer = monitoringService['transactionIndexer'];
    const transactions = await transactionIndexer.getTransactionsByType(
      type as 'daily_issuance' | 'restaurant_transfer' | 'expiration',
      limit,
      offset
    );
    
    res.json({
      type,
      limit,
      offset,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get transactions by type',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/monitoring/transactions/:hash/monitor
 * Monitor a specific transaction
 */
router.post('/transactions/:hash/monitor', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const { hash } = req.params;
    
    // Start monitoring the transaction (async)
    monitoringService.monitorTransaction(hash).catch(error => {
      console.error(`Error monitoring transaction ${hash}:`, error);
    });
    
    res.json({
      success: true,
      message: `Started monitoring transaction ${hash}`,
      transactionHash: hash
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to start transaction monitoring',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/monitoring/backfill
 * Backfill historical transaction data
 */
router.post('/backfill', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const { fromBlock, toBlock } = req.body;
    
    if (!fromBlock || typeof fromBlock !== 'number') {
      return res.status(400).json({
        error: 'fromBlock is required and must be a number'
      });
    }

    // Start backfill process (async)
    monitoringService.backfillHistoricalData(fromBlock, toBlock).catch(error => {
      console.error('Error during backfill:', error);
    });
    
    res.json({
      success: true,
      message: `Started backfill from block ${fromBlock}${toBlock ? ` to ${toBlock}` : ''}`,
      fromBlock,
      toBlock
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to start backfill',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/monitoring/performance
 * Get performance metrics
 */
router.get('/performance', async (req, res) => {
  try {
    if (!monitoringService) {
      return res.status(503).json({
        error: 'Monitoring service not initialized'
      });
    }

    const hours = parseInt(req.query.hours as string) || 24;
    const networkMonitor = monitoringService['networkMonitor'];
    const performance = await networkMonitor.getPerformanceMetrics(hours);
    
    res.json({
      hours,
      ...performance
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
export { initializeMonitoring };