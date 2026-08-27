// ============================================================
// Question Bank API — GET/POST /api/questions
// ============================================================
// SECURITY FIX (AUDIT-CRIT-4): Added auth checks.
// GET requires auth (question bank is proprietary).
// POST requires auth (tutor-created questions).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { QuestionType } from '@prisma/client';
import { requireAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Require auth
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = req.nextUrl;
    const subject = searchParams.get('subject');
    const gradeBand = searchParams.get('gradeBand');
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const curriculum = searchParams.get('curriculum');
    const questionType = searchParams.get('questionType');
    const testType = searchParams.get('testType');
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
      isActive: true,
    };

    if (gradeBand) where.gradeBand = gradeBand;
    if (topic) where.topic = { contains: topic, mode: 'insensitive' } as Record<string, unknown>;
    if (difficulty) where.difficulty = parseInt(difficulty, 10);
    if (curriculum) where.curriculum = curriculum.toUpperCase();
    if (questionType) where.questionType = questionType.toUpperCase() as QuestionType;
    if (search) {
      (where as Record<string, unknown[]>).OR = [
        { stem: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (testType) {
      where.testPrepCategory = { testType: testType.toUpperCase() };
    }

    const [questions, total] = await Promise.all([
      db.questionItem.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { difficulty: 'asc' },
        select: {
          id: true, subject: true, gradeBand: true, topic: true, difficulty: true,
          curriculum: true, standardCode: true, stem: true, stemLatex: true,
          diagramSvg: true, answerKey: true, solutionSteps: true, distractors: true,
          questionType: true, tags: true, estimatedTimeSec: true,
          testPrepCategory: { select: { id: true, name: true, testType: true } },
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
      subject, gradeBand, topic, difficulty, curriculum, standardCode,
      stem, stemLatex, answerKey, solutionSteps, distractors,
      questionType, tags, estimatedTimeSec, diagramSvg, testPrepCategoryId,
    } = body;

    if (!subject || !gradeBand || !topic || !stem || !answerKey) {
      return NextResponse.json(
        { error: 'subject, gradeBand, topic, stem, and answerKey are required' },
        { status: 400 },
      );
    }

    if (typeof difficulty !== 'number' || difficulty < 1 || difficulty > 5) {
      return NextResponse.json(
        { error: 'difficulty must be a number between 1 and 5' },
        { status: 400 },
      );
    }

    const question = await db.questionItem.create({
      data: {
        subject: subject.toUpperCase(),
        gradeBand, topic, difficulty,
        curriculum: curriculum?.toUpperCase(),
        standardCode, stem, stemLatex, answerKey, solutionSteps,
        distractors, questionType: (questionType?.toUpperCase() || 'OPEN') as QuestionType,
        tags, estimatedTimeSec, diagramSvg, testPrepCategoryId,
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('[API /questions POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
