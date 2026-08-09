// ============================================================
// API Route: Lesson Notes — Room-based Get / Update
// ============================================================
// GET:   Get the lesson note for a specific room.
// PATCH: Update the lesson note for a specific room.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateNoteSchema = z.object({
  studentId: z.string().uuid().optional().nullable(),
  content: z.string().min(1).max(50000).optional(),
  tutorFeedback: z.string().max(10000).optional().nullable(),
  topicsForNext: z.string().max(5000).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
});

type RouteContext = { params: Promise<{ roomId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { roomId } = await context.params;

    const note = await db.lessonNote.findUnique({
      where: { roomId },
      include: {
        room: { select: { id: true, subject: true, durationMinutes: true, endedAt: true, tutorId: true } },
        student: { select: { id: true, name: true, email: true, grade: true } },
        tutor: { select: { id: true, name: true, email: true } },
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'No lesson note found for this room' }, { status: 404 });
    }

    // Only the tutor who owns the room (or their agency) can read notes
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isOwner = note.tutorId === auth.userId;
    const isAgencyOwner = user.parentAgencyId === null &&
      (user.tier === 'AGENCY' || user.tier === 'AGENCY_STANDARD' || user.tier === 'AGENCY_PREMIUM');
    const isSubTutor = user.parentAgencyId === note.room.tutorId;

    if (!isOwner && !isAgencyOwner && !isSubTutor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      ...note,
      room: note.room
        ? { ...note.room, endedAt: note.room.endedAt?.toISOString() ?? null }
        : null,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[Lesson Note Get] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson note' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { roomId } = await context.params;
    const body = await request.json();
    const parsed = updateNoteSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message || 'Validation error',
      }));
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    // Verify the room belongs to this tutor
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { tutorId: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.tutorId !== auth.userId) {
      return NextResponse.json(
        { error: 'You can only update notes for your own rooms' },
        { status: 403 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.studentId !== undefined) updateData.studentId = parsed.data.studentId;
    if (parsed.data.content !== undefined) updateData.content = parsed.data.content;
    if (parsed.data.tutorFeedback !== undefined) updateData.tutorFeedback = parsed.data.tutorFeedback;
    if (parsed.data.topicsForNext !== undefined) updateData.topicsForNext = parsed.data.topicsForNext;
    if (parsed.data.rating !== undefined) updateData.rating = parsed.data.rating;

    const updated = await db.lessonNote.upsert({
      where: { roomId },
      update: updateData,
      create: {
        roomId,
        tutorId: auth.userId,
        content: parsed.data.content || '',
        studentId: parsed.data.studentId ?? null,
        tutorFeedback: parsed.data.tutorFeedback ?? null,
        topicsForNext: parsed.data.topicsForNext ?? null,
        rating: parsed.data.rating ?? null,
      },
      include: {
        room: { select: { id: true, subject: true, durationMinutes: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[Lesson Note Update] Error:', error);
    return NextResponse.json({ error: 'Failed to update lesson note' }, { status: 500 });
  }
}
