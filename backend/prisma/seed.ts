import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.dailyReward.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        originCountry: 'USA',
        arrivalDate: new Date('2024-01-15'),
        departureDate: new Date('2024-01-25'),
        walletAddress: '0x1234567890123456789012345678901234567890',
      },
    }),
    prisma.user.create({
      data: {
        originCountry: 'Germany',
        arrivalDate: new Date('2024-01-20'),
        departureDate: new Date('2024-02-05'),
        walletAddress: '0x2345678901234567890123456789012345678901',
      },
    }),
    prisma.user.create({
      data: {
        originCountry: 'Japan',
        arrivalDate: new Date('2024-01-18'),
        departureDate: new Date('2024-01-28'),
        walletAddress: '0x3456789012345678901234567890123456789012',
      },
    }),
    prisma.user.create({
      data: {
        originCountry: 'Brazil',
        arrivalDate: new Date('2024-01-22'),
        departureDate: new Date('2024-02-10'),
        walletAddress: '0x4567890123456789012345678901234567890123',
      },
    }),
    prisma.user.create({
      data: {
        originCountry: 'France',
        arrivalDate: new Date('2024-01-16'),
        departureDate: new Date('2024-01-30'),
        walletAddress: '0x5678901234567890123456789012345678901234',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create sample restaurants in Hong Kong
  const restaurants = await Promise.all([
    prisma.restaurant.create({
      data: {
        googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: 'Tim Ho Wan (Central)',
        address: '2-20 Wellington Street, Central, Hong Kong',
        latitude: new Decimal('22.2819'),
        longitude: new Decimal('114.1577'),
        walletAddress: '0xabcdef1234567890123456789012345678901234',
        qrCodeData: 'restaurant_1_qr_data',
        totalCoinsReceived: 150,
      },
    }),
    prisma.restaurant.create({
      data: {
        googlePlaceId: 'ChIJrTLr-GyuEmsRBfy61i59si0',
        name: 'Kam Wah Cafe',
        address: '47 Bute Street, Prince Edward, Kowloon, Hong Kong',
        latitude: new Decimal('22.3242'),
        longitude: new Decimal('114.1688'),
        walletAddress: '0xbcdef12345678901234567890123456789012345',
        qrCodeData: 'restaurant_2_qr_data',
        totalCoinsReceived: 230,
      },
    }),
    prisma.restaurant.create({
      data: {
        googlePlaceId: 'ChIJOwg_06VPwokRYv534QaPC8g',
        name: 'Yung Kee Restaurant',
        address: '32-40 Wellington Street, Central, Hong Kong',
        latitude: new Decimal('22.2815'),
        longitude: new Decimal('114.1569'),
        walletAddress: '0xcdef123456789012345678901234567890123456',
        qrCodeData: 'restaurant_3_qr_data',
        totalCoinsReceived: 180,
      },
    }),
    prisma.restaurant.create({
      data: {
        googlePlaceId: 'ChIJKxjxuaNZwokRVf__s8CPn-8',
        name: 'Mak Man Kee Noodle Shop',
        address: '51 Parkes Street, Jordan, Kowloon, Hong Kong',
        latitude: new Decimal('22.3048'),
        longitude: new Decimal('114.1719'),
        walletAddress: '0xdef1234567890123456789012345678901234567',
        qrCodeData: 'restaurant_4_qr_data',
        totalCoinsReceived: 95,
      },
    }),
    prisma.restaurant.create({
      data: {
        googlePlaceId: 'ChIJb09Jlc9dwokRMf_2tVfBSgU',
        name: 'Sing Heung Yuen',
        address: '2 Mei Lun Street, Central, Hong Kong',
        latitude: new Decimal('22.2825'),
        longitude: new Decimal('114.1532'),
        walletAddress: '0xef12345678901234567890123456789012345678',
        qrCodeData: 'restaurant_5_qr_data',
        totalCoinsReceived: 320,
      },
    }),
    prisma.restaurant.create({
      data: {
        googlePlaceId: 'ChIJc1t_tDeuEmsRUsoyG83frY5',
        name: "Maxim's Palace",
        address: 'City Hall Low Block, 2/F, Central, Hong Kong',
        latitude: new Decimal('22.2793'),
        longitude: new Decimal('114.1614'),
        walletAddress: '0xfe23456789012345678901234567890123456789',
        qrCodeData: 'restaurant_6_qr_data',
        totalCoinsReceived: 275,
      },
    }),
    prisma.restaurant.create({
      data: {
        googlePlaceId: 'ChIJd2t_tDeuEmsRUsoyG83frY6',
        name: 'Tsui Wah Restaurant',
        address: '15-19 Wellington Street, Central, Hong Kong',
        latitude: new Decimal('22.2811'),
        longitude: new Decimal('114.1573'),
        walletAddress: '0xed34567890123456789012345678901234567890',
        qrCodeData: 'restaurant_7_qr_data',
        totalCoinsReceived: 190,
      },
    }),
    prisma.restaurant.create({
      data: {
        googlePlaceId: 'ChIJe3t_tDeuEmsRUsoyG83frY7',
        name: 'Kau Kee Restaurant',
        address: '21 Gough Street, Central, Hong Kong',
        latitude: new Decimal('22.2834'),
        longitude: new Decimal('114.1548'),
        walletAddress: '0xdc45678901234567890123456789012345678901',
        qrCodeData: 'restaurant_8_qr_data',
        totalCoinsReceived: 165,
      },
    }),
    prisma.restaurant.create({
      data: {
        googlePlaceId: 'ChIJf4t_tDeuEmsRUsoyG83frY8',
        name: 'Lan Fong Yuen',
        address: '2 Gage Street, Central, Hong Kong',
        latitude: new Decimal('22.2821'),
        longitude: new Decimal('114.1559'),
        walletAddress: '0xcb56789012345678901234567890123456789012',
        qrCodeData: 'restaurant_9_qr_data',
        totalCoinsReceived: 210,
      },
    }),
    prisma.restaurant.create({
      data: {
        googlePlaceId: 'ChIJg5t_tDeuEmsRUsoyG83frY9',
        name: 'Tai Cheong Bakery',
        address: '35 Lyndhurst Terrace, Central, Hong Kong',
        latitude: new Decimal('22.2845'),
        longitude: new Decimal('114.1542'),
        walletAddress: '0xba67890123456789012345678901234567890123',
        qrCodeData: 'restaurant_10_qr_data',
        totalCoinsReceived: 125,
      },
    }),
  ]);

  console.log(`✅ Created ${restaurants.length} restaurants`);

  // Create daily rewards for users
  const dailyRewards = [];
  for (const user of users) {
    for (let i = 0; i < 5; i++) {
      const rewardDate = new Date('2024-01-20');
      rewardDate.setDate(rewardDate.getDate() + i);

      dailyRewards.push(
        prisma.dailyReward.create({
          data: {
            userId: user.id,
            rewardDate,
            coinsReceived: 10,
            coinsGiven: Math.floor(Math.random() * 8) + 2, // 2-9 coins given
            allCoinsGiven: Math.random() > 0.7, // 30% chance all coins given
          },
        })
      );
    }
  }

  await Promise.all(dailyRewards);
  console.log(`✅ Created ${dailyRewards.length} daily rewards`);

  // Create sample transactions
  const transactions = [];

  // Generate transactions for each user visiting different restaurants
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (!user) continue;

    const numTransactions = Math.floor(Math.random() * 5) + 3; // 3-7 transactions per user

    for (let j = 0; j < numTransactions; j++) {
      const restaurant =
        restaurants[Math.floor(Math.random() * restaurants.length)];
      if (!restaurant) continue;

      const amount = Math.floor(Math.random() * 8) + 2; // 2-9 coins
      const transactionDate = new Date('2024-01-20');
      transactionDate.setDate(
        transactionDate.getDate() + Math.floor(Math.random() * 5)
      );

      transactions.push(
        prisma.transaction.create({
          data: {
            blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            fromAddress: user.walletAddress,
            toAddress: restaurant.walletAddress,
            userId: user.id,
            restaurantId: restaurant.id,
            amount,
            transactionDate,
            userOriginCountry: user.originCountry,
            blockNumber: BigInt(Math.floor(Math.random() * 1000000) + 18000000),
            gasUsed: BigInt(Math.floor(Math.random() * 50000) + 21000),
          },
        })
      );
    }
  }

  await Promise.all(transactions);
  console.log(`✅ Created ${transactions.length} transactions`);

  // Update restaurant total coins based on transactions
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

  console.log('✅ Updated restaurant coin totals');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
