// ============================================================
// API Route: Apply Referral Code
// ============================================================
// POST: Apply a referral code to the current user.
//       - Looks up the referrer by code
//       - Sets referredByCode on the current user
//       - Increments the referrer's referralCount
//       - Can only apply once (rejects if already referred)
//       - Can't refer yourself
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { applyReferralSchema, validateInput } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = validateInput<{ referralCode: string }>(applyReferralSchema, body);
    if (!parsed.success) return parsed.response;
    const { referralCode } = parsed.data;

    // Fetch current user's referral status
    const currentUser = await db.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, referredByCode: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Can only apply once
    if (currentUser.referredByCode) {
      return NextResponse.json(
        { error: 'ALREADY_REFERRED', message: 'You have already applied a referral code' },
        { status: 409 }
      );
    }

    // Look up the referrer by code
    const referrer = await db.user.findUnique({
      where: { referralCode },
      select: { id: true, referralCode: true, referralCount: true },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: 'INVALID_REFERRAL_CODE', message: 'Referral code not found' },
        { status: 404 }
      );
    }

    // Can't refer yourself
    if (referrer.id === auth.userId) {
      return NextResponse.json(
        { error: 'SELF_REFERRAL', message: 'You cannot use your own referral code' },
        { status: 400 }
      );
    }

    // Use a transaction to set referredByCode and increment referralCount atomically
    await db.$transaction([
      db.user.update({
        where: { id: auth.userId },
        data: { referredByCode: referralCode },
      }),
      db.user.update({
        where: { id: referrer.id },
        data: { referralCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Referral Apply] Error:', error);
    return NextResponse.json(
      { error: 'Failed to apply referral code' },
      { status: 500 }
    );
  }
}
