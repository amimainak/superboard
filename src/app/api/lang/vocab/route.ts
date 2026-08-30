import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: Request) {
  const authCheck = await requireAuth(request)
  if (authCheck instanceof NextResponse) return authCheck
  try {
    const { searchParams } = new URL(request.url)
    const pos = searchParams.get('pos')
    const level = searchParams.get('level')

    // Validate query params to prevent injection
    if (pos) {
      const values = pos.split(',').map(function (v) { return v.trim() })
      // Whitelist allowed POS values to prevent arbitrary column queries
      const allowedPOS = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'determiner', 'modal', 'auxiliary']
      for (const v of values) {
        if (!allowedPOS.includes(v.toLowerCase())) {
          return NextResponse.json({ error: 'Invalid POS value' }, { status: 400 })
        }
      }
    }

    const supabase = await createClient()

    let query = (supabase as any).from('vocab_cards').select('*')

    if (pos) {
      const values = pos.split(',').map(function (v) { return v.trim() })
      if (values.length === 1) {
        query = query.eq('pos', values[0])
      } else {
        query = query.in('pos', values)
      }
    }

    if (level) {
      // Whitelist allowed levels
      const allowedLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'beginner', 'intermediate', 'advanced']
      if (!allowedLevels.includes(level.toLowerCase())) {
        return NextResponse.json({ error: 'Invalid level value' }, { status: 400 })
      }
      query = query.eq('level', level)
    }

    // Limit results
    query = query.limit(200)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ cards: data || [] })
  } catch (err: unknown) {
    console.error('[GET /api/lang/vocab]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
