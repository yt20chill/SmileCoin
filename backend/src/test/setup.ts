// Test setup file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/tourist_rewards_test';

// Mock console methods in tests to reduce noise
if (process.env.NODE_ENV === 'test') {
  // Temporarily disable console mocking to see debug output
  // console.log = jest.fn();
  // console.info = jest.fn();
  // console.warn = jest.fn();
  // console.error = jest.fn();
}