import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createTemplateSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const templates = await db.template.findMany({
      where: { tutorId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(templates)
  } catch (err: unknown) {
    console.error('[GET /api/templates]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = createTemplateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })

    const template = await db.template.create({
      data: {
        tutorId: user.id,
        name: parsed.data.name,
        subject: parsed.data.subject || 'GENERAL',
        snapshot: (parsed.data.snapshot || {}) as unknown as object,
      },
    })
    return NextResponse.json(template, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/templates]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
