// ============================================================
// API Route: Get Current Usage
// ============================================================
// Returns the current period's usage for the authenticated user.
// Used by the UsageBar component and the Dashboard.
// Now requires auth — JWT must match the requested userId.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUsageLog } from '@/lib/usage';
import { requireAuth } from '@/lib/auth';
import type { Tier } from '@/types';
import { TIER_LIMITS } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // --- Auth check: caller can only view their own usage ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Use authenticated user's ID if userId param not provided
    const targetUserId = userId || auth.userId;

    // Security: caller can only view their own usage (agency owners can view sub-tutors)
    if (userId && userId !== auth.userId) {
      const caller = await db.user.findUnique({
        where: { id: auth.userId },
        select: { tier: true },
      });
      if (!caller || caller.tier !== 'AGENCY') {
        return NextResponse.json(
          { error: 'Forbidden — you can only view your own usage' },
          { status: 403 }
        );
      }
      const target = await db.user.findUnique({
        where: { id: userId },
        select: { parentAgencyId: true },
      });
      if (!target || target.parentAgencyId !== auth.userId) {
        return NextResponse.json(
          { error: 'Forbidden — you can only view your own or sub-tutor usage' },
          { status: 403 }
        );
      }
    }

    const user = await db.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tier = user.tier as Tier;
    const usageLog = await getCurrentUsageLog(targetUserId, tier);

    // Use centralized TIER_LIMITS instead of duplicated constants
    const tierConfig = TIER_LIMITS[tier];

    // Map the tier config to the response format expected by the frontend
    const aiCreditsLimit =
      tier === 'FREE'
        ? tierConfig.aiCreditsPerWeek
        : tierConfig.aiCreditsPerMonth;

    return NextResponse.json({
      tier,
      aiCreditsUsed: usageLog.aiCreditsUsed,
      aiCreditsLimit,
      videoMinutesUsed: usageLog.videoMinutesUsed,
      videoMinutesLimit: tierConfig.videoMinutesPerWeek,
      recordingsUsed: usageLog.recordingsUsed,
      recordingsLimit: tierConfig.recordingsPerMonth,
    });
  } catch (error) {
    console.error('[Usage Current] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
