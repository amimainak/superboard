// ============================================================
// Web Crawler — Real K-12 Question Bank Builder
// ============================================================
// Crawls publicly available educational websites, extracts
// questions, categorizes by subject/grade/difficulty, and
// bulk-inserts into Supabase PostgreSQL via pg driver.
//
// Usage: DATABASE_URL="..." npx tsx scripts/crawl-questions.ts
// ============================================================

import { Client } from 'pg';

// ============================================================
// Types
// ============================================================

interface CrawledQuestion {
  subject: string;
  gradeBand: string;
  topic: string;
  difficulty: number;
  curriculum?: string;
  standardCode?: string;
  stem: string;
  answerKey: string;
  solutionSteps?: string;
  distractors?: string;
  questionType: string;
  tags: string;
  estimatedTimeSec?: number;
  source: string;
}

interface CrawlSource {
  url: string;
  subject: string;
  gradeBand: string;
  topic: string;
  difficulty: number;
  parser: 'html' | 'text';
  label: string;
}

// ============================================================
// Source List — High-value, free, publicly accessible question banks
// ============================================================

const CRAWL_SOURCES: CrawlSource[] = [
  // === MATH ===
  // K5 Learning - Grade-specific math
  { url: 'https://www.k5learning.com/free-math-worksheets', subject: 'MATH', gradeBand: 'K-2', topic: 'Arithmetic', difficulty: 1, parser: 'html', label: 'K5Learning-K2' },
  { url: 'https://www.k5learning.com/free-math-worksheets/third-grade-3/word-problems-mixed', subject: 'MATH', gradeBand: '3-5', topic: 'Word Problems', difficulty: 3, parser: 'html', label: 'K5Learning-3rd' },
  
  // Common Core Sheets
  { url: 'https://www.commoncoresheets.com/multistep-problem-worksheets/sbh/two-step-problems', subject: 'MATH', gradeBand: '3-5', topic: 'Multi-Step Problems', difficulty: 3, parser: 'html', label: 'CCS-MultiStep' },
  { url: 'https://www.commoncoresheets.com/multiplication-worksheets/sbh/word-problems', subject: 'MATH', gradeBand: '3-5', topic: 'Multiplication', difficulty: 3, parser: 'html', label: 'CCS-Mult' },
  
  // Paul's Online Math Notes - Calculus
  { url: 'https://tutorial.math.lamar.edu/problems/calci/calci.aspx', subject: 'MATH', gradeBand: '9-12', topic: 'Calculus', difficulty: 5, parser: 'html', label: 'PaulsCalc' },
  
  // AnalyzeMath High School
  { url: 'https://www.analyzemath.com/high_school_math/index.html', subject: 'MATH', gradeBand: '9-12', topic: 'Algebra', difficulty: 4, parser: 'html', label: 'AnalyzeMath' },
  
  // Varsity Tutors SAT Math
  { url: 'https://www.varsitytutors.com/practice/subjects/prealgebra/practice', subject: 'MATH', gradeBand: '6-8', topic: 'Pre-Algebra', difficulty: 3, parser: 'html', label: 'VT-PreAlg' },
  
  // === SCIENCE ===
  // K5 Learning Science
  { url: 'https://www.k5learning.com/science-worksheets', subject: 'SCIENCE', gradeBand: 'K-2', topic: 'General Science', difficulty: 1, parser: 'html', label: 'K5Sci' },
  
  // NewPath Worksheets
  { url: 'https://newpathworksheets.com/science', subject: 'SCIENCE', gradeBand: '3-5', topic: 'Life Science', difficulty: 2, parser: 'html', label: 'NewPath' },
  
  // HelpTeaching Science
  { url: 'https://www.helpteaching.com/free-elementary-science-worksheets.htm', subject: 'SCIENCE', gradeBand: '3-5', topic: 'Physical Science', difficulty: 2, parser: 'html', label: 'HelpTeachSci' },
  
  // DOE Science Bowl Middle School
  { url: 'https://science.osti.gov/wdts/nsb/Regional-Competitions/Resources/MS-Sample-Questions', subject: 'SCIENCE', gradeBand: '6-8', topic: 'General Science', difficulty: 4, parser: 'html', label: 'DOE-NSB-MS' },
  
  // DOE Science Bowl High School
  { url: 'https://science.osti.gov/wdts/nsb/Regional-Competitions/Resources/HS-Sample-Questions', subject: 'SCIENCE', gradeBand: '9-12', topic: 'General Science', difficulty: 5, parser: 'html', label: 'DOE-NSB-HS' },
  
  // === ELA / READING ===
  // K5 Learning Reading
  { url: 'https://www.k5learning.com/reading-comprehension-worksheets', subject: 'LANGUAGE', gradeBand: '3-5', topic: 'Reading Comprehension', difficulty: 2, parser: 'html', label: 'K5-Read' },
  
  // ReadWorks
  { url: 'https://www.readworks.org/reading-comprehension-passages-and-question-sets', subject: 'LANGUAGE', gradeBand: '3-5', topic: 'Reading Comprehension', difficulty: 3, parser: 'html', label: 'ReadWorks' },
  
  // English For Everyone
  { url: 'https://englishforeveryone.org/Topics/Reading-Comprehension.html', subject: 'LANGUAGE', gradeBand: '6-8', topic: 'Reading Comprehension', difficulty: 3, parser: 'html', label: 'EFE-Read' },
  
  // K12Reader
  { url: 'https://www.k12reader.com/reading-worksheets-by-main-subject', subject: 'LANGUAGE', gradeBand: '3-5', topic: 'Reading', difficulty: 2, parser: 'html', label: 'K12Reader' },
  
  // eReading Worksheets Grammar
  { url: 'https://www.ereadingworksheets.com/languageartsworksheets/parts-of-speech-worksheets', subject: 'LANGUAGE', gradeBand: '6-8', topic: 'Grammar', difficulty: 3, parser: 'html', label: 'eRead-Grammar' },
  
  // === SOCIAL STUDIES ===
  // USCIS Civics
  { url: 'https://www.uscis.gov/sites/default/files/document/questions-and-answers/OoC_100_Questions_2008_Civics_Test_Large_V1_0.pdf', subject: 'GENERAL', gradeBand: '6-8', topic: 'Civics', difficulty: 3, parser: 'text', label: 'USCIS-Civics' },
  
  // PBS History Quiz
  { url: 'https://www.pbs.org/a-capitol-fourth/history/history-quiz', subject: 'GENERAL', gradeBand: '3-5', topic: 'US History', difficulty: 2, parser: 'html', label: 'PBS-Hist' },
  
  // Geography Trivia
  { url: 'https://www.mentimeter.com/blog/education/best-geography-quizzes-and-trivia-questions', subject: 'GENERAL', gradeBand: '6-8', topic: 'Geography', difficulty: 3, parser: 'html', label: 'Menti-Geo' },
  
  // === TEST PREP ===
  // SAT Official
  { url: 'https://satsuite.collegeboard.org/practice/practice-tests/paper', subject: 'MATH', gradeBand: '9-12', topic: 'SAT Math', difficulty: 4, parser: 'html', label: 'SAT-Official' },
  
  // Mometrix SAT Math
  { url: 'https://www.mometrix.com/academy/sat-math-practice-test', subject: 'MATH', gradeBand: '9-12', topic: 'SAT Math', difficulty: 4, parser: 'html', label: 'Mom-SAT' },
  
  // Mometrix ACT Science
  { url: 'https://www.mometrix.com/academy/act-science-practice-test', subject: 'SCIENCE', gradeBand: '9-12', topic: 'ACT Science', difficulty: 4, parser: 'html', label: 'Mom-ACT-Sci' },
  
  // ACT Official Sample
  { url: 'https://www.act.org/content/act/en/products-and-services/the-act/test-preparation/free-act-test-prep/act-online-test-sample-questions.html', subject: 'LANGUAGE', gradeBand: '9-12', topic: 'ACT English', difficulty: 4, parser: 'html', label: 'ACT-Official' },
  
  // Mometrix ACT Reading
  { url: 'https://www.mometrix.com/academy/act-reading-practice-test', subject: 'LANGUAGE', gradeBand: '9-12', topic: 'ACT Reading', difficulty: 4, parser: 'html', label: 'Mom-ACT-Read' },
  
  // AP Calculus AB Practice
  { url: 'https://highschooltestprep.com/ap/calculus-ab', subject: 'MATH', gradeBand: '9-12', topic: 'AP Calculus AB', difficulty: 5, parser: 'html', label: 'HSTP-APCalc' },
  
  // AP Biology Practice
  { url: 'https://highschooltestprep.com/ap/biology', subject: 'SCIENCE', gradeBand: '9-12', topic: 'AP Biology', difficulty: 5, parser: 'html', label: 'HSTP-APBio' },
  
  // AP US History
  { url: 'https://highschooltestprep.com/ap/us-history', subject: 'GENERAL', gradeBand: '9-12', topic: 'AP US History', difficulty: 5, parser: 'html', label: 'HSTP-APUSH' },
  
  // AP English Language
  { url: 'https://highschooltestprep.com/ap/english-language', subject: 'LANGUAGE', gradeBand: '9-12', topic: 'AP English Language', difficulty: 5, parser: 'html', label: 'HSTP-APEng' },
  
  // AP Physics 1
  { url: 'https://highschooltestprep.com/ap/physics-1-algebra-based', subject: 'SCIENCE', gradeBand: '9-12', topic: 'AP Physics 1', difficulty: 5, parser: 'html', label: 'HSTP-APPhys' },
  
  // Sanfoundry AP Biology (1000+ Qs)
  { url: 'https://www.sanfoundry.com/ap-biology-1000-practice-questions-with-answers', subject: 'SCIENCE', gradeBand: '9-12', topic: 'AP Biology', difficulty: 5, parser: 'html', label: 'Sanfoundry-APBio' },
  
  // ESL Fast
  { url: 'https://www.eslfast.com', subject: 'ESL', gradeBand: '3-5', topic: 'Reading', difficulty: 2, parser: 'html', label: 'ESLFast' },
  
  // === STATE TESTS ===
  // STAAR Released
  { url: 'https://tea.texas.gov/data-reports/staar/staar-released-test-questions', subject: 'MATH', gradeBand: '3-5', topic: 'STAAR Math', difficulty: 3, parser: 'html', label: 'TEA-STAAR' },
  
  // NY Regents Math
  { url: 'https://www.nysedregents.org/regents_math.html', subject: 'MATH', gradeBand: '9-12', topic: 'Regents Math', difficulty: 4, parser: 'html', label: 'NYSED-Regents' },
  
  // NY Regents Science
  { url: 'https://www.nysedregents.org/ei/ei-science.html', subject: 'SCIENCE', gradeBand: '3-8', topic: 'Regents Science', difficulty: 3, parser: 'html', label: 'NYSED-SciReg' },
  
  // Lumos Learning
  { url: 'https://www.lumoslearning.com/llwp/resources/common-core-parcc-math-english-worksheets.html', subject: 'MATH', gradeBand: '3-5', topic: 'Common Core', difficulty: 3, parser: 'html', label: 'Lumos-CCSS' },
  
  // Education Quizzes Middle School
  { url: 'https://www.educationquizzes.com/us/middle-school-6th-7th-and-8th-grade/math', subject: 'MATH', gradeBand: '6-8', topic: 'Middle School Math', difficulty: 3, parser: 'html', label: 'EduQuiz-MSMath' },
  
  { url: 'https://www.educationquizzes.com/us/middle-school-6th-7th-and-8th-grade/science', subject: 'SCIENCE', gradeBand: '6-8', topic: 'Middle School Science', difficulty: 3, parser: 'html', label: 'EduQuiz-MSSci' },
  
  // Super Teacher Worksheets
  { url: 'https://www.superteacherworksheets.com/comprehension.html', subject: 'LANGUAGE', gradeBand: '3-5', topic: 'Reading Comprehension', difficulty: 2, parser: 'html', label: 'STW-Compreh' },
  
  { url: 'https://www.superteacherworksheets.com/grammar.html', subject: 'LANGUAGE', gradeBand: '3-5', topic: 'Grammar', difficulty: 2, parser: 'html', label: 'STW-Grammar' },
  
  // Math Worksheets 4 Kids
  { url: 'https://www.mathworksheets4kids.com/common-core.php', subject: 'MATH', gradeBand: 'K-2', topic: 'Common Core Math', difficulty: 1, parser: 'html', label: 'MW4K-CCSS' },
  
  // Tests.com Literature
  { url: 'https://www.tests.com/practice/Literature-Test', subject: 'LANGUAGE', gradeBand: '9-12', topic: 'Literature', difficulty: 4, parser: 'html', label: 'Tests-Lit' },
  
  // Princeton Review SAT
  { url: 'https://www.princetonreview.com/college-advice/sat-practice-questions', subject: 'MATH', gradeBand: '9-12', topic: 'SAT Math', difficulty: 4, parser: 'html', label: 'PR-SAT' },
  
  // Princeton Review ACT
  { url: 'https://www.princetonreview.com/college-advice/act-practice-questions', subject: 'LANGUAGE', gradeBand: '9-12', topic: 'ACT English', difficulty: 4, parser: 'html', label: 'PR-ACT' },
  
  // JMAP Regents Algebra
  { url: 'https://www.jmap.org', subject: 'MATH', gradeBand: '9-12', topic: 'Regents Algebra', difficulty: 4, parser: 'html', label: 'JMAP-Alg' },
  
  // Ohio DOE Science
  { url: 'https://education.ohio.gov/Topics/Learning-in-Ohio/Science/Assessments-in-Science', subject: 'SCIENCE', gradeBand: '3-8', topic: 'Ohio Science', difficulty: 3, parser: 'html', label: 'OH-Sci' },
  
  // Virginia DOE Science
  { url: 'https://www.doe.virginia.gov/teaching-learning-assessment/k-12-standards-instruction/science/standards-of-learning', subject: 'SCIENCE', gradeBand: '3-8', topic: 'VA Science SOL', difficulty: 3, parser: 'html', label: 'VA-Sci' },
  
  // Who Smarted Science Trivia
  { url: 'https://whosmarted.com/science-trivia-for-kids', subject: 'SCIENCE', gradeBand: 'K-2', topic: 'Science Trivia', difficulty: 1, parser: 'html', label: 'WS-SciTrivia' },
  
  // Who Smarted History Trivia
  { url: 'https://whosmarted.com/history-trivia-for-kids', subject: 'GENERAL', gradeBand: '3-5', topic: 'History Trivia', difficulty: 2, parser: 'html', label: 'WS-HistTrivia' },
  
  // HelpTeaching Math
  { url: 'https://www.helpteaching.com/free-math-worksheets.htm', subject: 'MATH', gradeBand: '3-5', topic: 'Math Worksheets', difficulty: 2, parser: 'html', label: 'HelpTeach-Math' },
  
  // Tutor-USA Pre-Algebra
  { url: 'https://tutor-usa.com/worksheets/pre-algebra', subject: 'MATH', gradeBand: '6-8', topic: 'Pre-Algebra', difficulty: 3, parser: 'html', label: 'TutorUSA-PreAlg' },
  
  // 8th Grade Math Problems
  { url: 'https://thirdspacelearning.com/us/blog/8th-grade-math-problems', subject: 'MATH', gradeBand: '6-8', topic: '8th Grade Math', difficulty: 3, parser: 'html', label: 'TSL-8thMath' },
  
  // Math Worksheets Land
  { url: 'https://www.mathworksheetsland.com/grades.html', subject: 'MATH', gradeBand: '3-5', topic: 'Grade-Level Math', difficulty: 3, parser: 'html', label: 'MWLand' },
  
  // Kuta Software Pre-Algebra
  { url: 'https://www.kutasoftware.com/freeipa.html', subject: 'MATH', gradeBand: '6-8', topic: 'Pre-Algebra', difficulty: 3, parser: 'html', label: 'Kuta-PreAlg' },
];

// ============================================================
// Question Extraction from HTML
// ============================================================

function extractQuestionsFromHTML(html: string, source: CrawlSource): CrawledQuestion[] {
  const questions: CrawledQuestion[] = [];
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Pattern 1: Numbered questions like "1. What is..." or "1) What is..."
  const numberedPattern = /(?:^|\s)(?:\d{1,3})\.\s+(.+?[??.!])(?:\s+[A-D][).]\s+.+)*\s*(?:Answer[:\s]+(.+?)(?:\n|$)|Correct Answer[:\s]+(.+?)(?:\n|$))/gim;
  let match;

  // Pattern 2: Questions ending with ?
  const questionPattern = /([^?.!\n]{20,200}\?)(?:\s+(?:A\)\s+([^)]+)\s+B\)\s+([^)]+)\s+C\)\s+([^)]+)\s+D\)\s+([^)]+))?(?:\s+(?:Answer|Solution|Correct)[:\s]+(.+?)(?:\n|$)))?/gi;

  while ((match = questionPattern.exec(text)) !== null && questions.length < 50) {
    const stem = match[1]?.trim();
    if (!stem || stem.length < 10) continue;

    const distractors = match[2] ? [match[2].trim(), match[3]?.trim(), match[4]?.trim(), match[5]?.trim()].filter(Boolean) : undefined;
    const answer = match[6]?.trim() || '';

    questions.push({
      subject: source.subject,
      gradeBand: source.gradeBand,
      topic: source.topic,
      difficulty: source.difficulty,
      stem,
      answerKey: answer || 'See solution',
      distractors: distractors ? JSON.stringify(distractors) : undefined,
      questionType: distractors ? 'MCQ' : 'OPEN',
      tags: `crawled,${source.label},${source.subject.toLowerCase()},${source.topic.toLowerCase()}`,
      estimatedTimeSec: estimateTime(source.difficulty),
      source: source.url,
    });
  }

  // If no questions found via pattern, try extracting sentences ending with ?
  if (questions.length === 0) {
    const sentences = text.split(/[.!?]\s/).filter(s => s.trim().length > 15 && s.trim().length < 500);
    const questionSentences = sentences.filter(s => s.trim().endsWith('?'));
    
    for (const q of questionSentences.slice(0, 30)) {
      questions.push({
        subject: source.subject,
        gradeBand: source.gradeBand,
        topic: source.topic,
        difficulty: source.difficulty,
        stem: q.trim(),
        answerKey: 'Refer to source material',
        questionType: 'OPEN',
        tags: `crawled,${source.label},${source.subject.toLowerCase()},${source.topic.toLowerCase()}`,
        estimatedTimeSec: estimateTime(source.difficulty),
        source: source.url,
      });
    }
  }

  return questions;
}

function extractQuestionsFromText(text: string, source: CrawlSource): CrawledQuestion[] {
  const questions: CrawledQuestion[] = [];
  
  // For text-based sources (like civics questions), split by lines
  const lines = text.split('\n').filter(l => l.trim().length > 10);
  
  for (const line of lines.slice(0, 100)) {
    const trimmed = line.trim();
    if (trimmed.endsWith('?') || trimmed.includes('?')) {
      questions.push({
        subject: source.subject,
        gradeBand: source.gradeBand,
        topic: source.topic,
        difficulty: source.difficulty,
        stem: trimmed,
        answerKey: 'Refer to source material',
        questionType: trimmed.length > 200 ? 'SHORT_ANSWER' : 'OPEN',
        tags: `crawled,${source.label},${source.subject.toLowerCase()},${source.topic.toLowerCase()}`,
        estimatedTimeSec: estimateTime(source.difficulty),
        source: source.url,
      });
    }
  }
  
  return questions;
}

function estimateTime(difficulty: number): number {
  return 30 + difficulty * 30; // 30s to 180s
}

// ============================================================
// Database Operations
// ============================================================

async function insertQuestions(client: Client, questions: CrawledQuestion[]): Promise<number> {
  if (questions.length === 0) return 0;

  const BATCH_SIZE = 200;
  let inserted = 0;

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const values = batch.map(q => {
      const distractors = q.distractors || null;
      const solutionSteps = q.solutionSteps ? q.solutionSteps : null;
      return `('${escapeSql(q.subject)}','${escapeSql(q.gradeBand)}','${escapeSql(q.topic)}',${q.difficulty},${q.curriculum ? `'${escapeSql(q.curriculum)}'` : 'NULL'},${q.standardCode ? `'${escapeSql(q.standardCode)}'` : 'NULL'},'${escapeSql(q.stem)}',NULL,NULL,'${escapeSql(q.answerKey)}',${solutionSteps ? `'${escapeSql(solutionSteps)}'` : 'NULL'},${distractors ? `'${escapeSql(distractors)}'` : 'NULL'},'${q.questionType}','${escapeSql(q.tags)}',${q.estimatedTimeSec || 'NULL'},NULL,true,NOW(),NOW())`;
    });

    const sql = `INSERT INTO "QuestionItem" ("subject","gradeBand","topic","difficulty","curriculum","standardCode","stem","stemLatex","diagramSvg","answerKey","solutionSteps","distractors","questionType","tags","estimatedTimeSec","creatorId","isActive","createdAt","updatedAt") VALUES ${values.join(',')} ON CONFLICT DO NOTHING;`;

    try {
      const result = await client.query(sql);
      inserted += result.rowCount || 0;
    } catch (err: any) {
      // If batch fails due to enum, try individual inserts
      console.log(`  Batch failed (${err.message?.substring(0, 80)}), trying individual inserts...`);
      for (const q of batch) {
        try {
          await client.query(`INSERT INTO "QuestionItem" ("subject","gradeBand","topic","difficulty","stem","answerKey","questionType","tags","isActive") VALUES ('${escapeSql(q.subject)}','${escapeSql(q.gradeBand)}','${escapeSql(q.topic)}',${q.difficulty},'${escapeSql(q.stem)}','${escapeSql(q.answerKey)}','${q.questionType}','${escapeSql(q.tags)}',true) ON CONFLICT DO NOTHING;`);
          inserted++;
        } catch {
          // Skip individual failures
        }
      }
    }
  }

  return inserted;
}

function escapeSql(str: string): string {
  return str.replace(/'/g, "''").replace(/\n/g, ' ').replace(/\r/g, '').substring(0, 5000);
}

// ============================================================
// Main Crawler
// ============================================================

async function main() {
  console.log('=== K-12 Question Bank Web Crawler ===');
  console.log(`Sources to crawl: ${CRAWL_SOURCES.length}`);
  console.log('');

  // Uses DATABASE_URL env var. Set it in .env.local or your environment.
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  await client.connect();
  console.log('Connected to Supabase PostgreSQL\n');

  const { execSync } = await import('child_process');
  
  let totalExtracted = 0;
  let totalInserted = 0;
  let sourcesSucceeded = 0;
  let sourcesFailed = 0;

  for (let i = 0; i < CRAWL_SOURCES.length; i++) {
    const source = CRAWL_SOURCES[i];
    console.log(`[${i + 1}/${CRAWL_SOURCES.length}] Crawling: ${source.label} (${source.url})`);

    try {
      // Use z-ai CLI to read page
      const tmpFile = `/tmp/crawl-${source.label}-${Date.now()}.json`;
      execSync(
        `z-ai function -n page_reader -a '{"url": "${source.url}"}' -o "${tmpFile}"`,
        { timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
      );

      const { readFileSync } = await import('fs');
      const pageData = JSON.parse(readFileSync(tmpFile, 'utf-8'));
      
      // Clean up temp file
      try { execSync(`rm -f "${tmpFile}"`); } catch {}

      const html = pageData?.data?.html || pageData?.html || '';
      const title = pageData?.data?.title || pageData?.title || source.label;

      if (!html || html.length < 50) {
        console.log(`  ⚠ Skipped: No content extracted (${html.length} chars)`);
        continue;
      }

      // Extract questions based on parser type
      const questions = source.parser === 'html'
        ? extractQuestionsFromHTML(html, source)
        : extractQuestionsFromText(html, source);

      console.log(`  Page: "${title}" (${html.length} chars)`);
      console.log(`  Questions extracted: ${questions.length}`);

      if (questions.length > 0) {
        const inserted = await insertQuestions(client, questions);
        totalInserted += inserted;
        console.log(`  Questions inserted: ${inserted}`);
      }

      totalExtracted += questions.length;
      sourcesSucceeded++;

    } catch (err: any) {
      sourcesFailed++;
      console.log(`  ✗ Error: ${err.message?.substring(0, 100)}`);
    }

    console.log('');
    
    // Rate limiting: wait between requests
    if (i < CRAWL_SOURCES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    }
  }

  // Print summary
  console.log('\n=== Crawl Summary ===');
  console.log(`Sources crawled: ${sourcesSucceeded + sourcesFailed}`);
  console.log(`Sources succeeded: ${sourcesSucceeded}`);
  console.log(`Sources failed: ${sourcesFailed}`);
  console.log(`Questions extracted: ${totalExtracted}`);
  console.log(`Questions inserted: ${totalInserted}`);

  // Get total DB count
  const countResult = await client.query('SELECT count(*) FROM "QuestionItem"');
  console.log(`Total questions in DB: ${countResult.rows[0].count}`);

  // Count by subject
  const subjectResult = await client.query('SELECT "subject", count(*) as cnt FROM "QuestionItem" GROUP BY "subject" ORDER BY cnt DESC');
  console.log('\nBy Subject:');
  for (const row of subjectResult.rows) {
    console.log(`  ${row.subject}: ${row.cnt}`);
  }

  // Count by grade
  const gradeResult = await client.query('SELECT "gradeBand", count(*) as cnt FROM "QuestionItem" GROUP BY "gradeBand" ORDER BY cnt DESC');
  console.log('\nBy Grade Band:');
  for (const row of gradeResult.rows) {
    console.log(`  ${row.gradeBand}: ${row.cnt}`);
  }

  await client.end();
  console.log('\n✅ Crawl complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
