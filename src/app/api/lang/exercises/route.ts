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
    const widgetKind = searchParams.get('widgetKind')
    const difficulty = searchParams.get('difficulty')
    const band = searchParams.get('band')
    const discriminator = searchParams.get('discriminator')

    if (!widgetKind) {
      return NextResponse.json(
        { error: 'widgetKind is required' },
        { status: 400 },
      )
    }

    // Whitelist widgetKind to prevent injection
    const allowedWidgetKinds = ['fill-blank', 'multiple-choice', 'sentence-reorder', 'punctuation', 'pos-tagger', 'subject-verb', 'tense-shift']
    if (!allowedWidgetKinds.includes(widgetKind)) {
      return NextResponse.json(
        { error: 'Invalid widgetKind' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    let query = (supabase as any).from('language_exercises').select('*').eq('widget_kind', widgetKind)

    if (difficulty) {
      const allowedDifficulties = ['easy', 'medium', 'hard', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
      if (!allowedDifficulties.includes(difficulty)) {
        return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
      }
      query = query.eq('difficulty', difficulty)
    }

    if (band) {
      query = query.eq('band', band)
    }

    if (discriminator) {
      const values = discriminator.split(',').map(function (v) { return v.trim() })
      if (values.length === 1) {
        query = query.eq('discriminator', values[0])
      } else {
        query = query.in('discriminator', values)
      }
    }

    query = query.order('band', { ascending: true }).order('difficulty', { ascending: true }).order('discriminator', { ascending: true })

    // Limit results to prevent abuse
    query = query.limit(200)

    const { data, error } = await query

    if (error) throw error

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exercises = (data || []).map(function (row: any) {
      return {
        ...row,
        options: row.options ? JSON.parse(row.options) : [],
        explanations: row.explanations ? JSON.parse(row.explanations) : [],
        correctIndex: row.correct_index,
        baseSentence: row.base_sentence || null,
        passage: row.passage || null,
      }
    })

    return NextResponse.json({ exercises: exercises })
  } catch (err: unknown) {
    console.error('[GET /api/lang/exercises]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
