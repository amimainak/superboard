import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('User')
      .select('installedWidgets')
      .eq('id', user.id)
      .single()

    const installed = profile?.installedWidgets || []
    return NextResponse.json({ installedTools: installed })
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
    const installedTools: string[] = body.installedTools || []

    // Validate: only allow known marketplace tool IDs
    const ALLOWED_IDS = [
      'lang-root-morphology',
      'lang-active-passive',
      'lang-reading-strategies',
      'lang-grammar-diagnostic',
      'lang-spelling-patterns',
    ]
    const validTools = installedTools.filter((id: string) => ALLOWED_IDS.includes(id))

    const { data, error } = await (supabase as any)
      .from('User')
      .update({ installedWidgets: validTools })
      .eq('id', user.id)
      .select('installedWidgets')
      .single()

    if (error) throw error
    return NextResponse.json({ installedTools: data?.installedWidgets || validTools })
  } catch (err: unknown) {
    console.error('[PUT /api/user/widgets]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
