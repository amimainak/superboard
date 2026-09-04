import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Widget curation is stored inside the installedWidgets JSON field
// under a "widgetCuration" key.

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const u = await db.user.findUnique({
      where: { id: user.id },
      select: { installedWidgets: true },
    })

    let curation: Record<string, unknown> = {}
    if (u?.installedWidgets && typeof u.installedWidgets === 'object') {
      const installed = u.installedWidgets as Record<string, unknown>
      if (installed.widgetCuration && typeof installed.widgetCuration === 'object') {
        curation = installed.widgetCuration as Record<string, unknown>
      }
    }

    return NextResponse.json(curation)
  } catch (err: unknown) {
    console.error('[GET /api/user/widget-curation]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const u = await db.user.findUnique({
      where: { id: user.id },
      select: { installedWidgets: true },
    })

    const existing = (u?.installedWidgets as Record<string, unknown>) || {}
    const updated = { ...existing, widgetCuration: body }

    await db.user.update({
      where: { id: user.id },
      data: { installedWidgets: updated },
    })

    return NextResponse.json(body)
  } catch (err: unknown) {
    console.error('[PUT /api/user/widget-curation]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
