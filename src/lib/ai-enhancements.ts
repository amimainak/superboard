/**
 * AI Enhancement Utilities — Phase 6B
 * Prompt templates for enhanced AI actions.
 * Action types and routing are defined in src/types/index.ts.
 *
 * Enhanced actions are Pro-only and cost 3-5 credits each.
 */

import type { AIAction, Subject } from '@/types';

// Prompt templates for each enhanced AI action
export const AI_PROMPT_TEMPLATES: Record<string, (context: string) => string> = {
  LESSON_PLAN: (context) =>
    `Create a detailed lesson plan for: ${context}. Include:
- Learning objectives (aligned to K-12 standards)
- Materials needed
- Warm-up activity (5 min)
- Main instruction (20 min) with guided practice
- Independent practice (15 min)
- Assessment/exit ticket
- Differentiation strategies for struggling and advanced learners`,

  DIFFERENTIATED_INSTRUCTION: (context) =>
    `Create differentiated instruction activities for: ${context}. Provide three tiers:
- Tier 1 (Below level): Scaffolding activities with extra support
- Tier 2 (On level): Grade-level practice with moderate challenge
- Tier 3 (Above level): Extension activities with higher-order thinking
Include specific modifications and accommodations.`,

  FORMATIVE_ASSESSMENT: (context) =>
    `Create a formative assessment for: ${context}. Include:
- 5 multiple choice questions (DOK levels 1-3)
- 2 short answer questions
- 1 extended response question
- Answer key with rationales for each distractor`,

  RUBRIC_GENERATOR: (context) =>
    `Create a grading rubric for: ${context}. Include 4 performance levels:
- Exemplary (4): Above grade level expectations
- Proficient (3): Meets grade level expectations
- Developing (2): Approaching grade level expectations
- Beginning (1): Below grade level expectations
Provide 4-6 criteria with specific descriptors for each level.`,

  STUDENT_FEEDBACK: (context) =>
    `Write constructive, encouraging feedback for a student's work: ${context}.
- Begin with a positive observation
- Identify specific strengths (cite evidence)
- Note 1-2 areas for growth
- Suggest concrete next steps
- End with an encouraging statement
Use warm, professional tone appropriate for K-12 students.`,

  CONCEPT_EXPLAINER: (context) =>
    `Explain this concept in student-friendly language: ${context}.
- Start with a relatable analogy or real-world example
- Break into 3-4 key parts
- Use simple vocabulary (appropriate for the grade level)
- Include "Teacher Tip" with common misconceptions
- Suggest a quick activity to reinforce understanding`,

  STEP_BY_STEP_SOLVER: (context) =>
    `Solve this step by step: ${context}.
For each step:
- State what you're doing and why
- Show the work clearly
- Note any rules or formulas applied
After the solution:
- Verify the answer
- Identify common mistakes to avoid
- Provide a similar practice problem`,

  FLASHCARD_GENERATOR: (context) =>
    `Create a set of 10 study flashcards for: ${context}.
Each flashcard should have:
- Front: Clear, concise question or term
- Back: Answer with brief explanation
- Difficulty: (Easy/Medium/Hard)
Include a mix of recall, understanding, and application cards.`,

  WORD_PROBLEM_BUILDER: (context) =>
    `Create 5 word problems based on: ${context}.
Include:
- Real-world scenarios relevant to students' lives
- Clear, age-appropriate language
- Multiple choice answers (A-D)
- Difficulty progression (easy to challenging)
- Answer key with step-by-step solutions`,

  ANNOTATION_HELPER: (context) =>
    `Help annotate and explain this content: ${context}.
- Identify the main idea and supporting details
- Highlight key vocabulary with definitions
- Note connections to prior knowledge
- Suggest discussion questions
- Provide a summary suitable for student notes`,
};

/**
 * Build a system prompt for enhanced AI actions.
 */
export function buildEnhancedSystemPrompt(action: string): string {
  const prompts: Record<string, string> = {
    LESSON_PLAN: 'You are an expert K-12 curriculum designer. Create comprehensive, standards-aligned lesson plans.',
    DIFFERENTIATED_INSTRUCTION: 'You are a special education and gifted education specialist. Design activities that meet diverse learning needs.',
    FORMATIVE_ASSESSMENT: 'You are an assessment design expert. Create valid, reliable formative assessments aligned to learning objectives.',
    RUBRIC_GENERATOR: 'You are an assessment and grading expert. Create clear, objective rubrics that help students understand expectations.',
    STUDENT_FEEDBACK: 'You are an experienced, empathetic teacher. Write feedback that motivates and guides student improvement.',
    CONCEPT_EXPLAINER: 'You are a skilled teacher who makes complex concepts accessible. Use analogies, examples, and clear language.',
    STEP_BY_STEP_SOLVER: 'You are a patient math and science tutor. Show every step clearly and explain the reasoning.',
    FLASHCARD_GENERATOR: 'You are a study skills expert. Create effective flashcards that promote active recall and spaced repetition.',
    WORD_PROBLEM_BUILDER: 'You are a curriculum writer specializing in word problems. Create engaging, age-appropriate problems.',
    ANNOTATION_HELPER: 'You are a literacy and content analysis expert. Help students actively engage with texts and materials.',
  };
  return prompts[action] || 'You are a helpful K-12 tutoring assistant.';
}

/**
 * Map enhanced actions to their primary subject for toolbar grouping.
 * Some actions are cross-subject and appear in multiple toolkits.
 */
export const ENHANCED_ACTION_SUBJECTS: Record<string, { primary: Subject; secondary?: Subject[] }> = {
  LESSON_PLAN: { primary: 'GENERAL', secondary: ['MATH', 'SCIENCE', 'LANGUAGE'] },
  DIFFERENTIATED_INSTRUCTION: { primary: 'GENERAL', secondary: ['MATH', 'SCIENCE', 'LANGUAGE'] },
  FORMATIVE_ASSESSMENT: { primary: 'GENERAL', secondary: ['MATH', 'SCIENCE', 'LANGUAGE'] },
  RUBRIC_GENERATOR: { primary: 'LANGUAGE', secondary: ['GENERAL'] },
  STUDENT_FEEDBACK: { primary: 'GENERAL', secondary: ['MATH', 'SCIENCE', 'LANGUAGE'] },
  CONCEPT_EXPLAINER: { primary: 'GENERAL', secondary: ['MATH', 'SCIENCE'] },
  STEP_BY_STEP_SOLVER: { primary: 'MATH', secondary: ['SCIENCE'] },
  FLASHCARD_GENERATOR: { primary: 'LANGUAGE', secondary: ['SCIENCE', 'GENERAL'] },
  WORD_PROBLEM_BUILDER: { primary: 'MATH', secondary: ['SCIENCE'] },
  ANNOTATION_HELPER: { primary: 'LANGUAGE', secondary: ['GENERAL'] },
};

/**
 * Human-readable labels for enhanced actions.
 */
export const ENHANCED_ACTION_LABELS: Record<string, { label: string; description: string }> = {
  LESSON_PLAN: { label: 'Lesson Plan', description: 'Create standards-aligned lesson plans' },
  DIFFERENTIATED_INSTRUCTION: { label: 'Differentiated Instruction', description: '3-tier activities for diverse learners' },
  FORMATIVE_ASSESSMENT: { label: 'Formative Assessment', description: 'MCQ, short answer, and extended response' },
  RUBRIC_GENERATOR: { label: 'Rubric Generator', description: '4-level grading rubrics with criteria' },
  STUDENT_FEEDBACK: { label: 'Student Feedback', description: 'Constructive, encouraging feedback' },
  CONCEPT_EXPLAINER: { label: 'Concept Explainer', description: 'Student-friendly explanations with analogies' },
  STEP_BY_STEP_SOLVER: { label: 'Step-by-Step Solver', description: 'Show every step with verification' },
  FLASHCARD_GENERATOR: { label: 'Flashcard Generator', description: '10 study flashcards with difficulty levels' },
  WORD_PROBLEM_BUILDER: { label: 'Word Problem Builder', description: '5 word problems with answer keys' },
  ANNOTATION_HELPER: { label: 'Annotation Helper', description: 'Annotate text with vocabulary and questions' },
};
