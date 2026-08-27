// ============================================================
// Test Prep Assign API — POST /api/test-prep/assign
// ============================================================
// SECURITY FIX (AUDIT-CRIT-6): Added auth check.
// Previously anyone could reassign questions to categories.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

    // Verify category exists
    const category = await db.testPrepCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Test prep category not found' },
        { status: 404 },
      );
    }

    // Update all questions to reference this category
    const result = await db.questionItem.updateMany({
      where: { id: { in: questionIds } },
      data: { testPrepCategoryId: categoryId },
    });

    return NextResponse.json({
      updated: result.count,
      categoryId,
    });
  } catch (error) {
    console.error('[API /test-prep/assign] Error:', error);
    return NextResponse.json(
      { error: 'Failed to assign questions to category' },
      { status: 500 },
    );
  }
}
