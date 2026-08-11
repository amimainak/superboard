// ============================================================
// Question Bank API — GET /api/questions
// ============================================================
// Fetches pre-built, standards-tagged questions.
// Query params:
//   subject (required): MATH, SCIENCE, LANGUAGE, etc.
//   gradeBand (optional): K-2, 3-5, 6-8, 9-12
//   topic (optional): e.g., "Quadratic Equations"
//   difficulty (optional): 1-5
//   curriculum (optional): CCSS, NGSS, IB, etc.
//   limit (optional): default 20, max 50
//   offset (optional): default 0
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const subject = searchParams.get('subject');
    const gradeBand = searchParams.get('gradeBand');
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const curriculum = searchParams.get('curriculum');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
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

    const [questions, total] = await Promise.all([
      db.questionItem.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { difficulty: 'asc' },
        select: {
          id: true,
          subject: true,
          gradeBand: true,
          topic: true,
          difficulty: true,
          curriculum: true,
          standardCode: true,
          stem: true,
          stemLatex: true,
          diagramSvg: true,
          answerKey: true,
          solutionSteps: true,
          distractors: true,
          questionType: true,
          tags: true,
          estimatedTimeSec: true,
        },
      }),
      db.questionItem.count({ where }),
    ]);

    return NextResponse.json({
      questions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API /questions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
