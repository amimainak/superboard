import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseBody, updateTemplateSchema } from '@/lib/validations'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('Template')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status:  401 })

    const body = await request.json()
    const { data: parsed, error: parseError } = parseBody(updateTemplateSchema, body)
    if (parseError || !parsed) return NextResponse.json({ error: parseError || 'Invalid body' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = { ...parsed }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('Template')
      .update(updates)
      .eq('id', templateId)
      .eq('tutorId', user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await (supabase as any)
      .from('Template')
      .delete()
      .eq('id', templateId)
      .eq('tutorId', user.id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
