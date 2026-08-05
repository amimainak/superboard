// ============================================================
// API Route: Agency Active Student Count (for Billing)
// ============================================================
// GET: Counts unique active students across all sub-tutor rooms
//      in the current billing period. Agency owner auth required.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Verify the caller is an agency
    const agency = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, name: true },
    });

    if (!agency || agency.tier !== 'AGENCY') {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'This endpoint is only available for Agency tier users' },
        { status: 403 }
      );
    }

    // 1. Get all sub-tutor IDs under this agency
    const subTutors = await db.user.findMany({
      where: { parentAgencyId: auth.userId },
      select: { id: true },
    });

    const subTutorIds = subTutors.map((t) => t.id);

    // 2. Get all active rooms for those sub-tutors
    const activeRooms = await db.room.findMany({
      where: {
        tutorId: { in: subTutorIds },
        isActive: true,
      },
      select: { id: true },
    });

    const activeRoomIds = activeRooms.map((r) => r.id);

    // 3. Calculate billing period start (first of current month, UTC)
    const now = new Date();
    const billingPeriodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
    );

    // 4. Get all unique studentIdentities from RoomParticipant
    //    for those rooms, where lastActiveAt is within the billing period
    if (activeRoomIds.length === 0) {
      return NextResponse.json({
        activeStudentCount: 0,
        billingPeriodStart,
        subTutorIds,
      });
    }

    const activeStudents = await db.roomParticipant.findMany({
      where: {
        roomId: { in: activeRoomIds },
        lastActiveAt: { gte: billingPeriodStart },
      },
      select: { studentIdentity: true },
      distinct: ['studentIdentity'],
    });

    return NextResponse.json({
      activeStudentCount: activeStudents.length,
      billingPeriodStart,
      subTutorIds,
    });
  } catch (error) {
    console.error('[Agency Students] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active student count' },
      { status: 500 }
    );
  }
}
