// ============================================================
// Encryption Utilities — Field-Level Encryption at Rest
// ============================================================
// Provides AES-256-GCM encryption for sensitive data fields
// stored in the database. Uses Node.js built-in crypto module.
//
// USAGE:
//   import { encrypt, decrypt } from '@/lib/encryption';
//   const encrypted = encrypt('sensitive-data', ENCRYPTION_KEY);
//   const decrypted = decrypt(encrypted, ENCRYPTION_KEY);
//
// REQUIRED ENV VAR:
//   ENCRYPTION_KEY — 32-byte hex string (64 hex chars)
//   Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//
// SECURITY NOTES:
//   - Uses AES-256-GCM (authenticated encryption)
//   - Each encryption uses a random IV (never reused)
//   - IV is prepended to the ciphertext for storage
//   - If ENCRYPTION_KEY is not set, returns plaintext with a warning
// ============================================================

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

function getEncryptionKey(): Buffer | null {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    return null;
  }

  // Key must be 32 bytes (64 hex chars)
  if (key.length !== 64) {
    console.error('[Encryption] ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got:', key.length);
    return null;
  }

  try {
    return Buffer.from(key, 'hex');
  } catch {
    console.error('[Encryption] ENCRYPTION_KEY must be valid hex');
    return null;
  }
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns base64-encoded string: IV + authTag + ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();

  if (!key) {
    // No encryption key configured — return plaintext with warning in dev
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Encryption] No ENCRYPTION_KEY set — storing plaintext (dev mode only)');
      return plaintext;
    }
    throw new Error('ENCRYPTION_KEY not configured for production encryption');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Prepend IV + authTag to ciphertext for easy decryption
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * Decrypt a base64-encoded string (IV + authTag + ciphertext) back to plaintext.
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();

  if (!key) {
    // If no key, assume it was stored as plaintext (dev mode)
    if (process.env.NODE_ENV === 'development') {
      return encryptedData;
    }
    throw new Error('ENCRYPTION_KEY not configured for production decryption');
  }

  const buffer = Buffer.from(encryptedData, 'base64');

  // Extract IV, authTag, and ciphertext
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Check if encryption is available (key is configured and valid).
 */
export function isEncryptionAvailable(): boolean {
  return getEncryptionKey() !== null;
}
