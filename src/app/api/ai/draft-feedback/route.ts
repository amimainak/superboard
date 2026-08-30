// ============================================================
// POST /api/ai/draft-feedback
// Provides constructive writing feedback on student drafts
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-guard'
import { getDraftFeedback } from '@/lib/ai/service'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser()
  if (auth.response) return auth.response

  const { allowed } = rateLimit('ai:draft-feedback:' + auth.user!.id, 10, 60000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { text, context } = body

    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please provide at least 20 characters of draft text.' },
        { status: 400 }
      )
    }

    const draftText = text.trim()
    if (draftText.length > 10000) {
      return NextResponse.json({ error: 'Input too long. Maximum 10,000 characters.' }, { status: 400 })
    }

    const result = await getDraftFeedback(text.trim(), context)

    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to analyze draft'
    const status = msg.includes('not configured') ? 503 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
