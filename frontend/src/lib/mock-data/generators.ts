// Mock data generators for development and testing

import type { User, Merchant, Offer, Reward, Voucher, Transaction, Rating } from '../types';

// Helper function to generate random IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Helper function to generate random dates
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to get random array element
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate mock users
export function generateMockUsers(count: number = 10): User[] {
  const users: User[] = [];
  const airlines = ['CX', 'SQ', 'BA', 'QF', 'EK', 'JL', 'KE', 'TG'];
  const languages: ('en' | 'zh-TW')[] = ['en', 'zh-TW'];
  const methods: ('boarding-pass' | 'manual')[] = ['boarding-pass', 'manual'];

  for (let i = 0; i < count; i++) {
    const arrivalDate = randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date());

    users.push({
      id: generateId(),
      email: `tourist${i + 1}@example.com`,
      fullName: `Tourist User ${i + 1}`,
      flightNumber: `${randomChoice(airlines)}${Math.floor(Math.random() * 9000) + 1000}`,
      arrivalDate,
      walletAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
      preferredLanguage: randomChoice(languages),
      registrationMethod: randomChoice(methods),
      scannedBoardingPasses: [],
      createdAt: arrivalDate,
    });
  }

  return users;
}

// Generate mock merchants (restaurants and food establishments only)
export function generateMockMerchants(count: number = 20): Merchant[] {
  const merchants: Merchant[] = [];

  const merchantData = [
    {
      name: 'Dim Sum Palace',
      nameZh: '點心皇宮',
      description: 'Authentic Cantonese dim sum in the heart of Central',
      descriptionZh: '位於中環的正宗粵式點心',
      category: 'restaurant',
      address: '123 Des Voeux Road Central, Central',
      addressZh: '中環德輔道中123號',
      coordinates: [22.2819, 114.1577] as [number, number],
    },
    {
      name: 'Golden Dragon Restaurant',
      nameZh: '金龍茶餐廳',
      description: 'Traditional Hong Kong cha chaan teng serving local favorites',
      descriptionZh: '傳統香港茶餐廳，提供本地美食',
      category: 'restaurant',
      address: '456 Nathan Road, Tsim Sha Tsui',
      addressZh: '尖沙咀彌敦道456號',
      coordinates: [22.2988, 114.1722] as [number, number],
    },
    {
      name: 'Roast Goose Master',
      nameZh: '燒鵝大師',
      description: 'Michelin-recommended roast goose and BBQ specialties',
      descriptionZh: '米其林推薦燒鵝及燒味專門店',
      category: 'restaurant',
      address: '789 Wellington Street, Central',
      addressZh: '中環威靈頓街789號',
      coordinates: [22.2766, 114.1668] as [number, number],
    },
    {
      name: 'Noodle Kingdom',
      nameZh: '麵條王國',
      description: 'Hand-pulled noodles and wonton soup specialists',
      descriptionZh: '手拉麵及雲吞湯專門店',
      category: 'restaurant',
      address: '321 Temple Street, Yau Ma Tei',
      addressZh: '油麻地廟街321號',
      coordinates: [22.3080, 114.1714] as [number, number],
    },
    {
      name: 'Seafood Harbor',
      nameZh: '海鮮港灣',
      description: 'Fresh seafood and Cantonese cuisine with harbor views',
      descriptionZh: '新鮮海鮮及粵菜，享海港景色',
      category: 'restaurant',
      address: '654 Gloucester Road, Causeway Bay',
      addressZh: '銅鑼灣告士打道654號',
      coordinates: [22.2783, 114.1747] as [number, number],
    },
    {
      name: 'Street Food Paradise',
      nameZh: '街頭美食天堂',
      description: 'Authentic Hong Kong street food and snacks',
      descriptionZh: '正宗香港街頭小食及零食',
      category: 'restaurant',
      address: '987 Fa Yuen Street, Mong Kok',
      addressZh: '旺角花園街987號',
      coordinates: [22.3193, 114.1694] as [number, number],
    },
    {
      name: 'Tea House Elegance',
      nameZh: '茶樓雅致',
      description: 'Premium Chinese tea house with traditional dim sum',
      descriptionZh: '高級中式茶樓，傳統點心',
      category: 'restaurant',
      address: '147 Queen\'s Road East, Wan Chai',
      addressZh: '灣仔皇后大道東147號',
      coordinates: [22.2783, 114.1747] as [number, number],
    },
    {
      name: 'Hotpot Heaven',
      nameZh: '火鍋天堂',
      description: 'All-you-can-eat hotpot with premium ingredients',
      descriptionZh: '優質食材任食火鍋',
      category: 'restaurant',
      address: '258 Canton Road, Tsim Sha Tsui',
      addressZh: '尖沙咀廣東道258號',
      coordinates: [22.2988, 114.1722] as [number, number],
    },
    {
      name: 'Bakery Bliss',
      nameZh: '麵包天堂',
      description: 'Fresh Hong Kong-style pastries and egg tarts',
      descriptionZh: '新鮮港式糕點及蛋撻',
      category: 'restaurant',
      address: '369 Hennessy Road, Causeway Bay',
      addressZh: '銅鑼灣軒尼詩道369號',
      coordinates: [22.2783, 114.1747] as [number, number],
    },
    {
      name: 'Congee Corner',
      nameZh: '粥品角落',
      description: 'Traditional Cantonese congee and side dishes',
      descriptionZh: '傳統粵式粥品及小菜',
      category: 'restaurant',
      address: '741 Shanghai Street, Mong Kok',
      addressZh: '旺角上海街741號',
      coordinates: [22.3193, 114.1694] as [number, number],
    },
  ];

  // Generate additional merchants by repeating and modifying the base data
  for (let i = 0; i < count; i++) {
    const baseData = merchantData[i % merchantData.length];
    const suffix = i >= merchantData.length ? ` ${Math.floor(i / merchantData.length) + 1}` : '';

    const merchantId = `merchant-${(i + 1).toString().padStart(3, '0')}`;

    merchants.push({
      id: merchantId,
      name: baseData.name + suffix,
      nameZh: baseData.nameZh + suffix,
      description: baseData.description,
      descriptionZh: baseData.descriptionZh,
      logo: "https://api.dicebear.com/9.x/thumbs/svg",
      category: baseData.category,
      qrCode: `SMILE_${merchantId.toUpperCase()}_RATING_ACCESS`,
      location: {
        address: baseData.address,
        addressZh: baseData.addressZh,
        coordinates: baseData.coordinates,
      },
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
      totalRatings: Math.floor(Math.random() * 500) + 50,
      isActive: Math.random() > 0.1, // 90% active
    });
  }

  return merchants;
}

// Generate mock offers
export function generateMockOffers(count: number = 50): Offer[] {
  const offers: Offer[] = [];
  const merchants = generateMockMerchants(20);

  const offerTemplates = [
    {
      title: '20% Off All Dim Sum',
      titleZh: '所有點心8折優惠',
      description: 'Enjoy 20% discount on all dim sum items during lunch hours',
      descriptionZh: '午餐時間所有點心項目享受8折優惠',
      discount: 20,
      terms: 'Valid during lunch hours (11:30 AM - 3:00 PM). Cannot be combined with other offers.',
      termsZh: '午餐時間有效（上午11:30 - 下午3:00）。不能與其他優惠同時使用。',
    },
    {
      title: 'Free Dessert with Main Course',
      titleZh: '主菜送甜品',
      description: 'Order any main course and get a complimentary dessert',
      descriptionZh: '點任何主菜即送免費甜品',
      discount: 25,
      terms: 'Valid for dine-in only. One dessert per main course ordered.',
      termsZh: '僅限堂食。每份主菜送一份甜品。',
    },
    {
      title: '15% Off Weekend Brunch',
      titleZh: '週末早午餐85折',
      description: 'Special weekend brunch discount for tourists',
      descriptionZh: '遊客專享週末早午餐優惠',
      discount: 15,
      terms: 'Valid on weekends only (Sat-Sun). Show tourist ID or boarding pass.',
      termsZh: '僅限週末（週六至週日）。需出示遊客證件或登機證。',
    },
    {
      title: 'Happy Hour Tea Set',
      titleZh: '歡樂時光茶點套餐',
      description: '30% off afternoon tea sets between 2-5 PM',
      descriptionZh: '下午2-5點茶點套餐7折優惠',
      discount: 30,
      terms: 'Valid 2:00 PM - 5:00 PM daily. Minimum 2 persons required.',
      termsZh: '每日下午2:00 - 5:00有效。最少2人用餐。',
    },
    {
      title: 'Group Dining Discount',
      titleZh: '團體用餐優惠',
      description: '25% off for groups of 6 or more people',
      descriptionZh: '6人或以上團體享75折優惠',
      discount: 25,
      terms: 'Minimum 6 people required. Advance reservation recommended.',
      termsZh: '最少6人。建議提前預訂。',
    },
    {
      title: 'Seafood Special Night',
      titleZh: '海鮮特價夜',
      description: 'Fresh seafood dishes at 20% off every Tuesday',
      descriptionZh: '每週二新鮮海鮮菜式8折優惠',
      discount: 20,
      terms: 'Valid on Tuesdays only. Fresh catch of the day included.',
      termsZh: '僅限週二。包括當日新鮮漁獲。',
    },
  ];

  for (let i = 0; i < count; i++) {
    const merchant = randomChoice(merchants);
    const template = randomChoice(offerTemplates);
    const validUntil = randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    offers.push({
      id: generateId(),
      merchantId: merchant.id,
      title: template.title,
      titleZh: template.titleZh,
      description: template.description,
      descriptionZh: template.descriptionZh,
      discountPercentage: template.discount,
      validUntil,
      termsAndConditions: template.terms,
      termsAndConditionsZh: template.termsZh,
      isActive: validUntil > new Date() && Math.random() > 0.2, // 80% active
    });
  }

  return offers;
}

// Generate mock rewards (unified voucher system)
export function generateMockRewards(count: number = 15): Reward[] {
  const rewards: Reward[] = [];

  const rewardData = [
    {
      name: '15% Off Dim Sum Feast',
      nameZh: '點心盛宴85折優惠券',
      description: 'Enjoy 15% discount on premium dim sum selection at participating restaurants',
      descriptionZh: '在參與餐廳享受精選點心85折優惠',
      category: 'voucher' as const,
      voucherType: 'discount' as const,
      discount: 15,
      instructions: 'Present this digital voucher at any participating dim sum restaurant. Valid for 30 days.',
      instructionsZh: '在任何參與的點心餐廳出示此數字券。有效期30天。',
    },
    {
      name: '20% Off Seafood Dinner',
      nameZh: '海鮮晚餐8折優惠',
      description: 'Special discount on fresh seafood dishes at premium restaurants',
      descriptionZh: '優質餐廳新鮮海鮮菜式特別優惠',
      category: 'voucher' as const,
      voucherType: 'discount' as const,
      discount: 20,
      instructions: 'Valid for dinner service only. Cannot be combined with other offers.',
      instructionsZh: '僅限晚餐服務。不能與其他優惠同時使用。',
    },
    {
      name: 'Complimentary Dim Sum Cooking Class',
      nameZh: '免費點心烹飪班',
      description: 'Free hands-on dim sum cooking experience with professional chef',
      descriptionZh: '與專業廚師免費體驗點心烹飪',
      category: 'experience' as const,
      voucherType: 'experience' as const,
      instructions: 'Book your free class by calling +852 1234 5678 and mention voucher code.',
      instructionsZh: '致電+852 1234 5678預訂免費課程並提及券碼。',
    },
    {
      name: 'Free Roast Duck Tasting',
      nameZh: '免費燒鴨品嚐',
      description: 'Complimentary roast duck sample at premium Hong Kong restaurants',
      descriptionZh: '在香港優質餐廳免費品嚐燒鴨',
      category: 'voucher' as const,
      voucherType: 'free_item' as const,
      instructions: 'Present voucher during lunch or dinner hours at participating restaurants.',
      instructionsZh: '在參與餐廳的午餐或晚餐時間出示券。',
    },
    {
      name: 'Free Wonton Noodle Bowl',
      nameZh: '免費雲吞麵',
      description: 'Complimentary authentic Hong Kong wonton noodle soup',
      descriptionZh: '免費正宗香港雲吞麵',
      category: 'voucher' as const,
      voucherType: 'free_item' as const,
      instructions: 'Redeem at any participating noodle shop. One voucher per customer.',
      instructionsZh: '在任何參與的麵店兌換。每位顧客限用一券。',
    },
    {
      name: 'Free Milk Tea Experience',
      nameZh: '免費奶茶體驗',
      description: 'Complimentary Hong Kong-style milk tea at local cha chaan tengs',
      descriptionZh: '在本地茶餐廳免費享用港式奶茶',
      category: 'voucher' as const,
      voucherType: 'free_item' as const,
      instructions: 'Show voucher at participating cha chaan tengs for your free milk tea.',
      instructionsZh: '在參與的茶餐廳出示券領取免費奶茶。',
    },
    {
      name: 'Free Egg Tart Dessert',
      nameZh: '免費蛋撻甜品',
      description: 'Complimentary traditional Hong Kong egg tart',
      descriptionZh: '免費傳統香港蛋撻',
      category: 'voucher' as const,
      voucherType: 'free_item' as const,
      instructions: 'Redeem at bakeries and dim sum restaurants. Valid until end of month.',
      instructionsZh: '在麵包店和點心餐廳兌換。有效期至月底。',
    },
    {
      name: 'Free Pineapple Bun',
      nameZh: '免費菠蘿包',
      description: 'Complimentary fresh pineapple bun from local bakeries',
      descriptionZh: '本地麵包店免費新鮮菠蘿包',
      category: 'voucher' as const,
      voucherType: 'free_item' as const,
      instructions: 'Present voucher at participating bakeries during morning hours.',
      instructionsZh: '在早上時間於參與麵包店出示券。',
    },
    {
      name: 'Free Congee Breakfast',
      nameZh: '免費粥品早餐',
      description: 'Complimentary traditional congee breakfast with preserved egg',
      descriptionZh: '免費傳統皮蛋瘦肉粥早餐',
      category: 'voucher' as const,
      voucherType: 'free_item' as const,
      instructions: 'Redeem before 11 AM at participating congee shops.',
      instructionsZh: '在上午11點前於參與粥店兌換。',
    },
    {
      name: 'Free Char Siu Bao',
      nameZh: '免費叉燒包',
      description: 'Complimentary BBQ pork bun from premium dim sum restaurants',
      descriptionZh: '優質點心餐廳免費叉燒包',
      category: 'voucher' as const,
      voucherType: 'free_item' as const,
      instructions: 'Show voucher during dim sum service hours for your free char siu bao.',
      instructionsZh: '在點心服務時間出示券領取免費叉燒包。',
    },
    {
      name: 'Free Hot Pot Appetizer',
      nameZh: '免費火鍋前菜',
      description: 'Complimentary appetizer platter at participating hot pot restaurants',
      descriptionZh: '參與火鍋餐廳免費前菜拼盤',
      category: 'voucher' as const,
      voucherType: 'free_item' as const,
      instructions: 'Valid with minimum 2-person hot pot order. Show voucher before ordering.',
      instructionsZh: '最少2人火鍋套餐方可使用。點餐前出示券。',
    },
    {
      name: 'Free Dessert with Tea Set',
      nameZh: '茶點套餐送甜品',
      description: 'Complimentary dessert with any afternoon tea set order',
      descriptionZh: '點任何下午茶套餐送免費甜品',
      category: 'voucher' as const,
      voucherType: 'free_item' as const,
      instructions: 'Valid 2-5 PM daily. One dessert per tea set ordered.',
      instructionsZh: '每日下午2-5點有效。每套茶點送一份甜品。',
    },
  ];

  for (let i = 0; i < count; i++) {
    const baseData = rewardData[i % rewardData.length];
    const suffix = i >= rewardData.length ? ` ${Math.floor(i / rewardData.length) + 1}` : '';
    const imageNumber = (i % 11) + 1; // Use merchant-image-01 to 11

    rewards.push({
      id: generateId(),
      name: baseData.name + suffix,
      nameZh: baseData.nameZh + suffix,
      description: baseData.description,
      descriptionZh: baseData.descriptionZh,
      backgroundImage: `/images/merchant/merchant-image-${imageNumber.toString().padStart(2, '0')}.jpg`,
      discountPercentage: baseData.discount,
      category: baseData.category,
      voucherType: baseData.voucherType,
      isAvailable: Math.random() > 0.05, // 95% available
      redemptionInstructions: baseData.instructions,
      redemptionInstructionsZh: baseData.instructionsZh,
    });
  }

  return rewards;
}

// Generate mock transactions
export function generateMockTransactions(count: number = 100): Transaction[] {
  const transactions: Transaction[] = [];
  const types: ('earn' | 'spend' | 'expire')[] = ['earn', 'spend', 'expire'];
  const statuses: ('pending' | 'completed' | 'failed')[] = ['pending', 'completed', 'failed'];
  const merchants = generateMockMerchants(10);
  const rewards = generateMockRewards(5);

  const descriptions = {
    earn: [
      'Registration bonus',
      'Daily check-in reward',
      'Restaurant visit bonus',
      'Food review completion',
      'Social media share',
      'Dining experience rating',
      'Menu photo upload',
    ],
    spend: [
      'Restaurant rating',
      'Food review unlock',
      'Premium dining info',
      'Chef recommendation access',
    ],
    redeem: [
      'Food voucher redemption',
      'Dining experience booking',
      'Cooking class reservation',
    ],
    expire: [
      'Coin expiry',
      'Unused dining bonus expiry',
    ],
  };

  for (let i = 0; i < count; i++) {
    const type = randomChoice(types);
    const status = Math.random() > 0.1 ? 'completed' : randomChoice(statuses);
    const timestamp = randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());

    let amount: number;
    let merchantId: string | undefined;

    switch (type) {
      case 'earn':
        amount = Math.floor(Math.random() * 50) + 10; // 10-60 coins
        break;
      case 'spend':
        amount = Math.floor(Math.random() * 3) + 1; // 1-3 coins
        merchantId = randomChoice(merchants).id;
        break;
      case 'expire':
        amount = Math.floor(Math.random() * 30) + 5; // 5-35 coins
        break;
    }

    transactions.push({
      id: generateId(),
      type,
      amount,
      description: randomChoice(descriptions[type]),
      merchantId,
      timestamp,
      status,
    });
  }

  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate mock ratings
export function generateMockRatings(count: number = 200): Rating[] {
  const ratings: Rating[] = [];
  const users = generateMockUsers(20);
  const merchants = generateMockMerchants(10);

  const comments = [
    'Great service and delicious food!',
    'Amazing dining experience, highly recommended!',
    'Excellent value for money and authentic flavors.',
    'Friendly staff and clean restaurant environment.',
    'Will definitely dine here again!',
    'Food quality exceeded my expectations!',
    'Perfect location and cozy atmosphere.',
    'Fresh ingredients and skillful cooking.',
    'Authentic Hong Kong flavors at their best.',
    'Outstanding dim sum and tea selection.',
    'Best roast duck I\'ve had in Hong Kong!',
    'Traditional recipes with modern presentation.',
    'Generous portions and reasonable prices.',
    'Must-try for any food lover visiting HK.',
  ];

  for (let i = 0; i < count; i++) {
    const user = randomChoice(users);
    const merchant = randomChoice(merchants);
    const coinsSpent = Math.floor(Math.random() * 3) + 1; // 1-3 coins
    const timestamp = randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());

    ratings.push({
      id: generateId(),
      userId: user.id,
      merchantId: merchant.id,
      coinsSpent,
      comment: Math.random() > 0.3 ? randomChoice(comments) : undefined,
      qrCodeScanned: merchant.qrCode,
      timestamp,
    });
  }

  return ratings.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate mock vouchers for user's claimed rewards
export function generateMockVouchers(count: number = 5): Voucher[] {
  const vouchers: Voucher[] = [];
  const rewards = generateMockRewards(15);
  const users = generateMockUsers(10);

  for (let i = 0; i < count; i++) {
    const reward = randomChoice(rewards);
    const user = randomChoice(users);
    const claimedAt = randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date());
    const expiresAt = new Date(claimedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from claim

    vouchers.push({
      id: generateId(),
      code: `SMC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      rewardId: reward.id,
      rewardName: reward.name,
      rewardNameZh: reward.nameZh,
      userId: user.id,
      claimedAt,
      expiresAt,
      isUsed: Math.random() > 0.7, // 30% used
      usedAt: Math.random() > 0.7 ? randomDate(claimedAt, new Date()) : undefined,
      voucherType: reward.voucherType,
      discountPercentage: reward.discountPercentage,
      redemptionInstructions: reward.redemptionInstructions,
      redemptionInstructionsZh: reward.redemptionInstructionsZh,
    });
  }

  return vouchers.sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime());
}

// Export all mock data
export const mockData = {
  users: generateMockUsers(10),
  merchants: generateMockMerchants(20),
  offers: generateMockOffers(50),
  rewards: generateMockRewards(15),
  vouchers: generateMockVouchers(5),
  transactions: generateMockTransactions(100),
  ratings: generateMockRatings(200),
};

// Seed database with mock data
export async function seedMockData() {
  try {
    const { DatabaseService } = await import('../db');

    // Clear existing data
    await DatabaseService.clearAllData();

    // Generate fresh mock data
    const freshMockData = {
      users: generateMockUsers(10),
      merchants: generateMockMerchants(20),
      offers: generateMockOffers(50),
      rewards: generateMockRewards(15),
      transactions: generateMockTransactions(100),
      ratings: generateMockRatings(200),
    };

    // Seed with fresh mock data
    await DatabaseService.saveMerchants(freshMockData.merchants);
    await DatabaseService.saveOffers(freshMockData.offers);
    await DatabaseService.saveRewards(freshMockData.rewards);

    // Add some transactions and ratings for the current user if exists
    const currentUser = await DatabaseService.getCurrentUser();
    if (currentUser) {
      const userTransactions = freshMockData.transactions.slice(0, 20);
      const userRatings = freshMockData.ratings.slice(0, 10).map(rating => ({
        ...rating,
        userId: currentUser.id,
      }));

      for (const transaction of userTransactions) {
        await DatabaseService.addTransaction(transaction);
      }

      for (const rating of userRatings) {
        await DatabaseService.addRating(rating);
      }
    }

    console.log('Mock data seeded successfully');
  } catch (error) {
    console.error('Failed to seed mock data:', error);
    throw error;
  }
}