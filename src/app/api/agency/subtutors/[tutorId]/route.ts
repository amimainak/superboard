// ============================================================
// API Route: Remove Sub-Tutor from Agency
// ============================================================
// DELETE: Disconnects a sub-tutor from the agency. Auth required —
//         must be the agency owner, and the tutorId must belong to
//         this agency (parentAgencyId === auth.userId).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier, type Tier } from '@/types';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { tutorId } = await params;

    if (!tutorId || typeof tutorId !== 'string') {
      return NextResponse.json(
        { error: 'Missing tutorId' },
        { status: 400 }
      );
    }

    // Verify the caller is an agency
    const agency = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true },
    });

    if (!agency || !isAgencyTier(agency.tier as Tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'Only Agency tier users can manage sub-tutors' },
        { status: 403 }
      );
    }

    // Find the sub-tutor and verify they belong to this agency
    const subTutor = await db.user.findUnique({
      where: { id: tutorId },
      select: {
        id: true,
        parentAgencyId: true,
        name: true,
        email: true,
      },
    });

    if (!subTutor) {
      return NextResponse.json({ error: 'Sub-tutor not found' }, { status: 404 });
    }

    if (subTutor.parentAgencyId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — this tutor is not under your agency' },
        { status: 403 }
      );
    }

    // Remove from agency: null out parentAgencyId, reset tier, delete AgencyMember row
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: tutorId },
        data: { parentAgencyId: null, tier: 'FREE' },
      });
      await tx.agencyMember.deleteMany({
        where: { tutorId, agencyId: auth.userId },
      });
    });

    return NextResponse.json({
      success: true,
      removedTutor: {
        id: subTutor.id,
        name: subTutor.name,
        email: subTutor.email,
      },
    });
  } catch (error) {
    console.error('[Sub-Tutor Remove] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove sub-tutor' },
      { status: 500 }
    );
  }
}
