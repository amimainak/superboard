// ============================================================
// API Route: Resources — List & Create
// ============================================================
// GET:  List agency resources with optional filters.
//       ?category=worksheet&subject=MATH&page=1&limit=50
// POST: Upload resource metadata (file storage added later).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier, type Tier } from '@/types';
import { z } from 'zod';

const createResourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(300, 'Name too long'),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(50).optional().default('general'),
  subject: z.enum(['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL']).optional().default('GENERAL'),
  fileUrl: z.string().min(1, 'File URL is required').max(1000),
  fileType: z.string().max(100, 'File type too long'),
  fileSize: z.number().int().min(0).max(100_000_000).optional().default(0),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const subject = searchParams.get('subject');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Determine agency context
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const agencyId = user.parentAgencyId || auth.userId;

    // Build where filter
    const where: Record<string, unknown> = { agencyId };
    if (category) where.category = category;
    if (subject) where.subject = subject;

    const [resources, totalCount] = await Promise.all([
      db.resourceLibrary.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          subject: true,
          fileUrl: true,
          fileType: true,
          fileSize: true,
          downloadCount: true,
          createdAt: true,
          updatedAt: true,
          uploadedByTutorId: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.resourceLibrary.count({ where }),
    ]);

    const serialized = resources.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      resources: serialized,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('[Resources List] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = createResourceSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message || 'Validation error',
      }));
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    const { name, description, category, subject, fileUrl, fileType, fileSize } = parsed.data;

    // Verify agency access
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user || !isAgencyTier(user.tier as Tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'Only agency users can upload resources' },
        { status: 403 },
      );
    }

    const agencyId = user.parentAgencyId || auth.userId;

    const resource = await db.resourceLibrary.create({
      data: {
        agencyId,
        uploadedByTutorId: auth.userId,
        name,
        description: description ?? null,
        category,
        subject,
        fileUrl,
        fileType,
        fileSize,
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        subject: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        downloadCount: true,
        createdAt: true,
        updatedAt: true,
        uploadedByTutorId: true,
      },
    });

    return NextResponse.json({
      ...resource,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('[Resources Create] Error:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}
