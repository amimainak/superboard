// ============================================================
// Question API — PUT/DELETE /api/questions/[id]
// ============================================================
// PUT: Update a question
// DELETE: Soft-delete a question (sets isActive = false)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { QuestionType } from '@prisma/client';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.questionItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const question = await db.questionItem.update({
      where: { id },
      data: {
        ...(body.subject && { subject: body.subject.toUpperCase() }),
        ...(body.gradeBand && { gradeBand: body.gradeBand }),
        ...(body.topic && { topic: body.topic }),
        ...(body.difficulty && { difficulty: body.difficulty }),
        ...(body.curriculum && { curriculum: body.curriculum.toUpperCase() }),
        ...(body.standardCode !== undefined && { standardCode: body.standardCode }),
        ...(body.stem && { stem: body.stem }),
        ...(body.stemLatex !== undefined && { stemLatex: body.stemLatex }),
        ...(body.answerKey && { answerKey: body.answerKey }),
        ...(body.solutionSteps !== undefined && { solutionSteps: body.solutionSteps }),
        ...(body.distractors !== undefined && { distractors: body.distractors }),
        ...(body.questionType && { questionType: body.questionType.toUpperCase() as QuestionType }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.estimatedTimeSec !== undefined && { estimatedTimeSec: body.estimatedTimeSec }),
        ...(body.diagramSvg !== undefined && { diagramSvg: body.diagramSvg }),
        ...(body.testPrepCategoryId !== undefined && { testPrepCategoryId: body.testPrepCategoryId }),
      },
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error('[API /questions PUT] Error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.questionItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Soft delete
    await db.questionItem.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error('[API /questions DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
