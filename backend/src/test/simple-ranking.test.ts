// Using Jest test framework (no imports needed)
import { prisma } from '../config/database';

describe('Simple Ranking Test', () => {
  let testRestaurants: any[] = [];

  beforeAll(async () => {
    console.log('Starting simple test setup...');
    
    // Clean up
    await prisma.transaction.deleteMany({
      where: { blockchainHash: { startsWith: '0x' } }
    });
    await prisma.restaurant.deleteMany({
      where: { googlePlaceId: { startsWith: 'test_' } }
    });

    // Create one test restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        googlePlaceId: 'test_simple',
        name: 'Simple Test Restaurant',
        address: '123 Test St',
        latitude: 22.3193,
        longitude: 114.1694,
        walletAddress: '0x1111111111111111111111111111111111111111',
        qrCodeData: 'test_qr',
        totalCoinsReceived: 10
      }
    });

    testRestaurants = [restaurant];
    console.log('Created restaurant:', restaurant.id, restaurant.name);
    console.log('testRestaurants array:', testRestaurants.length);
  });

  afterAll(async () => {
    // Clean up in correct order: transactions first, then restaurants
    await prisma.transaction.deleteMany({
      where: { blockchainHash: { startsWith: '0x' } }
    });
    await prisma.dailyReward.deleteMany({});
    await prisma.restaurant.deleteMany({
      where: { googlePlaceId: { startsWith: 'test_' } }
    });
    await prisma.user.deleteMany({
      where: { walletAddress: { startsWith: '0x' } }
    });
  });

  it('should have test data available', async () => {
    console.log('In test - testRestaurants length:', testRestaurants.length);
    console.log('In test - testRestaurants[0]:', testRestaurants[0]?.id);
    
    if (testRestaurants.length === 0) {
      throw new Error('No test restaurants found');
    }
    
    if (!testRestaurants[0]) {
      throw new Error('testRestaurants[0] is undefined');
    }

    console.log('Test passed - restaurant ID:', testRestaurants[0].id);
  });
});