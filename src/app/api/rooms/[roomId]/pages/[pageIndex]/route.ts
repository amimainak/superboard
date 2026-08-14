import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string; pageIndex: string }> }
) {
  try {
    const { roomId, pageIndex } = await params
    const supabase = await createClient()

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
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roomId: string; pageIndex: string }> }
) {
  try {
    const { roomId, pageIndex } = await params
    const supabase = await createClient()
    const { snapshot } = await request.json()

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
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
