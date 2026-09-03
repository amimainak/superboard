// ============================================================
// API Route: Homework — Get / Update / Delete
// ============================================================
// GET:    Fetch a single homework by ID.
// PATCH:  Update homework (status, title, description, dueDate).
// DELETE: Delete a homework assignment.
// ============================================================
//
// NOTE: Homework only exposes: tutorId, roomId, title, description,
// dueDate, status. No agencyId, studentId, subject, tutorFeedback,
// grade, or snapshot fields. Access scoping uses tutorId.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier, Tier } from '@/types';
import { z } from 'zod';

const updateHomeworkSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(10000).optional().nullable(),
  dueDate: z.string().datetime('Invalid due date format').optional().nullable(),
  status: z.string().max(50).optional(),
});

type RouteContext = { params: Promise<{ homeworkId: string }> };

/**
 * Compute the list of tutor IDs whose homework the caller may view:
 * - Agency owners: themselves + their sub-tutors
 * - Sub-tutors: themselves + their parent agency owner
 * - Free/PRO: just themselves
 */
async function getAccessibleTutorIds(authUserId: string): Promise<string[]> {
  const user = await db.user.findUnique({
    where: { id: authUserId },
    select: { tier: true, parentAgencyId: true },
  });
  if (!user) return [authUserId];

  if (isAgencyTier(user.tier as Tier) && !user.parentAgencyId) {
    const subTutors = await db.user.findMany({
      where: { parentAgencyId: authUserId },
      select: { id: true },
    });
    return [authUserId, ...subTutors.map((t) => t.id)];
  }
  if (user.parentAgencyId) {
    return [authUserId, user.parentAgencyId];
  }
  return [authUserId];
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { homeworkId } = await context.params;

    const tutorIds = await getAccessibleTutorIds(auth.userId);

    const homework = await db.homework.findFirst({
      where: {
        id: homeworkId,
        tutorId: { in: tutorIds },
      },
      include: {
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

    const tutorIds = await getAccessibleTutorIds(auth.userId);

    const existing = await db.homework.findFirst({
      where: {
        id: homeworkId,
        tutorId: { in: tutorIds },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    // Build update data — only fields that exist on the Homework model.
    const updateData: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.dueDate !== undefined) updateData.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

    const updated = await db.homework.update({
      where: { id: homeworkId },
      data: updateData,
      include: {
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

    const tutorIds = await getAccessibleTutorIds(auth.userId);

    const existing = await db.homework.findFirst({
      where: {
        id: homeworkId,
        tutorId: { in: tutorIds },
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
