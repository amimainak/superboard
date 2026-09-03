// ============================================================
// API Route: Scheduled Lesson — Update / Delete
// ============================================================
// PATCH:  Update lesson status or details (auth required, owner only).
// DELETE: Cancel/delete a scheduled lesson (auth required, owner only).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { updateScheduleSchema } from '@/lib/validations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    // --- Auth check ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { lessonId } = await params;

    // Validate lessonId format (UUID)
    if (!lessonId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(lessonId)) {
      return NextResponse.json({ error: 'Invalid lessonId format' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // Fetch the lesson and verify ownership
    const lesson = await db.scheduledLesson.findUnique({
      where: { id: lessonId },
      select: { id: true, tutorId: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    if (lesson.tutorId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — you can only update your own lessons' },
        { status: 403 },
      );
    }

    // Build update data — only fields supported by ScheduledLesson
    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
    if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);

    const updated = await db.scheduledLesson.update({
      where: { id: lessonId },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      subject: updated.subject,
      studentEmail: updated.studentEmail,
      studentName: updated.studentName,
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime?.toISOString() ?? null,
      status: updated.status,
      roomId: updated.roomId,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[Schedule Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled lesson' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    // --- Auth check ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { lessonId } = await params;

    // Validate lessonId format (UUID)
    if (!lessonId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(lessonId)) {
      return NextResponse.json({ error: 'Invalid lessonId format' }, { status: 400 });
    }

    // Fetch the lesson and verify ownership
    const lesson = await db.scheduledLesson.findUnique({
      where: { id: lessonId },
      select: { id: true, tutorId: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    if (lesson.tutorId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — you can only delete your own lessons' },
        { status: 403 },
      );
    }

    await db.scheduledLesson.delete({
      where: { id: lessonId },
    });

    return NextResponse.json({ success: true, id: lessonId });
  } catch (error) {
    console.error('[Schedule Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled lesson' },
      { status: 500 },
    );
  }
}
