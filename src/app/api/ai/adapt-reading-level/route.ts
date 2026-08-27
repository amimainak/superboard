// ============================================================
// POST /api/ai/adapt-reading-level
// Adapts text to a target reading level (simplify or bulletize)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-guard'
import { adaptReadingLevel, type ReadingLevel } from '@/lib/ai/service'

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser()
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const { text, targetLevel, mode } = body

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide at least 10 characters of content.' },
        { status: 400 }
      )
    }

    const validLevels: ReadingLevel[] = ['elementary', 'middle-school', 'high-school', 'college']
    const level = validLevels.includes(targetLevel) ? targetLevel : 'middle-school'
    const m = mode === 'bulletize' ? 'bulletize' : 'simplify'

    const result = await adaptReadingLevel(text.trim(), level, m)

    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to adapt text'
    const status = msg.includes('not configured') ? 503 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
