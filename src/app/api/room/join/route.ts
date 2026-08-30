// ============================================================
// API Route: Student Room Join (Email-Based)
// ============================================================
// POST: Student joins a room using their registered email.
//       No Supabase auth required — the student email is checked
//       against the agency's Student roster.
//       Upserts RoomParticipant with studentId FK.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // SECURITY FIX (API-C01): Require authentication for room join.
    // Previously unauthenticated — anyone could probe active rooms and enumerate students.
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { roomId, studentEmail } = body;

    if (!roomId || !studentEmail) {
      return NextResponse.json(
        { error: 'roomId and studentEmail are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = studentEmail.trim().toLowerCase();

    // CRITICAL: Verify the caller IS the student — prevent joining as someone else
    if (auth.email && auth.email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { error: 'You can only join as yourself' },
        { status: 403 }
      );
    }

    // Validate room exists and is active
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true, isActive: true, tutorId: true, startedAt: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (!room.isActive) {
      return NextResponse.json(
        { error: 'Room is no longer active' },
        { status: 410 }
      );
    }

    // Find the tutor's agency
    const tutor = await db.user.findUnique({
      where: { id: room.tutorId },
      select: { parentAgencyId: true, tier: true },
    });

    // Determine agency ID
    let agencyId: string | null = null;
    if (tutor?.parentAgencyId) {
      agencyId = tutor.parentAgencyId;
    } else {
      // The tutor is the agency owner themselves
      const agencyOwner = await db.user.findUnique({
        where: { id: room.tutorId },
        select: { tier: true },
      });
      // Only agency owners (or the new tier variants) can have student rosters
      if (agencyOwner && ['AGENCY', 'AGENCY_STANDARD', 'AGENCY_PREMIUM'].includes(agencyOwner.tier)) {
        agencyId = room.tutorId;
      }
    }

    if (!agencyId) {
      return NextResponse.json(
        { error: 'This room does not belong to an agency. Email-based join requires an agency room.' },
        { status: 403 }
      );
    }

    // Look up student in agency roster
    const student = await db.student.findUnique({
      where: {
        agencyId_email: { agencyId, email: normalizedEmail },
      },
    });

    if (!student || !student.isActive) {
      return NextResponse.json(
        { error: 'EMAIL_NOT_REGISTERED', message: 'This email is not registered with the agency. Contact your tutor to get registered.' },
        { status: 403 }
      );
    }

    // SECURITY FIX (API-M01): Atomic startedAt set using updateMany to prevent race condition
    await db.room.updateMany({
      where: { id: roomId, startedAt: null },
      data: { startedAt: new Date() },
    });

    // Use student name as the studentIdentity for the unique constraint
    const studentIdentity = student.id; // Use Student.id for reliable uniqueness

    // Upsert: if (roomId, studentIdentity) combo exists, update lastActiveAt;
    // otherwise create a new participant row.
    const participant = await db.roomParticipant.upsert({
      where: {
        roomId_studentIdentity: { roomId, studentIdentity },
      },
      update: {
        lastActiveAt: new Date(),
        studentId: student.id,
        studentName: student.name,
      },
      create: {
        roomId,
        studentIdentity,
        studentId: student.id,
        studentName: student.name,
      },
    });

    return NextResponse.json({
      success: true,
      participantId: participant.id,
      studentName: student.name,
      studentId: student.id,
    });
  } catch (error) {
    console.error('[Room Join] Error:', error);
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    );
  }
}
