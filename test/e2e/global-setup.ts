/**
 * Global Setup for E2E Tests
 * 
 * This runs once before all test suites and sets up the testing environment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  console.log('🚀 Starting E2E Test Global Setup');
  
  try {
    // Ensure test environment file exists
    await ensureTestEnvironment();
    
    // Start required services if not running
    await startServices();
    
    // Verify system is ready
    await verifySystemReadiness();
    
    console.log('✅ E2E Test Global Setup Complete');
    
  } catch (error) {
    console.error('❌ E2E Test Global Setup Failed:', error);
    throw error;
  }
}

async function ensureTestEnvironment() {
  const testEnvPath = path.join(process.cwd(), '.env.test');
  
  if (!fs.existsSync(testEnvPath)) {
    console.log('📝 Creating .env.test file...');
    
    const testEnvContent = `
# E2E Test Environment Configuration
NODE_ENV=test
TEST_API_URL=http://localhost:3000
TEST_API_KEY=test-api-key-e2e-global
RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
BLOCKCHAIN_NETWORK=hardhat
DATABASE_URL=postgresql://test:test@localhost:5432/smilecoin_test
REDIS_URL=redis://localhost:6379/1
ADMIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
API_PORT=3000
LOG_LEVEL=error
`.trim();

    fs.writeFileSync(testEnvPath, testEnvContent);
    console.log('✅ Created .env.test file');
  }
}

async function startServices() {
  console.log('🔧 Checking and starting required services...');
  
  // Check if API server is running
  try {
    const response = await fetch('http://localhost:3000/health');
    if (response.ok) {
      console.log('✅ API server is already running');
    }
  } catch (error) {
    console.log('🚀 Starting API server...');
    
    // Start API server in background
    try {
      execSync('npm run start:test &', { 
        stdio: 'pipe',
        timeout: 10000
      });
      
      // Wait for server to start
      await waitForService('http://localhost:3000/health', 30000);
      console.log('✅ API server started');
      
    } catch (error) {
      console.warn('⚠️  Could not start API server automatically');
      console.warn('   Please ensure the API server is running on http://localhost:3000');
    }
  }
  
  // Check if blockchain network is running
  try {
    const response = await fetch('http://localhost:8545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    });
    
    if (response.ok) {
      console.log('✅ Blockchain network is already running');
    }
  } catch (error) {
    console.log('🚀 Starting local blockchain network...');
    
    try {
      // Start Hardhat network in background
      execSync('npx hardhat node &', { 
        stdio: 'pipe',
        timeout: 10000
      });
      
      // Wait for network to start
      await waitForBlockchainNetwork(30000);
      console.log('✅ Blockchain network started');
      
    } catch (error) {
      console.warn('⚠️  Could not start blockchain network automatically');
      console.warn('   Please ensure a blockchain network is running on http://localhost:8545');
    }
  }
}

async function waitForService(url: string, timeout: number): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Service not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error(`Service at ${url} did not become ready within ${timeout}ms`);
}

async function waitForBlockchainNetwork(timeout: number): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch('http://localhost:8545', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });
      
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Network not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error(`Blockchain network did not become ready within ${timeout}ms`);
}

async function verifySystemReadiness() {
  console.log('🔍 Verifying system readiness...');
  
  const checks = [
    {
      name: 'API Server Health',
      check: async () => {
        const response = await fetch('http://localhost:3000/health');
        return response.ok;
      }
    },
    {
      name: 'Blockchain Network',
      check: async () => {
        const response = await fetch('http://localhost:8545', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          })
        });
        return response.ok;
      }
    },
    {
      name: 'Environment Variables',
      check: async () => {
        const required = ['TEST_API_URL', 'RPC_URL'];
        return required.every(varName => process.env[varName]);
      }
    }
  ];
  
  for (const { name, check } of checks) {
    try {
      const result = await check();
      if (result) {
        console.log(`✅ ${name}: Ready`);
      } else {
        console.log(`⚠️  ${name}: Not ready (tests may fail)`);
      }
    } catch (error) {
      console.log(`⚠️  ${name}: Error (${error.message})`);
    }
  }
  
  console.log('✅ System readiness check complete');
}