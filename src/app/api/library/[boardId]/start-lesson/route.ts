// ============================================================
// API Route: Start Lesson from Board Library  (F-06)
// ============================================================
// POST  /api/library/[boardId]/start-lesson
//   Body: { studentId?: string }
//
//   Secondary entry point — starts a new active lesson from any
//   saved board. If a studentId is provided, the lesson is auto-
//   linked to that student (same as the primary entry point).
//   If no studentId is provided, the lesson starts unlinked
//   (same as the existing "New Lesson" flow, but pre-filled with
//   board content).
//
//   Same rules as the primary entry point:
//     • Always a copy — source board is never modified
//     • Auto-dated (startedAt = now)
//     • Title preserved, tags + 'from-archive'
//     • isActive = true
//
//   Access: tutor must own the source board. If studentId is
//   provided, tutor must own the student too.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

type RouteContext = { params: Promise<{ boardId: string }> };

const bodySchema = z.object({
  studentId: z.string().optional(),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { boardId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { studentId } = parsed.data;

    // 1. Verify the tutor owns the source board
    const sourceBoard = await db.room.findFirst({
      where: { id: boardId, tutorId: auth.userId },
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
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // 2. Optionally verify the student
    let student: { id: string; name: string | null; isActive: boolean } | null = null;
    if (studentId) {
      student = await db.student.findFirst({
        where: { id: studentId, agencyId: auth.userId },
        select: { id: true, name: true, isActive: true },
      });
      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
      if (!student.isActive) {
        return NextResponse.json({ error: 'Cannot start a lesson for an inactive student' }, { status: 400 });
      }
    }

    // 3. Load source pages for cloning
    const sourcePages = await db.boardPage.findMany({
      where: { roomId: boardId },
      orderBy: { pageIndex: 'asc' },
      select: { pageIndex: true, snapshot: true },
    });

    // 4. Transaction: create room + clone pages + (optional) upsert participant
    const now = new Date();
    const newRoom = await db.$transaction(async (tx) => {
      const r = await tx.room.create({
        data: {
          tutorId: auth.userId,
          subject: sourceBoard.subject,
          title: sourceBoard.title,
          studentName: student?.name ?? null,
          tags: [...(sourceBoard.tags || []), 'from-archive'],
          brandingLogo: sourceBoard.brandingLogo,
          brandingColor: sourceBoard.brandingColor,
          isActive: true,
          startedAt: now,
        },
      });

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

      if (student) {
        const studentIdentity = student.id;
        await tx.roomParticipant.upsert({
          where: {
            roomId_studentIdentity: { roomId: r.id, studentIdentity },
          },
          update: {
            lastActiveAt: now,
            studentId: student.id,
            studentName: student.name,
            isOnline: false,
          },
          create: {
            roomId: r.id,
            studentIdentity,
            studentId: student.id,
            studentName: student.name,
            isOnline: false,
          },
        });
      }

      return r;
    });

    return NextResponse.json({
      success: true,
      roomId: newRoom.id,
      studentName: student?.name ?? null,
      title: newRoom.title,
      subject: newRoom.subject,
    }, { status: 201 });
  } catch (error) {
    console.error('[Start Lesson from Library POST] Error:', error);
    return NextResponse.json({ error: 'Failed to start lesson' }, { status: 500 });
  }
}
