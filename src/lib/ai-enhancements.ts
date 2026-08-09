/**
 * AI Enhancement Utilities — Phase 6B
 * Extended AI capabilities for the tutoring platform.
 */

// Additional AI actions
export const ENHANCED_AI_ACTIONS = {
  LESSON_PLAN: 'LESSON_PLAN',
  DIFFERENTIATED_INSTRUCTION: 'DIFFERENTIATED_INSTRUCTION',
  FORMATIVE_ASSESSMENT: 'FORMATIVE_ASSESSMENT',
  RUBRIC_GENERATOR: 'RUBRIC_GENERATOR',
  STUDENT_FEEDBACK: 'STUDENT_FEEDBACK',
  CONCEPT_EXPLAINER: 'CONCEPT_EXPLAINER',
  STEP_BY_STEP_SOLVER: 'STEP_BY_STEP_SOLVER',
  FLASHCARD_GENERATOR: 'FLASHCARD_GENERATOR',
  WORD_PROBLEM_BUILDER: 'WORD_PROBLEM_BUILDER',
  ANNOTATION_HELPER: 'ANNOTATION_HELPER',
} as const;

export type EnhancedAIAction = typeof ENHANCED_AI_ACTIONS[keyof typeof ENHANCED_AI_ACTIONS];

// Prompt templates for each enhanced AI action
export const AI_PROMPT_TEMPLATES: Record<EnhancedAIAction, (context: string) => string> = {
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
- Difficulty progression (easy → challenging)
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
export function buildEnhancedSystemPrompt(action: EnhancedAIAction): string {
  const prompts: Record<EnhancedAIAction, string> = {
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
