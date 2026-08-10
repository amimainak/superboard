import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET: Batch fetch lesson notes for all of a tutor's rooms
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const notes = await db.lessonNote.findMany({
      where: { tutorId: auth.userId },
      include: {
        room: { select: { subject: true, isActive: true } },
        student: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.lessonNote.count({ where: { tutorId: auth.userId } });

    return NextResponse.json({ notes, total, limit, offset });
  } catch (error) {
    console.error('[Lesson Notes Batch] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch lesson notes' }, { status: 500 });
  }
}
