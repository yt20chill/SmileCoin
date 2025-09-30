const { PrismaClient } = require('@prisma/client');

async function debugTest() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://test:test@localhost:5432/tourist_rewards_test'
      }
    }
  });

  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✓ Database connected');

    // Test restaurant count
    const restaurantCount = await prisma.restaurant.count();
    console.log(`✓ Restaurant count: ${restaurantCount}`);

    // Test transaction count
    const transactionCount = await prisma.transaction.count();
    console.log(`✓ Transaction count: ${transactionCount}`);

    // Create test data
    console.log('Creating test data...');
    
    const testUser = await prisma.user.create({
      data: {
        originCountry: 'United States',
        arrivalDate: new Date('2024-01-01'),
        departureDate: new Date('2024-01-10'),
        walletAddress: '0x1234567890123456789012345678901234567890'
      }
    });
    console.log(`✓ Created test user: ${testUser.id}`);

    const testRestaurant = await prisma.restaurant.create({
      data: {
        googlePlaceId: 'test_place_1',
        name: 'Top Restaurant',
        address: '123 Main St, Hong Kong',
        latitude: 22.3193,
        longitude: 114.1694,
        walletAddress: '0x2234567890123456789012345678901234567890',
        qrCodeData: JSON.stringify({ googlePlaceId: 'test_place_1', walletAddress: '0x2234567890123456789012345678901234567890' }),
        totalCoinsReceived: 100
      }
    });
    console.log(`✓ Created test restaurant: ${testRestaurant.id}`);

    const testTransaction = await prisma.transaction.create({
      data: {
        blockchainHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        fromAddress: testUser.walletAddress,
        toAddress: testRestaurant.walletAddress,
        userId: testUser.id,
        restaurantId: testRestaurant.id,
        amount: 3,
        transactionDate: new Date('2024-01-05'),
        userOriginCountry: 'United States'
      }
    });
    console.log(`✓ Created test transaction: ${testTransaction.id}`);

    // Test origin-based query
    const originQuery = `
      WITH origin_stats AS (
        SELECT 
          t.restaurant_id,
          SUM(t.amount) as origin_coins,
          COUNT(*) as origin_transactions
        FROM transactions t
        WHERE t.user_origin_country = $1
        GROUP BY t.restaurant_id
      ),
      ranked_restaurants AS (
        SELECT 
          r.*,
          COALESCE(os.origin_coins, 0) as origin_specific_coins,
          COALESCE(os.origin_transactions, 0) as origin_transactions,
          ROW_NUMBER() OVER (ORDER BY COALESCE(os.origin_coins, 0) DESC, r.total_coins_received DESC, r.created_at ASC) as origin_rank
        FROM restaurants r
        LEFT JOIN origin_stats os ON r.id = os.restaurant_id
      )
      SELECT * FROM ranked_restaurants
      ORDER BY origin_specific_coins DESC, total_coins_received DESC, created_at ASC
      LIMIT $2 OFFSET $3
    `;

    console.log('Testing origin-based query...');
    const result = await prisma.$queryRawUnsafe(originQuery, 'United States', 20, 0);
    console.log(`✓ Origin query result count: ${result.length}`);
    if (result.length > 0) {
      console.log('✓ First result:', {
        name: result[0].name,
        origin_specific_coins: result[0].origin_specific_coins,
        total_coins_received: result[0].total_coins_received
      });
    }

  } catch (error) {
    console.error('✗ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTest();