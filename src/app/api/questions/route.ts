// ============================================================
// Question Bank API — GET/POST /api/questions
// ============================================================
// SECURITY FIX (AUDIT-CRIT-4): Added auth checks.
// GET requires auth (question bank is proprietary).
// POST requires auth (tutor-created questions).
// ============================================================
//
// NOTE: QuestionItem fields are: tutorId (nullable), type, subject,
// difficulty, question, options (Json), correctAnswer, explanation,
// tags (String[]). There are no gradeBand, topic, curriculum,
// standardCode, stem, stemLatex, diagramSvg, answerKey,
// solutionSteps, distractors, isActive, estimatedTimeSec, or
// testPrepCategoryId columns. `type` is a plain String (e.g.
// 'multiple_choice' | 'short_answer' | 'true_false'); `difficulty`
// is a String ('easy' | 'medium' | 'hard'), not an Int.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Require auth
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = req.nextUrl;
    const subject = searchParams.get('subject');
    const difficulty = searchParams.get('difficulty');
    const type = searchParams.get('type') || searchParams.get('questionType');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!subject) {
      return NextResponse.json(
        { error: 'subject parameter is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      subject: subject.toUpperCase(),
    };

    if (difficulty) where.difficulty = difficulty.toLowerCase();
    if (type) where.type = type.toLowerCase();

    if (search) {
      (where as Record<string, unknown[]>).OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { explanation: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [questions, total] = await Promise.all([
      db.questionItem.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, tutorId: true, type: true, subject: true, difficulty: true,
          question: true, options: true, correctAnswer: true, explanation: true,
          tags: true, createdAt: true, updatedAt: true,
        },
      }),
      db.questionItem.count({ where }),
    ]);

    return NextResponse.json({ questions, total, limit, offset });
  } catch (error) {
    console.error('[API /questions] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Require auth
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    // Rate limit: 20 creates per minute
    const { allowed } = rateLimit(`questions:create:${auth.userId}`, 20, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    const body = await req.json();
    const {
      subject, difficulty, type,
      question, options, correctAnswer, explanation, tags,
    } = body ?? {};

    if (!subject || !question) {
      return NextResponse.json(
        { error: 'subject and question are required' },
        { status: 400 },
      );
    }

    const created = await db.questionItem.create({
      data: {
        tutorId: auth.userId,
        subject: String(subject).toUpperCase(),
        difficulty: difficulty ? String(difficulty).toLowerCase() : 'medium',
        type: type ? String(type).toLowerCase() : 'multiple_choice',
        question: String(question),
        options: options ?? null,
        correctAnswer: correctAnswer ?? null,
        explanation: explanation ?? null,
        tags: Array.isArray(tags) ? tags : [],
      },
    });

    return NextResponse.json({ question: created }, { status: 201 });
  } catch (error) {
    console.error('[API /questions POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
