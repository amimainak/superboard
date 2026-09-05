// ============================================================
// API Route: Start Lesson from Saved Board  (F-06)
// ============================================================
// POST  /api/student/[studentId]/start-lesson
//   Body: { sourceBoardId: string }
//
//   Creates a NEW active lesson room pre-filled with the contents
//   of the chosen source board, auto-linked to the student.
//
//   Key properties:
//     • ALWAYS a copy — the source board is never modified
//     • Auto-dated (startedAt = now)
//     • Auto-linked (studentName set from student record,
//       RoomParticipant upserted so the student appears in the
//       room and the lesson shows up on their timeline)
//     • Title preserved (no " (copy)" suffix — it's today's lesson)
//     • Tags from source + 'from-archive' tag for traceability
//     • isActive = true, startedAt = now
//
//   Access: tutor must own both the student and the source board.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

type RouteContext = { params: Promise<{ studentId: string }> };

const bodySchema = z.object({
  sourceBoardId: z.string().min(1, 'sourceBoardId is required'),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { studentId } = await context.params;
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { sourceBoardId } = parsed.data;

    // 1. Verify the tutor owns this student
    const student = await db.student.findFirst({
      where: { id: studentId, agencyId: auth.userId },
      select: { id: true, name: true, isActive: true },
    });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    if (!student.isActive) {
      return NextResponse.json({ error: 'Cannot start a lesson for an inactive student' }, { status: 400 });
    }

    // 2. Verify the tutor owns the source board
    const sourceBoard = await db.room.findFirst({
      where: { id: sourceBoardId, tutorId: auth.userId },
      select: {
        id: true,
        subject: true,
        title: true,
        tags: true,
        brandingLogo: true,
        brandingColor: true,
      },
    });
    if (!sourceBoard) {
      return NextResponse.json({ error: 'Source board not found' }, { status: 404 });
    }

    // 3. Load the source board's pages (we'll clone them into the new room)
    const sourcePages = await db.boardPage.findMany({
      where: { roomId: sourceBoardId },
      orderBy: { pageIndex: 'asc' },
      select: { pageIndex: true, snapshot: true },
    });

    // 4. Transaction: create new room + clone pages + upsert participant
    const now = new Date();
    const newRoom = await db.$transaction(async (tx) => {
      // Create the new active room — pre-filled metadata, no " (copy)" suffix
      const r = await tx.room.create({
        data: {
          tutorId: auth.userId,
          subject: sourceBoard.subject,
          title: sourceBoard.title,
          studentName: student.name,
          tags: [...(sourceBoard.tags || []), 'from-archive'],
          brandingLogo: sourceBoard.brandingLogo,
          brandingColor: sourceBoard.brandingColor,
          isActive: true,
          startedAt: now,
        },
      });

      // Clone every page's snapshot into the new room.
      // If source had 0 pages (edge case), create one empty page so the
      // whiteboard doesn't break.
      if (sourcePages.length === 0) {
        await tx.boardPage.create({
          data: {
            roomId: r.id,
            pageIndex: 0,
            snapshot: { elements: [], camera: { x: 0, y: 0, zoom: 1 } } as unknown as object,
          },
        });
      } else {
        for (const p of sourcePages) {
          await tx.boardPage.create({
            data: {
              roomId: r.id,
              pageIndex: p.pageIndex,
              snapshot: p.snapshot as unknown as object,
            },
          });
        }
      }

      // Upsert RoomParticipant so the student is "in" the room from t=0.
      // This makes the lesson appear on their timeline immediately and
      // means the tutor sees them in the participant list when the room
      // loads.
      const studentIdentity = student.id;
      await tx.roomParticipant.upsert({
        where: {
          roomId_studentIdentity: { roomId: r.id, studentIdentity },
        },
        update: {
          lastActiveAt: now,
          studentId: student.id,
          studentName: student.name,
          isOnline: false, // student isn't online until they click their join link
        },
        create: {
          roomId: r.id,
          studentIdentity,
          studentId: student.id,
          studentName: student.name,
          isOnline: false,
        },
      });

      return r;
    });

    return NextResponse.json({
      success: true,
      roomId: newRoom.id,
      studentName: student.name,
      title: newRoom.title,
      subject: newRoom.subject,
    }, { status: 201 });
  } catch (error) {
    console.error('[Start Lesson POST] Error:', error);
    return NextResponse.json({ error: 'Failed to start lesson' }, { status: 500 });
  }
}
