// ============================================================
// Question API — PUT/DELETE /api/questions/[id]
// ============================================================
// SECURITY FIX (AUDIT-CRIT-5): Added auth checks.
// PUT requires auth to update questions.
// DELETE requires auth to soft-delete questions.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { QuestionType } from '@prisma/client';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateQuestionSchema = z.object({
  subject: z.string().max(100).optional(),
  gradeBand: z.string().max(50).optional(),
  topic: z.string().max(200).optional(),
  difficulty: z.number().min(1).max(10).optional(),
  curriculum: z.string().max(50).optional(),
  standardCode: z.string().max(50).optional(),
  stem: z.string().max(5000).optional(),
  stemLatex: z.string().max(5000).optional(),
  answerKey: z.string().max(5000).optional(),
  solutionSteps: z.string().max(10000).optional(),
  distractors: z.array(z.string()).max(10).optional(),
  questionType: z.string().max(30).optional(),
  tags: z.array(z.string()).max(20).optional(),
  estimatedTimeSec: z.number().min(5).max(3600).optional(),
  diagramSvg: z.string().max(50000).optional(),
  testPrepCategoryId: z.string().max(100).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Require auth
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await req.json();

    // Validate input with Zod — prevents arbitrary field injection
    const parsed = updateQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const existing = await db.questionItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // IDOR check: only the owner can update their own questions
    if (existing.tutorId && existing.tutorId !== auth.userId) {
      return NextResponse.json({ error: 'You do not have access to this question' }, { status: 403 });
    }

    const question = await db.questionItem.update({
      where: { id },
      data: {
        ...(data.subject && { subject: data.subject.toUpperCase() }),
        ...(data.gradeBand && { gradeBand: data.gradeBand }),
        ...(data.topic && { topic: data.topic }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.curriculum && { curriculum: data.curriculum.toUpperCase() }),
        ...(data.standardCode !== undefined && { standardCode: data.standardCode }),
        ...(data.stem && { stem: data.stem }),
        ...(data.stemLatex !== undefined && { stemLatex: data.stemLatex }),
        ...(data.answerKey && { answerKey: data.answerKey }),
        ...(data.solutionSteps !== undefined && { solutionSteps: data.solutionSteps }),
        ...(data.distractors !== undefined && { distractors: data.distractors }),
        ...(data.questionType && { questionType: data.questionType.toUpperCase() as QuestionType }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.estimatedTimeSec !== undefined && { estimatedTimeSec: data.estimatedTimeSec }),
        ...(data.diagramSvg !== undefined && { diagramSvg: data.diagramSvg }),
        ...(data.testPrepCategoryId !== undefined && { testPrepCategoryId: data.testPrepCategoryId }),
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
    // SECURITY: Require auth
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const existing = await db.questionItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // IDOR check: only the owner can delete their own questions
    if (existing.tutorId && existing.tutorId !== auth.userId) {
      return NextResponse.json({ error: 'You do not have access to this question' }, { status: 403 });
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
