import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('session_notes')
      .select('*')
      .eq('room_id', roomId)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json(
      {
        content: data ? data.content : '',
        updatedAt: data ? data.updated_at : null,
      },
      { headers: corsHeaders }
    )
  } catch (err: unknown) {
    console.error('[GET /api/rooms/[roomId]/notes]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const body = await request.json()
    const { content } = body

    const supabase = await createClient()
    const now = new Date().toISOString()

    // Check if note exists
    const { data: existing } = await (supabase as any)
      .from('session_notes')
      .select('room_id')
      .eq('room_id', roomId)
      .maybeSingle()

    if (existing) {
      const { error } = await (supabase as any)
        .from('session_notes')
        .update({
          content: content,
          updated_at: now,
        })
        .eq('room_id', roomId)

      if (error) throw error
    } else {
      const { error } = await (supabase as any)
        .from('session_notes')
        .insert({
          room_id: roomId,
          content: content,
          updated_at: now,
        })

      if (error) throw error
    }

    return NextResponse.json(
      { success: true, updatedAt: now },
      { headers: corsHeaders }
    )
  } catch (err: unknown) {
    console.error('[PUT /api/rooms/[roomId]/notes]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
