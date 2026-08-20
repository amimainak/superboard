import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const widgetKind = searchParams.get('widgetKind')
    const difficulty = searchParams.get('difficulty')
    const band = searchParams.get('band')
    const discriminator = searchParams.get('discriminator')

    if (!widgetKind) {
      return NextResponse.json(
        { error: 'widgetKind is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = await createClient()

    let query = (supabase as any).from('language_exercises').select('*').eq('widget_kind', widgetKind)

    if (difficulty) {
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

    return NextResponse.json({ exercises: exercises }, { headers: corsHeaders })
  } catch (err: unknown) {
    console.error('[GET /api/lang/exercises]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
