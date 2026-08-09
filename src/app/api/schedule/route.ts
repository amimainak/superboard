// ============================================================
// API Route: Scheduled Lessons — List / Create
// ============================================================
// GET:  List scheduled lessons for the authenticated tutor.
//       Supports ?status=SCHEDULED&from=ISO_DATE&to=ISO_DATE
// POST: Create a new scheduled lesson (auth required).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createScheduleSchema, validateInput } from '@/lib/validations';
import type { Subject, LessonStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // --- Auth check ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = validateInput<{
      title: string;
      description?: string | null;
      subject: string;
      studentEmail?: string | null;
      studentName?: string | null;
      scheduledAt: string;
      durationMinutes?: number;
      timeZone?: string;
    }>(createScheduleSchema, body);
    if (!parsed.success) return parsed.response;

    const {
      title,
      description,
      subject,
      studentEmail,
      studentName,
      scheduledAt,
      durationMinutes,
      timeZone,
    } = parsed.data;

    // Verify tutor exists
    const tutor = await db.user.findUnique({ where: { id: auth.userId } });
    if (!tutor) {
      return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
    }

    // Create the scheduled lesson
    const lesson = await db.scheduledLesson.create({
      data: {
        tutorId: auth.userId,
        title,
        description: description ?? null,
        subject: subject as Subject,
        studentEmail: studentEmail ?? null,
        studentName: studentName ?? null,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: durationMinutes ?? 60,
        timeZone: timeZone ?? 'UTC',
      },
    });

    return NextResponse.json({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      subject: lesson.subject,
      studentEmail: lesson.studentEmail,
      studentName: lesson.studentName,
      scheduledAt: lesson.scheduledAt.toISOString(),
      durationMinutes: lesson.durationMinutes,
      timeZone: lesson.timeZone,
      status: lesson.status,
      createdAt: lesson.createdAt,
    });
  } catch (error) {
    console.error('[Schedule Create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduled lesson' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // --- Auth check ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build the where clause
    const where: Record<string, unknown> = { tutorId: auth.userId };

    if (status) {
      where.status = status as LessonStatus;
    }

    if (from || to) {
      const scheduledAt: Record<string, Date> = {};
      if (from) scheduledAt.gte = new Date(from);
      if (to) scheduledAt.lte = new Date(to);
      where.scheduledAt = scheduledAt;
    }

    const lessons = await db.scheduledLesson.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        subject: true,
        studentEmail: true,
        studentName: true,
        scheduledAt: true,
        durationMinutes: true,
        timeZone: true,
        status: true,
        roomUrl: true,
        reminderSent: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Serialize dates
    const serialized = lessons.map((l) => ({
      ...l,
      scheduledAt: l.scheduledAt.toISOString(),
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));

    return NextResponse.json({ lessons: serialized });
  } catch (error) {
    console.error('[Schedule List] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled lessons' },
      { status: 500 },
    );
  }
}
