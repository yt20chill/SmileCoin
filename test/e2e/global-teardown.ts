/**
 * Global Teardown for E2E Tests
 * 
 * This runs once after all test suites and cleans up the testing environment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  console.log('🧹 Starting E2E Test Global Teardown');
  
  try {
    // Clean up test data
    await cleanupTestData();
    
    // Stop services if they were started by the test suite
    await stopServices();
    
    // Generate final test artifacts
    await generateTestArtifacts();
    
    console.log('✅ E2E Test Global Teardown Complete');
    
  } catch (error) {
    console.error('❌ E2E Test Global Teardown Failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

async function cleanupTestData() {
  console.log('🗑️  Cleaning up test data...');
  
  try {
    // Clean up any test files or temporary data
    const tempDirs = [
      path.join(process.cwd(), 'temp'),
      path.join(process.cwd(), '.tmp'),
      path.join(process.cwd(), 'test-temp')
    ];
    
    for (const dir of tempDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✅ Cleaned up ${dir}`);
      }
    }
    
    // Clean up test database if using a test-specific database
    // This would depend on your database setup
    
    console.log('✅ Test data cleanup complete');
    
  } catch (error) {
    console.warn('⚠️  Test data cleanup failed:', error.message);
  }
}

async function stopServices() {
  console.log('🛑 Stopping test services...');
  
  try {
    // Stop API server if it was started by tests
    // Note: In production, you might want to keep services running
    // This is mainly for CI/CD environments
    
    if (process.env.CI || process.env.STOP_SERVICES_AFTER_TESTS === 'true') {
      try {
        // Kill processes on test ports
        execSync('pkill -f "node.*3000" || true', { stdio: 'pipe' });
        execSync('pkill -f "hardhat node" || true', { stdio: 'pipe' });
        console.log('✅ Test services stopped');
      } catch (error) {
        console.warn('⚠️  Could not stop all test services');
      }
    } else {
      console.log('ℹ️  Leaving services running for development');
    }
    
  } catch (error) {
    console.warn('⚠️  Service cleanup failed:', error.message);
  }
}

async function generateTestArtifacts() {
  console.log('📄 Generating test artifacts...');
  
  try {
    // Ensure test reports directory exists
    const reportsDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate test summary
    const testSummary = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        ci: !!process.env.CI
      },
      configuration: {
        testApiUrl: process.env.TEST_API_URL,
        rpcUrl: process.env.RPC_URL,
        blockchainNetwork: process.env.BLOCKCHAIN_NETWORK
      }
    };
    
    const summaryPath = path.join(reportsDir, 'test-environment.json');
    fs.writeFileSync(summaryPath, JSON.stringify(testSummary, null, 2));
    
    console.log(`✅ Test artifacts generated in ${reportsDir}`);
    
  } catch (error) {
    console.warn('⚠️  Test artifact generation failed:', error.message);
  }
}

// Handle cleanup on process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  await globalTeardown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  await globalTeardown();
  process.exit(0);
});