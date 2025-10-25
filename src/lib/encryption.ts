import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.warn('CALENDAR_TOKEN_ENCRYPTION_KEY must be at least 32 characters. Calendar token encryption will be disabled.');
}

/**
 * Encrypt sensitive data (like OAuth tokens) for storage
 * @param text - Plain text to encrypt
 * @returns Encrypted string
 */
export async function encrypt(text: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt encrypted data
 * @param encryptedText - Encrypted string
 * @returns Decrypted plain text
 */
export async function decrypt(encryptedText: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Alias for encrypt function (for backward compatibility)
 */
export const encryptToken = encrypt;
