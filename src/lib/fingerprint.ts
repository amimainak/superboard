// ============================================================
// FingerprintJS Anti-Fraud Utility
// ============================================================
// Generates a device fingerprint hash on dashboard load.
// Sent to backend to detect multi-account fraud.
// Uses FingerprintJS Open Source.
// ============================================================

import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<FingerprintJS.BrowserFingerprint> | null = null;

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
 * Call this on Dashboard mount.
 */
export async function reportFingerprint(): Promise<string> {
  const hash = await getFingerprintHash();

  // Send hash to backend for anti-fraud check
  try {
    await fetch('/api/usage/fingerprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprintHash: hash }),
    });
  } catch (error) {
    console.error('[Fingerprint] Failed to report:', error);
  }

  return hash;
}

export default FingerprintJS;
