// ============================================================
// API Route: Lesson Notes — List & Create
// ============================================================
// GET:  List lesson notes for a tutor (optionally filter by studentId).
//       ?studentId=UUID&page=1&limit=50
// POST: Create a lesson note for a room (tutor must own the room).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const createLessonNoteSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required').max(100),
  studentId: z.string().uuid().optional().nullable(),
  content: z.string().min(1, 'Content is required').max(50000, 'Content too long'),
  tutorFeedback: z.string().max(10000).optional().nullable(),
  topicsForNext: z.string().max(5000).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = { tutorId: auth.userId };
    if (studentId) where.studentId = studentId;

    const [notes, totalCount] = await Promise.all([
      db.lessonNote.findMany({
        where,
        select: {
          id: true,
          roomId: true,
          content: true,
          tutorFeedback: true,
          topicsForNext: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
          room: { select: { id: true, subject: true, durationMinutes: true, endedAt: true } },
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.lessonNote.count({ where }),
    ]);

    const serialized = notes.map((n) => ({
      ...n,
      room: n.room
        ? { ...n.room, endedAt: n.room.endedAt?.toISOString() ?? null }
        : null,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      notes: serialized,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('[Lesson Notes List] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = createLessonNoteSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message || 'Validation error',
      }));
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    const { roomId, studentId, content, tutorFeedback, topicsForNext, rating } = parsed.data;

    // Verify the room exists and belongs to the tutor
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { tutorId: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.tutorId !== auth.userId) {
      return NextResponse.json(
        { error: 'You can only create notes for your own rooms' },
        { status: 403 },
      );
    }

    // If studentId provided, verify student exists
    if (studentId) {
      const student = await db.student.findUnique({ where: { id: studentId } });
      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
    }

    // LessonNote has @@unique([roomId]), so we use upsert
    const note = await db.lessonNote.upsert({
      where: { roomId },
      update: {
        studentId: studentId ?? null,
        content,
        tutorFeedback: tutorFeedback ?? null,
        topicsForNext: topicsForNext ?? null,
        rating: rating ?? null,
      },
      create: {
        roomId,
        tutorId: auth.userId,
        studentId: studentId ?? null,
        content,
        tutorFeedback: tutorFeedback ?? null,
        topicsForNext: topicsForNext ?? null,
        rating: rating ?? null,
      },
      include: {
        room: { select: { id: true, subject: true, durationMinutes: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('[Lesson Notes Create] Error:', error);
    return NextResponse.json({ error: 'Failed to create lesson note' }, { status: 500 });
  }
}
