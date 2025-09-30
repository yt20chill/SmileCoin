/**
 * E2E Test Setup
 * 
 * This file runs before each test file and sets up the testing environment
 */

import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.test') });

// Set default test environment variables if not provided
if (!process.env.TEST_API_URL) {
  process.env.TEST_API_URL = 'http://localhost:3000';
}

if (!process.env.TEST_API_KEY) {
  process.env.TEST_API_KEY = 'test-api-key-e2e';
}

if (!process.env.RPC_URL) {
  process.env.RPC_URL = 'http://localhost:8545';
}

if (!process.env.CONTRACT_ADDRESS) {
  process.env.CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
}

if (!process.env.BLOCKCHAIN_NETWORK) {
  process.env.BLOCKCHAIN_NETWORK = 'hardhat';
}

// Global test configuration
beforeAll(async () => {
  console.log('🔧 Setting up E2E test environment...');
  
  // Wait for services to be ready
  await waitForServices();
  
  console.log('✅ E2E test environment ready');
});

afterAll(async () => {
  console.log('🧹 Cleaning up E2E test environment...');
  
  // Cleanup any global resources
  await cleanup();
  
  console.log('✅ E2E test environment cleaned up');
});

// Increase timeout for E2E tests
jest.setTimeout(120000); // 2 minutes

/**
 * Wait for required services to be available
 */
async function waitForServices(): Promise<void> {
  const maxRetries = 30;
  const retryDelay = 2000; // 2 seconds
  
  // Wait for API server
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${process.env.TEST_API_URL}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        console.log('✅ API server is ready');
        break;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        console.warn('⚠️  API server not responding, tests may fail');
      } else {
        console.log(`⏳ Waiting for API server... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Wait for blockchain network
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(process.env.RPC_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        }),
        timeout: 5000
      });
      
      if (response.ok) {
        console.log('✅ Blockchain network is ready');
        break;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        console.warn('⚠️  Blockchain network not responding, tests may fail');
      } else {
        console.log(`⏳ Waiting for blockchain network... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}

/**
 * Cleanup function for global resources
 */
async function cleanup(): Promise<void> {
  // Close any open connections, clear caches, etc.
  // This helps prevent Jest from hanging
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
}

// Global error handlers for better debugging
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Extend fetch with timeout support for older Node.js versions
if (!global.fetch) {
  const { default: fetch } = require('node-fetch');
  global.fetch = fetch;
}

// Add custom matchers for better assertions
expect.extend({
  toBeValidTransactionHash(received: string) {
    const pass = /^0x[a-fA-F0-9]{64}$/.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid transaction hash`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid transaction hash (0x followed by 64 hex characters)`,
        pass: false,
      };
    }
  },

  toBeValidWalletAddress(received: string) {
    const pass = /^0x[a-fA-F0-9]{40}$/.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid wallet address`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid wallet address (0x followed by 40 hex characters)`,
        pass: false,
      };
    }
  },

  toBeWithinTimeRange(received: string, expectedTime: Date, toleranceMs: number = 60000) {
    const receivedTime = new Date(received);
    const timeDiff = Math.abs(receivedTime.getTime() - expectedTime.getTime());
    const pass = timeDiff <= toleranceMs;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be within ${toleranceMs}ms of ${expectedTime.toISOString()}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within ${toleranceMs}ms of ${expectedTime.toISOString()}, but was ${timeDiff}ms away`,
        pass: false,
      };
    }
  }
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidTransactionHash(): R;
      toBeValidWalletAddress(): R;
      toBeWithinTimeRange(expectedTime: Date, toleranceMs?: number): R;
    }
  }
}