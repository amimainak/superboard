// ============================================================
// API Route: Lesson Plans CRUD (Milestone 2 — Lesson Builder)
// ============================================================
// GET:  List own lesson plans (optional ?subject= filter).
// POST: Create a new lesson plan.
//
// Each LessonPlan holds a JSON `steps` array of LessonStep objects:
//   { id, title, instructions, widgetKind, widgetConfig, duration? }
// The `widgetConfig` is supplied by getDefaultWidgetConfig() on the
// client; the server treats it as opaque JSON.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { parseBody, createLessonPlanSchema } from '@/lib/validations';

export const maxDuration = 30;

const MAX_STEPS_SIZE = 2_000_000; // 2MB per steps array
const MAX_LESSONS_PER_USER = 100;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || undefined;

    const lessons = await db.lessonPlan.findMany({
      where: {
        tutorId: auth.userId,
        ...(subject ? { subject } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        subject: true,
        gradeBand: true,
        tags: true,
        isPublic: true,
        // Omit steps on list view (could be large). Client fetches
        // full record when opening the Lesson Builder.
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('[LessonPlans Get] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { data: parsed, error: parseError } = parseBody(createLessonPlanSchema, body);
    if (parseError || !parsed) {
      return NextResponse.json({ error: parseError || 'Invalid body' }, { status: 400 });
    }
    const { title, description, subject, gradeBand, tags, steps, isPublic } = parsed;

    // Validate steps payload size
    const stepsStr = JSON.stringify(steps);
    if (stepsStr.length > MAX_STEPS_SIZE) {
      return NextResponse.json(
        { error: `Lesson steps too large (max ${Math.round(MAX_STEPS_SIZE / 1_000_000)}MB)` },
        { status: 400 }
      );
    }

    // Check lesson plan count limit
    const lessonCount = await db.lessonPlan.count({
      where: { tutorId: auth.userId },
    });
    if (lessonCount >= MAX_LESSONS_PER_USER) {
      return NextResponse.json(
        {
          error: 'LESSON_LIMIT_REACHED',
          message: `Maximum ${MAX_LESSONS_PER_USER} lesson plans allowed.`,
        },
        { status: 403 }
      );
    }

    const lesson = await db.lessonPlan.create({
      data: {
        tutorId: auth.userId,
        title,
        description: description ?? null,
        subject,
        gradeBand: gradeBand ?? '',
        tags,
        steps: steps as any, // Prisma JSON field
        isPublic,
      },
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

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error('[LessonPlans Create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson plan' },
      { status: 500 }
    );
  }
}
