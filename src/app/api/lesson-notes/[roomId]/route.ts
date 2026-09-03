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
  content: z.string().min(1).max(50000).optional(),
});

type RouteContext = { params: Promise<{ roomId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { roomId } = await context.params;

    // LessonNote has no @@unique(roomId) constraint, so we use findFirst.
    const note = await db.lessonNote.findFirst({
      where: { roomId },
      include: {
        room: { select: { id: true, subject: true, durationMinutes: true, endedAt: true, tutorId: true } },
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
    // SECURITY FIX (API-M06): Fix sub-tutor access check — verify the room's tutor
    // is a sub-tutor under the same agency as the caller
    const tutorAgency = note.room
      ? await db.user.findUnique({
          where: { id: note.room.tutorId },
          select: { parentAgencyId: true },
        })
      : null;
    const isSubTutor = tutorAgency?.parentAgencyId === auth.userId;

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
    if (parsed.data.content !== undefined) updateData.content = parsed.data.content;
    updateData.tutorId = auth.userId;

    // Find existing note for this room (LessonNote has no @@unique on roomId)
    const existing = await db.lessonNote.findFirst({
      where: { roomId },
      select: { id: true },
    });

    const updated = existing
      ? await db.lessonNote.update({
          where: { id: existing.id },
          data: updateData,
          include: {
            room: { select: { id: true, subject: true, durationMinutes: true } },
          },
        })
      : await db.lessonNote.create({
          data: {
            roomId,
            tutorId: auth.userId,
            content: parsed.data.content || '',
          },
          include: {
            room: { select: { id: true, subject: true, durationMinutes: true } },
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
