// ============================================================
// API Route: Homework — Get / Update / Delete
// ============================================================
// GET:    Fetch a single homework by ID.
// PATCH:  Update homework (status, feedback, grade, etc.).
// DELETE: Delete a homework assignment.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier } from '@/types';
import { z } from 'zod';

const updateHomeworkSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(10000).optional().nullable(),
  subject: z.enum(['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL']).optional(),
  dueDate: z.string().datetime('Invalid due date format').optional().nullable(),
  status: z.enum(['PENDING', 'SUBMITTED', 'GRADED', 'OVERDUE']).optional(),
  tutorFeedback: z.string().max(10000).optional().nullable(),
  grade: z.string().max(50).optional().nullable(),
  snapshot: z.string().max(5_000_000).optional().nullable(),
});

type RouteContext = { params: Promise<{ homeworkId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { homeworkId } = await context.params;

    // Verify user has access
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const agencyId = user.parentAgencyId || auth.userId;

    const homework = await db.homework.findFirst({
      where: {
        id: homeworkId,
        OR: [
          { agencyId },
          { tutorId: auth.userId },
        ],
      },
      include: {
        student: { select: { id: true, name: true, email: true, grade: true } },
        tutor: { select: { id: true, name: true, email: true } },
      },
    });

    if (!homework) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...homework,
      dueDate: homework.dueDate?.toISOString() ?? null,
      createdAt: homework.createdAt.toISOString(),
      updatedAt: homework.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[Homework Get] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch homework' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { homeworkId } = await context.params;
    const body = await request.json();
    const parsed = updateHomeworkSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message || 'Validation error',
      }));
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    // Verify access
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const agencyId = user.parentAgencyId || auth.userId;

    const existing = await db.homework.findFirst({
      where: {
        id: homeworkId,
        OR: [
          { agencyId },
          { tutorId: auth.userId },
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.subject !== undefined) updateData.subject = parsed.data.subject;
    if (parsed.data.dueDate !== undefined) updateData.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.tutorFeedback !== undefined) updateData.tutorFeedback = parsed.data.tutorFeedback;
    if (parsed.data.grade !== undefined) updateData.grade = parsed.data.grade;
    if (parsed.data.snapshot !== undefined) updateData.snapshot = parsed.data.snapshot;

    const updated = await db.homework.update({
      where: { id: homeworkId },
      data: updateData,
      include: {
        student: { select: { id: true, name: true, email: true } },
        tutor: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      ...updated,
      dueDate: updated.dueDate?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[Homework Update] Error:', error);
    return NextResponse.json({ error: 'Failed to update homework' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { homeworkId } = await context.params;

    // Only agency owners or the assigning tutor can delete
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const agencyId = user.parentAgencyId || auth.userId;

    const existing = await db.homework.findFirst({
      where: {
        id: homeworkId,
        OR: [
          { agencyId },
          { tutorId: auth.userId },
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    await db.homework.delete({ where: { id: homeworkId } });

    return NextResponse.json({ success: true, message: 'Homework deleted' });
  } catch (error) {
    console.error('[Homework Delete] Error:', error);
    return NextResponse.json({ error: 'Failed to delete homework' }, { status: 500 });
  }
}
