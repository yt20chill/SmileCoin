import { AppState, AppAction, User, SmileCoin, Merchant, Offer, Reward, Voucher, Transaction } from '../types';

// Initial state
export const initialState: AppState = {
  user: null,
  wallet: {
    balance: 100, // Start with some coins for demo
    pendingTransactions: [],
    lastUpdated: new Date(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  merchants: [],
  offers: [],
  rewards: [],
  vouchers: [], // Initialize unified voucher system
  transactions: [
    // Add some initial demo transactions
    {
      id: 'initial-1',
      type: 'earn',
      amount: 100,
      description: 'Registration bonus',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'completed',
    },
    {
      id: 'initial-2',
      type: 'earn',
      amount: 25,
      description: 'Daily check-in reward',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      status: 'completed',
    },
  ],
  boardingPasses: [],
  qrScans: [], // Initialize QR scan history
  ui: {
    isLoading: false,
    error: null,
    activeModal: null,
    language: 'en',
    boardingPassScanner: {
      isActive: false,
      isProcessing: false,
    },
    qrScanner: {
      isActive: false,
      scannedData: null,
    },
  },
};

// Main app reducer
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'UPDATE_BALANCE':
      return {
        ...state,
        wallet: {
          ...state.wallet,
          balance: action.payload,
          lastUpdated: new Date(),
        },
      };

    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        wallet: {
          ...state.wallet,
          pendingTransactions: state.wallet.pendingTransactions.filter(
            t => t.id !== action.payload.id
          ),
        },
      };

    case 'SET_MERCHANTS':
      return {
        ...state,
        merchants: action.payload,
      };

    case 'SET_OFFERS':
      return {
        ...state,
        offers: action.payload,
      };

    case 'SET_REWARDS':
      return {
        ...state,
        rewards: action.payload,
      };

    case 'ADD_VOUCHER':
      return {
        ...state,
        vouchers: [action.payload, ...state.vouchers],
      };

    case 'SET_VOUCHERS':
      return {
        ...state,
        vouchers: action.payload,
      };

    case 'UPDATE_VOUCHER':
      return {
        ...state,
        vouchers: state.vouchers.map(voucher =>
          voucher.id === action.payload.id
            ? { ...voucher, ...action.payload.updates }
            : voucher
        ),
      };

    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoading: action.payload,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          error: action.payload,
        },
      };

    case 'SET_LANGUAGE':
      return {
        ...state,
        ui: {
          ...state.ui,
          language: action.payload,
        },
      };

    case 'ADD_BOARDING_PASS':
      return {
        ...state,
        boardingPasses: [action.payload, ...state.boardingPasses],
      };

    case 'SET_BOARDING_PASSES':
      return {
        ...state,
        boardingPasses: action.payload,
      };

    case 'SET_BOARDING_PASS_SCANNER':
      return {
        ...state,
        ui: {
          ...state.ui,
          boardingPassScanner: {
            ...state.ui.boardingPassScanner,
            ...action.payload,
          },
        },
      };

    case 'SET_QR_SCANNER':
      return {
        ...state,
        ui: {
          ...state.ui,
          qrScanner: {
            ...state.ui.qrScanner,
            ...action.payload,
          },
        },
      };

    case 'ADD_QR_SCAN':
      return {
        ...state,
        qrScans: [action.payload, ...state.qrScans],
      };

    case 'SET_QR_SCANS':
      return {
        ...state,
        qrScans: action.payload,
      };

    case 'CLEAR_QR_SCAN_HISTORY':
      return {
        ...state,
        qrScans: [],
      };

    default:
      return state;
  }
}

// Wallet-specific reducer for more granular wallet operations
export function walletReducer(wallet: SmileCoin, action: WalletAction): SmileCoin {
  switch (action.type) {
    case 'UPDATE_BALANCE':
      return {
        ...wallet,
        balance: action.payload,
        lastUpdated: new Date(),
      };

    case 'ADD_PENDING_TRANSACTION':
      return {
        ...wallet,
        pendingTransactions: [...wallet.pendingTransactions, action.payload],
      };

    case 'REMOVE_PENDING_TRANSACTION':
      return {
        ...wallet,
        pendingTransactions: wallet.pendingTransactions.filter(
          t => t.id !== action.payload
        ),
      };

    case 'SET_EXPIRY_DATE':
      return {
        ...wallet,
        expiryDate: action.payload,
      };

    default:
      return wallet;
  }
}

// Wallet action types
export type WalletAction =
  | { type: 'UPDATE_BALANCE'; payload: number }
  | { type: 'ADD_PENDING_TRANSACTION'; payload: Transaction }
  | { type: 'REMOVE_PENDING_TRANSACTION'; payload: string }
  | { type: 'SET_EXPIRY_DATE'; payload: Date | undefined };

// UI-specific reducer for UI state management
export function uiReducer(ui: AppState['ui'], action: UIAction): AppState['ui'] {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...ui,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...ui,
        error: action.payload,
      };

    case 'SET_ACTIVE_MODAL':
      return {
        ...ui,
        activeModal: action.payload,
      };

    case 'SET_LANGUAGE':
      return {
        ...ui,
        language: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...ui,
        error: null,
      };

    default:
      return ui;
  }
}

// UI action types
export type UIAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_MODAL'; payload: string | null }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'zh-TW' }
  | { type: 'CLEAR_ERROR' };