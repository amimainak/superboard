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
    const pos = searchParams.get('pos')
    const level = searchParams.get('level')

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
      query = query.eq('level', level)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ cards: data || [] }, { headers: corsHeaders })
  } catch (err: unknown) {
    console.error('[GET /api/lang/vocab]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
