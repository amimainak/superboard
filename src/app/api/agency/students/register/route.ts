// ============================================================
// API Route: Register Student
// ============================================================
// POST: Register a new student for an agency.
//       Agency owner or sub-tutor auth required.
//       If student email was previously deactivated, reactivates.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier, type Tier } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!normalizedEmail || !trimmedName) {
      return NextResponse.json(
        { error: 'Email and name cannot be empty' },
        { status: 400 }
      );
    }

    // Verify the caller is an agency
    const agency = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!agency || !isAgencyTier(agency.tier as Tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'Only Agency tier users can register students' },
        { status: 403 }
      );
    }

    // Determine agency ID (for sub-tutors, use their parent agency)
    const agencyId = agency.parentAgencyId || auth.userId;

    // Check if student already exists (active or deactivated)
    const existing = await db.student.findUnique({
      where: {
        agencyId_email: { agencyId, email: normalizedEmail },
      },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { error: 'STUDENT_EXISTS', message: 'This student is already registered and active' },
          { status: 409 }
        );
      }

      // Reactivate previously deactivated student
      const reactivated = await db.student.update({
        where: { id: existing.id },
        data: {
          name: trimmedName,
          isActive: true,
          deactivatedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        student: {
          id: reactivated.id,
          email: reactivated.email,
          name: reactivated.name,
          isActive: true,
          reactivated: true,
        },
      });
    }

    // Create new student
    const student = await db.student.create({
      data: {
        agencyId,
        email: normalizedEmail,
        name: trimmedName,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        email: student.email,
        name: student.name,
        isActive: true,
        reactivated: false,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Student Register] Error:', error);
    return NextResponse.json(
      { error: 'Failed to register student' },
      { status: 500 }
    );
  }
}
