// ============================================================
// API Route: Agency Students — List & Manage Student Roster
// ============================================================
// GET: Lists all students for an agency (with optional status filter).
//      Agency owner or sub-tutor auth required.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active'; // 'active' | 'all' | 'inactive'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Verify the caller is an agency
    const agency = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!agency || !isAgencyTier(agency.tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'This endpoint is only available for Agency tier users' },
        { status: 403 }
      );
    }

    // Determine agency ID (for sub-tutors, use their parent agency)
    const agencyId = agency.parentAgencyId || auth.userId;

    // Build query filter
    const whereFilter: any = { agencyId };
    if (status === 'active') whereFilter.isActive = true;
    if (status === 'inactive') whereFilter.isActive = false;

    const [students, totalCount] = await Promise.all([
      db.student.findMany({
        where: whereFilter,
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          createdAt: true,
          deactivatedAt: true,
          _count: {
            select: { roomParticipants: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.student.count({ where: whereFilter }),
    ]);

    // Get the last-seen date for each student from their most recent room participation
    const studentIds = students.map((s) => s.id);
    const lastSeenMap = new Map<string, string | null>();

    if (studentIds.length > 0) {
      const latestParticipations = await db.roomParticipant.findMany({
        where: { studentId: { in: studentIds } },
        select: { studentId: true, lastActiveAt: true },
        orderBy: { lastActiveAt: 'desc' },
      });

      for (const p of latestParticipations) {
        if (p.studentId) {
          lastSeenMap.set(p.studentId, p.lastActiveAt ? p.lastActiveAt.toISOString() : null);
        }
      }
    }

    const studentRows = students.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      deactivatedAt: s.deactivatedAt?.toISOString() || null,
      lessonsAttended: s._count.roomParticipants,
      lastSeen: lastSeenMap.get(s.id) || null,
    }));

    return NextResponse.json({
      students: studentRows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('[Agency Students] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
