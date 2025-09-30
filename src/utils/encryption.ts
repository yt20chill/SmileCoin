import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

/**
 * Derives an encryption key from the wallet seed
 */
function deriveKey(seed: string): Buffer {
  return crypto.pbkdf2Sync(seed, 'wallet-encryption-salt', 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts a private key using AES-256-CBC
 */
export function encrypt(privateKey: string): string {
  const seed = process.env.WALLET_SEED;
  if (!seed) {
    throw new Error('WALLET_SEED environment variable is required');
  }

  const key = deriveKey(seed);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Combine iv + encrypted data
  return iv.toString('hex') + encrypted;
}

/**
 * Decrypts a private key using AES-256-CBC
 */
export function decrypt(encryptedData: string): string {
  const seed = process.env.WALLET_SEED;
  if (!seed) {
    throw new Error('WALLET_SEED environment variable is required');
  }

  const key = deriveKey(seed);
  
  // Extract iv and encrypted data
  const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
  const encrypted = encryptedData.slice(IV_LENGTH * 2);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generates a secure random seed for wallet generation
 */
export function generateSecureRandomSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}