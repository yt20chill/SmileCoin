// Core data types for the Tourist Frontend PWA

export interface User {
  id: string;
  email?: string;
  fullName: string; // Required for boarding pass name matching
  flightNumber?: string;
  arrivalDate: Date;
  walletAddress: string;
  preferredLanguage: 'en' | 'zh-TW';
  registrationMethod: 'boarding-pass' | 'manual';
  scannedBoardingPasses: string[]; // Track scanned passes to prevent duplicates
  createdAt: Date;
}

export interface SmileCoin {
  balance: number;
  pendingTransactions: Transaction[];
  lastUpdated: Date;
  expiryDate?: Date;
}

export interface Transaction {
  id: string;
  type: 'earn' | 'spend' | 'expire'; // Removed 'redeem' as rewards are free
  amount: number;
  description: string;
  merchantId?: string; // For rating transactions
  boardingPassId?: string; // For earning transactions
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface Merchant {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  logo: string;
  category: string;
  qrCode: string; // QR code data for rating access
  location: {
    address: string;
    addressZh: string;
    coordinates: [number, number];
  };
  rating: number;
  totalRatings: number;
  isActive: boolean;
}

export interface Offer {
  id: string;
  merchantId: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  discountPercentage: number;
  validUntil: Date;
  termsAndConditions: string;
  termsAndConditionsZh: string;
  isActive: boolean;
}

export interface Reward {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  backgroundImage: string; // Reference to merchant-image-{01-11}.jpg for food backgrounds
  discountPercentage?: number; // For discount-based vouchers (e.g., 85% off)
  category: 'voucher' | 'experience'; // Unified voucher system - removed 'coupon'
  isAvailable: boolean;
  redemptionInstructions: string;
  redemptionInstructionsZh: string;
  voucherType: 'discount' | 'free_item' | 'experience' | 'service'; // Type of voucher benefit
}

export interface Rating {
  id: string;
  userId: string;
  merchantId: string;
  coinsSpent: number; // 1-3 coins
  comment?: string;
  qrCodeScanned: string; // QR code data that was scanned
  timestamp: Date;
}

// State management types
export interface AppState {
  user: User | null;
  wallet: SmileCoin;
  merchants: Merchant[];
  offers: Offer[];
  rewards: Reward[];
  vouchers: Voucher[]; // Unified voucher management system
  transactions: Transaction[];
  boardingPasses: BoardingPass[];
  qrScans: QRCodeScan[]; // Add QR scan history
  ui: {
    isLoading: boolean;
    error: string | null;
    activeModal: string | null;
    language: 'en' | 'zh-TW';
    boardingPassScanner: {
      isActive: boolean;
      isProcessing: boolean;
    };
    qrScanner: {
      isActive: boolean;
      scannedData: string | null;
      lastScanResult?: QRCodeScanResult;
    };
  };
}

export type AppAction = 
  | { type: 'SET_USER'; payload: User }
  | { type: 'UPDATE_BALANCE'; payload: number }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'SET_MERCHANTS'; payload: Merchant[] }
  | { type: 'SET_OFFERS'; payload: Offer[] }
  | { type: 'SET_REWARDS'; payload: Reward[] }
  | { type: 'ADD_VOUCHER'; payload: Voucher }
  | { type: 'SET_VOUCHERS'; payload: Voucher[] }
  | { type: 'UPDATE_VOUCHER'; payload: { id: string; updates: Partial<Voucher> } }
  | { type: 'ADD_BOARDING_PASS'; payload: BoardingPass }
  | { type: 'SET_BOARDING_PASSES'; payload: BoardingPass[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'zh-TW' }
  | { type: 'SET_BOARDING_PASS_SCANNER'; payload: { isActive: boolean; isProcessing?: boolean } }
  | { type: 'SET_QR_SCANNER'; payload: { isActive: boolean; scannedData?: string | null; lastScanResult?: QRCodeScanResult } }
  | { type: 'ADD_QR_SCAN'; payload: QRCodeScan }
  | { type: 'SET_QR_SCANS'; payload: QRCodeScan[] }
  | { type: 'CLEAR_QR_SCAN_HISTORY'; payload?: void };

// Component prop types
export interface CoinBalanceProps {
  balance: number;
  isLoading: boolean;
  showAnimation?: boolean;
}

export interface TransactionHistoryProps {
  transactions: Transaction[];
  onLoadMore?: () => void;
}

export interface CoinAnimationProps {
  type: 'earn' | 'spend' | 'redeem';
  amount: number;
  onComplete: () => void;
}

export interface MerchantCardProps {
  merchant: Merchant;
  offer?: Offer;
  onSelect: (merchantId: string) => void;
}

export interface RatingInterfaceProps {
  merchantId: string;
  userBalance: number;
  onRatingSubmit: (rating: number, coinsSpent: number) => void;
}

export interface RewardCardProps {
  reward: Reward;
  userBalance: number;
  onRedeem: (rewardId: string) => void;
  isRedeeming?: boolean;
}

export interface RedemptionModalProps {
  reward: Reward;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export interface Voucher {
  id: string;
  code: string;
  rewardId: string;
  rewardName: string;
  rewardNameZh: string;
  userId: string;
  claimedAt: Date;
  expiresAt?: Date;
  isUsed: boolean;
  usedAt?: Date;
  merchantId?: string; // If voucher is merchant-specific
  voucherType: 'discount' | 'free_item' | 'experience' | 'service';
  discountPercentage?: number;
  redemptionInstructions: string;
  redemptionInstructionsZh: string;
}

export interface RedemptionResult {
  success: boolean;
  voucher?: Voucher;
  voucherCode?: string;
  reward?: Reward;
  message: string;
  redemptionInstructions?: string;
}

// Error handling types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface NetworkError extends Error {
  status?: number;
  code?: string;
}

export interface BlockchainError extends Error {
  transactionId?: string;
  blockchainCode?: string;
}

export interface ValidationError extends Error {
  field?: string;
  userMessage: string;
}

// Offline strategy types
export interface OfflineStrategy {
  cacheStrategy: {
    userWallet: 'always-cache';
    merchantList: 'cache-with-ttl';
    recentTransactions: 'cache-recent-only';
    rewards: 'cache-available-only';
  };
  queuedActions: {
    ratings: 'queue-and-sync';
    redemptions: 'queue-and-sync';
    registrations: 'require-online';
  };
  offlineExperience: {
    showCachedData: boolean;
    allowBrowsing: boolean;
    disableTransactions: boolean;
    showOfflineIndicator: boolean;
  };
}

// Onboarding types
export interface OnboardingSlide {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  icon: string;
  animation: 'earn' | 'spend' | 'redeem' | 'browse';
  demoData?: {
    coins?: number;
    merchantName?: string;
    rewardName?: string;
  };
}

export interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export interface OnboardingSlideProps {
  slide: OnboardingSlide;
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  currentSlide: number;
  totalSlides: number;
}

// Boarding pass types
export interface BoardingPass {
  id: string;
  passengerName: string;
  flightNumber: string;
  date: Date;
  imageUrl: string;
  isScanned: boolean;
  coinsAwarded: number; // Always 10
  scannedAt?: Date;
  userId?: string; // User who scanned this pass
}

export interface BoardingPassScanResult {
  success: boolean;
  boardingPass?: BoardingPass;
  coinsEarned?: number;
  message: string;
  error?: string;
}

export interface NameExtractionResult {
  success: boolean;
  extractedName?: string;
  confidence?: number;
  error?: string;
}

export interface BoardingPassUploadResult {
  success: boolean;
  extractedData?: {
    passengerName: string;
    flightNumber: string;
    arrivalDate: string;
    airline?: string;
  };
  message: string;
  error?: string;
}

// QR Code types
export interface QRCodeScan {
  id: string;
  merchantId: string;
  userId: string;
  scannedData: string;
  timestamp: Date;
  isValid: boolean;
  validatedAt?: Date;
  merchantName?: string;
  merchantNameZh?: string;
  category?: string;
  location?: string;
}

export interface QRCodeScanResult {
  success: boolean;
  merchantId?: string;
  merchantName?: string;
  merchantNameZh?: string;
  category?: string;
  location?: string;
  isValid: boolean;
  message: string;
  error?: string;
  qrCodeData?: string;
  validatedAt?: string;
}

export interface MerchantQRCode {
  merchantId: string;
  qrData: string;
  generatedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  merchantName: string;
  merchantNameZh: string;
  category: string;
  location: string;
}

export interface QRScanHistory {
  scans: QRCodeScan[];
  totalScans: number;
  uniqueMerchants: number;
  lastScanDate?: Date;
}