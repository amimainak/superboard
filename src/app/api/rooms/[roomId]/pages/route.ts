import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('BoardPage')
      .select('*')
      .eq('roomId', roomId)
      .order('pageIndex', { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const supabase = await createClient()

    const body = await request.json()
    const pages = body.pages

    await (supabase as any).from('BoardPage').delete().eq('roomId', roomId)

    if (pages && pages.length > 0) {
      const rows = pages.map((p: { pageIndex: number; snapshot: any }) => ({
        roomId,
        pageIndex: p.pageIndex,
        snapshot: p.snapshot,
      }))
      const { error } = await (supabase as any).from('BoardPage').insert(rows)
      if (error) throw error
    }

    return NextResponse.json({ success: true, count: pages?.length || 0 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
