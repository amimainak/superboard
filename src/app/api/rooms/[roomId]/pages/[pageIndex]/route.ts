import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseBody, upsertPageSchema } from '@/lib/validations'
import { getAuthenticatedUser } from '@/lib/auth-guard'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string; pageIndex: string }> }
) {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const { roomId, pageIndex } = await params
    const supabase = await createClient()

    // Verify room ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: room } = await (supabase as any).from('Room').select('tutorId').eq('id', roomId).single()
    if (!room || room.tutorId !== user?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('BoardPage')
      .select('*')
      .eq('roomId', roomId)
      .eq('pageIndex', parseInt(pageIndex))
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('[GET /api/rooms/[roomId]/pages/[pageIndex]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roomId: string; pageIndex: string }> }
) {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const { roomId, pageIndex } = await params
    const supabase = await createClient()

    // Verify room ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: room } = await (supabase as any).from('Room').select('tutorId').eq('id', roomId).single()
    if (!room || room.tutorId !== user?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { data: parsed, error: parseError } = parseBody(upsertPageSchema, body)
    if (parseError || !parsed) return NextResponse.json({ error: parseError || 'Invalid body' }, { status: 400 })

    const { snapshot } = parsed

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('BoardPage')
      .upsert(
        { roomId, pageIndex: parseInt(pageIndex), snapshot },
        { onConflict: 'roomId,pageIndex' }
      )

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('[PUT /api/rooms/[roomId]/pages/[pageIndex]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
