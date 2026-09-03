// ============================================================
// Test Prep Categories API — GET /api/test-prep/categories
// ============================================================
// Lists all test prep categories with optional filtering.
// Query params:
//   testType (optional): SAT, ACT, AP, STAAR, etc.
//   subject (optional): MATH, ENGLISH, SCIENCE, etc.
// ============================================================
//
// NOTE: The TestPrepCategory Prisma model does not exist in the
// schema. This endpoint returns an empty list with a 200 status
// to preserve client compatibility.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    // TestPrepCategory model is not present in the Prisma schema.
    // Return an empty list so the client UI renders gracefully.
    return NextResponse.json({ categories: [] });
  } catch (error) {
    console.error('[API /test-prep/categories] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test prep categories' },
      { status: 500 }
    );
  }
}
