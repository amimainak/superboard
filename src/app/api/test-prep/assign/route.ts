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

    // IDOR: verify the caller owns the questions being assigned
    const ownedQuestions = await db.questionItem.findMany({
      where: { id: { in: questionIds }, tutorId: auth.userId },
      select: { id: true },
    });
    const ownedIds = new Set(ownedQuestions.map(q => q.id));
    const disallowedIds = questionIds.filter((id: string) => !ownedIds.has(id));
    // Only block if some questions have a tutorId that doesn't match
    // (questions with null tutorId are legacy and allowed)
    if (disallowedIds.length > 0) {
      const nonNullTutorQuestions = await db.questionItem.findMany({
        where: { id: { in: disallowedIds }, tutorId: { not: null } },
        select: { id: true },
      });
      if (nonNullTutorQuestions.length > 0) {
        return NextResponse.json(
          { error: 'You do not have access to some of these questions' },
          { status: 403 },
        );
      }
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
