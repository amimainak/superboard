// ============================================================
// Test Prep Assign API — POST /api/test-prep/assign
// ============================================================
// Assigns one or more questions to a test prep category.
// Body: { questionIds: string[], categoryId: string }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionIds, categoryId } = body as {
      questionIds?: string[];
      categoryId?: string;
    };

    if (!questionIds?.length || !categoryId) {
      return NextResponse.json(
        { error: 'questionIds and categoryId are required' },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await db.testPrepCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Test prep category not found' },
        { status: 404 }
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
      { status: 500 }
    );
  }
}
