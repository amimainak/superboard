import { NextResponse } from 'next/server'
import { getGenerateSimilarPrompt, getReadingLevelPrompt, getDraftFeedbackPrompt, SYSTEM_PROMPT } from '@/lib/ai/prompts'

const MAX_CONTENT_LENGTH = 4000

export async function POST(request: Request) {
  try {
    const { action, content, options } = await request.json()

    if (!action || !content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing action or content' }, { status: 400 })
    }

    const trimmed = content.slice(0, MAX_CONTENT_LENGTH)

    let prompt = ''
    if (action === 'generate_similar') {
      const subject = (options && options.subject) || 'general'
      prompt = getGenerateSimilarPrompt(trimmed, subject)
    } else if (action === 'adapt_reading_level') {
      const mode = (options && options.level) || 'simpler'
      prompt = getReadingLevelPrompt(trimmed, mode)
    } else if (action === 'check_work') {
      prompt = getDraftFeedbackPrompt(trimmed)
    } else {
      return NextResponse.json({ error: 'Invalid action. Use generate_similar, adapt_reading_level, or check_work.' }, { status: 400 })
    }

    const result = await callLLM(prompt)
    return NextResponse.json({ result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI generation failed'
    console.error('AI generate error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

async function callLLM(prompt: string): Promise<Record<string, unknown>> {
  // Dynamic import to avoid bundling issues
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()

  const response = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  })

  // Extract the text from the response
  const text = extractResponseText(response)

  // Parse JSON from the response (handle potential markdown wrapping)
  const jsonStr = extractJSON(text)
  try {
    return JSON.parse(jsonStr)
  } catch {
    return { raw: text }
  }
}

function extractResponseText(response: unknown): string {
  if (!response) return ''
  if (typeof response === 'string') return response
  const obj = response as Record<string, unknown>
  if (obj.choices && Array.isArray(obj.choices)) {
    const choice = obj.choices[0] as Record<string, unknown>
    if (choice.message && typeof choice.message === 'object') {
      const msg = choice.message as Record<string, unknown>
      return String(msg.content || '')
    }
    return String(choice.message || '')
  }
  if (obj.content) return String(obj.content)
  if (obj.text) return String(obj.text)
  return JSON.stringify(response)
}

function extractJSON(text: string): string {
  // Try to find JSON object in the text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return jsonMatch[0]
  // Try to find JSON array
  const arrMatch = text.match(/\[[\s\S]*\]/)
  if (arrMatch) return arrMatch[0]
  return text
}
