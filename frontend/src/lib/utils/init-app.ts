// Application initialization utilities

import { initializeDatabase, DatabaseService } from '../db';
import { seedMockData } from '../mock-data/generators';
import { NetworkMonitor } from '../api/client';

export interface InitOptions {
  seedData?: boolean;
  clearExisting?: boolean;
}

/**
 * Initialize the application with database and network monitoring
 */
export async function initializeApp(options: InitOptions = {}): Promise<void> {
  const { seedData = true, clearExisting = false } = options;
  
  try {
    // Initialize IndexedDB
    console.log('Initializing database...');
    await initializeDatabase();
    
    // Clear existing data if requested
    if (clearExisting) {
      console.log('Clearing existing data...');
      await DatabaseService.clearAllData();
    }
    
    // Check if we need to seed data
    const existingMerchants = await DatabaseService.getMerchants();
    const shouldSeed = seedData && (clearExisting || existingMerchants.length === 0);
    
    if (shouldSeed) {
      console.log('Seeding mock data...');
      await seedMockData();
    }
    
    // Initialize network monitoring
    if (typeof window !== 'undefined') {
      NetworkMonitor.init();
      console.log('Network monitoring initialized');
    }
    
    console.log('Application initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    throw error;
  }
}

/**
 * Check application health and data integrity
 */
export async function checkAppHealth(): Promise<{
  database: boolean;
  mockData: boolean;
  network: boolean;
}> {
  const health = {
    database: false,
    mockData: false,
    network: false,
  };
  
  try {
    // Check database connection
    const merchants = await DatabaseService.getMerchants();
    health.database = true;
    health.mockData = merchants.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
  }
  
  try {
    // Check network connectivity
    if (typeof window !== 'undefined') {
      health.network = navigator.onLine;
    } else {
      health.network = true; // Assume online in server context
    }
  } catch (error) {
    console.error('Network health check failed:', error);
  }
  
  return health;
}

/**
 * Reset application to initial state
 */
export async function resetApp(): Promise<void> {
  try {
    await DatabaseService.clearAllData();
    await seedMockData();
    console.log('Application reset successfully');
  } catch (error) {
    console.error('Failed to reset application:', error);
    throw error;
  }
}