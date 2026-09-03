// ============================================================
// Question API — PUT/DELETE /api/questions/[id]
// ============================================================
// SECURITY FIX (AUDIT-CRIT-5): Added auth checks.
// PUT requires auth to update questions.
// DELETE requires auth to soft-delete questions.
// ============================================================
//
// NOTE: QuestionItem fields are: tutorId, type, subject, difficulty,
// question, options (Json), correctAnswer, explanation, tags.
// There is no `isActive` column to soft-delete; we hard-delete
// instead. The update schema only validates real fields.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateQuestionSchema = z.object({
  subject: z.string().max(100).optional(),
  difficulty: z.string().max(50).optional(),
  type: z.string().max(50).optional(),
  question: z.string().max(10000).optional(),
  options: z.any().optional(),
  correctAnswer: z.string().max(10000).optional().nullable(),
  explanation: z.string().max(10000).optional().nullable(),
  tags: z.array(z.string()).max(50).optional(),
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

    // Build update payload with only schema-valid fields
    const updateData: Record<string, unknown> = {};
    if (data.subject !== undefined) updateData.subject = data.subject.toUpperCase();
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty.toLowerCase();
    if (data.type !== undefined) updateData.type = data.type.toLowerCase();
    if (data.question !== undefined) updateData.question = data.question;
    if (data.options !== undefined) updateData.options = data.options;
    if (data.correctAnswer !== undefined) updateData.correctAnswer = data.correctAnswer;
    if (data.explanation !== undefined) updateData.explanation = data.explanation;
    if (data.tags !== undefined) updateData.tags = data.tags;

    const question = await db.questionItem.update({
      where: { id },
      data: updateData,
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

    // Hard delete — schema has no `isActive` flag to soft-delete.
    await db.questionItem.delete({ where: { id } });

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error('[API /questions DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
