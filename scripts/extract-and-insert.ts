// ============================================================
// Question Extractor & DB Inserter
// ============================================================
// Reads crawled JSON files from /tmp/, extracts questions
// using smart patterns, and bulk-inserts into Supabase.
// ============================================================

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Uses DATABASE_URL env var. Set it in .env.local or your environment.
const DB_URL = process.env.DATABASE_URL;

interface ExtractedQuestion {
  subject: string;
  gradeBand: string;
  topic: string;
  difficulty: number;
  stem: string;
  answerKey: string;
  distractors: string | null;
  questionType: string;
  tags: string;
  estimatedTimeSec: number;
  source: string;
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\{[^}]*\}/g, '')  // CSS rules
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// Extractors for different content types
// ============================================================

function extractTriviaQuestions(text: string, subject: string, gradeBand: string, topic: string, source: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  
  // Pattern: "1. Question text? Answer: answer" or "Q1. ...? A. ..."
  const blocks = text.split(/(?:^|\n)\s*\d+[\.\)]\s*/);
  
  for (const block of blocks) {
    const trimmed = block.trim();
    if (trimmed.length < 15 || trimmed.length > 2000) continue;
    
    // Split question from answer
    const parts = trimmed.split(/\s*(?:Answer|A\.?|Ans|Solution)\s*[:]\s*/i);
    const stem = parts[0].trim();
    const answer = parts[1]?.trim().split(/\n/)[0].trim() || 'See source';
    
    if (stem.length > 10) {
      questions.push({
        subject,
        gradeBand,
        topic,
        difficulty: gradeBand === 'K-2' ? 1 : gradeBand === '3-5' ? 2 : 3,
        stem: stem.substring(0, 2000),
        answerKey: answer.substring(0, 500),
        distractors: null,
        questionType: stem.includes('?') ? 'SHORT_ANSWER' : 'FILL_IN_BLANK',
        tags: `crawled,${topic.toLowerCase().replace(/\s+/g, '-')},${subject.toLowerCase()},trivia`,
        estimatedTimeSec: 30,
        source,
      });
    }
  }
  
  return questions;
}

function extractMCQQuestions(text: string, subject: string, gradeBand: string, topic: string, difficulty: number, source: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  
  // Pattern: "1. Question stem" followed by A) B) C) D) choices, then answer
  // Common in practice tests
  const questionBlocks = text.match(/(?:^|\n)\s*\d+\.\s+[^?\n]+\?[^A]*?(?:A\)\s*[^BCD]+B\)\s*[^CD]+C\)\s*[^D]+D\)\s*[^\n]+)?(?:\s*(?:Answer|Correct|Explanation)\s*[:]\s*[^\n]+)?/gi) || [];
  
  // Also try: numbered items with question marks
  const simpleQs = text.match(/(?:^|\n)\s*\d+\.\s+[^\n]+\?/gi) || [];
  
  // Combine unique questions
  const seen = new Set<string>();
  
  for (const q of [...questionBlocks, ...simpleQs]) {
    const cleaned = q.trim().replace(/\s+/g, ' ');
    const key = cleaned.substring(0, 80);
    if (seen.has(key) || cleaned.length < 15) continue;
    seen.add(key);
    
    // Extract answer if present
    const answerMatch = cleaned.match(/(?:Answer|Correct|Solution)\s*[:]\s*([^\n]+)/i);
    const answer = answerMatch?.[1]?.trim() || 'See explanation';
    
    // Extract distractors if present
    const choiceMatches = cleaned.match(/[A-D]\)\s*([^)\n]+)/g);
    let distractors: string | null = null;
    let questionType = 'OPEN';
    
    if (choiceMatches && choiceMatches.length >= 2) {
      const choices = choiceMatches.map(c => c.replace(/^[A-D]\)\s*/, '').trim());
      distractors = JSON.stringify(choices);
      questionType = 'MCQ';
    }
    
    // Extract just the stem (before choices)
    const stemParts = cleaned.split(/[A-D]\)\s/);
    const stem = stemParts[0].replace(/\d+\.\s*/, '').replace(/(?:Answer|Correct|Solution)\s*[:].*/i, '').trim();
    
    if (stem.length > 10) {
      questions.push({
        subject,
        gradeBand,
        topic,
        difficulty,
        stem: stem.substring(0, 2000),
        answerKey: answer.substring(0, 500),
        distractors,
        questionType,
        tags: `crawled,${topic.toLowerCase().replace(/\s+/g, '-')},${subject.toLowerCase()},practice-test`,
        estimatedTimeSec: 60 + difficulty * 30,
        source,
      });
    }
  }
  
  return questions;
}

function extractReadingComprehension(text: string, subject: string, gradeBand: string, topic: string, source: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  
  // Reading comp questions typically follow passages
  // Look for question patterns after passage text
  const passagePattern = /(?:Passage|Read|Story|Text)\s*\d*\s*[:\s]([\s\S]{100,3000}?)(?=\d+\.\s)/gi;
  const questionPattern = /\d+\.\s+([^?\n]{20,300}\?)/g;
  
  const allQuestions = text.match(questionPattern) || [];
  
  for (const q of allQuestions) {
    const stem = q.replace(/^\d+\.\s*/, '').trim();
    if (stem.length > 10) {
      questions.push({
        subject,
        gradeBand,
        topic,
        difficulty: gradeBand === 'K-2' ? 1 : 2,
        stem: stem.substring(0, 2000),
        answerKey: 'Refer to passage',
        distractors: null,
        questionType: 'OPEN',
        tags: `crawled,reading-comprehension,${subject.toLowerCase()}`,
        estimatedTimeSec: 120,
        source,
      });
    }
  }
  
  return questions;
}

function extractMathProblems(text: string, subject: string, gradeBand: string, topic: string, difficulty: number, source: string): ExtractedQuestion[] {
  const questions: ExtractedQuestion[] = [];
  
  // Math problems: "Evaluate...", "Find...", "Solve...", "Calculate..."
  const mathPattern = /(?:Evaluate|Find|Determine|Solve|Calculate|Compute|Simplify|Differentiate|Integrate|Prove|Show|Sketch|Graph|Express|Factor|Expand|Divide|Multiply|Add|Subtract|Convert|Round|Estimate|Compare|Classify|Identify|Name|List|Complete|Write|Simplify)\s+[^.\n]{10,300}(?:[.?]|\n)/gi;
  
  const matches = text.match(mathPattern) || [];
  const seen = new Set<string>();
  
  for (const m of matches) {
    const cleaned = m.trim();
    const key = cleaned.substring(0, 60);
    if (seen.has(key) || cleaned.length < 15) continue;
    seen.add(key);
    
    questions.push({
      subject,
      gradeBand,
      topic,
      difficulty,
      stem: cleaned.substring(0, 2000),
      answerKey: 'Show your work',
      distractors: null,
      questionType: 'OPEN',
      tags: `crawled,${topic.toLowerCase().replace(/\s+/g, '-')},${subject.toLowerCase()},math-problem`,
      estimatedTimeSec: 90 + difficulty * 30,
      source,
    });
  }
  
  return questions;
}

// ============================================================
// Source-specific extraction rules
// ============================================================

interface SourceRule {
  filePattern: string;
  subject: string;
  gradeBand: string;
  topic: string;
  difficulty: number;
  extractor: 'trivia' | 'mcq' | 'reading' | 'math';
}

const SOURCE_RULES: SourceRule[] = [
  // Trivia/quiz pages
  { filePattern: 'whosmarted.com_science', subject: 'SCIENCE', gradeBand: 'K-2', topic: 'Science Trivia', difficulty: 1, extractor: 'trivia' },
  { filePattern: 'whosmarted.com_history', subject: 'GENERAL', gradeBand: '3-5', topic: 'US History Trivia', difficulty: 2, extractor: 'trivia' },
  { filePattern: 'mentimeter', subject: 'GENERAL', gradeBand: '6-8', topic: 'World Geography', difficulty: 3, extractor: 'trivia' },
  
  // High School Test Prep practice tests
  { filePattern: 'ap_biology_practice-test', subject: 'SCIENCE', gradeBand: '9-12', topic: 'AP Biology', difficulty: 5, extractor: 'mcq' },
  { filePattern: 'ap_us-history_practice-test', subject: 'GENERAL', gradeBand: '9-12', topic: 'AP US History', difficulty: 5, extractor: 'mcq' },
  { filePattern: 'ap_english-language_practice', subject: 'LANGUAGE', gradeBand: '9-12', topic: 'AP English Language', difficulty: 5, extractor: 'mcq' },
  { filePattern: 'ap_english-literature_practice', subject: 'LANGUAGE', gradeBand: '9-12', topic: 'AP English Literature', difficulty: 5, extractor: 'mcq' },
  { filePattern: 'sat_reading_practice-test', subject: 'LANGUAGE', gradeBand: '9-12', topic: 'SAT Reading', difficulty: 4, extractor: 'mcq' },
  { filePattern: 'act_reading_practice-test', subject: 'LANGUAGE', gradeBand: '9-12', topic: 'ACT Reading', difficulty: 4, extractor: 'mcq' },
  
  // English For Everyone
  { filePattern: 'englishforeveryone', subject: 'LANGUAGE', gradeBand: '3-5', topic: 'Reading Comprehension', difficulty: 2, extractor: 'reading' },
  
  // Paul's Calculus
  { filePattern: 'calc.json', subject: 'MATH', gradeBand: '9-12', topic: 'Calculus I', difficulty: 5, extractor: 'math' },
  
  // Round 2: More practice tests
  { filePattern: 'sat_math_practice', subject: 'MATH', gradeBand: '9-12', topic: 'SAT Math', difficulty: 4, extractor: 'mcq' },
  { filePattern: 'act_math_practice', subject: 'MATH', gradeBand: '9-12', topic: 'ACT Math', difficulty: 4, extractor: 'mcq' },
  { filePattern: 'act_science_practice', subject: 'SCIENCE', gradeBand: '9-12', topic: 'ACT Science', difficulty: 4, extractor: 'mcq' },
  
  // Round 4: Geography, civics, test prep sites
  { filePattern: 'geography-trivia', subject: 'GENERAL', gradeBand: '6-8', topic: 'World Geography', difficulty: 3, extractor: 'trivia' },
  { filePattern: 'geography-quiz', subject: 'GENERAL', gradeBand: '6-8', topic: 'World Geography', difficulty: 3, extractor: 'trivia' },
  { filePattern: 'princetonreview', subject: 'MATH', gradeBand: '9-12', topic: 'SAT/ACT Practice', difficulty: 4, extractor: 'mcq' },
  { filePattern: 'mometrix', subject: 'MATH', gradeBand: '9-12', topic: 'SAT/ACT Practice', difficulty: 4, extractor: 'mcq' },
  { filePattern: 'Literature-Test', subject: 'LANGUAGE', gradeBand: '9-12', topic: 'English Literature', difficulty: 4, extractor: 'mcq' },
];

// ============================================================
// Main Processing
// ============================================================

async function main() {
  console.log('=== Question Extractor & DB Inserter ===\n');
  
  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  
  await client.connect();
  console.log('Connected to Supabase\n');
  
  // Get all crawled files
  const tmpDir = '/tmp';
  const crawlFiles = fs.readdirSync(tmpDir)
    .filter(f => f.match(/^crawl[234]-/) && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(tmpDir, f),
      mtime: fs.statSync(path.join(tmpDir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime); // newest first
  
  console.log(`Found ${crawlFiles.length} crawled files\n`);
  
  let totalExtracted = 0;
  let totalInserted = 0;
  
  for (const file of crawlFiles) {
    try {
      const raw = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
      const html = raw?.data?.html || raw?.html || '';
      const title = raw?.data?.title || raw?.title || '';
      const source = raw?.data?.url || raw?.url || file.name;
      
      if (html.length < 100 || html.includes('Just a moment') || html.includes('403 Forbidden')) {
        continue;
      }
      
      const text = cleanHtml(html);
      
      // Find matching source rule
      const rule = SOURCE_RULES.find(r => file.name.includes(r.filePattern));
      
      let questions: ExtractedQuestion[] = [];
      
      if (rule) {
        switch (rule.extractor) {
          case 'trivia':
            questions = extractTriviaQuestions(text, rule.subject, rule.gradeBand, rule.topic, source);
            break;
          case 'mcq':
            questions = extractMCQQuestions(text, rule.subject, rule.gradeBand, rule.topic, rule.difficulty, source);
            break;
          case 'reading':
            questions = extractReadingComprehension(text, rule.subject, rule.gradeBand, rule.topic, source);
            break;
          case 'math':
            questions = extractMathProblems(text, rule.subject, rule.gradeBand, rule.topic, rule.difficulty, source);
            break;
        }
      }
      
      // If no rule matched, try generic extraction
      if (questions.length === 0) {
        // Try generic question extraction
        const genericQs = text.match(/\d+\.\s+[^?\n]{20,300}\?/gi) || [];
        if (genericQs.length > 3) {
          for (const q of genericQs) {
            const stem = q.replace(/^\d+\.\s*/, '').trim();
            questions.push({
              subject: 'GENERAL',
              gradeBand: '3-5',
              topic: 'General Knowledge',
              difficulty: 2,
              stem: stem.substring(0, 2000),
              answerKey: 'See source',
              distractors: null,
              questionType: 'OPEN',
              tags: `crawled,general-knowledge`,
              estimatedTimeSec: 60,
              source,
            });
          }
        }
      }
      
      if (questions.length > 0) {
        console.log(`${file.name.substring(0, 50)}`);
        console.log(`  Title: ${title}`);
        console.log(`  Extracted: ${questions.length} questions`);
        
        // Insert into DB
        const BATCH_SIZE = 100;
        let inserted = 0;
        
        for (let i = 0; i < questions.length; i += BATCH_SIZE) {
          const batch = questions.slice(i, i + BATCH_SIZE);
          const values = batch.map(q => {
            const stem = q.stem.replace(/'/g, "''").substring(0, 5000);
            const answer = q.answerKey.replace(/'/g, "''").substring(0, 2000);
            const tags = q.tags.replace(/'/g, "''");
            const distractors = q.distractors ? `'${q.distractors.replace(/'/g, "''")}'` : 'NULL';
            return `('${q.subject}','${q.gradeBand}','${q.topic.replace(/'/g, "''")}',${q.difficulty},NULL,NULL,'${stem}',NULL,NULL,'${answer}',NULL,${distractors},'${q.questionType}','${tags}',${q.estimatedTimeSec},NULL,true,NOW(),NOW())`;
          });
          
          try {
            const sql = `INSERT INTO "QuestionItem" ("subject","gradeBand","topic","difficulty","curriculum","standardCode","stem","stemLatex","diagramSvg","answerKey","solutionSteps","distractors","questionType","tags","estimatedTimeSec","creatorId","isActive","createdAt","updatedAt") VALUES ${values.join(',')} ON CONFLICT DO NOTHING;`;
            const result = await client.query(sql);
            inserted += result.rowCount || 0;
          } catch (err: any) {
            console.log(`  ⚠ Batch error: ${err.message?.substring(0, 60)}`);
          }
        }
        
        console.log(`  Inserted: ${inserted}`);
        totalInserted += inserted;
      }
      
      totalExtracted += questions.length;
      
    } catch (err: any) {
      console.log(`  ✗ Error processing ${file.name}: ${err.message?.substring(0, 60)}`);
    }
  }
  
  // Summary
  console.log('\n=== Extraction Summary ===');
  console.log(`Total extracted: ${totalExtracted}`);
  console.log(`Total inserted: ${totalInserted}`);
  
  // DB counts
  const total = await client.query('SELECT count(*) FROM "QuestionItem"');
  console.log(`\nTotal questions in DB: ${total.rows[0].count}`);
  
  const bySubject = await client.query('SELECT "subject", count(*) as cnt FROM "QuestionItem" GROUP BY "subject" ORDER BY cnt DESC');
  console.log('\nBy Subject:');
  for (const row of bySubject.rows) console.log(`  ${row.subject}: ${row.cnt}`);
  
  const byGrade = await client.query('SELECT "gradeBand", count(*) as cnt FROM "QuestionItem" GROUP BY "gradeBand" ORDER BY cnt DESC');
  console.log('\nBy Grade Band:');
  for (const row of byGrade.rows) console.log(`  ${row.gradeBand}: ${row.cnt}`);
  
  const byType = await client.query('SELECT "questionType", count(*) as cnt FROM "QuestionItem" GROUP BY "questionType" ORDER BY cnt DESC');
  console.log('\nBy Type:');
  for (const row of byType.rows) console.log(`  ${row.questionType}: ${row.cnt}`);
  
  await client.end();
  console.log('\n✅ Done!');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
