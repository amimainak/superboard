// ============================================================
// API Route: Agency Lesson Hours (for Billing)
// ============================================================
// GET: Returns current billing period's total lesson hours
//      for an agency. Agency owner auth required.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier, type Tier } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Verify the caller is an agency
    const agency = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!agency || !isAgencyTier(agency.tier as Tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'This endpoint is only available for Agency tier users' },
        { status: 403 }
      );
    }

    const agencyId = agency.parentAgencyId || auth.userId;

    // Get all sub-tutor IDs (and include agency owner)
    const subTutors = await db.user.findMany({
      where: { parentAgencyId: agencyId },
      select: { id: true },
    });
    const allTutorIds = [agencyId, ...subTutors.map((t) => t.id)];

    // Calculate billing period start (first of current month, UTC)
    const now = new Date();
    const billingPeriodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
    );

    // Sum durationMinutes for completed rooms in the billing period
    const hourAgg = await db.room.aggregate({
      where: {
        tutorId: { in: allTutorIds },
        endedAt: { gte: billingPeriodStart },
      },
      _sum: { durationMinutes: true },
      _count: true,
    });

    const totalMinutes = hourAgg._sum.durationMinutes || 0;
    const totalHours = Math.ceil(totalMinutes / 60);
    const completedRooms = hourAgg._count;

    // Also get active (ongoing) rooms
    const activeRooms = await db.room.count({
      where: {
        tutorId: { in: allTutorIds },
        isActive: true,
      },
    });

    return NextResponse.json({
      totalHours,
      totalMinutes,
      completedRooms,
      activeRooms,
      billingPeriodStart,
    });
  } catch (error) {
    console.error('[Agency Hours] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson hours' },
      { status: 500 }
    );
  }
}
