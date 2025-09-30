// Restaurant Data Generator for 1000+ Hong Kong Restaurants
import { TFunction } from 'i18next';

export interface RestaurantData {
  id: string;
  name: string;
  placeId: string;
  address: string;
  district: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  category: string;
}

// Base restaurant names and types
const restaurantTypes = [
  'Restaurant', 'Cafe', 'Bistro', 'House', 'Palace', 'Hall', 'Garden', 'Pavilion', 
  'Terrace', 'Eatery', 'Dining', 'Kitchen', 'Lounge', 'Bar', 'Grill', 'Steakhouse',
  'Seafood House', 'Tea House', 'Dim Sum', 'Hot Pot', 'BBQ', 'Noodle Bar', 'Sushi Bar'
];

const adjectives = [
  'Golden', 'Silver', 'Crystal', 'Pearl', 'Jade', 'Ruby', 'Sapphire', 'Emerald', 'Diamond',
  'Royal', 'Imperial', 'Supreme', 'Premium', 'Elite', 'Grand', 'Majestic', 'Noble',
  'Celestial', 'Heavenly', 'Divine', 'Sacred', 'Mystic', 'Ancient', 'Modern', 'Classic',
  'Elegant', 'Luxury', 'Deluxe', 'Exclusive', 'Private', 'Secret', 'Hidden', 'Famous',
  'Legendary', 'Traditional', 'Authentic', 'Original', 'Signature', 'Specialty'
];

const nouns = [
  'Dragon', 'Phoenix', 'Tiger', 'Lion', 'Eagle', 'Crane', 'Lotus', 'Bamboo', 'Orchid',
  'Rose', 'Jasmine', 'Peony', 'Plum', 'Cherry', 'Willow', 'Pine', 'Mountain', 'River',
  'Ocean', 'Harbor', 'Bay', 'Peak', 'Valley', 'Garden', 'Palace', 'Temple', 'Tower',
  'Bridge', 'Gate', 'Court', 'Square', 'Plaza', 'Avenue', 'Street', 'Lane', 'Road'
];

const hongKongDistricts = [
  'Central', 'Admiralty', 'Wan Chai', 'Causeway Bay', 'Tin Hau', 'Fortress Hill', 'North Point',
  'Quarry Bay', 'Tai Koo', 'Sai Wan Ho', 'Shau Kei Wan', 'Chai Wan', 'Tsim Sha Tsui',
  'Tsim Sha Tsui East', 'Jordan', 'Yau Ma Tei', 'Mong Kok', 'Prince Edward', 'Sham Shui Po',
  'Cheung Sha Wan', 'Lai Chi Kok', 'Mei Foo', 'Kowloon Tong', 'Lok Fu', 'Wong Tai Sin',
  'Diamond Hill', 'Choi Hung', 'Kowloon Bay', 'Ngau Tau Kok', 'Kwun Tong', 'Lam Tin',
  'Yau Tong', 'Lei Yue Mun', 'Sheung Wan', 'Sai Ying Pun', 'Kennedy Town', 'Mid-Levels',
  'The Peak', 'Pokfulam', 'Aberdeen', 'Ap Lei Chau', 'Stanley', 'Repulse Bay', 'Deep Water Bay',
  'Shek O', 'Chai Wan', 'Happy Valley', 'Tai Hang', 'So Ho', 'Lan Kwai Fong'
];

const cuisineTypes = [
  'Cantonese', 'Dim Sum', 'Seafood', 'Hot Pot', 'BBQ', 'Noodles', 'Congee', 'Tea Restaurant',
  'Western', 'Italian', 'French', 'Japanese', 'Korean', 'Thai', 'Vietnamese', 'Indian',
  'Fusion', 'International', 'Vegetarian', 'Dessert', 'Cafe', 'Bar', 'Buffet', 'Fine Dining'
];

const priceRanges = ['$', '$$', '$$$', '$$$$'];

const categories = [
  'Fine Dining', 'Casual Dining', 'Fast Casual', 'Cafe', 'Bar & Lounge', 'Buffet',
  'Street Food', 'Food Court', 'Takeaway', 'Delivery Only'
];

// Generate a random restaurant name
function generateRestaurantName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const type = restaurantTypes[Math.floor(Math.random() * restaurantTypes.length)];
  
  const patterns = [
    `${adjective} ${noun} ${type}`,
    `${noun} ${type}`,
    `${adjective} ${type}`,
    `The ${adjective} ${noun}`,
    `${noun}'s ${type}`,
    `${adjective} ${noun}`
  ];
  
  return patterns[Math.floor(Math.random() * patterns.length)];
}

// Generate a realistic Google Place ID
function generatePlaceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = 'ChIJ';
  for (let i = 0; i < 23; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate restaurant address
function generateAddress(district: string): string {
  const buildingNumbers = Math.floor(Math.random() * 999) + 1;
  const streetNames = [
    'Nathan Road', 'Canton Road', 'Queen\'s Road', 'Des Voeux Road', 'Hennessy Road',
    'Lockhart Road', 'Jaffe Road', 'Johnston Road', 'Gloucester Road', 'Connaught Road',
    'Hollywood Road', 'Wellington Street', 'Pedder Street', 'Ice House Street', 'Wyndham Street',
    'Lyndhurst Terrace', 'Elgin Street', 'Staunton Street', 'Robinson Road', 'Caine Road'
  ];
  
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  const floors = ['G/F', '1/F', '2/F', '3/F', 'UG/F', 'Shop A', 'Shop B', 'Shop 1', 'Shop 2'];
  const floor = floors[Math.floor(Math.random() * floors.length)];
  
  return `${floor}, ${buildingNumbers} ${streetName}, ${district}, Hong Kong`;
}

// Generate multiple restaurants
export function generateRestaurants(count: number): RestaurantData[] {
  const restaurants: RestaurantData[] = [];
  
  for (let i = 0; i < count; i++) {
    const district = hongKongDistricts[Math.floor(Math.random() * hongKongDistricts.length)];
    const cuisine = cuisineTypes[Math.floor(Math.random() * cuisineTypes.length)];
    const priceRange = priceRanges[Math.floor(Math.random() * priceRanges.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const rating = Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0 to 5.0 rating
    
    restaurants.push({
      id: `restaurant-${String(i + 1).padStart(4, '0')}`,
      name: generateRestaurantName(),
      placeId: generatePlaceId(),
      address: generateAddress(district),
      district,
      cuisine,
      priceRange,
      rating,
      category
    });
  }
  
  return restaurants;
}

// Get restaurants by district
export function getRestaurantsByDistrict(restaurants: RestaurantData[], district: string): RestaurantData[] {
  return restaurants.filter(r => r.district === district);
}

// Get restaurants by cuisine
export function getRestaurantsByCuisine(restaurants: RestaurantData[], cuisine: string): RestaurantData[] {
  return restaurants.filter(r => r.cuisine === cuisine);
}

// Get restaurants by price range
export function getRestaurantsByPriceRange(restaurants: RestaurantData[], priceRange: string): RestaurantData[] {
  return restaurants.filter(r => r.priceRange === priceRange);
}

// Search restaurants by name
export function searchRestaurants(restaurants: RestaurantData[], query: string): RestaurantData[] {
  const lowercaseQuery = query.toLowerCase();
  return restaurants.filter(r => 
    r.name.toLowerCase().includes(lowercaseQuery) ||
    r.district.toLowerCase().includes(lowercaseQuery) ||
    r.cuisine.toLowerCase().includes(lowercaseQuery)
  );
}

// Get top rated restaurants
export function getTopRatedRestaurants(restaurants: RestaurantData[], limit: number = 50): RestaurantData[] {
  return restaurants
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

// Get restaurants statistics
export function getRestaurantStatistics(restaurants: RestaurantData[]) {
  const stats = {
    total: restaurants.length,
    byDistrict: {} as Record<string, number>,
    byCuisine: {} as Record<string, number>,
    byPriceRange: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    averageRating: 0
  };
  
  let totalRating = 0;
  
  restaurants.forEach(restaurant => {
    // Count by district
    stats.byDistrict[restaurant.district] = (stats.byDistrict[restaurant.district] || 0) + 1;
    
    // Count by cuisine
    stats.byCuisine[restaurant.cuisine] = (stats.byCuisine[restaurant.cuisine] || 0) + 1;
    
    // Count by price range
    stats.byPriceRange[restaurant.priceRange] = (stats.byPriceRange[restaurant.priceRange] || 0) + 1;
    
    // Count by category
    stats.byCategory[restaurant.category] = (stats.byCategory[restaurant.category] || 0) + 1;
    
    totalRating += restaurant.rating;
  });
  
  stats.averageRating = Math.round((totalRating / restaurants.length) * 10) / 10;
  
  return stats;
}

// Export predefined restaurant lists for demo
export const DEMO_RESTAURANTS = [
  {
    id: 'demo-restaurant-001',
    name: 'Golden Dragon Restaurant',
    placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    address: 'G/F, 123 Nathan Road, Tsim Sha Tsui, Hong Kong',
    district: 'Tsim Sha Tsui',
    cuisine: 'Cantonese',
    priceRange: '$$$',
    rating: 4.5,
    category: 'Fine Dining'
  },
  {
    id: 'demo-restaurant-002',
    name: 'Harbour View Cafe',
    placeId: 'ChIJrTLr-GyuEmsRBfy61i59si0',
    address: '2/F, 456 Canton Road, Tsim Sha Tsui, Hong Kong',
    district: 'Tsim Sha Tsui',
    cuisine: 'Western',
    priceRange: '$$',
    rating: 4.2,
    category: 'Casual Dining'
  },
  {
    id: 'demo-restaurant-003',
    name: 'Peak Dining',
    placeId: 'ChIJ2eUgeAK6EmsRqRfr6hFrw-M',
    address: 'Shop 1, The Peak Tower, The Peak, Hong Kong',
    district: 'The Peak',
    cuisine: 'International',
    priceRange: '$$$$',
    rating: 4.8,
    category: 'Fine Dining'
  }
];