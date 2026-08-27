// ============================================================
// API Route: Claim Referral Reward
// ============================================================
// POST: Claim the referral reward (1 free month of Pro).
//   - Requires auth
//   - User must have referralCount >= 1 and referralRewardClaimed === false
//   - Sets referralRewardClaimed = true
//   - Stripe coupon integration can be wired later
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Fetch user's referral data
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { referralCount: true, referralRewardClaimed: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check eligibility
    if (user.referralRewardClaimed) {
      return NextResponse.json(
        { error: 'ALREADY_CLAIMED', message: 'Reward already claimed' },
        { status: 409 }
      );
    }

    if (user.referralCount < 1) {
      return NextResponse.json(
        { error: 'NOT_ELIGIBLE', message: 'You need at least 1 referral to claim the reward' },
        { status: 400 }
      );
    }

    // Mark as claimed
    await db.user.update({
      where: { id: auth.userId },
      data: { referralRewardClaimed: true },
    });

    // TODO: Wire Stripe coupon/credit for 1 free month of Pro

    return NextResponse.json({
      claimed: true,
      message: "You've earned 1 free month of Pro!",
    });
  } catch (error) {
    console.error('[Referral Claim] Error:', error);
    return NextResponse.json(
      { error: 'Failed to claim referral reward' },
      { status: 500 }
    );
  }
}
