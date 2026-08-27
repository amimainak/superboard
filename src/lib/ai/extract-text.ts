import type { WhiteboardElement } from '@/lib/whiteboard/types'

interface ExtractedContent {
  text: string
  elementIds: string[]
  elementType: string
}

export function extractTextFromElements(elements: WhiteboardElement[]): ExtractedContent | null {
  if (!elements.length) return null

  const parts: string[] = []
  const ids: string[] = []
  let hasText = false

  for (const el of elements) {
    if (el.type === 'text' && el.text) {
      parts.push(el.text)
      ids.push(el.id)
      hasText = true
    } else if (el.type === 'sticky' && el.text) {
      parts.push(el.text)
      ids.push(el.id)
      hasText = true
    } else if (el.type === 'widget') {
      const config = el.config || {}
      const widgetText = extractWidgetText(config, el.widgetKind)
      if (widgetText) {
        parts.push(widgetText)
        ids.push(el.id)
        hasText = true
      }
    }
  }

  if (!hasText) return null
  return { text: parts.join('\n\n'), elementIds: ids, elementType: elements[0].type }
}

function extractWidgetText(config: Record<string, unknown>, kind: string): string | null {
  // Language widgets
  if (kind && kind.startsWith('lang-')) {
    const text = config.text as string | undefined
    if (text) return text
    const question = config.question as string | undefined
    if (question) return question
  }

  // Generic config text fields
  const fields = ['text', 'question', 'prompt', 'content', 'problem', 'passage', 'sentence'] as const
  for (const field of fields) {
    const val = config[field]
    if (typeof val === 'string' && val.trim()) return val
  }

  // Array text fields
  const arrayFields = ['questions', 'sentences', 'items', 'options'] as const
  for (const field of arrayFields) {
    const val = config[field]
    if (Array.isArray(val)) {
      const items = val.filter((v): v is string => typeof v === 'string').join('\n')
      if (items) return items
    }
  }

  return null
}

export function inferSubject(text: string): string {
  const lower = text.toLowerCase()
  const mathPatterns = ['equation', 'solve for', 'calculate', 'formula', 'x +', 'y =', 'derivative', 'integral', 'fraction', 'angle', 'triangle', 'algebra', 'geometry', 'trigonometry', 'probability', 'matrix']
  if (mathPatterns.some(p => lower.includes(p))) return 'math'

  const sciencePatterns = ['atom', 'molecule', 'cell', 'force', 'energy', 'velocity', 'mass', 'gravity', 'photosynthesis', 'organism', 'hypothesis', 'experiment', 'acid', 'base', 'element', 'compound']
  if (sciencePatterns.some(p => lower.includes(p))) return 'science'

  const languagePatterns = ['grammar', 'verb', 'noun', 'adjective', 'sentence', 'paragraph', 'punctuation', 'metaphor', 'simile', 'theme', 'character', 'plot']
  if (languagePatterns.some(p => lower.includes(p))) return 'language'

  const econPatterns = ['demand', 'supply', 'price', 'market', 'gdp', 'inflation', 'utility', 'cost', 'revenue', 'profit', 'tax', 'subsidy']
  if (econPatterns.some(p => lower.includes(p))) return 'economics'

  return 'general'
}