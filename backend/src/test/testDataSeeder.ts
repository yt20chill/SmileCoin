import { prisma } from '../config/database';

export interface TestUser {
  id: string;
  originCountry: string;
  arrivalDate: Date;
  departureDate: Date;
  walletAddress: string;
}

export interface TestRestaurant {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number | any;
  longitude: number | any;
  walletAddress: string;
  qrCodeData: string;
}

export interface TestTransaction {
  id: string;
  blockchainHash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  transactionDate: Date;
  userOriginCountry: string;
}

export class TestDataSeeder {
  /**
   * Create test users with various origin countries and travel dates
   */
  static async createTestUsers(): Promise<TestUser[]> {
    const users = [
      {
        originCountry: 'United States',
        arrivalDate: new Date('2024-01-15T10:00:00Z'),
        departureDate: new Date('2024-01-22T15:00:00Z'),
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
      },
      {
        originCountry: 'United Kingdom',
        arrivalDate: new Date('2024-01-10T08:00:00Z'),
        departureDate: new Date('2024-01-25T12:00:00Z'),
        walletAddress: '0x1234567890123456789012345678901234567890',
      },
      {
        originCountry: 'Japan',
        arrivalDate: new Date('2024-01-12T14:00:00Z'),
        departureDate: new Date('2024-01-19T18:00:00Z'),
        walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      },
      {
        originCountry: 'Australia',
        arrivalDate: new Date('2024-01-08T06:00:00Z'),
        departureDate: new Date('2024-01-28T20:00:00Z'),
        walletAddress: '0x9876543210987654321098765432109876543210',
      },
      {
        originCountry: 'Canada',
        arrivalDate: new Date('2024-01-14T11:00:00Z'),
        departureDate: new Date('2024-01-21T16:00:00Z'),
        walletAddress: '0xfedcbafedcbafedcbafedcbafedcbafedcbafed',
      },
    ];

    const createdUsers: TestUser[] = [];
    for (const userData of users) {
      const user = await prisma.user.create({
        data: userData,
      });
      createdUsers.push(user);
    }

    return createdUsers;
  }

  /**
   * Create test restaurants with Google Place IDs and various locations in Hong Kong
   */
  static async createTestRestaurants(): Promise<TestRestaurant[]> {
    const restaurants = [
      {
        googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: 'Dim Sum Palace',
        address: '123 Nathan Road, Tsim Sha Tsui, Hong Kong',
        latitude: 22.3193,
        longitude: 114.1694,
        walletAddress: '0x1111111111111111111111111111111111111111',
        qrCodeData: JSON.stringify({
          googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          walletAddress: '0x1111111111111111111111111111111111111111',
        }),
      },
      {
        googlePlaceId: 'ChIJ2WrMN9AZADQR9WqhGlY5llI',
        name: 'Golden Dragon Restaurant',
        address: '456 Queen\'s Road Central, Central, Hong Kong',
        latitude: 22.2819,
        longitude: 114.1577,
        walletAddress: '0x2222222222222222222222222222222222222222',
        qrCodeData: JSON.stringify({
          googlePlaceId: 'ChIJ2WrMN9AZADQR9WqhGlY5llI',
          walletAddress: '0x2222222222222222222222222222222222222222',
        }),
      },
      {
        googlePlaceId: 'ChIJOwg_06VPwokRYv534QaPC8g',
        name: 'Harbour View Seafood',
        address: '789 Harbour Road, Wan Chai, Hong Kong',
        latitude: 22.2783,
        longitude: 114.1747,
        walletAddress: '0x3333333333333333333333333333333333333333',
        qrCodeData: JSON.stringify({
          googlePlaceId: 'ChIJOwg_06VPwokRYv534QaPC8g',
          walletAddress: '0x3333333333333333333333333333333333333333',
        }),
      },
      {
        googlePlaceId: 'ChIJdd4hrwug2EcRmSrV3Vo6llI',
        name: 'Rooftop Bar & Grill',
        address: '321 Lockhart Road, Causeway Bay, Hong Kong',
        latitude: 22.2800,
        longitude: 114.1850,
        walletAddress: '0x4444444444444444444444444444444444444444',
        qrCodeData: JSON.stringify({
          googlePlaceId: 'ChIJdd4hrwug2EcRmSrV3Vo6llI',
          walletAddress: '0x4444444444444444444444444444444444444444',
        }),
      },
      {
        googlePlaceId: 'ChIJrTLr-GyuEmsRBfy61i59si0',
        name: 'Traditional Tea House',
        address: '654 Hollywood Road, Sheung Wan, Hong Kong',
        latitude: 22.2850,
        longitude: 114.1500,
        walletAddress: '0x5555555555555555555555555555555555555555',
        qrCodeData: JSON.stringify({
          googlePlaceId: 'ChIJrTLr-GyuEmsRBfy61i59si0',
          walletAddress: '0x5555555555555555555555555555555555555555',
        }),
      },
    ];

    const createdRestaurants: TestRestaurant[] = [];
    for (const restaurantData of restaurants) {
      const restaurant = await prisma.restaurant.create({
        data: restaurantData,
      });
      createdRestaurants.push(restaurant);
    }

    return createdRestaurants;
  }

  /**
   * Create test transactions between users and restaurants
   */
  static async createTestTransactions(
    users: TestUser[],
    restaurants: TestRestaurant[]
  ): Promise<TestTransaction[]> {
    const transactions = [
      // User 1 (US) gives coins to multiple restaurants
      {
        blockchainHash: '0xabc123def456ghi789jkl012mno345pqr678stu901vwx234yzab567cde890fgh123',
        fromAddress: users[0]?.walletAddress || '',
        toAddress: restaurants[0]?.walletAddress || '',
        userId: users[0]?.id || '',
        restaurantId: restaurants[0]?.id || '',
        amount: 3,
        transactionDate: new Date('2024-01-15T12:00:00Z'),
        userOriginCountry: users[0]?.originCountry || '',
      },
      {
        blockchainHash: '0xdef456ghi789jkl012mno345pqr678stu901vwx234yzab567cde890fgh123abc456',
        fromAddress: users[0]?.walletAddress || '',
        toAddress: restaurants[1]?.walletAddress || '',
        userId: users[0]?.id || '',
        restaurantId: restaurants[1]?.id || '',
        amount: 2,
        transactionDate: new Date('2024-01-16T14:30:00Z'),
        userOriginCountry: users[0]?.originCountry || '',
      },
      // User 2 (UK) gives coins
      {
        blockchainHash: '0xghi789jkl012mno345pqr678stu901vwx234yzab567cde890fgh123abc456def789',
        fromAddress: users[1]?.walletAddress || '',
        toAddress: restaurants[0]?.walletAddress || '',
        userId: users[1]?.id || '',
        restaurantId: restaurants[0]?.id || '',
        amount: 1,
        transactionDate: new Date('2024-01-11T10:15:00Z'),
        userOriginCountry: users[1]?.originCountry || '',
      },
      {
        blockchainHash: '0xjkl012mno345pqr678stu901vwx234yzab567cde890fgh123abc456def789ghi012',
        fromAddress: users[1]?.walletAddress || '',
        toAddress: restaurants[2]?.walletAddress || '',
        userId: users[1]?.id || '',
        restaurantId: restaurants[2]?.id || '',
        amount: 3,
        transactionDate: new Date('2024-01-12T16:45:00Z'),
        userOriginCountry: users[1]?.originCountry || '',
      },
      // User 3 (Japan) gives coins
      {
        blockchainHash: '0xmno345pqr678stu901vwx234yzab567cde890fgh123abc456def789ghi012jkl345',
        fromAddress: users[2]?.walletAddress || '',
        toAddress: restaurants[1]?.walletAddress || '',
        userId: users[2]?.id || '',
        restaurantId: restaurants[1]?.id || '',
        amount: 2,
        transactionDate: new Date('2024-01-13T13:20:00Z'),
        userOriginCountry: users[2]?.originCountry || '',
      },
      // User 4 (Australia) gives coins
      {
        blockchainHash: '0xpqr678stu901vwx234yzab567cde890fgh123abc456def789ghi012jkl345mno678',
        fromAddress: users[3]?.walletAddress || '',
        toAddress: restaurants[3]?.walletAddress || '',
        userId: users[3]?.id || '',
        restaurantId: restaurants[3]?.id || '',
        amount: 1,
        transactionDate: new Date('2024-01-09T09:30:00Z'),
        userOriginCountry: users[3]?.originCountry || '',
      },
      // User 5 (Canada) gives coins
      {
        blockchainHash: '0xstu901vwx234yzab567cde890fgh123abc456def789ghi012jkl345mno678pqr901',
        fromAddress: users[4]?.walletAddress || '',
        toAddress: restaurants[4]?.walletAddress || '',
        userId: users[4]?.id || '',
        restaurantId: restaurants[4]?.id || '',
        amount: 3,
        transactionDate: new Date('2024-01-15T15:10:00Z'),
        userOriginCountry: users[4]?.originCountry || '',
      },
    ];

    const createdTransactions: TestTransaction[] = [];
    for (const transactionData of transactions) {
      const transaction = await prisma.transaction.create({
        data: transactionData,
      });
      createdTransactions.push(transaction);
    }

    // Update restaurant total coins
    for (const restaurant of restaurants) {
      const totalCoins = await prisma.transaction.aggregate({
        where: { restaurantId: restaurant.id },
        _sum: { amount: true },
      });

      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { totalCoinsReceived: totalCoins._sum.amount || 0 },
      });
    }

    return createdTransactions;
  }

  /**
   * Create daily rewards data for users
   */
  static async createTestDailyRewards(users: TestUser[]): Promise<void> {
    const dailyRewards = [];

    for (const user of users) {
      const arrivalDate = new Date(user.arrivalDate);
      const departureDate = new Date(user.departureDate);
      
      // Create daily rewards for each day of stay
      for (let date = new Date(arrivalDate); date <= departureDate; date.setDate(date.getDate() + 1)) {
        const rewardDate = new Date(date);
        const isCompleted = Math.random() > 0.3; // 70% chance of completion
        
        dailyRewards.push({
          userId: user.id,
          rewardDate,
          coinsReceived: 10,
          coinsGiven: isCompleted ? 10 : Math.floor(Math.random() * 10),
          allCoinsGiven: isCompleted,
        });
      }
    }

    for (const rewardData of dailyRewards) {
      await prisma.dailyReward.create({
        data: rewardData,
      });
    }
  }

  /**
   * Seed all test data
   */
  static async seedAll(): Promise<{
    users: TestUser[];
    restaurants: TestRestaurant[];
    transactions: TestTransaction[];
  }> {
    console.log('🌱 Seeding test data...');

    // Clean existing data
    await prisma.transaction.deleteMany();
    await prisma.dailyReward.deleteMany();
    await prisma.user.deleteMany();
    await prisma.restaurant.deleteMany();

    // Create test data
    const users = await this.createTestUsers();
    console.log(`✅ Created ${users.length} test users`);

    const restaurants = await this.createTestRestaurants();
    console.log(`✅ Created ${restaurants.length} test restaurants`);

    const transactions = await this.createTestTransactions(users, restaurants);
    console.log(`✅ Created ${transactions.length} test transactions`);

    await this.createTestDailyRewards(users);
    console.log(`✅ Created daily rewards data`);

    console.log('🎉 Test data seeding completed!');

    return { users, restaurants, transactions };
  }

  /**
   * Clean all test data
   */
  static async cleanAll(): Promise<void> {
    console.log('🧹 Cleaning test data...');

    await prisma.transaction.deleteMany();
    await prisma.dailyReward.deleteMany();
    await prisma.user.deleteMany();
    await prisma.restaurant.deleteMany();

    console.log('✅ Test data cleaned!');
  }

  /**
   * Get sample data for API testing
   */
  static getSampleData() {
    return {
      validUser: {
        originCountry: 'United States',
        arrivalDate: '2024-01-15T10:00:00Z',
        departureDate: '2024-01-22T15:00:00Z',
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4',
      },
      validRestaurant: {
        googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        walletAddress: '0x1111111111111111111111111111111111111111',
      },
      validTransaction: {
        amount: 2,
        restaurantId: 'restaurant-id-placeholder',
      },
      invalidWalletAddress: 'invalid-wallet-address',
      invalidDate: 'invalid-date-format',
      invalidAmount: 5, // Max is 3 coins per transaction
    };
  }
}