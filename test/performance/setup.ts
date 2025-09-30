/**
 * Performance Test Setup
 * 
 * This file runs before each performance test file and sets up the testing environment
 * with performance monitoring capabilities
 */

import dotenv from 'dotenv';
import path from 'path';
import { performance } from 'perf_hooks';

// Load test environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.test') });

// Set performance-specific environment variables
if (!process.env.TEST_API_URL) {
  process.env.TEST_API_URL = 'http://localhost:3000';
}

if (!process.env.TEST_API_KEY) {
  process.env.TEST_API_KEY = 'test-api-key-performance';
}

// Performance monitoring globals
global.performanceMetrics = {
  testStartTime: 0,
  testEndTime: 0,
  memoryUsage: [],
  responseTimeThresholds: {
    api: 1000,      // 1 second for API calls
    database: 500,  // 500ms for database queries
    blockchain: 30000 // 30 seconds for blockchain operations
  }
};

// Global test configuration for performance tests
beforeAll(async () => {
  console.log('🚀 Setting up performance test environment...');
  
  // Record initial system state
  global.performanceMetrics.testStartTime = performance.now();
  global.performanceMetrics.memoryUsage.push({
    timestamp: Date.now(),
    usage: process.memoryUsage(),
    label: 'test-start'
  });
  
  // Wait for services to be ready
  await waitForServices();
  
  // Warm up the system
  await warmUpSystem();
  
  console.log('✅ Performance test environment ready');
});

afterAll(async () => {
  console.log('📊 Collecting final performance metrics...');
  
  // Record final system state
  global.performanceMetrics.testEndTime = performance.now();
  global.performanceMetrics.memoryUsage.push({
    timestamp: Date.now(),
    usage: process.memoryUsage(),
    label: 'test-end'
  });
  
  // Generate performance summary
  generatePerformanceSummary();
  
  console.log('✅ Performance test environment cleaned up');
});

// Extended timeout for performance tests
jest.setTimeout(180000); // 3 minutes

/**
 * Wait for required services to be available
 */
async function waitForServices(): Promise<void> {
  const maxRetries = 20;
  const retryDelay = 3000; // 3 seconds
  
  // Wait for API server
  for (let i = 0; i < maxRetries; i++) {
    try {
      const startTime = performance.now();
      const response = await fetch(`${process.env.TEST_API_URL}/health`, {
        method: 'GET',
        timeout: 10000
      });
      const endTime = performance.now();
      
      if (response.ok) {
        console.log(`✅ API server ready (${(endTime - startTime).toFixed(2)}ms)`);
        break;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        console.warn('⚠️  API server not responding, performance tests may fail');
      } else {
        console.log(`⏳ Waiting for API server... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Wait for blockchain network
  for (let i = 0; i < maxRetries; i++) {
    try {
      const startTime = performance.now();
      const response = await fetch(process.env.RPC_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        }),
        timeout: 10000
      });
      const endTime = performance.now();
      
      if (response.ok) {
        console.log(`✅ Blockchain network ready (${(endTime - startTime).toFixed(2)}ms)`);
        break;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        console.warn('⚠️  Blockchain network not responding, performance tests may fail');
      } else {
        console.log(`⏳ Waiting for blockchain network... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}

/**
 * Warm up the system to get consistent performance measurements
 */
async function warmUpSystem(): Promise<void> {
  console.log('🔥 Warming up system for consistent performance measurements...');
  
  try {
    // Make several warm-up requests to prime caches and connections
    const warmUpRequests = [
      fetch(`${process.env.TEST_API_URL}/health`),
      fetch(`${process.env.TEST_API_URL}/health`),
      fetch(`${process.env.TEST_API_URL}/health`)
    ];
    
    await Promise.all(warmUpRequests.map(req => req.catch(() => null)));
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Wait a moment for system to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ System warm-up complete');
  } catch (error) {
    console.warn('⚠️  System warm-up failed, but continuing with tests');
  }
}

/**
 * Generate performance summary at the end of tests
 */
function generatePerformanceSummary(): void {
  const totalTestTime = global.performanceMetrics.testEndTime - global.performanceMetrics.testStartTime;
  const memoryUsage = global.performanceMetrics.memoryUsage;
  
  console.log('\n📊 Performance Test Summary');
  console.log('===========================');
  console.log(`Total test duration: ${(totalTestTime / 1000).toFixed(2)} seconds`);
  
  if (memoryUsage.length >= 2) {
    const startMemory = memoryUsage[0].usage;
    const endMemory = memoryUsage[memoryUsage.length - 1].usage;
    const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
    
    console.log(`Memory usage change: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Final heap usage: ${(endMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    if (memoryIncrease > 50 * 1024 * 1024) { // More than 50MB increase
      console.warn('⚠️  Significant memory increase detected - possible memory leak');
    }
  }
}

// Performance monitoring utilities
global.measurePerformance = async function<T>(
  operation: () => Promise<T>,
  operationName: string,
  category: 'api' | 'database' | 'blockchain' = 'api'
): Promise<T> {
  const startTime = performance.now();
  const startMemory = process.memoryUsage();
  
  try {
    const result = await operation();
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    
    const duration = endTime - startTime;
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    
    // Log performance metrics
    console.log(`📊 ${operationName}: ${duration.toFixed(2)}ms (memory: ${(memoryDelta / 1024).toFixed(2)}KB)`);
    
    // Check against thresholds
    const threshold = global.performanceMetrics.responseTimeThresholds[category];
    if (duration > threshold) {
      console.warn(`⚠️  ${operationName} exceeded threshold: ${duration.toFixed(2)}ms > ${threshold}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error(`❌ ${operationName} failed after ${duration.toFixed(2)}ms:`, error.message);
    throw error;
  }
};

// Memory monitoring utility
global.recordMemoryUsage = function(label: string): void {
  global.performanceMetrics.memoryUsage.push({
    timestamp: Date.now(),
    usage: process.memoryUsage(),
    label
  });
};

// Custom performance matchers
expect.extend({
  toCompleteWithin(received: Promise<any>, expectedTime: number) {
    return new Promise(async (resolve) => {
      const startTime = performance.now();
      
      try {
        await received;
        const endTime = performance.now();
        const actualTime = endTime - startTime;
        
        const pass = actualTime <= expectedTime;
        
        resolve({
          message: () => 
            pass 
              ? `expected operation not to complete within ${expectedTime}ms, but it completed in ${actualTime.toFixed(2)}ms`
              : `expected operation to complete within ${expectedTime}ms, but it took ${actualTime.toFixed(2)}ms`,
          pass
        });
      } catch (error) {
        resolve({
          message: () => `operation failed: ${error.message}`,
          pass: false
        });
      }
    });
  },

  toHaveMemoryUsageLessThan(received: () => void, maxMemoryMB: number) {
    const initialMemory = process.memoryUsage().heapUsed;
    
    received();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
    
    const pass = memoryIncrease < maxMemoryMB;
    
    return {
      message: () => 
        pass 
          ? `expected memory usage not to be less than ${maxMemoryMB}MB, but it increased by ${memoryIncrease.toFixed(2)}MB`
          : `expected memory usage to be less than ${maxMemoryMB}MB, but it increased by ${memoryIncrease.toFixed(2)}MB`,
      pass
    };
  }
});

// Type declarations for custom matchers and globals
declare global {
  namespace jest {
    interface Matchers<R> {
      toCompleteWithin(expectedTime: number): Promise<R>;
      toHaveMemoryUsageLessThan(maxMemoryMB: number): R;
    }
  }

  var performanceMetrics: {
    testStartTime: number;
    testEndTime: number;
    memoryUsage: Array<{
      timestamp: number;
      usage: NodeJS.MemoryUsage;
      label: string;
    }>;
    responseTimeThresholds: {
      api: number;
      database: number;
      blockchain: number;
    };
  };

  var measurePerformance: <T>(
    operation: () => Promise<T>,
    operationName: string,
    category?: 'api' | 'database' | 'blockchain'
  ) => Promise<T>;

  var recordMemoryUsage: (label: string) => void;
}