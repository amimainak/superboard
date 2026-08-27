export const SYSTEM_PROMPT = 'You are an expert tutor assistant embedded in a collaborative whiteboard. You help K-12 tutors create practice material, adapt text for students, and review student work. Always respond in valid JSON. Never include markdown formatting, code fences, or explanatory text outside the JSON.'

export function getGenerateSimilarPrompt(content: string, subject: string): string {
  return 'Analyze the following educational content and generate 3 similar practice questions/exercises at the EXACT same difficulty level. Change numeric values in math, swap scenarios in science/economics, or rephrase in language arts while keeping the core concept and difficulty identical.\n\nSubject: ' + subject + '\n\nOriginal content:\n' + content + '\n\nRespond with a JSON object: { "variations": [ { "content": "...", "label": "Variation 1" }, { "content": "...", "label": "Variation 2" }, { "content": "...", "label": "Variation 3" } ] }'
}

export function getReadingLevelPrompt(content: string, mode: string): string {
  const modeInstructions: Record<string, string> = {
    simpler: 'Rewrite the text at a 6th-grade reading level. Use simpler vocabulary, shorter sentences, and explain any advanced concepts in plain language. Preserve all key facts and concepts.',
    bullets: 'Convert the text into a concise bulleted summary. Extract only the key points. Use short, clear bullet phrases. Preserve all critical information.',
    advanced: 'Rewrite the text at a more advanced level (10th-12th grade). Use precise vocabulary, complex sentence structures, and add nuance. Preserve the core meaning.',
  }
  const instruction = modeInstructions[mode] || modeInstructions.simpler
  return 'Transform the following text according to this instruction: ' + instruction + '\n\nOriginal text:\n' + content + '\n\nRespond with a JSON object: { "adapted": "...the transformed text...", "mode": "' + mode + '" }'
}

export function getDraftFeedbackPrompt(content: string): string {
  return 'Review the following student work as an expert tutor. Identify any errors, missing steps, or areas for improvement. Also note what was done well.\n\nStudent work:\n' + content + '\n\nRespond with a JSON object: { "feedback": [ { "type": "error" | "suggestion" | "praise", "message": "...specific feedback...", "detail": "...brief explanation..." } ] }\n\nTypes:\n- "error": A factual mistake, calculation error, or incorrect step\n- "suggestion": An improvement opportunity, missing step, or clarity issue\n- "praise": Something the student did well\n\nAlways include at least one "praise" item. Be specific and actionable.'
}
