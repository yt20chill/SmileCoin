/**
 * Jest configuration for Performance tests
 */

module.exports = {
  displayName: 'Performance Tests',
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
  coverageDirectory: '../../coverage/performance',
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
  testTimeout: 180000, // 3 minutes for performance tests
  maxWorkers: 1, // Run tests sequentially to get accurate performance measurements
  verbose: true,
  bail: false, // Continue running tests even if some fail
  detectOpenHandles: true,
  forceExit: true,
  
  // Performance-specific configuration
  slowTestThreshold: 30, // Mark tests as slow if they take more than 30 seconds
  
  // Custom reporters for performance metrics
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: '../../test-reports/performance',
      filename: 'performance-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'SmileCoin Performance Test Report'
    }]
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/global-setup.ts',
  globalTeardown: '<rootDir>/global-teardown.ts',

  // Test environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },

  // Performance test specific settings
  globals: {
    'ts-jest': {
      tsconfig: {
        compilerOptions: {
          // Optimize for performance testing
          target: 'es2020',
          module: 'commonjs',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        }
      }
    }
  }
};