import { readFileSync } from 'fs';
import { join } from 'path';
import { prisma } from '../config/database';

/**
 * Script to create database views
 * Run with: npx ts-node src/scripts/createViews.ts
 */
async function createViews() {
  try {
    console.log('🔧 Creating database views...');

    // Read the restaurant analytics view SQL
    const viewSQL = readFileSync(
      join(__dirname, '../../prisma/views/restaurant_analytics.sql'),
      'utf-8'
    );

    // Execute the view creation
    await prisma.$executeRawUnsafe(viewSQL);

    console.log('✅ Restaurant analytics view created successfully');

    // Test the view by running a simple query
    const testResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM restaurant_analytics
    `;
    
    console.log('🧪 View test result:', testResult);

  } catch (error) {
    console.error('❌ Error creating views:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if called directly
if (require.main === module) {
  createViews();
}

export { createViews };
