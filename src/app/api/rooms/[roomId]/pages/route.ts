import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseBody, savePagesSchema } from '@/lib/validations'
import { getAuthenticatedUser } from '@/lib/auth-guard'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const { roomId } = await params
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: room } = await (supabase as any).from('Room').select('tutorId').eq('id', roomId).single()
    if (!room || room.tutorId !== user?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('BoardPage')
      .select('*')
      .eq('roomId', roomId)
      .order('pageIndex', { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('[GET /api/rooms/[roomId]/pages]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const { roomId } = await params
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: room } = await (supabase as any).from('Room').select('tutorId').eq('id', roomId).single()
    if (!room || room.tutorId !== user?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { data: parsed, error: parseError } = parseBody(savePagesSchema, body)
    if (parseError || !parsed) return NextResponse.json({ error: parseError || 'Invalid body' }, { status: 400 })

    const pages = parsed.pages

    // Use upsert instead of delete+insert to prevent data loss on failure
    if (pages && pages.length > 0) {
      const rows = pages.map((p: { pageIndex: number; snapshot: any }) => ({
        roomId,
        pageIndex: p.pageIndex,
        snapshot: p.snapshot,
      }))
      const { error } = await (supabase as any).from('BoardPage').upsert(rows, { onConflict: 'roomId,pageIndex' })
      if (error) throw error
    }

    return NextResponse.json({ success: true, count: pages?.length || 0 })
  } catch (err: unknown) {
    console.error('[PUT /api/rooms/[roomId]/pages]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
