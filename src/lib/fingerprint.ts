// ============================================================
// FingerprintJS Anti-Fraud Utility
// ============================================================
// Generates a device fingerprint hash on dashboard load.
// Sent to backend to detect multi-account fraud.
// Uses FingerprintJS Open Source.
// ============================================================

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { authFetch } from '@/lib/auth-fetch';

let fpPromise: Promise<any> | null = null;

/**
 * Get the visitor fingerprint hash.
 * This is run on Dashboard load and sent to the backend.
 *
 * @returns A 32-bit hash string identifying the device
 */
export async function getFingerprintHash(): Promise<string> {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }

  const fp = await fpPromise;
  const { visitorId } = await fp.get();
  return visitorId;
}

/**
 * Initialize fingerprinting and send to backend.
 * Call this on Dashboard mount with the authenticated user's ID.
 *
 * @param userId — The authenticated user's Supabase Auth ID
 */
export async function reportFingerprint(userId: string): Promise<string> {
  const hash = await getFingerprintHash();

  // Send hash + userId to backend for anti-fraud check
  try {
    await authFetch('/api/usage/fingerprint', {
      method: 'POST',
      body: JSON.stringify({ userId, fingerprintHash: hash }),
    });
  } catch (error) {
    console.error('[Fingerprint] Failed to report:', error);
  }

  return hash;
}

export default FingerprintJS;
