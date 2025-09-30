import { AppState } from '../types';

const STORAGE_KEY = 'smile-travel-app-state';
const STORAGE_VERSION = '1.0';

// Keys for different parts of state that should be persisted
const PERSISTENT_KEYS = {
  user: 'user',
  wallet: 'wallet',
  transactions: 'transactions',
  language: 'ui.language',
} as const;

interface PersistedState {
  version: string;
  timestamp: number;
  user: AppState['user'];
  wallet: AppState['wallet'];
  transactions: AppState['transactions'];
  boardingPasses: AppState['boardingPasses'];
  language: AppState['ui']['language'];
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Load persisted state from localStorage
export function loadPersistedState(): Partial<AppState> | null {
  if (!isBrowser) return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed: PersistedState = JSON.parse(stored);
    
    // Check version compatibility
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('State version mismatch, clearing stored state');
      clearPersistedState();
      return null;
    }

    // Check if data is not too old (7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    if (Date.now() - parsed.timestamp > maxAge) {
      console.warn('Stored state is too old, clearing');
      clearPersistedState();
      return null;
    }

    // Convert date strings back to Date objects
    const restoredState: Partial<AppState> = {
      user: parsed.user ? {
        ...parsed.user,
        arrivalDate: new Date(parsed.user.arrivalDate),
        createdAt: new Date(parsed.user.createdAt),
      } : null,
      wallet: {
        ...parsed.wallet,
        lastUpdated: new Date(parsed.wallet.lastUpdated),
        expiryDate: parsed.wallet.expiryDate ? new Date(parsed.wallet.expiryDate) : undefined,
        pendingTransactions: parsed.wallet.pendingTransactions.map(t => ({
          ...t,
          timestamp: new Date(t.timestamp),
        })),
      },
      transactions: parsed.transactions.map(t => ({
        ...t,
        timestamp: new Date(t.timestamp),
      })),
      boardingPasses: parsed.boardingPasses || [],
      ui: {
        isLoading: false, // Never persist loading state
        error: null, // Never persist errors
        activeModal: null, // Never persist modal state
        language: parsed.language,
        boardingPassScanner: {
          isActive: false, // Never persist scanner state
          isProcessing: false,
        },
        qrScanner: {
          isActive: false, // Never persist scanner state
          scannedData: null,
        },
      },
    };

    return restoredState;
  } catch (error) {
    console.error('Error loading persisted state:', error);
    clearPersistedState();
    return null;
  }
}

// Persist state to localStorage
export function persistState(state: AppState): void {
  if (!isBrowser) return;

  try {
    const stateToPersist: PersistedState = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      user: state.user,
      wallet: state.wallet,
      transactions: state.transactions,
      boardingPasses: state.boardingPasses,
      language: state.ui.language,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
  } catch (error) {
    console.error('Error persisting state:', error);
    // Handle quota exceeded or other storage errors
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, clearing old data');
      clearPersistedState();
    }
  }
}

// Clear persisted state
export function clearPersistedState(): void {
  if (!isBrowser) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing persisted state:', error);
  }
}

// Persist specific parts of state (for more granular control)
export function persistPartialState(key: keyof typeof PERSISTENT_KEYS, data: any): void {
  if (!isBrowser) return;

  try {
    const storageKey = `${STORAGE_KEY}-${key}`;
    localStorage.setItem(storageKey, JSON.stringify({
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      data,
    }));
  } catch (error) {
    console.error(`Error persisting ${key}:`, error);
  }
}

// Load specific parts of state
export function loadPartialState<T>(key: keyof typeof PERSISTENT_KEYS): T | null {
  if (!isBrowser) return null;

  try {
    const storageKey = `${STORAGE_KEY}-${key}`;
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    
    // Check version and age
    if (parsed.version !== STORAGE_VERSION) return null;
    
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > maxAge) return null;

    return parsed.data;
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return null;
  }
}

// Offline queue management
interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = `${STORAGE_KEY}-queue`;

export function addToOfflineQueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): void {
  if (!isBrowser) return;

  try {
    const queue = getOfflineQueue();
    const queuedAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    queue.push(queuedAction);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to offline queue:', error);
  }
}

export function getOfflineQueue(): QueuedAction[] {
  if (!isBrowser) return [];

  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
}

export function removeFromOfflineQueue(actionId: string): void {
  if (!isBrowser) return;

  try {
    const queue = getOfflineQueue();
    const filteredQueue = queue.filter(action => action.id !== actionId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filteredQueue));
  } catch (error) {
    console.error('Error removing from offline queue:', error);
  }
}

export function clearOfflineQueue(): void {
  if (!isBrowser) return;

  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing offline queue:', error);
  }
}

// Utility to check storage availability
export function isStorageAvailable(): boolean {
  if (!isBrowser) return false;

  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}