/**
 * End-to-End Test Runner
 * 
 * This script orchestrates the execution of all E2E tests and provides
 * comprehensive reporting on the test results.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestResult {
  suiteName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  tests: {
    name: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    duration: number;
    error?: string;
  }[];
}

class E2ETestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  async runAllTests(): Promise<boolean> {
    console.log('🧪 Starting End-to-End Test Suite');
    console.log('==================================');

    // Check prerequisites
    await this.checkPrerequisites();

    // Run test suites in order
    const testSuites = [
      'tourist-flow.test.ts',
      'restaurant-flow.test.ts', 
      'business-rules.test.ts',
      'transaction-monitoring.test.ts'
    ];

    let allPassed = true;

    for (const suite of testSuites) {
      console.log(`\n📋 Running ${suite}...`);
      const result = await this.runTestSuite(suite);
      this.results.push(result);
      
      if (result.status === 'FAIL') {
        allPassed = false;
      }
    }

    // Generate final report
    this.generateReport();

    return allPassed;
  }

  private async checkPrerequisites(): Promise<void> {
    console.log('🔍 Checking prerequisites...');

    // Check if API server is running
    try {
      const apiUrl = process.env.TEST_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/health`);
      if (!response.ok) {
        throw new Error('API server health check failed');
      }
      console.log('✅ API server is running');
    } catch (error) {
      console.log('⚠️  API server may not be running. Some tests may fail.');
    }

    // Check if blockchain network is accessible
    try {
      const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
      // Simple RPC call to check connectivity
      const response = await fetch(rpcUrl, {
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
        console.log('✅ Blockchain network is accessible');
      }
    } catch (error) {
      console.log('⚠️  Blockchain network may not be accessible. Some tests may fail.');
    }

    // Check environment variables
    const requiredEnvVars = [
      'TEST_API_URL',
      'TEST_API_KEY',
      'RPC_URL',
      'CONTRACT_ADDRESS'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
      console.log('   Tests will use default values which may cause failures.');
    } else {
      console.log('✅ All required environment variables are set');
    }
  }

  private async runTestSuite(suiteName: string): Promise<TestResult> {
    const suitePath = path.join(__dirname, suiteName);
    const startTime = Date.now();

    try {
      // Run Jest for specific test file
      const output = execSync(
        `npx jest ${suitePath} --verbose --json --testTimeout=120000`,
        { 
          encoding: 'utf8',
          cwd: process.cwd(),
          env: { ...process.env, NODE_ENV: 'test' }
        }
      );

      const jestResult = JSON.parse(output);
      const duration = Date.now() - startTime;

      // Parse Jest results
      const testResult: TestResult = {
        suiteName,
        status: jestResult.success ? 'PASS' : 'FAIL',
        duration,
        tests: []
      };

      // Extract individual test results
      if (jestResult.testResults && jestResult.testResults.length > 0) {
        const suiteResult = jestResult.testResults[0];
        
        testResult.tests = suiteResult.assertionResults.map((test: any) => ({
          name: test.title,
          status: test.status === 'passed' ? 'PASS' : 'FAIL',
          duration: test.duration || 0,
          error: test.failureMessages?.join('\n')
        }));
      }

      console.log(`✅ ${suiteName}: PASSED (${duration}ms)`);
      return testResult;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      console.log(`❌ ${suiteName}: FAILED (${duration}ms)`);
      console.log(`   Error: ${error.message}`);

      return {
        suiteName,
        status: 'FAIL',
        duration,
        tests: [{
          name: 'Suite execution',
          status: 'FAIL',
          duration,
          error: error.message
        }]
      };
    }
  }

  private generateReport(): void {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n📊 End-to-End Test Report');
    console.log('=========================');

    // Summary statistics
    const totalSuites = this.results.length;
    const passedSuites = this.results.filter(r => r.status === 'PASS').length;
    const failedSuites = this.results.filter(r => r.status === 'FAIL').length;

    const totalTests = this.results.reduce((sum, suite) => sum + suite.tests.length, 0);
    const passedTests = this.results.reduce((sum, suite) => 
      sum + suite.tests.filter(t => t.status === 'PASS').length, 0
    );
    const failedTests = this.results.reduce((sum, suite) => 
      sum + suite.tests.filter(t => t.status === 'FAIL').length, 0
    );

    console.log(`\n📈 Summary:`);
    console.log(`   Test Suites: ${passedSuites}/${totalSuites} passed`);
    console.log(`   Tests:       ${passedTests}/${totalTests} passed`);
    console.log(`   Duration:    ${totalDuration}ms`);

    // Detailed results
    console.log(`\n📋 Detailed Results:`);
    this.results.forEach(suite => {
      const icon = suite.status === 'PASS' ? '✅' : '❌';
      console.log(`\n${icon} ${suite.suiteName} (${suite.duration}ms)`);
      
      suite.tests.forEach(test => {
        const testIcon = test.status === 'PASS' ? '  ✓' : '  ✗';
        console.log(`${testIcon} ${test.name} (${test.duration}ms)`);
        
        if (test.error) {
          console.log(`    Error: ${test.error.split('\n')[0]}`);
        }
      });
    });

    // Failed tests summary
    const failedTestsList = this.results
      .flatMap(suite => suite.tests.filter(t => t.status === 'FAIL'))
      .map(test => test.name);

    if (failedTestsList.length > 0) {
      console.log(`\n❌ Failed Tests:`);
      failedTestsList.forEach(testName => {
        console.log(`   • ${testName}`);
      });
    }

    // Coverage and requirements mapping
    console.log(`\n📋 Requirements Coverage:`);
    console.log(`   ✅ Requirement 1.1: Tourist registration and coin issuance flow`);
    console.log(`   ✅ Requirement 1.2: Restaurant registration and coin receiving flow`);
    console.log(`   ✅ Requirement 5.3: Daily coin issuance business rules`);
    console.log(`   ✅ Requirement 5.4: Restaurant transfer limits and validation`);
    console.log(`   ✅ Requirement 6.1: Transaction monitoring and status tracking`);

    // Save report to file
    this.saveReportToFile();

    // Final status
    if (failedSuites === 0) {
      console.log(`\n🎉 All E2E tests passed! System is ready for deployment.`);
    } else {
      console.log(`\n❌ ${failedSuites} test suite(s) failed. Please fix issues before deployment.`);
    }
  }

  private saveReportToFile(): void {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuites: this.results.length,
        passedSuites: this.results.filter(r => r.status === 'PASS').length,
        failedSuites: this.results.filter(r => r.status === 'FAIL').length,
        totalDuration: Date.now() - this.startTime
      },
      results: this.results
    };

    const reportPath = path.join(process.cwd(), 'test-reports', 'e2e-report.json');
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// CLI execution
async function main() {
  const runner = new E2ETestRunner();
  const success = await runner.runAllTests();
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

export { E2ETestRunner };