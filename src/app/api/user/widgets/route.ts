import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const ALLOWED_WIDGETS = ['chat', 'participants', 'video', 'recording', 'notes', 'ai', 'math', 'physics', 'chemistry', 'biology', 'language', 'statistics', 'earthscience', 'arts', 'classroom']

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const u = await db.user.findUnique({
      where: { id: user.id },
      select: { installedWidgets: true },
    })

    let widgets: string[] = []
    if (u?.installedWidgets && typeof u.installedWidgets === 'object') {
      const installed = u.installedWidgets as Record<string, unknown>
      if (Array.isArray(installed.widgets)) {
        widgets = installed.widgets.filter((w: unknown) => typeof w === 'string' && ALLOWED_WIDGETS.includes(w as string)) as string[]
      }
    }

    return NextResponse.json({ widgets })
  } catch (err: unknown) {
    console.error('[GET /api/user/widgets]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!Array.isArray(body.widgets)) {
      return NextResponse.json({ error: 'widgets must be an array' }, { status: 400 })
    }

    // Validate widget IDs
    const widgets = body.widgets.filter((w: string) => typeof w === 'string' && ALLOWED_WIDGETS.includes(w))

    await db.user.update({
      where: { id: user.id },
      data: { installedWidgets: { widgets } },
    })

    return NextResponse.json({ widgets })
  } catch (err: unknown) {
    console.error('[PUT /api/user/widgets]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
