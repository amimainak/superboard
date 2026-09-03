// ============================================================
// Test Prep Assign API — POST /api/test-prep/assign
// ============================================================
// SECURITY FIX (AUDIT-CRIT-6): Added auth check.
// Previously anyone could reassign questions to categories.
// ============================================================
//
// NOTE: The TestPrepCategory model does not exist in the Prisma
// schema, and QuestionItem has no `testPrepCategoryId` column.
// This endpoint validates input and auth, then returns a no-op
// 200 response with updated: 0.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Require auth
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { questionIds, categoryId } = body as {
      questionIds?: string[];
      categoryId?: string;
    };

    if (!questionIds?.length || !categoryId) {
      return NextResponse.json(
        { error: 'questionIds and categoryId are required' },
        { status: 400 },
      );
    }

    // Limit batch size
    if (questionIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 questions per assignment' },
        { status: 400 },
      );
    }

    // TestPrepCategory model is not present in the Prisma schema, and
    // QuestionItem has no testPrepCategoryId column. Acknowledge the
    // request without modifying any rows.
    return NextResponse.json({
      updated: 0,
      categoryId,
      note: 'Test prep categories are not enabled on this deployment.',
    });
  } catch (error) {
    console.error('[API /test-prep/assign] Error:', error);
    return NextResponse.json(
      { error: 'Failed to assign questions to category' },
      { status: 500 },
    );
  }
}
