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
    const widgetKind = searchParams.get('widgetKind')
    const difficulty = searchParams.get('difficulty')
    const band = searchParams.get('band')
    const discriminator = searchParams.get('discriminator')

    if (!widgetKind) return NextResponse.json({ error: 'widgetKind is required' }, { status: 400 })

    const allowedWidgetKinds = ['fill-blank', 'multiple-choice', 'sentence-reorder', 'punctuation', 'pos-tagger', 'subject-verb', 'tense-shift']
    if (!allowedWidgetKinds.includes(widgetKind)) return NextResponse.json({ error: 'Invalid widgetKind' }, { status: 400 })

    const where: Record<string, unknown> = { widgetKind }
    if (difficulty) {
      const allowedDifficulties = ['easy', 'medium', 'hard', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
      if (!allowedDifficulties.includes(difficulty)) return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
      where.difficulty = difficulty
    }
    if (band) where.band = band
    if (discriminator) {
      const values = discriminator.split(',').map(v => v.trim())
      where.discriminator = values.length === 1 ? values[0] : { in: values }
    }

    const exercises = await db.languageExercise.findMany({
      where,
      orderBy: [{ band: 'asc' }, { difficulty: 'asc' }, { discriminator: 'asc' }],
      take: 200,
    })

    return NextResponse.json({ exercises })
  } catch (err: unknown) {
    console.error('[GET /api/lang/exercises]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
