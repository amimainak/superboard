import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if (authCheck instanceof NextResponse) return authCheck
  try {
    const { searchParams } = new URL(request.url)
    const pos = searchParams.get('pos')
    const level = searchParams.get('level')

    if (pos) {
      const values = pos.split(',').map(v => v.trim())
      const allowed = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'interjection']
      for (const v of values) {
        if (!allowed.includes(v)) return NextResponse.json({ error: 'Invalid POS value' }, { status: 400 })
      }
    }

    const where: Record<string, unknown> = {}
    if (pos) {
      const values = pos.split(',').map(v => v.trim())
      where.pos = values.length === 1 ? values[0] : { in: values }
    }
    if (level) where.level = level

    const cards = await db.vocabCard.findMany({
      where,
      take: 200,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ cards })
  } catch (err: unknown) {
    console.error('[GET /api/lang/vocab]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
