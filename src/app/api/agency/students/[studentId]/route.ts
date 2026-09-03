// ============================================================
// API Route: Update/Deactivate Student
// ============================================================
// PATCH: Update student name or deactivate/reactivate.
// DELETE: Hard delete a student (or soft-deactivate).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier, type Tier } from '@/types';

async function verifyAgencyAccess(auth: { userId: string; email: string | null }) {
  const agency = await db.user.findUnique({
    where: { id: auth.userId },
    select: { tier: true, parentAgencyId: true },
  });

  if (!agency || !isAgencyTier(agency.tier as Tier)) {
    return { error: 'AGENCY_REQUIRED', message: 'Only Agency tier users can manage students' };
  }

  return { agencyId: agency.parentAgencyId || auth.userId };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { studentId } = await params;
    const access = await verifyAgencyAccess(auth);
    if ('error' in access) {
      return NextResponse.json({ error: access.error, message: access.message }, { status: 403 });
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, agencyId: true },
    });

    if (!student || student.agencyId !== access.agencyId) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, isActive } = body;

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (isActive !== undefined) {
      updateData.isActive = isActive;
      updateData.deactivatedAt = isActive ? null : new Date();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await db.student.update({
      where: { id: studentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      student: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        isActive: updated.isActive,
        deactivatedAt: updated.deactivatedAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('[Student Update] Error:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { studentId } = await params;
    const access = await verifyAgencyAccess(auth);
    if ('error' in access) {
      return NextResponse.json({ error: access.error, message: access.message }, { status: 403 });
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, agencyId: true },
    });

    if (!student || student.agencyId !== access.agencyId) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Soft-delete: deactivate instead of removing from DB
    await db.student.update({
      where: { id: studentId },
      data: { isActive: false, deactivatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Student Delete] Error:', error);
    return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 });
  }
}
