// ============================================================
// API Route: Homework — List & Create
// ============================================================
// GET:  List homework for an agency/tutor with optional filters.
//       ?status=assigned&page=1&limit=50
// POST: Create a new homework assignment (agency tier required).
// ============================================================
//
// NOTE: The Homework Prisma model only exposes: tutorId, roomId,
// title, description, dueDate, status. There is no agencyId,
// studentId, subject, tutorFeedback, grade, or snapshot column.
// Agency scoping is achieved by listing tutor IDs that belong to
// the agency owner (sub-tutors share parentAgencyId).

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier, Tier } from '@/types';
import { z } from 'zod';

const createHomeworkSchema = z.object({
  roomId: z.string().max(100).optional(),
  title: z.string().min(1, 'Title is required').max(300, 'Title too long'),
  description: z.string().max(10000).optional().nullable(),
  dueDate: z.string().datetime('Invalid due date format').optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
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

    // Agency owners see homework across their agency (themselves + sub-tutors).
    // Sub-tutors see only their own homework.
    const isAgencyOwner = isAgencyTier(user.tier as Tier) && !user.parentAgencyId;

    let tutorIds: string[] = [auth.userId];
    if (isAgencyOwner) {
      const subTutors = await db.user.findMany({
        where: { parentAgencyId: auth.userId },
        select: { id: true },
      });
      tutorIds = [auth.userId, ...subTutors.map((t) => t.id)];
    } else if (user.parentAgencyId) {
      // Sub-tutor: include the agency owner so they can see agency-level
      // homework created by the owner, plus their own.
      tutorIds = [auth.userId, user.parentAgencyId];
    }

    // Build where filter — only fields that exist on Homework.
    const where: Record<string, unknown> = {
      tutorId: { in: tutorIds },
    };

    if (status) where.status = status;

    const [homeworks, totalCount] = await Promise.all([
      db.homework.findMany({
        where,
        select: {
          id: true,
          tutorId: true,
          roomId: true,
          title: true,
          description: true,
          dueDate: true,
          status: true,
          createdAt: true,
          updatedAt: true,
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
    const parsed = createHomeworkSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message || 'Validation error',
      }));
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    const { roomId, title, description, dueDate } = parsed.data;

    // Verify agency access
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user || !isAgencyTier(user.tier as Tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'Only agency users can create homework' },
        { status: 403 },
      );
    }

    const homework = await db.homework.create({
      data: {
        tutorId: auth.userId,
        roomId: roomId ?? null,
        title,
        description: description ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      select: {
        id: true, tutorId: true, roomId: true, title: true, description: true,
        dueDate: true, status: true, createdAt: true, updatedAt: true,
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
