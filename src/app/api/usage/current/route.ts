// ============================================================
// API Route: Get Current Usage
// ============================================================
// Returns the current period's usage for the authenticated user.
// Used by the UsageBar component and the Dashboard.
// Now requires auth — JWT must match the requested userId.
//
// SECURITY FIX (I-05): Removed unsafe 'as-any' casts for tier config
// access. Uses proper type narrowing instead.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUsageLog } from '@/lib/usage';
import { requireAuth } from '@/lib/auth';
import type { Tier } from '@/types';
import { isAgencyTier, TIER_LIMITS } from '@/types';

/**
 * SECURITY FIX (I-05): Properly typed helper to get AI credit limit
 * based on tier without 'as-any' casts.
 */
function getAICreditsLimit(tier: Tier): number {
  if (tier === 'FREE') {
    return TIER_LIMITS.FREE.aiCreditsPerWeek;
  }
  const effectiveTier = tier === 'AGENCY' ? 'AGENCY_STANDARD' : tier;
  const config = TIER_LIMITS[effectiveTier as keyof typeof TIER_LIMITS];
  return 'aiCreditsPerMonth' in config ? config.aiCreditsPerMonth : Infinity;
}

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
      if (!caller || !isAgencyTier(caller.tier)) {
        return NextResponse.json(
          { error: 'Forbidden — you can only view your own usage' },
          { status: 403 }
        );
      }
      // Fetch target user with tier info now to avoid a redundant second query
      const target = await db.user.findUnique({
        where: { id: userId },
        select: { parentAgencyId: true, tier: true },
      });
      if (!target || target.parentAgencyId !== auth.userId) {
        return NextResponse.json(
          { error: 'Forbidden — you can only view your own or sub-tutor usage' },
          { status: 403 }
        );
      }
      // Target verified and tier available — compute usage inline to skip second fetch
      const tier = target.tier as Tier;
      const usageLog = await getCurrentUsageLog(targetUserId!, tier);
      const tierConfig = TIER_LIMITS[tier];
      return NextResponse.json({
        tier,
        aiCreditsUsed: usageLog.aiCreditsUsed,
        aiCreditsLimit: getAICreditsLimit(tier),
        aiCostCents: (usageLog as any).aiCostCents ?? 0,
        videoMinutesUsed: usageLog.videoMinutesUsed,
        videoMinutesLimit: tierConfig.videoMinutesPerWeek,
        recordingsUsed: usageLog.recordingsUsed,
        recordingsLimit: tierConfig.recordingsPerMonth,
      });
    }

    const user = await db.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tier = user.tier as Tier;
    const usageLog = await getCurrentUsageLog(targetUserId, tier);

    // Use centralized TIER_LIMITS instead of duplicated constants
    const tierConfig = TIER_LIMITS[tier];

    return NextResponse.json({
      tier,
      aiCreditsUsed: usageLog.aiCreditsUsed,
      aiCreditsLimit: getAICreditsLimit(tier),
      aiCostCents: (usageLog as any).aiCostCents ?? 0,
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
