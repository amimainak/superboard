// ============================================================
// API Route: GET /api/room/list — List All Rooms for Tutor
// ============================================================
// Returns all rooms (active AND ended) for the authenticated
// tutor, ordered by createdAt desc, limited to 20.
// Also used by agency owners to list their sub-tutors' rooms.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier, type Tier } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId');

    if (!tutorId) {
      return NextResponse.json(
        { error: 'Missing tutorId parameter' },
        { status: 400 }
      );
    }

    // Security: caller can only list their own rooms (or sub-tutor rooms if agency owner)
    if (tutorId !== auth.userId) {
      const caller = await db.user.findUnique({
        where: { id: auth.userId },
        select: { tier: true },
      });
      if (!caller || !isAgencyTier(caller.tier as Tier)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Verify the tutor is a sub-tutor under this agency
      const tutor = await db.user.findUnique({
        where: { id: tutorId },
        select: { parentAgencyId: true },
      });
      if (!tutor || tutor.parentAgencyId !== auth.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const rooms = await db.room.findMany({
      where: { tutorId },
      select: {
        id: true,
        subject: true,
        isActive: true,
        brandingLogo: true,
        brandingColor: true,
        createdAt: true,
        endedAt: true,
        durationMinutes: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('[Room List] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
