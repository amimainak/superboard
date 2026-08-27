// ============================================================
// API Route: Agency Usage (Admin Dashboard)
// ============================================================
// Returns aggregate usage data for an agency owner's sub-tutors.
// Only agency-tier users can access this endpoint.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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
  if (tier === 'PRO') {
    return TIER_LIMITS.PRO.aiCreditsPerMonth;
  }
  // AGENCY — unlimited
  return Infinity;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId') || auth.userId;

    // Security: caller must be the agency owner
    if (agencyId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — you can only view your own agency data' },
        { status: 403 }
      );
    }

    // Verify the caller is actually an agency
    const agency = await db.user.findUnique({
      where: { id: agencyId },
      select: { tier: true },
    });

    if (!agency || !isAgencyTier(agency.tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'This endpoint is only available for Agency tier users' },
        { status: 403 }
      );
    }

    // Fetch all sub-tutors under this agency
    const subTutors = await db.user.findMany({
      where: { parentAgencyId: agencyId },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        createdAt: true,
        rooms: {
          select: {
            id: true,
            subject: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        usageLogs: {
          orderBy: { periodStartDate: 'desc' },
          take: 1,
        },
      },
    });

    // Enrich with usage data
    const enrichedSubTutors = subTutors.map((tutor) => {
      const tier = tutor.tier as Tier;
      const tierConfig = TIER_LIMITS[tier];
      const currentUsage = tutor.usageLogs[0];

      return {
        id: tutor.id,
        name: tutor.name,
        email: tutor.email,
        tier,
        totalRooms: tutor.rooms.length,
        activeRooms: tutor.rooms.filter((r) => r.isActive).length,
        aiCreditsUsed: currentUsage?.aiCreditsUsed || 0,
        aiCreditsLimit: getAICreditsLimit(tier),
        videoMinutesUsed: currentUsage?.videoMinutesUsed || 0,
        videoMinutesLimit: tierConfig.videoMinutesPerWeek,
        recordingsUsed: currentUsage?.recordingsUsed || 0,
        recordingsLimit: tierConfig.recordingsPerMonth,
        joinedAt: tutor.createdAt,
      };
    });

    // Agency aggregate stats
    const totalSubTutors = enrichedSubTutors.length;
    const totalActiveRooms = enrichedSubTutors.reduce((sum, t) => sum + t.activeRooms, 0);
    const totalAiCreditsUsed = enrichedSubTutors.reduce((sum, t) => sum + t.aiCreditsUsed, 0);

    return NextResponse.json({
      subTutors: enrichedSubTutors,
      stats: {
        totalSubTutors,
        totalActiveRooms,
        totalAiCreditsUsed,
      },
    });
  } catch (error) {
    console.error('[Agency Usage] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agency usage' },
      { status: 500 }
    );
  }
}
