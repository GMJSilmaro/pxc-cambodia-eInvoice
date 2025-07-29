import CryptoJS from 'crypto-js';

// Get encryption key from environment variable
const ENCRYPTION_KEY = process.env.CAMINV_ENCRYPTION_KEY || process.env.AUTH_SECRET || 'default-key-change-in-production';

if (!process.env.CAMINV_ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  console.warn('CAMINV_ENCRYPTION_KEY not set in production. Using AUTH_SECRET as fallback.');
}

/**
 * Encrypts sensitive data using AES encryption
 * @param text - The text to encrypt
 * @returns Encrypted string
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  try {
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts encrypted data
 * @param encryptedText - The encrypted text to decrypt
 * @returns Decrypted string
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Failed to decrypt - invalid key or corrupted data');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypts an object by encrypting its values
 * @param obj - Object with string values to encrypt
 * @returns Object with encrypted values
 */
export function encryptObject<T extends Record<string, string>>(obj: T): T {
  const encrypted = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    encrypted[key as keyof T] = encrypt(value) as T[keyof T];
  }
  
  return encrypted;
}

/**
 * Decrypts an object by decrypting its values
 * @param obj - Object with encrypted string values
 * @returns Object with decrypted values
 */
export function decryptObject<T extends Record<string, string>>(obj: T): T {
  const decrypted = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    decrypted[key as keyof T] = decrypt(value) as T[keyof T];
  }
  
  return decrypted;
}

/**
 * Generates a secure random string for use as tokens or IDs
 * @param length - Length of the random string
 * @returns Random string
 */
export function generateSecureToken(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}

/**
 * Hashes a string using SHA256
 * @param text - Text to hash
 * @returns SHA256 hash
 */
export function hashString(text: string): string {
  return CryptoJS.SHA256(text).toString();
}

/**
 * Validates if a string is properly encrypted (basic check)
 * @param text - Text to validate
 * @returns True if appears to be encrypted
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  
  // Basic check - encrypted strings are typically base64 and longer
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(text) && text.length > 20;
}
