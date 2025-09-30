// Jest setup file for global test configuration
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Setup test database, mock services, etc.
});

afterAll(async () => {
  // Cleanup after all tests
});

// Increase timeout for blockchain operations
jest.setTimeout(30000);