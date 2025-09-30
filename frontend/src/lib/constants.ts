// Application constants

export const APP_CONFIG = {
  name: 'Smile Travel HK',
  shortName: 'Smile Travel',
  description: 'Gamified tourism experience in Hong Kong with Smile Coins',
  version: '1.0.0',
} as const;

export const COIN_CONFIG = {
  initialBalance: 100,
  maxRating: 3,
  minRating: 1,
  expiryDays: 30,
} as const;

export const SUPPORTED_LANGUAGES = ['en', 'zh-TW'] as const;

export const MERCHANT_CATEGORIES = [
  'restaurant',
  'shopping',
  'attraction',
  'hotel',
  'transport',
  'entertainment',
] as const;

export const REWARD_CATEGORIES = [
  'souvenir',
  'voucher', 
  'experience',
] as const;

export const TRANSACTION_TYPES = [
  'earn',
  'spend',
  'redeem',
  'expire',
] as const;

export const TRANSACTION_STATUS = [
  'pending',
  'completed',
  'failed',
] as const;

export const API_ENDPOINTS = {
  auth: '/api/auth',
  wallet: '/api/wallet',
  merchants: '/api/merchants',
  offers: '/api/offers',
  rewards: '/api/rewards',
  ratings: '/api/ratings',
  transactions: '/api/transactions',
} as const;

export const STORAGE_KEYS = {
  user: 'smile-travel-user',
  wallet: 'smile-travel-wallet',
  language: 'smile-travel-language',
  onboarding: 'smile-travel-onboarding-complete',
} as const;

export const HONG_KONG_THEME = {
  colors: {
    red: '#dc2626',
    gold: '#f59e0b',
    jade: '#059669',
    harborBlue: '#1e40af',
    pearl: '#f8fafc',
    night: '#0f172a',
    smileCoin: '#fbbf24',
    smileCoinDark: '#f59e0b',
  },
  gradients: {
    hk: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)',
    harbor: 'linear-gradient(135deg, #1e40af 0%, #059669 100%)',
    coin: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
  },
} as const;