import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { updateTemplateSchema } from '@/lib/validations'
import { getAuthenticatedUser } from '@/lib/auth-guard'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const { templateId } = await params
    const template = await db.template.findFirst({
      where: { id: templateId, tutorId: user!.id },
    })
    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(template)
  } catch (err: unknown) {
    console.error('GET /api/templates/[templateId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = updateTemplateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })

    const template = await db.template.updateMany({
      where: { id: templateId, tutorId: user.id },
      data: parsed.data as Record<string, unknown>,
    })
    if (template.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await db.template.findUnique({ where: { id: templateId } })
    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('PATCH /api/templates/[templateId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    await db.template.deleteMany({ where: { id: templateId, tutorId: user.id } })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('DELETE /api/templates/[templateId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
