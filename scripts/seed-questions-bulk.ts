// ============================================================
// Bulk Question Seeder — Seeds the QuestionItem table
// ============================================================
// Reads from the generated JSON and bulk-inserts into PostgreSQL.
// Usage: npx tsx scripts/seed-questions-bulk.ts
// ============================================================

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const BATCH_SIZE = 1000;

interface Question {
  id: string;
  subject: string;
  gradeBand: string;
  topic: string;
  difficulty: number;
  curriculum: string;
  standardCode: string;
  stem: string;
  stemLatex: string | null;
  diagramSvg: string | null;
  answerKey: string;
  solutionSteps: string;
  distractors: string | null;
  questionType: string;
  tags: string;
  estimatedTimeSec: number;
  isActive: boolean;
  creatorId: string | null;
}

interface Database {
  metadata: {
    totalQuestions: number;
    generatedAt: string;
    subjects: Record<string, number>;
    gradeBands: Record<string, number>;
  };
  questions: Question[];
}

async function main() {
  const db = new PrismaClient();

  const jsonPath = path.join(process.cwd(), 'download', 'k12-questions-database.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Database file not found: ${jsonPath}`);
    console.error('Run: python3 scripts/generate-questions.py');
    process.exit(1);
  }

  console.log('📖 Loading question database...');
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data: Database = JSON.parse(raw);
  const { questions, metadata } = data;

  console.log(`📋 Total questions: ${metadata.totalQuestions.toLocaleString()}`);
  console.log(`📊 Subjects: ${JSON.stringify(metadata.subjects)}`);
  console.log(`📈 Grade bands: ${JSON.stringify(metadata.gradeBands)}`);

  // Check existing count
  const existing = await db.questionItem.count();
  console.log(`📦 Existing questions in DB: ${existing.toLocaleString()}`);

  if (existing > 0) {
    console.log('⚠️  Questions already exist. Skipping seed to avoid duplicates.');
    console.log('   Run DELETE FROM "QuestionItem" first if you want to re-seed.');
    await db.$disconnect();
    return;
  }

  // Bulk insert in batches
  console.log(`\n🔄 Inserting ${questions.length.toLocaleString()} questions in batches of ${BATCH_SIZE}...`);

  let inserted = 0;
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);

    await db.questionItem.createMany({
      data: batch.map((q) => ({
        id: q.id,
        subject: q.subject as any,
        gradeBand: q.gradeBand,
        topic: q.topic,
        difficulty: q.difficulty,
        curriculum: q.curriculum,
        standardCode: q.standardCode,
        stem: q.stem,
        stemLatex: q.stemLatex,
        diagramSvg: q.diagramSvg,
        answerKey: q.answerKey,
        solutionSteps: q.solutionSteps,
        distractors: q.distractors,
        questionType: q.questionType as any,
        tags: q.tags,
        estimatedTimeSec: q.estimatedTimeSec,
        isActive: q.isActive,
        creatorId: q.creatorId,
      })),
      skipDuplicates: true,
    });

    inserted += batch.length;
    if (inserted % 10000 === 0 || inserted === questions.length) {
      console.log(`   ✅ ${inserted.toLocaleString()} / ${questions.length.toLocaleString()} inserted`);
    }
  }

  console.log(`\n🎉 Done! ${inserted.toLocaleString()} questions seeded successfully.`);

  await db.$disconnect();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
