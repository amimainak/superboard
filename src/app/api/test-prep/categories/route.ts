// ============================================================
// Test Prep Categories API — GET /api/test-prep/categories
// ============================================================
// Lists all test prep categories with optional filtering.
// Query params:
//   testType (optional): SAT, ACT, AP, STAAR, etc.
//   subject (optional): MATH, ENGLISH, SCIENCE, etc.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const testType = searchParams.get('testType');
    const subject = searchParams.get('subject');

    const where: Record<string, unknown> = { isActive: true };
    if (testType) where.testType = testType.toUpperCase();
    if (subject) where.subject = subject.toUpperCase();

    const categories = await db.testPrepCategory.findMany({
      where,
      select: {
        id: true,
        name: true,
        testType: true,
        subject: true,
        gradeLevel: true,
        description: true,
        _count: { select: { questions: true } },
      },
      orderBy: [{ testType: 'asc' }, { subject: 'asc' }],
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[API /test-prep/categories] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test prep categories' },
      { status: 500 }
    );
  }
}
