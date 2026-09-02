// ============================================================
// API Route: Community Templates (Phase 2B)
// ============================================================
// GET: Browse public templates from all users.
//       ?subject=  &gradeBand=  &search=  &sort=newest|popular&limit=&offset=
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || undefined;
    const gradeBand = searchParams.get('gradeBand') || undefined;
    const search = searchParams.get('search') || undefined;
    const sort = searchParams.get('sort') || 'newest'; // newest | popular (placeholder)
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {
      isPublic: true,
      // Exclude own templates from community browse
      tutorId: { not: auth.userId },
      ...(subject ? { subject } : {}),
      ...(gradeBand ? { gradeBand } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { tags: { has: search } },
            ],
          }
        : {}),
    };

    const orderBy = sort === 'popular'
      ? { createdAt: 'desc' as const } // placeholder — would use usage stats
      : { createdAt: 'desc' as const };

    const [templates, total] = await Promise.all([
      db.template.findMany({
        where: where as any,
        select: {
          id: true,
          tutorId: true,
          name: true,
          description: true,
          subject: true,
          gradeBand: true,
          tags: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          tutor: { select: { name: true } },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      db.template.count({ where: where as any }),
    ]);

    return NextResponse.json({
      templates: templates.map((t) => ({
        ...t,
        authorName: t.tutor.name,
        // Don't expose tutorId or snapshot in listing
        tutorId: undefined,
        snapshot: undefined,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Community Templates] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community templates' },
      { status: 500 }
    );
  }
}
