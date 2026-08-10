import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET: Batch fetch recordings for all of a tutor's rooms
// Eliminates N+1 API calls from RecordingsPanel
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const where: Record<string, unknown> = { tutorId: auth.userId };
    if (status) where.status = status;

    const recordings = await db.recording.findMany({
      where,
      select: {
        id: true,
        roomId: true,
        tutorId: true,
        status: true,
        duration: true,
        egressId: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
        room: {
          select: { subject: true, isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.recording.count({ where });

    return NextResponse.json({
      recordings,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Recordings Batch] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 });
  }
}
