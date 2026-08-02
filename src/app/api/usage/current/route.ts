// ============================================================
// API Route: Get Current Usage
// ============================================================
// Returns the current period's usage for the authenticated user.
// Used by the UsageBar component and the Dashboard.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUsageLog } from '@/lib/usage';
import type { Tier } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tier = user.tier as Tier;
    const usageLog = await getCurrentUsageLog(userId, tier);

    const limits: Record<Tier, { aiCreditsLimit: number; videoMinutesLimit: number; recordingsLimit: number }> = {
      FREE: { aiCreditsLimit: 10, videoMinutesLimit: 120, recordingsLimit: 0 },
      PRO: { aiCreditsLimit: 100, videoMinutesLimit: Infinity, recordingsLimit: 2 },
      AGENCY: { aiCreditsLimit: Infinity, videoMinutesLimit: Infinity, recordingsLimit: Infinity },
    };

    const tierLimits = limits[tier];

    return NextResponse.json({
      tier,
      aiCreditsUsed: usageLog.aiCreditsUsed,
      aiCreditsLimit: tierLimits.aiCreditsLimit,
      videoMinutesUsed: usageLog.videoMinutesUsed,
      videoMinutesLimit: tierLimits.videoMinutesLimit,
      recordingsUsed: usageLog.recordingsUsed,
      recordingsLimit: tierLimits.recordingsLimit,
    });
  } catch (error) {
    console.error('[Usage Current] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
