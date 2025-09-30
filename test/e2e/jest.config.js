/**
 * Jest configuration for End-to-End tests
 */

module.exports = {
  displayName: 'E2E Tests',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    '../../src/**/*.ts',
    '!../../src/**/*.d.ts',
    '!../../src/**/*.test.ts',
    '!../../src/**/*.spec.ts'
  ],
  coverageDirectory: '../../coverage/e2e',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../src/$1',
    '^@contracts/(.*)$': '<rootDir>/../../contracts/$1',
    '^@test/(.*)$': '<rootDir>/../../test/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testTimeout: 120000, // 2 minutes for E2E tests
  maxWorkers: 1, // Run tests sequentially to avoid conflicts
  verbose: true,
  bail: false, // Continue running tests even if some fail
  detectOpenHandles: true,
  forceExit: true,
  
  // Custom reporters for better output
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: '../../test-reports/e2e',
      filename: 'e2e-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'SmileCoin E2E Test Report'
    }]
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/global-setup.ts',
  globalTeardown: '<rootDir>/global-teardown.ts',

  // Test environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};