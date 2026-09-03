// ============================================================
// API Route: Lesson Notes — List & Create
// ============================================================
// GET:  List lesson notes for a tutor (optionally filter by roomId).
//       ?roomId=UUID&page=1&limit=50
// POST: Create or update a lesson note for a room (tutor must own the room).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const createLessonNoteSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required').max(100),
  content: z.string().min(1, 'Content is required').max(50000, 'Content too long'),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: Record<string, unknown> = { tutorId: auth.userId };
    if (roomId) where.roomId = roomId;

    const [notes, totalCount] = await Promise.all([
      db.lessonNote.findMany({
        where,
        select: {
          id: true,
          roomId: true,
          tutorId: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          room: { select: { id: true, subject: true, durationMinutes: true, endedAt: true } },
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

    const { roomId, content } = parsed.data;

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

    // LessonNote schema has no @@unique constraint on roomId, so we look up
    // an existing note for this room first and create or update accordingly.
    const existing = await db.lessonNote.findFirst({
      where: { roomId },
      select: { id: true },
    });

    const note = existing
      ? await db.lessonNote.update({
          where: { id: existing.id },
          data: { content, tutorId: auth.userId },
          include: {
            room: { select: { id: true, subject: true, durationMinutes: true } },
          },
        })
      : await db.lessonNote.create({
          data: {
            roomId,
            tutorId: auth.userId,
            content,
          },
          include: {
            room: { select: { id: true, subject: true, durationMinutes: true } },
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
