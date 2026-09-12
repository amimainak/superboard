// ============================================================
// API Route: Student Progress
// ============================================================
// GET:  Aggregate student progress: lessons attended, subjects,
//       homework completion stats, and recent lesson notes.
//       Requires agency or tutor auth with access to the student.
//
// NOTE: The aggregation logic lives in `@/lib/student-progress` so
// that other endpoints (e.g. /api/room/[roomId]/resume) can reuse
// it without duplicating the queries.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getStudentProgress } from '@/lib/student-progress';

type RouteContext = { params: Promise<{ studentId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { studentId } = await context.params;

    const data = await getStudentProgress(auth.userId, studentId);
    if (!data) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Student Progress] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch student progress' }, { status: 500 });
  }
}
