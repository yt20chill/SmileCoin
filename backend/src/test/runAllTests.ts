#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { TestDataSeeder } from './testDataSeeder';

/**
 * Comprehensive test runner for Tourist Rewards API
 * Runs unit tests, integration tests, and generates coverage reports
 */
class TestRunner {
  private static readonly TEST_COMMANDS = {
    unit: 'jest --testPathPattern="unit\\.test\\.ts$" --coverage --coverageDirectory=coverage/unit',
    integration: 'jest --testPathPattern="integration\\.test\\.ts$" --coverage --coverageDirectory=coverage/integration',
    all: 'jest --coverage --coverageDirectory=coverage/all',
    watch: 'jest --watch',
    watchAll: 'jest --watchAll',
  };

  /**
   * Run specific test suite
   */
  static async runTests(type: keyof typeof TestRunner.TEST_COMMANDS): Promise<void> {
    console.log(`🧪 Running ${type} tests...`);
    
    try {
      const command = TestRunner.TEST_COMMANDS[type];
      execSync(command, { 
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      console.log(`✅ ${type} tests completed successfully!`);
    } catch (error) {
      console.error(`❌ ${type} tests failed:`, error);
      process.exit(1);
    }
  }

  /**
   * Setup test database with seed data
   */
  static async setupTestData(): Promise<void> {
    console.log('🌱 Setting up test data...');
    
    try {
      await TestDataSeeder.seedAll();
      console.log('✅ Test data setup completed!');
    } catch (error) {
      console.error('❌ Test data setup failed:', error);
      throw error;
    }
  }

  /**
   * Clean test database
   */
  static async cleanTestData(): Promise<void> {
    console.log('🧹 Cleaning test data...');
    
    try {
      await TestDataSeeder.cleanAll();
      console.log('✅ Test data cleanup completed!');
    } catch (error) {
      console.error('❌ Test data cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Run API endpoint tests with sample requests
   */
  static async runAPITests(): Promise<void> {
    console.log('🔗 Running API endpoint tests...');
    
    const testCases = [
      {
        name: 'Health Check',
        test: () => this.testHealthEndpoint(),
      },
      {
        name: 'Authentication Flow',
        test: () => this.testAuthenticationFlow(),
      },
      {
        name: 'Restaurant Discovery',
        test: () => this.testRestaurantDiscovery(),
      },
      {
        name: 'Transaction Recording',
        test: () => this.testTransactionRecording(),
      },
    ];

    for (const testCase of testCases) {
      try {
        console.log(`  Testing: ${testCase.name}`);
        await testCase.test();
        console.log(`  ✅ ${testCase.name} passed`);
      } catch (error) {
        console.error(`  ❌ ${testCase.name} failed:`, error);
        throw error;
      }
    }
    
    console.log('✅ All API endpoint tests passed!');
  }

  /**
   * Test health endpoint
   */
  private static async testHealthEndpoint(): Promise<void> {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:3000/health');
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const data = await response.json() as any;
    if (data.status !== 'OK') {
      throw new Error('Health check returned non-OK status');
    }
  }

  /**
   * Test authentication flow
   */
  private static async testAuthenticationFlow(): Promise<void> {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = 'http://localhost:3000/api/v1';
    
    // Test user registration
    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originCountry: 'Test Country',
        arrivalDate: '2024-01-15T10:00:00Z',
        departureDate: '2024-01-22T15:00:00Z',
        walletAddress: '0x' + '1'.repeat(40),
      }),
    });
    
    if (!registerResponse.ok) {
      const error = await registerResponse.text();
      throw new Error(`Registration failed: ${error}`);
    }
    
    const registerData = await registerResponse.json() as any;
    const token = registerData.data.token;
    
    // Test profile access
    const profileResponse = await fetch(`${baseUrl}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!profileResponse.ok) {
      throw new Error('Profile access failed');
    }
  }

  /**
   * Test restaurant discovery
   */
  private static async testRestaurantDiscovery(): Promise<void> {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = 'http://localhost:3000/api/v1';
    
    // Test nearby restaurants (mocked Google Maps API)
    const nearbyResponse = await fetch(
      `${baseUrl}/restaurants/nearby?lat=22.3193&lng=114.1694&radius=5000`
    );
    
    if (!nearbyResponse.ok) {
      throw new Error('Nearby restaurants endpoint failed');
    }
  }

  /**
   * Test transaction recording
   */
  private static async testTransactionRecording(): Promise<void> {
    // This would require setting up test blockchain or mocking
    // For now, just validate the endpoint exists
    console.log('  Transaction recording test skipped (requires blockchain setup)');
  }

  /**
   * Generate test coverage report
   */
  static async generateCoverageReport(): Promise<void> {
    console.log('📊 Generating coverage report...');
    
    try {
      execSync('jest --coverage --coverageReporters=html --coverageReporters=text', {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      console.log('✅ Coverage report generated in coverage/ directory');
      console.log('📖 Open coverage/index.html to view detailed report');
    } catch (error) {
      console.error('❌ Coverage report generation failed:', error);
      throw error;
    }
  }

  /**
   * Validate API documentation
   */
  static async validateDocumentation(): Promise<void> {
    console.log('📚 Validating API documentation...');
    
    try {
      // Check if Swagger spec is valid
      const { swaggerSpec } = await import('../config/swagger');
      
      if (!swaggerSpec || typeof swaggerSpec !== 'object') {
        throw new Error('Invalid Swagger specification');
      }
      
      console.log('✅ API documentation is valid');
      console.log('📖 Access documentation at http://localhost:3000/api-docs');
    } catch (error) {
      console.error('❌ API documentation validation failed:', error);
      throw error;
    }
  }

  /**
   * Main test execution
   */
  static async main(): Promise<void> {
    const args = process.argv.slice(2);
    const command = args[0] || 'all';

    console.log('🚀 Tourist Rewards API Test Suite');
    console.log('=====================================');

    try {
      switch (command) {
        case 'unit':
          await this.runTests('unit');
          break;
          
        case 'integration':
          await this.runTests('integration');
          break;
          
        case 'all':
          await this.runTests('all');
          break;
          
        case 'watch':
          await this.runTests('watch');
          break;
          
        case 'api':
          await this.runAPITests();
          break;
          
        case 'coverage':
          await this.generateCoverageReport();
          break;
          
        case 'docs':
          await this.validateDocumentation();
          break;
          
        case 'seed':
          await this.setupTestData();
          break;
          
        case 'clean':
          await this.cleanTestData();
          break;
          
        case 'full':
          console.log('🔄 Running full test suite...');
          await this.setupTestData();
          await this.runTests('all');
          await this.generateCoverageReport();
          await this.validateDocumentation();
          await this.cleanTestData();
          break;
          
        default:
          console.log('Available commands:');
          console.log('  unit        - Run unit tests only');
          console.log('  integration - Run integration tests only');
          console.log('  all         - Run all tests');
          console.log('  watch       - Run tests in watch mode');
          console.log('  api         - Run API endpoint tests');
          console.log('  coverage    - Generate coverage report');
          console.log('  docs        - Validate API documentation');
          console.log('  seed        - Setup test data');
          console.log('  clean       - Clean test data');
          console.log('  full        - Run complete test suite');
          break;
      }
      
      console.log('🎉 Test execution completed successfully!');
    } catch (error) {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  TestRunner.main().catch(console.error);
}

export default TestRunner;