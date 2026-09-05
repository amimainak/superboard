// ============================================================
// API Route: Join Room by Student Token  (F-05)
// ============================================================
// POST  /api/room/join-by-token
//   Body: { token: string }
//
//   Public endpoint — NO requireAuth. The student token IS the
//   authentication. This is the same model as HomeworkAssignment's
//   /by-token endpoint: the link is the identity.
//
//   Flow:
//     1. Look up Student by joinToken (indexed, O(1))
//     2. If not found / revoked → 404
//     3. If student inactive → 403 "account paused"
//     4. Find the tutor's currently-active room (most recently
//        started wins if multiple)
//     5. If no active room → 409 "no lesson in progress"
//     6. Upsert RoomParticipant (studentId, studentIdentity=student.id)
//     7. Return roomId so the client can redirect
//
//   This is deliberately a POST (not a GET) so the token isn't
//   logged in URL access logs or browser history. The /join/[token]
//   page is a thin server component that renders a waiting screen
//   and calls this endpoint via fetch.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const bodySchema = z.object({
  token: z.string().min(64).max(64),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // 1. Look up student by token
    const student = await db.student.findUnique({
      where: { joinToken: parsed.data.token },
      select: {
        id: true,
        name: true,
        isActive: true,
        agencyId: true, // = the owning tutor's user ID
      },
    });

    // 2. Not found / revoked — same response to avoid enumeration
    if (!student) {
      return NextResponse.json(
        { error: 'INVALID_LINK', message: 'This link is no longer valid. Please ask your tutor for a fresh link.' },
        { status: 404 },
      );
    }

    // 3. Account paused
    if (!student.isActive) {
      return NextResponse.json(
        { error: 'ACCOUNT_PAUSED', message: 'Your account is currently paused. Please contact your tutor.' },
        { status: 403 },
      );
    }

    // 4. Find the tutor's currently-active room
    const activeRoom = await db.room.findFirst({
      where: {
        tutorId: student.agencyId,
        isActive: true,
      },
      orderBy: { startedAt: 'desc' },
      select: { id: true, subject: true, startedAt: true },
    });

    // 5. No active room
    if (!activeRoom) {
      return NextResponse.json(
        { error: 'NO_ACTIVE_LESSON', message: 'No lesson in progress right now. Your tutor will start one soon — try again when they\'re ready.' },
        { status: 409 },
      );
    }

    // 6. Upsert RoomParticipant. Use student.id as the studentIdentity
    //    for the unique constraint — same pattern as /api/room/join.
    const studentIdentity = student.id;

    await db.roomParticipant.upsert({
      where: {
        roomId_studentIdentity: { roomId: activeRoom.id, studentIdentity },
      },
      update: {
        lastActiveAt: new Date(),
        studentId: student.id,
        studentName: student.name,
      },
      create: {
        roomId: activeRoom.id,
        studentIdentity,
        studentId: student.id,
        studentName: student.name,
        isOnline: true,
      },
    });

    // 7. Return room info so client can redirect
    return NextResponse.json({
      success: true,
      roomId: activeRoom.id,
      subject: activeRoom.subject,
      studentName: student.name,
    });
  } catch (error) {
    console.error('[Join By Token] Error:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
