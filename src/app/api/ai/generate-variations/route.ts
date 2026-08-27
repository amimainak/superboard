// ============================================================
// POST /api/ai/generate-variations
// Generates similar content variations for educational text
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-guard'
import { generateVariations } from '@/lib/ai/service'

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser()
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const { text, count } = body

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide at least 10 characters of content.' },
        { status: 400 }
      )
    }

    const n = typeof count === 'number' && count >= 1 && count <= 5 ? count : 3
    const variations = await generateVariations(text.trim(), n)

    return NextResponse.json({ variations })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to generate variations'
    const status = msg.includes('not configured') ? 503 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
