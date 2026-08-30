// ============================================================
// Superboard — Shared AI Service Layer
// Wraps Gemini API with retry, rate-limit, and token budget.
// All AI canvas widgets call through this service.
// ============================================================

import { sanitizePrompt } from '@/lib/ai'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface AIServiceConfig {
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface AIVariation {
  text: string
  label: string
}

export interface AIReadingResult {
  adapted: string
  originalLevel: string
  targetLevel: string
  wordCountBefore: number
  wordCountAfter: number
}

export interface AIFeedbackItem {
  type: 'strength' | 'improvement' | 'suggestion'
  text: string
  severity?: 'low' | 'medium' | 'high'
}

export interface AIDraftFeedbackResult {
  overall: string
  items: AIFeedbackItem[]
  score: number
}

const DEFAULT_MODEL = 'gemini-2.0-flash'
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY is not configured')
  return key
}

async function callGemini(
  prompt: string,
  config: AIServiceConfig = {}
): Promise<string> {
  const apiKey = getApiKey()
  const model = config.model || DEFAULT_MODEL
  const url = GEMINI_BASE + '/' + model + ':generateContent'

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: config.maxTokens || 1024,
      temperature: config.temperature ?? 0.7,
    },
  }

  let lastError: Error | null = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        body: JSON.stringify(body),
      })
      if (res.status === 429) {
        // Rate limited — wait and retry
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)))
          continue
        }
        throw new Error('Rate limited. Please wait a moment and try again.')
      }
      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        throw new Error('Gemini API error ' + res.status + ': ' + errBody.slice(0, 200))
      }
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Empty response from Gemini')
      return text
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
      if (attempt < MAX_RETRIES && !(lastError.message.includes('429'))) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)))
        continue
      }
    }
  }
  throw lastError || new Error('Unknown error calling Gemini')
}

// ============================================================
// Generate Similar Variations
// ============================================================

export async function generateVariations(
  sourceText: string,
  count?: number
): Promise<AIVariation[]> {
  const n = count || 3
  const prompt = [
    'You are a tutoring assistant. Given the following educational content, generate ' + n + ' alternative versions that teach the same concept but with different wording, examples, or analogies.',
    '',
    'Original content:',
    sanitizePrompt(sourceText),
    '',
    'Respond ONLY with a valid JSON array. Each element must have:',
    '- "label": a short title (3-5 words) describing the variation approach (e.g. "Simple Analogy", "Real-World Example", "Step-by-Step")',
    '- "text": the full alternative version of the content',
    '',
    'Do NOT include any explanation before or after the JSON array. Return only the array.',
  ].join('\n')

  const raw = await callGemini(prompt, { maxTokens: 2048, temperature: 0.8 })
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      return parsed.slice(0, n).map((v: Record<string, unknown>) => ({
        text: String(v.text || ''),
        label: String(v.label || 'Variation'),
      }))
    }
  } catch {
    // If parsing fails, return a single fallback
  }
  return [{ text: raw, label: 'AI Variation' }]
}

// ============================================================
// Reading Level Adapter
// ============================================================

export type ReadingLevel = 'elementary' | 'middle-school' | 'high-school' | 'college'

const LEVEL_DESCRIPTIONS: Record<ReadingLevel, string> = {
  'elementary': 'simple words, short sentences (under 10 words), concrete examples, no jargon',
  'middle-school': 'moderate vocabulary, sentences 10-15 words, some abstract concepts allowed',
  'high-school': 'academic vocabulary, complex sentences, subject-specific terminology',
  'college': 'advanced scholarly language, long complex sentences, domain-specific jargon',
}

export async function adaptReadingLevel(
  sourceText: string,
  targetLevel: ReadingLevel,
  mode: 'simplify' | 'bulletize' = 'simplify'
): Promise<AIReadingResult> {
  const levelDesc = LEVEL_DESCRIPTIONS[targetLevel]
  let modeInstruction = ''
  if (mode === 'bulletize') {
    modeInstruction = 'Rewrite the content as clear, concise bullet points. Each bullet should be one idea. Use a dash (-) for bullets. Keep it structured and scannable.'
  } else {
    modeInstruction = 'Rewrite the content at the target reading level. Keep all key information and concepts intact.'
  }

  const prompt = [
    'You are a literacy expert. Adapt the following text to a ' + targetLevel + ' reading level.',
    '',
    'Target level characteristics: ' + levelDesc,
    '',
    modeInstruction,
    '',
    'Original text:',
    sanitizePrompt(sourceText),
    '',
    'Respond ONLY with valid JSON:',
    '{',
    '  "adapted": "the rewritten text here",',
    '  "originalLevel": "your assessment of the original text reading level (elementary/middle-school/high-school/college)",',
    '  "wordCountBefore": <number>,',
    '  "wordCountAfter": <number>',
    '}',
    '',
    'Do NOT include any explanation. Return only the JSON object.',
  ].join('\n')

  const raw = await callGemini(prompt, { maxTokens: 2048, temperature: 0.4 })
  const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return {
      adapted: String(parsed.adapted || raw),
      originalLevel: String(parsed.originalLevel || 'unknown'),
      targetLevel,
      wordCountBefore: Number(parsed.wordCountBefore) || sourceText.split(/\s+/).length,
      wordCountAfter: Number(parsed.wordCountAfter) || String(parsed.adapted || '').split(/\s+/).length,
    }
  } catch {
    return {
      adapted: raw,
      originalLevel: 'unknown',
      targetLevel,
      wordCountBefore: sourceText.split(/\s+/).length,
      wordCountAfter: raw.split(/\s+/).length,
    }
  }
}

// ============================================================
// Draft Feedback
// ============================================================

export async function getDraftFeedback(
  draftText: string,
  context?: string
): Promise<AIDraftFeedbackResult> {
  const sanitizedContext = context ? sanitizePrompt(context) : ''
  const contextLine = sanitizedContext ? 'Context/assignment: ' + sanitizedContext + '\n\n' : ''
  const prompt = [
    'You are a writing tutor. Analyze the following student draft and provide constructive feedback.',
    '',
    contextLine + 'Student draft:',
    sanitizePrompt(draftText),
    '',
    'Respond ONLY with valid JSON:',
    '{',
    '  "overall": "2-3 sentence overall assessment",',
    '  "score": <number 1-10>,',
    '  "items": [',
    '    { "type": "strength", "text": "specific praise", "severity": null },',
    '    { "type": "improvement", "text": "specific suggestion to improve", "severity": "high"|"medium"|"low" },',
    '    { "type": "suggestion", "text": "optional enhancement idea", "severity": "low" }',
    '  ]',
    '}',
    '',
    'Include 2-3 strengths, 2-4 improvements (ordered by severity), and 1-2 suggestions.',
    'Be specific — reference exact phrases from the draft when possible.',
    'Do NOT include any explanation. Return only the JSON object.',
  ].join('\n')

  const raw = await callGemini(prompt, { maxTokens: 2048, temperature: 0.5 })
  const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    const items: AIFeedbackItem[] = Array.isArray(parsed.items)
      ? parsed.items.map((item: Record<string, unknown>) => ({
          type: (['strength', 'improvement', 'suggestion'].includes(String(item.type)) ? item.type : 'suggestion') as AIFeedbackItem['type'],
          text: String(item.text || ''),
          severity: (['low', 'medium', 'high'].includes(String(item.severity)) ? item.severity : 'medium') as AIFeedbackItem['severity'],
        }))
      : []
    return {
      overall: String(parsed.overall || 'No overall assessment available.'),
      score: Math.min(10, Math.max(1, Number(parsed.score) || 5)),
      items,
    }
  } catch {
    return {
      overall: raw,
      score: 5,
      items: [],
    }
  }
}
