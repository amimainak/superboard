import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseBody, createTemplateSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = (supabase as any)
      .from('Template')
      .select('*')
      .eq('tutorId', user.id)
      .order('createdAt', { ascending: false })

    if (subject) query = query.eq('subject', subject)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { data: parsed, error: parseError } = parseBody(createTemplateSchema, body)
    if (parseError || !parsed) return NextResponse.json({ error: parseError || 'Invalid body' }, { status: 400 })

    const { name, subject, snapshot } = parsed

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('Template')
      .insert({ tutorId: user.id, name, subject, snapshot })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
