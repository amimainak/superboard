// ============================================================
// Question Bank API — GET/POST /api/questions
// ============================================================
// GET: Fetches pre-built, standards-tagged questions with filters.
// POST: Creates a new question (tutor-created).
//
// GET Query params:
//   subject (required): MATH, SCIENCE, LANGUAGE, etc.
//   gradeBand (optional): K-2, 3-5, 6-8, 9-12
//   topic (optional): e.g., "Quadratic Equations"
//   difficulty (optional): 1-5
//   curriculum (optional): CCSS, NGSS, IB, etc.
//   questionType (optional): MCQ, OPEN, TRUE_FALSE, etc.
//   testType (optional): SAT, ACT, AP — filters by test prep category
//   search (optional): full-text search in stem and topic
//   limit (optional): default 20, max 100
//   offset (optional): default 0
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { QuestionType } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
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
          testPrepCategory: {
            select: { id: true, name: true, testType: true },
          },
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

// ============================================================
// POST — Create a new question (tutor-created)
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      subject,
      gradeBand,
      topic,
      difficulty,
      curriculum,
      standardCode,
      stem,
      stemLatex,
      answerKey,
      solutionSteps,
      distractors,
      questionType,
      tags,
      estimatedTimeSec,
      diagramSvg,
      testPrepCategoryId,
    } = body as {
      subject: string;
      gradeBand: string;
      topic: string;
      difficulty: number;
      curriculum?: string;
      standardCode?: string;
      stem: string;
      stemLatex?: string;
      answerKey: string;
      solutionSteps?: string;
      distractors?: string;
      questionType?: string;
      tags?: string;
      estimatedTimeSec?: number;
      diagramSvg?: string;
      testPrepCategoryId?: string;
    };

    // Validate required fields
    if (!subject || !gradeBand || !topic || !stem || !answerKey) {
      return NextResponse.json(
        { error: 'subject, gradeBand, topic, stem, and answerKey are required' },
        { status: 400 }
      );
    }

    if (difficulty < 1 || difficulty > 5) {
      return NextResponse.json(
        { error: 'difficulty must be between 1 and 5' },
        { status: 400 }
      );
    }

    const question = await db.questionItem.create({
      data: {
        subject: subject.toUpperCase(),
        gradeBand,
        topic,
        difficulty,
        curriculum: curriculum?.toUpperCase(),
        standardCode,
        stem,
        stemLatex,
        answerKey,
        solutionSteps,
        distractors,
        questionType: (questionType?.toUpperCase() || 'OPEN') as QuestionType,
        tags,
        estimatedTimeSec,
        diagramSvg,
        testPrepCategoryId,
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('[API /questions POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
