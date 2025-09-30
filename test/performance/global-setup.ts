/**
 * Global Setup for Performance Tests
 * 
 * This runs once before all performance test suites and optimizes the environment
 * for accurate performance measurements
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  console.log('🚀 Starting Performance Test Global Setup');
  
  try {
    // Optimize Node.js for performance testing
    await optimizeNodeEnvironment();
    
    // Ensure clean test environment
    await ensureCleanEnvironment();
    
    // Start required services with performance optimizations
    await startOptimizedServices();
    
    // Verify system is ready for performance testing
    await verifyPerformanceReadiness();
    
    console.log('✅ Performance Test Global Setup Complete');
    
  } catch (error) {
    console.error('❌ Performance Test Global Setup Failed:', error);
    throw error;
  }
}

async function optimizeNodeEnvironment() {
  console.log('⚡ Optimizing Node.js environment for performance testing...');
  
  // Set Node.js performance flags
  process.env.NODE_OPTIONS = [
    '--max-old-space-size=4096',  // Increase heap size
    '--optimize-for-size',         // Optimize for memory usage
    '--gc-interval=100'           // More frequent garbage collection
  ].join(' ');
  
  // Set performance-specific environment variables
  process.env.UV_THREADPOOL_SIZE = '16'; // Increase thread pool size
  process.env.NODE_ENV = 'test';
  
  console.log('✅ Node.js environment optimized');
}

async function ensureCleanEnvironment() {
  console.log('🧹 Ensuring clean test environment...');
  
  // Clear any existing test reports
  const reportsDir = path.join(process.cwd(), 'test-reports', 'performance');
  if (fs.existsSync(reportsDir)) {
    fs.rmSync(reportsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(reportsDir, { recursive: true });
  
  // Clear Node.js module cache for clean start
  Object.keys(require.cache).forEach(key => {
    if (key.includes('test') || key.includes('spec')) {
      delete require.cache[key];
    }
  });
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  console.log('✅ Test environment cleaned');
}

async function startOptimizedServices() {
  console.log('🔧 Starting services with performance optimizations...');
  
  // Check if API server is running
  try {
    const response = await fetch('http://localhost:3000/health');
    if (response.ok) {
      console.log('✅ API server is already running');
    }
  } catch (error) {
    console.log('🚀 Starting optimized API server...');
    
    try {
      // Start API server with performance optimizations
      execSync('NODE_ENV=test npm run start:test &', { 
        stdio: 'pipe',
        timeout: 15000,
        env: {
          ...process.env,
          NODE_OPTIONS: '--max-old-space-size=2048 --optimize-for-size',
          API_CACHE_ENABLED: 'true',
          API_COMPRESSION_ENABLED: 'true'
        }
      });
      
      // Wait for server to start
      await waitForService('http://localhost:3000/health', 45000);
      console.log('✅ Optimized API server started');
      
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
    console.log('🚀 Starting optimized blockchain network...');
    
    try {
      // Start Hardhat network with performance optimizations
      execSync('npx hardhat node --max-memory 2048 &', { 
        stdio: 'pipe',
        timeout: 15000
      });
      
      // Wait for network to start
      await waitForBlockchainNetwork(45000);
      console.log('✅ Optimized blockchain network started');
      
    } catch (error) {
      console.warn('⚠️  Could not start blockchain network automatically');
      console.warn('   Please ensure a blockchain network is running on http://localhost:8545');
    }
  }
}

async function waitForService(url: string, timeout: number): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 3000; // 3 seconds
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url, { timeout: 5000 });
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
  const pollInterval = 3000; // 3 seconds
  
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
        }),
        timeout: 5000
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

async function verifyPerformanceReadiness() {
  console.log('🔍 Verifying system readiness for performance testing...');
  
  const checks = [
    {
      name: 'API Server Performance',
      check: async () => {
        const startTime = Date.now();
        const response = await fetch('http://localhost:3000/health');
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log(`   API response time: ${responseTime}ms`);
        return response.ok && responseTime < 1000; // Should respond within 1 second
      }
    },
    {
      name: 'Blockchain Network Performance',
      check: async () => {
        const startTime = Date.now();
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
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log(`   Blockchain response time: ${responseTime}ms`);
        return response.ok && responseTime < 2000; // Should respond within 2 seconds
      }
    },
    {
      name: 'System Resources',
      check: async () => {
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
        
        console.log(`   Heap usage: ${heapUsedMB.toFixed(2)} MB`);
        
        // System should have reasonable memory usage
        return heapUsedMB < 200; // Less than 200MB heap usage
      }
    },
    {
      name: 'Performance Test Configuration',
      check: async () => {
        const requiredEnvVars = [
          'TEST_API_URL',
          'TEST_API_KEY',
          'RPC_URL'
        ];
        
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
          console.log(`   Missing env vars: ${missingVars.join(', ')}`);
          return false;
        }
        
        return true;
      }
    }
  ];
  
  let allChecksPass = true;
  
  for (const { name, check } of checks) {
    try {
      const result = await check();
      if (result) {
        console.log(`✅ ${name}: Ready`);
      } else {
        console.log(`⚠️  ${name}: Not optimal (performance tests may be affected)`);
        allChecksPass = false;
      }
    } catch (error) {
      console.log(`❌ ${name}: Error (${error.message})`);
      allChecksPass = false;
    }
  }
  
  if (allChecksPass) {
    console.log('✅ System is optimally configured for performance testing');
  } else {
    console.log('⚠️  System configuration is not optimal - performance results may be affected');
  }
  
  // Create performance baseline
  await createPerformanceBaseline();
}

async function createPerformanceBaseline() {
  console.log('📊 Creating performance baseline...');
  
  const baseline = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      cpuCount: require('os').cpus().length
    },
    networkLatency: {
      api: await measureLatency('http://localhost:3000/health'),
      blockchain: await measureLatency('http://localhost:8545', 'POST', {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    }
  };
  
  const baselinePath = path.join(process.cwd(), 'test-reports', 'performance', 'baseline.json');
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
  
  console.log(`✅ Performance baseline created: ${baselinePath}`);
}

async function measureLatency(url: string, method: string = 'GET', body?: any): Promise<number> {
  try {
    const startTime = Date.now();
    
    const options: RequestInit = {
      method,
      timeout: 5000
    };
    
    if (body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const endTime = Date.now();
    
    return response.ok ? endTime - startTime : -1;
  } catch (error) {
    return -1;
  }
}