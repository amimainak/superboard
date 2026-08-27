// ============================================================
// API Route: Homework — List & Create
// ============================================================
// GET:  List homework for an agency/tutor with optional filters.
//       ?status=PENDING&studentId=UUID&page=1&limit=50
// POST: Create a new homework assignment (agency tier required).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier } from '@/types';
import { z } from 'zod';
import { validateInput } from '@/lib/validations';

const createHomeworkSchema = z.object({
  studentId: z.string().uuid().optional(),
  roomId: z.string().max(100).optional(),
  title: z.string().min(1, 'Title is required').max(300, 'Title too long'),
  description: z.string().max(10000).optional().nullable(),
  subject: z.enum(['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL']).optional().default('GENERAL'),
  dueDate: z.string().datetime('Invalid due date format').optional().nullable(),
  snapshot: z.string().max(5_000_000).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Determine the agency context
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Agency owners see all homework in their agency
    // Sub-tutors see only their own homework
    const isAgencyOwner = isAgencyTier(user.tier) && !user.parentAgencyId;
    const agencyId = user.parentAgencyId || (isAgencyOwner ? auth.userId : null);

    // Build where filter
    const where: Record<string, unknown> = {};

    if (isAgencyOwner && agencyId) {
      where.agencyId = agencyId;
    } else {
      where.tutorId = auth.userId;
    }

    if (status) where.status = status;
    if (studentId) where.studentId = studentId;

    const [homeworks, totalCount] = await Promise.all([
      db.homework.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          subject: true,
          dueDate: true,
          status: true,
          tutorFeedback: true,
          grade: true,
          createdAt: true,
          updatedAt: true,
          student: { select: { id: true, name: true, email: true } },
          tutor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.homework.count({ where }),
    ]);

    const serialized = homeworks.map((h) => ({
      ...h,
      dueDate: h.dueDate?.toISOString() ?? null,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      homeworks: serialized,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('[Homework List] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch homework' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = validateInput(createHomeworkSchema, body);
    if (!parsed.success) return parsed.response;

    const { studentId, roomId, title, description, subject, dueDate, snapshot } = parsed.data;

    // Verify agency access
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user || !isAgencyTier(user.tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'Only agency users can create homework' },
        { status: 403 },
      );
    }

    const agencyId = user.parentAgencyId || auth.userId;

    // If studentId provided, verify student belongs to this agency
    if (studentId) {
      const student = await db.student.findFirst({
        where: { id: studentId, agencyId },
      });
      if (!student) {
        return NextResponse.json({ error: 'Student not found in your agency' }, { status: 404 });
      }
    }

    const homework = await db.homework.create({
      data: {
        agencyId,
        tutorId: auth.userId,
        studentId: studentId ?? null,
        roomId: roomId ?? null,
        title,
        description: description ?? null,
        subject,
        dueDate: dueDate ? new Date(dueDate) : null,
        snapshot: snapshot ?? null,
      },
      select: {
        id: true, title: true, description: true, subject: true, dueDate: true,
        status: true, createdAt: true, updatedAt: true,
        student: { select: { id: true, name: true, email: true } },
        tutor: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      ...homework,
      dueDate: homework.dueDate?.toISOString() ?? null,
      createdAt: homework.createdAt.toISOString(),
      updatedAt: homework.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('[Homework Create] Error:', error);
    return NextResponse.json({ error: 'Failed to create homework' }, { status: 500 });
  }
}
