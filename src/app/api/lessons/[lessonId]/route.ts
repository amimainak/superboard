// ============================================================
// API Route: Single Lesson Plan CRUD (Milestone 2 — Lesson Builder)
// ============================================================
// GET:    Fetch a single lesson plan (owner or public).
// PUT:    Update lesson plan metadata + steps.
// DELETE: Delete own lesson plan.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { parseBody, updateLessonPlanSchema } from '@/lib/validations';

const MAX_STEPS_SIZE = 2_000_000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { lessonId } = await params;

    if (!lessonId || !/^[a-zA-Z0-9-]{1,100}$/.test(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const lesson = await db.lessonPlan.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        tutorId: true,
        title: true,
        description: true,
        subject: true,
        gradeBand: true,
        tags: true,
        steps: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 });
    }

    // Only owner or public lesson plans can be viewed
    if (lesson.tutorId !== auth.userId && !lesson.isPublic) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('[LessonPlan Get] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson plan' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { lessonId } = await params;

    if (!lessonId || !/^[a-zA-Z0-9-]{1,100}$/.test(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const body = await request.json();
    const { data: parsed, error: parseError } = parseBody(updateLessonPlanSchema, body);
    if (parseError || !parsed) {
      return NextResponse.json({ error: parseError || 'Invalid body' }, { status: 400 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (parsed.title !== undefined) updates.title = parsed.title;
    if (parsed.description !== undefined) updates.description = parsed.description ?? null;
    if (parsed.subject !== undefined) updates.subject = parsed.subject;
    if (parsed.gradeBand !== undefined) updates.gradeBand = parsed.gradeBand;
    if (parsed.tags !== undefined) updates.tags = parsed.tags;
    if (parsed.isPublic !== undefined) updates.isPublic = parsed.isPublic;
    if (parsed.steps !== undefined) {
      const stepsStr = JSON.stringify(parsed.steps);
      if (stepsStr.length > MAX_STEPS_SIZE) {
        return NextResponse.json(
          { error: `Lesson steps too large (max ${Math.round(MAX_STEPS_SIZE / 1_000_000)}MB)` },
          { status: 400 }
        );
      }
      updates.steps = parsed.steps;
    }

    // Only owner can update
    const existing = await db.lessonPlan.findUnique({
      where: { id: lessonId },
      select: { tutorId: true },
    });
    if (!existing || existing.tutorId !== auth.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const lesson = await db.lessonPlan.update({
      where: { id: lessonId },
      data: updates as any,
      select: {
        id: true,
        title: true,
        description: true,
        subject: true,
        gradeBand: true,
        tags: true,
        steps: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('[LessonPlan Update] Error:', error);
    return NextResponse.json({ error: 'Failed to update lesson plan' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { lessonId } = await params;

    if (!lessonId || !/^[a-zA-Z0-9-]{1,100}$/.test(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID format' }, { status: 400 });
    }

    const lesson = await db.lessonPlan.findUnique({
      where: { id: lessonId },
      select: { id: true, tutorId: true },
    });

    if (!lesson || lesson.tutorId !== auth.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.lessonPlan.delete({ where: { id: lessonId } });
    return NextResponse.json({ success: true, id: lessonId });
  } catch (error) {
    console.error('[LessonPlan Delete] Error:', error);
    return NextResponse.json({ error: 'Failed to delete lesson plan' }, { status: 500 });
  }
}
