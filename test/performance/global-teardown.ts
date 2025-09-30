/**
 * Global Teardown for Performance Tests
 * 
 * This runs once after all performance test suites and generates final
 * performance analysis and cleanup
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  console.log('🧹 Starting Performance Test Global Teardown');
  
  try {
    // Generate final performance analysis
    await generateFinalPerformanceAnalysis();
    
    // Clean up performance test artifacts
    await cleanupPerformanceArtifacts();
    
    // Stop services if needed
    await stopPerformanceServices();
    
    // Generate performance recommendations
    await generatePerformanceRecommendations();
    
    console.log('✅ Performance Test Global Teardown Complete');
    
  } catch (error) {
    console.error('❌ Performance Test Global Teardown Failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

async function generateFinalPerformanceAnalysis() {
  console.log('📊 Generating final performance analysis...');
  
  try {
    const reportsDir = path.join(process.cwd(), 'test-reports', 'performance');
    
    // Collect all performance data
    const performanceData = {
      timestamp: new Date().toISOString(),
      testDuration: Date.now() - (global.testStartTime || Date.now()),
      systemResources: {
        finalMemory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime()
      },
      testResults: await collectTestResults(reportsDir)
    };
    
    // Save comprehensive performance data
    const analysisPath = path.join(reportsDir, 'final-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(performanceData, null, 2));
    
    // Generate performance trends if baseline exists
    await generatePerformanceTrends(reportsDir, performanceData);
    
    console.log(`✅ Performance analysis saved to: ${analysisPath}`);
    
  } catch (error) {
    console.warn('⚠️  Performance analysis generation failed:', error.message);
  }
}

async function collectTestResults(reportsDir: string): Promise<any> {
  const testResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    averageTestDuration: 0,
    performanceMetrics: []
  };
  
  try {
    // Look for Jest test results
    const jestResultsPath = path.join(reportsDir, 'performance-report.json');
    if (fs.existsSync(jestResultsPath)) {
      const jestResults = JSON.parse(fs.readFileSync(jestResultsPath, 'utf8'));
      
      if (jestResults.testResults) {
        testResults.totalTests = jestResults.numTotalTests || 0;
        testResults.passedTests = jestResults.numPassedTests || 0;
        testResults.failedTests = jestResults.numFailedTests || 0;
        
        // Calculate average test duration
        const testDurations = jestResults.testResults
          .map((result: any) => result.perfStats?.end - result.perfStats?.start)
          .filter((duration: number) => duration > 0);
        
        if (testDurations.length > 0) {
          testResults.averageTestDuration = testDurations.reduce((a: number, b: number) => a + b, 0) / testDurations.length;
        }
      }
    }
    
    // Collect custom performance metrics from log files
    const logFiles = fs.readdirSync(reportsDir).filter(file => file.endsWith('.log'));
    for (const logFile of logFiles) {
      const logPath = path.join(reportsDir, logFile);
      const logContent = fs.readFileSync(logPath, 'utf8');
      
      // Extract performance metrics from logs (simplified parsing)
      const metricMatches = logContent.match(/📊 .+: [\d.]+ms/g) || [];
      testResults.performanceMetrics.push(...metricMatches);
    }
    
  } catch (error) {
    console.warn('⚠️  Could not collect all test results:', error.message);
  }
  
  return testResults;
}

async function generatePerformanceTrends(reportsDir: string, currentData: any) {
  console.log('📈 Generating performance trends...');
  
  try {
    const baselinePath = path.join(reportsDir, 'baseline.json');
    if (!fs.existsSync(baselinePath)) {
      console.log('ℹ️  No baseline found, skipping trend analysis');
      return;
    }
    
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    
    const trends = {
      timestamp: new Date().toISOString(),
      baseline: baseline.timestamp,
      memoryTrend: {
        baseline: baseline.environment.memory.heapUsed,
        current: currentData.systemResources.finalMemory.heapUsed,
        change: currentData.systemResources.finalMemory.heapUsed - baseline.environment.memory.heapUsed,
        changePercent: ((currentData.systemResources.finalMemory.heapUsed - baseline.environment.memory.heapUsed) / baseline.environment.memory.heapUsed) * 100
      },
      latencyTrends: {
        api: {
          baseline: baseline.networkLatency?.api || -1,
          current: await measureCurrentLatency('http://localhost:3000/health'),
        },
        blockchain: {
          baseline: baseline.networkLatency?.blockchain || -1,
          current: await measureCurrentLatency('http://localhost:8545', 'POST', {
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          })
        }
      }
    };
    
    // Calculate latency changes
    if (trends.latencyTrends.api.baseline > 0 && trends.latencyTrends.api.current > 0) {
      trends.latencyTrends.api.change = trends.latencyTrends.api.current - trends.latencyTrends.api.baseline;
      trends.latencyTrends.api.changePercent = (trends.latencyTrends.api.change / trends.latencyTrends.api.baseline) * 100;
    }
    
    if (trends.latencyTrends.blockchain.baseline > 0 && trends.latencyTrends.blockchain.current > 0) {
      trends.latencyTrends.blockchain.change = trends.latencyTrends.blockchain.current - trends.latencyTrends.blockchain.baseline;
      trends.latencyTrends.blockchain.changePercent = (trends.latencyTrends.blockchain.change / trends.latencyTrends.blockchain.baseline) * 100;
    }
    
    const trendsPath = path.join(reportsDir, 'performance-trends.json');
    fs.writeFileSync(trendsPath, JSON.stringify(trends, null, 2));
    
    console.log(`✅ Performance trends saved to: ${trendsPath}`);
    
    // Log significant changes
    if (Math.abs(trends.memoryTrend.changePercent) > 10) {
      console.log(`⚠️  Significant memory usage change: ${trends.memoryTrend.changePercent.toFixed(1)}%`);
    }
    
  } catch (error) {
    console.warn('⚠️  Performance trend generation failed:', error.message);
  }
}

async function measureCurrentLatency(url: string, method: string = 'GET', body?: any): Promise<number> {
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

async function cleanupPerformanceArtifacts() {
  console.log('🗑️  Cleaning up performance test artifacts...');
  
  try {
    // Clean up temporary files
    const tempDirs = [
      path.join(process.cwd(), 'temp-performance'),
      path.join(process.cwd(), '.tmp-perf'),
      path.join(process.cwd(), 'performance-temp')
    ];
    
    for (const dir of tempDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✅ Cleaned up ${dir}`);
      }
    }
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
      console.log('✅ Forced garbage collection');
    }
    
    console.log('✅ Performance artifacts cleanup complete');
    
  } catch (error) {
    console.warn('⚠️  Performance artifacts cleanup failed:', error.message);
  }
}

async function stopPerformanceServices() {
  console.log('🛑 Stopping performance test services...');
  
  try {
    // Only stop services in CI or if explicitly requested
    if (process.env.CI || process.env.STOP_SERVICES_AFTER_PERFORMANCE_TESTS === 'true') {
      try {
        // Kill processes on test ports
        execSync('pkill -f "node.*3000" || true', { stdio: 'pipe' });
        execSync('pkill -f "hardhat node" || true', { stdio: 'pipe' });
        console.log('✅ Performance test services stopped');
      } catch (error) {
        console.warn('⚠️  Could not stop all performance test services');
      }
    } else {
      console.log('ℹ️  Leaving services running for development');
    }
    
  } catch (error) {
    console.warn('⚠️  Service cleanup failed:', error.message);
  }
}

async function generatePerformanceRecommendations() {
  console.log('💡 Generating performance recommendations...');
  
  try {
    const reportsDir = path.join(process.cwd(), 'test-reports', 'performance');
    const recommendations: string[] = [];
    
    // Analyze trends for recommendations
    const trendsPath = path.join(reportsDir, 'performance-trends.json');
    if (fs.existsSync(trendsPath)) {
      const trends = JSON.parse(fs.readFileSync(trendsPath, 'utf8'));
      
      // Memory recommendations
      if (trends.memoryTrend.changePercent > 20) {
        recommendations.push('Memory usage increased significantly - investigate potential memory leaks');
        recommendations.push('Consider implementing more aggressive garbage collection strategies');
      }
      
      // API latency recommendations
      if (trends.latencyTrends.api.changePercent > 50) {
        recommendations.push('API response times have degraded - review recent changes and optimize slow endpoints');
        recommendations.push('Consider implementing response caching for frequently accessed data');
      }
      
      // Blockchain latency recommendations
      if (trends.latencyTrends.blockchain.changePercent > 30) {
        recommendations.push('Blockchain network performance has degraded - check network configuration');
        recommendations.push('Consider optimizing smart contract interactions and gas usage');
      }
    }
    
    // General recommendations based on system state
    const finalMemoryMB = process.memoryUsage().heapUsed / 1024 / 1024;
    if (finalMemoryMB > 500) {
      recommendations.push('High memory usage detected - consider memory optimization strategies');
    }
    
    // Add default recommendations if none were generated
    if (recommendations.length === 0) {
      recommendations.push('Performance metrics are within acceptable ranges');
      recommendations.push('Continue monitoring performance trends over time');
      recommendations.push('Consider implementing automated performance regression detection');
    }
    
    const recommendationsData = {
      timestamp: new Date().toISOString(),
      recommendations,
      nextSteps: [
        'Review detailed performance reports for specific optimization opportunities',
        'Set up continuous performance monitoring in CI/CD pipeline',
        'Establish performance budgets for critical operations',
        'Schedule regular performance reviews and optimizations'
      ]
    };
    
    const recommendationsPath = path.join(reportsDir, 'recommendations.json');
    fs.writeFileSync(recommendationsPath, JSON.stringify(recommendationsData, null, 2));
    
    // Generate human-readable recommendations
    const readableRecommendations = [
      '# Performance Test Recommendations',
      `Generated: ${recommendationsData.timestamp}`,
      '',
      '## Immediate Actions',
      ...recommendations.map(rec => `- ${rec}`),
      '',
      '## Next Steps',
      ...recommendationsData.nextSteps.map(step => `- ${step}`),
      '',
      '## Additional Resources',
      '- Review detailed performance reports in test-reports/performance/',
      '- Monitor system resources during peak usage',
      '- Consider implementing performance budgets for CI/CD',
      '- Set up alerts for performance regressions'
    ];
    
    const readableRecommendationsPath = path.join(reportsDir, 'recommendations.md');
    fs.writeFileSync(readableRecommendationsPath, readableRecommendations.join('\n'));
    
    console.log(`✅ Performance recommendations saved to: ${recommendationsPath}`);
    console.log(`📄 Human-readable recommendations: ${readableRecommendationsPath}`);
    
    // Log key recommendations
    console.log('\n💡 Key Performance Recommendations:');
    recommendations.slice(0, 3).forEach(rec => {
      console.log(`   • ${rec}`);
    });
    
  } catch (error) {
    console.warn('⚠️  Performance recommendations generation failed:', error.message);
  }
}

// Handle cleanup on process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, cleaning up performance tests...');
  await globalTeardown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, cleaning up performance tests...');
  await globalTeardown();
  process.exit(0);
});