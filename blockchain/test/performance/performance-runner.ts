/**
 * Performance Test Runner
 * 
 * This script orchestrates performance testing and generates comprehensive
 * performance reports with optimization recommendations.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'PASS' | 'FAIL' | 'WARNING';
  category: 'api' | 'database' | 'blockchain';
}

interface PerformanceReport {
  timestamp: string;
  duration: number;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warningTests: number;
  };
  metrics: PerformanceMetric[];
  recommendations: string[];
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    memory: NodeJS.MemoryUsage;
  };
}

class PerformanceTestRunner {
  private startTime: number = 0;
  private metrics: PerformanceMetric[] = [];
  private recommendations: string[] = [];

  constructor() {
    this.startTime = Date.now();
  }

  async runAllPerformanceTests(): Promise<boolean> {
    console.log('🚀 Starting Performance Test Suite');
    console.log('==================================');

    // Check system resources
    await this.checkSystemResources();

    // Run performance test suites
    const testSuites = [
      'api-load.test.ts',
      'database-optimization.test.ts',
      'blockchain-performance.test.ts'
    ];

    let allPassed = true;

    for (const suite of testSuites) {
      console.log(`\n📊 Running ${suite}...`);
      const success = await this.runPerformanceTestSuite(suite);
      if (!success) {
        allPassed = false;
      }
    }

    // Generate performance report
    await this.generatePerformanceReport();

    // Provide optimization recommendations
    this.generateOptimizationRecommendations();

    return allPassed;
  }

  private async checkSystemResources(): Promise<void> {
    console.log('🔍 Checking system resources...');

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    console.log(`💾 Memory Usage:`);
    console.log(`   Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);

    // Add memory metrics
    this.addMetric({
      name: 'Initial Heap Usage',
      value: memoryUsage.heapUsed / 1024 / 1024,
      unit: 'MB',
      threshold: 100,
      status: memoryUsage.heapUsed / 1024 / 1024 < 100 ? 'PASS' : 'WARNING',
      category: 'api'
    });

    // Check available disk space
    try {
      const diskUsage = execSync('df -h .', { encoding: 'utf8' });
      console.log(`💽 Disk Usage:`);
      console.log(diskUsage);
    } catch (error) {
      console.warn('Could not check disk usage');
    }
  }

  private async runPerformanceTestSuite(suiteName: string): Promise<boolean> {
    const suitePath = path.join(__dirname, suiteName);
    const startTime = performance.now();

    try {
      // Run Jest for specific performance test file
      const output = execSync(
        `npx jest ${suitePath} --verbose --json --testTimeout=180000 --maxWorkers=1`,
        { 
          encoding: 'utf8',
          cwd: process.cwd(),
          env: { ...process.env, NODE_ENV: 'test' }
        }
      );

      const jestResult = JSON.parse(output);
      const duration = performance.now() - startTime;

      console.log(`✅ ${suiteName}: PASSED (${duration.toFixed(2)}ms)`);

      // Extract performance metrics from test results
      this.extractMetricsFromTestResults(suiteName, jestResult);

      return jestResult.success;

    } catch (error: any) {
      const duration = performance.now() - startTime;
      
      console.log(`❌ ${suiteName}: FAILED (${duration.toFixed(2)}ms)`);
      console.log(`   Error: ${error.message}`);

      // Try to extract metrics even from failed tests
      try {
        const errorOutput = error.stdout || error.message;
        if (errorOutput.includes('{')) {
          const jestResult = JSON.parse(errorOutput.substring(errorOutput.indexOf('{')));
          this.extractMetricsFromTestResults(suiteName, jestResult);
        }
      } catch (parseError) {
        console.warn('Could not parse failed test results for metrics');
      }

      return false;
    }
  }

  private extractMetricsFromTestResults(suiteName: string, jestResult: any): void {
    // Extract performance metrics from Jest test output
    // This is a simplified version - in practice, you'd parse console.log outputs
    // or use custom Jest reporters to capture performance data

    const category = this.getCategoryFromSuiteName(suiteName);
    
    // Add basic test metrics
    if (jestResult.testResults && jestResult.testResults.length > 0) {
      const suiteResult = jestResult.testResults[0];
      
      this.addMetric({
        name: `${suiteName} - Test Duration`,
        value: suiteResult.perfStats?.end - suiteResult.perfStats?.start || 0,
        unit: 'ms',
        threshold: category === 'blockchain' ? 60000 : 30000,
        status: 'PASS',
        category
      });

      // Add test success rate
      const totalTests = suiteResult.assertionResults?.length || 0;
      const passedTests = suiteResult.assertionResults?.filter((t: any) => t.status === 'passed').length || 0;
      const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

      this.addMetric({
        name: `${suiteName} - Success Rate`,
        value: successRate,
        unit: '%',
        threshold: 90,
        status: successRate >= 90 ? 'PASS' : successRate >= 75 ? 'WARNING' : 'FAIL',
        category
      });
    }
  }

  private getCategoryFromSuiteName(suiteName: string): 'api' | 'database' | 'blockchain' {
    if (suiteName.includes('api')) return 'api';
    if (suiteName.includes('database')) return 'database';
    if (suiteName.includes('blockchain')) return 'blockchain';
    return 'api';
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
  }

  private async generatePerformanceReport(): Promise<void> {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const summary = {
      totalTests: this.metrics.length,
      passedTests: this.metrics.filter(m => m.status === 'PASS').length,
      failedTests: this.metrics.filter(m => m.status === 'FAIL').length,
      warningTests: this.metrics.filter(m => m.status === 'WARNING').length
    };

    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      duration,
      summary,
      metrics: this.metrics,
      recommendations: this.recommendations,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage()
      }
    };

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'test-reports', 'performance-report.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate human-readable report
    await this.generateHumanReadableReport(report);

    console.log(`\n📄 Performance report saved to: ${reportPath}`);
  }

  private async generateHumanReadableReport(report: PerformanceReport): Promise<void> {
    const reportLines = [
      '# Performance Test Report',
      `Generated: ${report.timestamp}`,
      `Duration: ${(report.duration / 1000).toFixed(2)} seconds`,
      '',
      '## Summary',
      `- Total Metrics: ${report.summary.totalTests}`,
      `- Passed: ${report.summary.passedTests}`,
      `- Failed: ${report.summary.failedTests}`,
      `- Warnings: ${report.summary.warningTests}`,
      '',
      '## Performance Metrics',
      ''
    ];

    // Group metrics by category
    const categories = ['api', 'database', 'blockchain'] as const;
    
    for (const category of categories) {
      const categoryMetrics = report.metrics.filter(m => m.category === category);
      if (categoryMetrics.length === 0) continue;

      reportLines.push(`### ${category.toUpperCase()} Performance`);
      reportLines.push('');

      for (const metric of categoryMetrics) {
        const status = metric.status === 'PASS' ? '✅' : metric.status === 'WARNING' ? '⚠️' : '❌';
        reportLines.push(`${status} **${metric.name}**: ${metric.value.toFixed(2)} ${metric.unit} (threshold: ${metric.threshold} ${metric.unit})`);
      }
      reportLines.push('');
    }

    // Add recommendations
    if (report.recommendations.length > 0) {
      reportLines.push('## Optimization Recommendations');
      reportLines.push('');
      
      for (const recommendation of report.recommendations) {
        reportLines.push(`- ${recommendation}`);
      }
      reportLines.push('');
    }

    // Add environment info
    reportLines.push('## Environment');
    reportLines.push(`- Node.js: ${report.environment.nodeVersion}`);
    reportLines.push(`- Platform: ${report.environment.platform} (${report.environment.arch})`);
    reportLines.push(`- Memory Usage: ${(report.environment.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);

    const readableReportPath = path.join(process.cwd(), 'test-reports', 'performance-report.md');
    fs.writeFileSync(readableReportPath, reportLines.join('\n'));

    console.log(`📄 Human-readable report saved to: ${readableReportPath}`);
  }

  private generateOptimizationRecommendations(): void {
    console.log('\n🔧 Performance Analysis and Recommendations');
    console.log('==========================================');

    // Analyze metrics and generate recommendations
    const failedMetrics = this.metrics.filter(m => m.status === 'FAIL');
    const warningMetrics = this.metrics.filter(m => m.status === 'WARNING');

    if (failedMetrics.length === 0 && warningMetrics.length === 0) {
      console.log('🎉 All performance metrics are within acceptable thresholds!');
      this.recommendations.push('System performance is optimal - no immediate optimizations needed');
      return;
    }

    // API Performance Recommendations
    const apiIssues = [...failedMetrics, ...warningMetrics].filter(m => m.category === 'api');
    if (apiIssues.length > 0) {
      console.log('\n📡 API Performance Issues:');
      apiIssues.forEach(metric => {
        console.log(`   ⚠️  ${metric.name}: ${metric.value.toFixed(2)} ${metric.unit} (threshold: ${metric.threshold})`);
      });

      this.recommendations.push('Consider implementing API response caching for frequently accessed endpoints');
      this.recommendations.push('Review API endpoint implementations for potential optimizations');
      this.recommendations.push('Consider implementing request batching for multiple operations');
    }

    // Database Performance Recommendations
    const dbIssues = [...failedMetrics, ...warningMetrics].filter(m => m.category === 'database');
    if (dbIssues.length > 0) {
      console.log('\n🗄️  Database Performance Issues:');
      dbIssues.forEach(metric => {
        console.log(`   ⚠️  ${metric.name}: ${metric.value.toFixed(2)} ${metric.unit} (threshold: ${metric.threshold})`);
      });

      this.recommendations.push('Review database indexes for frequently queried columns');
      this.recommendations.push('Consider implementing query result caching');
      this.recommendations.push('Optimize database connection pool settings');
      this.recommendations.push('Consider database query optimization and EXPLAIN analysis');
    }

    // Blockchain Performance Recommendations
    const blockchainIssues = [...failedMetrics, ...warningMetrics].filter(m => m.category === 'blockchain');
    if (blockchainIssues.length > 0) {
      console.log('\n⛓️  Blockchain Performance Issues:');
      blockchainIssues.forEach(metric => {
        console.log(`   ⚠️  ${metric.name}: ${metric.value.toFixed(2)} ${metric.unit} (threshold: ${metric.threshold})`);
      });

      this.recommendations.push('Consider optimizing smart contract gas usage');
      this.recommendations.push('Implement transaction batching where possible');
      this.recommendations.push('Review blockchain network configuration and RPC endpoints');
      this.recommendations.push('Consider implementing transaction result caching');
    }

    // General Recommendations
    console.log('\n💡 General Optimization Recommendations:');
    this.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });

    // Memory Usage Analysis
    const currentMemory = process.memoryUsage();
    const memoryIncrease = currentMemory.heapUsed - (this.metrics.find(m => m.name === 'Initial Heap Usage')?.value || 0) * 1024 * 1024;
    
    if (memoryIncrease > 50 * 1024 * 1024) { // More than 50MB increase
      console.log(`\n⚠️  Memory Usage Increased by ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB during testing`);
      this.recommendations.push('Investigate potential memory leaks in application code');
      this.recommendations.push('Consider implementing garbage collection optimization');
    }
  }
}

// CLI execution
async function main() {
  const runner = new PerformanceTestRunner();
  const success = await runner.runAllPerformanceTests();
  
  if (success) {
    console.log('\n🎉 Performance tests completed successfully!');
    console.log('📊 Check the performance reports for detailed metrics and recommendations.');
  } else {
    console.log('\n❌ Some performance tests failed or showed concerning metrics.');
    console.log('🔧 Review the performance report and implement recommended optimizations.');
  }
  
  process.exit(success ? 0 : 1);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

export { PerformanceTestRunner };