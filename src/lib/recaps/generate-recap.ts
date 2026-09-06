// ============================================================
// Recap Generator — extract structured data from a board + AI polish
// ============================================================
// Two layers:
//   1. Structured data extraction (always runs) — analyzes the board
//      elements, lesson notes, and student context to produce topics,
//      strengths, growth areas, next steps.
//   2. AI narrative (optional, Gemini) — writes a 2-paragraph recap
//      in professional tone. Only runs if the tutor has consented to
//      AI recaps (preferences.consentAIRecaps === true).
//
// The structured data is the foundation — it works even without AI.
// The AI narrative is a Pro-tier enhancement on top.
// ============================================================

import { db } from '@/lib/db'
import type { WhiteboardElement } from '@/lib/whiteboard/types'

interface BoardSnapshot {
  elements?: WhiteboardElement[]
  camera?: { x: number; y: number; zoom: number }
}

interface PageSnapshot {
  pageIndex: number
  snapshot: BoardSnapshot
}

export interface RecapDraft {
  topics: string[]
  strengths: string[]
  growthAreas: string[]
  nextSteps: string | null
  narrative: string | null  // null if AI not used
  aiGenerated: boolean
}

/**
 * Generate a recap draft for a lesson (room).
 * Pulls board content + lesson notes + student context.
 */
export async function generateRecapDraft(roomId: string): Promise<RecapDraft> {
  // 1. Load the room's final board state
  const pages = await db.boardPage.findMany({
    where: { roomId },
    orderBy: { pageIndex: 'asc' },
    select: { pageIndex: true, snapshot: true },
  })

  // 2. Load any lesson notes for this room
  const lessonNotes = await db.lessonNote.findMany({
    where: { roomId },
    select: { content: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // 3. Load room metadata (subject, student, duration)
  const room = await db.room.findUnique({
    where: { id: roomId },
    select: {
      subject: true,
      studentName: true,
      durationMinutes: true,
      startedAt: true,
      endedAt: true,
      tutorId: true,
    },
  })

  if (!room) {
    throw new Error('Room not found')
  }

  // 4. Extract structured data from board elements
  const allElements: WhiteboardElement[] = []
  for (const page of pages) {
    const snap = page.snapshot as BoardSnapshot
    if (snap?.elements && Array.isArray(snap.elements)) {
      allElements.push(...snap.elements)
    }
  }

  const extracted = extractStructuredData(allElements, lessonNotes.map(n => n.content), room.subject)

  // 5. Check if AI narrative is enabled for this tutor
  const tutor = await db.user.findUnique({
    where: { id: room.tutorId },
    select: { preferences: true, tier: true },
  })
  const prefs = (tutor?.preferences as Record<string, unknown> | null) || {}
  const isPro = tutor && ['PRO', 'AGENCY', 'AGENCY_STANDARD', 'AGENCY_PREMIUM'].includes(tutor.tier)
  const aiConsent = prefs.consentAIRecaps === true

  let narrative: string | null = null
  let aiGenerated = false

  if (isPro && aiConsent && process.env.GEMINI_API_KEY) {
    try {
      narrative = await generateAINarrative(extracted, room, lessonNotes.map(n => n.content))
      aiGenerated = true
    } catch (e) {
      console.error('[Recap AI] Failed, falling back to structured only:', e instanceof Error ? e.message : e)
      // Non-fatal — the structured data is still useful
    }
  }

  return {
    ...extracted,
    narrative,
    aiGenerated,
  }
}

// ----------------------------------------------------------------
// Structured data extraction — pure function, no AI
// ----------------------------------------------------------------
function extractStructuredData(
  elements: WhiteboardElement[],
  lessonNotes: string[],
  subject: string,
): Omit<RecapDraft, 'narrative' | 'aiGenerated'> {
  const topics: string[] = []
  const strengths: string[] = []
  const growthAreas: string[] = []

  // Extract text content from text elements + sticky notes
  const textContent: string[] = []
  for (const el of elements) {
    if (el.type === 'text' && el.text) {
      textContent.push(el.text)
    }
    if (el.type === 'sticky' && el.text) {
      textContent.push(el.text)
    }
  }

  // Combine with lesson notes
  const allText = [...textContent, ...lessonNotes].join(' ')

  // Extract topics — look for keywords in text
  const topicKeywords = extractTopics(allText, subject)
  topics.push(...topicKeywords)

  // If no topics found, use the subject as a fallback
  if (topics.length === 0 && subject !== 'GENERAL') {
    topics.push(subject.toLowerCase())
  }

  // Extract strengths/growth areas from lesson notes (heuristic)
  for (const note of lessonNotes) {
    const lower = note.toLowerCase()
    if (lower.includes('good') || lower.includes('well') || lower.includes('strong') || lower.includes('excellent')) {
      // Extract the sentence with the positive word
      const sentences = note.split(/[.!?]+/).filter(s => s.length > 10)
      for (const s of sentences) {
        if (/good|well|strong|excellent|great/.test(s.toLowerCase())) {
          strengths.push(s.trim().slice(0, 120))
          break
        }
      }
    }
    if (lower.includes('tricky') || lower.includes('difficult') || lower.includes('struggle') || lower.includes('hard')) {
      const sentences = note.split(/[.!?]+/).filter(s => s.length > 10)
      for (const s of sentences) {
        if (/tricky|difficult|struggle|hard|challenging/.test(s.toLowerCase())) {
          growthAreas.push(s.trim().slice(0, 120))
          break
        }
      }
    }
  }

  // Count element types for engagement signal
  const elementCounts: Record<string, number> = {}
  for (const el of elements) {
    elementCounts[el.type] = (elementCounts[el.type] || 0) + 1
  }

  // Derive next steps
  const nextSteps = generateNextSteps(topics, growthAreas, subject)

  return {
    topics: dedupe(topics).slice(0, 8),
    strengths: dedupe(strengths).slice(0, 5),
    growthAreas: dedupe(growthAreas).slice(0, 5),
    nextSteps,
  }
}

function extractTopics(text: string, subject: string): string[] {
  const lower = text.toLowerCase()
  const topics: string[] = []

  // Subject-specific keyword banks
  const keywordBanks: Record<string, string[]> = {
    MATH: ['fractions', 'decimals', 'percentages', 'algebra', 'geometry', 'multiplication', 'division', 'addition', 'subtraction', 'equations', 'graphs', 'angles', 'area', 'perimeter', 'volume', 'ratio', 'proportion', 'negative numbers', 'coordinates'],
    SCIENCE: ['photosynthesis', 'cells', 'forces', 'energy', 'electricity', 'magnetism', 'chemistry', 'atoms', 'molecules', 'reactions', 'biology', 'physics', 'ecosystems', 'evolution', 'genetics', 'periodic table'],
    LANGUAGE: ['grammar', 'comprehension', 'essay', 'writing', 'reading', 'vocabulary', 'spelling', 'punctuation', 'poetry', 'shakespeare', 'analysis', 'creative writing'],
    GENERAL: [],
  }

  const bank = keywordBanks[subject] || keywordBanks.GENERAL
  for (const kw of bank) {
    if (lower.includes(kw)) {
      topics.push(kw)
    }
  }

  // Also check the general bank
  for (const kw of keywordBanks.GENERAL) {
    if (lower.includes(kw)) {
      topics.push(kw)
    }
  }

  return topics
}

function generateNextSteps(topics: string[], growthAreas: string[], subject: string): string {
  if (growthAreas.length > 0) {
    return `Continue working on: ${growthAreas[0]}. Reinforce with practice problems next lesson.`
  }
  if (topics.length > 0) {
    return `Build on ${topics[0]} — introduce the next concept in this sequence.`
  }
  return `Review today's material and prepare the next topic in ${subject.toLowerCase()}.`
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr.map(s => s.trim()).filter(s => s.length > 0))]
}

// ----------------------------------------------------------------
// AI narrative generation (Gemini)
// ----------------------------------------------------------------
async function generateAINarrative(
  extracted: Omit<RecapDraft, 'narrative' | 'aiGenerated'>,
  room: { subject: string; studentName: string | null; durationMinutes: number },
  lessonNotes: string[],
): Promise<string> {
  const prompt = `You are writing a private session recap for a tutor's records. This is NOT sent to parents — it's the tutor's working memory.

Lesson details:
- Subject: ${room.subject}
- Student: ${room.studentName || 'Student'}
- Duration: ${room.durationMinutes} minutes

Topics covered: ${extracted.topics.join(', ') || 'not specified'}
Strengths observed: ${extracted.strengths.join('; ') || 'not specified'}
Growth areas: ${extracted.growthAreas.join('; ') || 'not specified'}
Tutor's lesson notes: ${lessonNotes.join(' ').slice(0, 1000) || 'none'}

Write a 2-paragraph recap in professional but warm tone:
1. What was covered and how the student engaged
2. What to focus on next time

Keep it under 150 words. Be specific and actionable. Do not use generic phrases like "the student did well" — reference the actual topics.`

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty Gemini response')
  return text.trim()
}
