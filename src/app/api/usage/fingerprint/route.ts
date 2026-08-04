// ============================================================
// API Route: Fingerprint Anti-Fraud
// ============================================================
// Receives device fingerprint hash from the client.
// If the hash exists on a DIFFERENT user ID, downgrade to restricted tier.
// Now requires auth — JWT must match the userId in the body.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // --- Auth check: caller can only submit fingerprints for themselves ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { userId, fingerprintHash } = body;

    if (!userId || !fingerprintHash) {
      return NextResponse.json(
        { error: 'Missing userId or fingerprintHash' },
        { status: 400 }
      );
    }

    // Security: caller can only submit fingerprint for their own account
    if (userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — you can only submit fingerprint for your own account' },
        { status: 403 }
      );
    }

    // Look for another user with the same fingerprint
    const existingUser = await db.user.findFirst({
      where: {
        fingerprintHash,
        id: { not: userId },
      },
    });

    if (existingUser) {
      // FRAUD DETECTED: Downgrade this user to restricted tier
      await db.user.update({
        where: { id: userId },
        data: { tier: 'FREE' },
      });

      console.warn(
        `[Anti-Fraud] Fingerprint collision detected. User ${userId} shares fingerprint with ${existingUser.id}. Downgraded to FREE.`
      );

      return NextResponse.json({
        fraudDetected: true,
        message: 'Account restricted due to policy violation.',
      });
    }

    // Save/update fingerprint for this user
    await db.user.update({
      where: { id: userId },
      data: { fingerprintHash },
    });

    return NextResponse.json({ fraudDetected: false });
  } catch (error) {
    console.error('[Fingerprint] Error:', error);
    return NextResponse.json(
      { error: 'Fingerprint check failed' },
      { status: 500 }
    );
  }
}
