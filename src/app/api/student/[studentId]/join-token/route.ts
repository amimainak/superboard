// ============================================================
// API Route: Student Join Token  (F-05)
// ============================================================
// POST    /api/student/[studentId]/join-token
//   Generate or regenerate the student's join token. If a token
//   already exists, it is overwritten — the old link instantly
//   stops working. Returns the new token so the tutor can copy
//   the join URL.
//
// DELETE  /api/student/[studentId]/join-token
//   Revoke the token. The student's join link stops working.
//   The tutor can generate a fresh one later via POST.
//
// Access: any authenticated tutor, scoped to their own students.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import crypto from 'crypto';

type RouteContext = { params: Promise<{ studentId: string }> };

async function resolveStudentForTutor(auth: { userId: string }, studentId: string) {
  const student = await db.student.findFirst({
    where: { id: studentId, agencyId: auth.userId },
    select: { id: true, name: true, isActive: true, joinToken: true, joinTokenGeneratedAt: true },
  });
  if (!student) {
    return { error: NextResponse.json({ error: 'Student not found' }, { status: 404 }) };
  }
  return { student };
}

// ----------------------------------------------------------------
// POST — generate or regenerate
// ----------------------------------------------------------------
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { studentId } = await context.params;
    const access = await resolveStudentForTutor(auth, studentId);
    if ('error' in access) return access.error;

    // 32 bytes of entropy = 256 bits. Same standard as
    // HomeworkAssignment.assignmentToken. Brute-force infeasible.
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();

    const updated = await db.student.update({
      where: { id: studentId },
      data: {
        joinToken: token,
        joinTokenGeneratedAt: now,
      },
      select: {
        id: true,
        name: true,
        joinToken: true,
        joinTokenGeneratedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      token: updated.joinToken,
      generatedAt: updated.joinTokenGeneratedAt?.toISOString() ?? now.toISOString(),
      // Convenience: the full URL is built client-side so the API
      // doesn't need to know the deployment domain.
    });
  } catch (error) {
    console.error('[Join Token POST] Error:', error);
    return NextResponse.json({ error: 'Failed to generate join token' }, { status: 500 });
  }
}

// ----------------------------------------------------------------
// DELETE — revoke
// ----------------------------------------------------------------
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { studentId } = await context.params;
    const access = await resolveStudentForTutor(auth, studentId);
    if ('error' in access) return access.error;

    await db.student.update({
      where: { id: studentId },
      data: {
        joinToken: null,
        joinTokenGeneratedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Join Token DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to revoke join token' }, { status: 500 });
  }
}
