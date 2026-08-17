import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseBody, usageHeartbeatSchema } from '@/lib/validations'

// GET /api/usage — fetch current period usage for authenticated user
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('UsageLog')
      .select('*')
      .eq('userId', user.id)
      .order('periodStartDate', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return NextResponse.json(data ?? {
      userId: user.id,
      periodStartDate: new Date().toISOString(),
      videoMinutesUsed: 0,
      aiCreditsUsed: 0,
      estimatedAiSpendCents: 0,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/usage/heartbeat — record usage (video minutes, AI credits)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { data: parsed, error: parseError } = parseBody(usageHeartbeatSchema, body)
    if (parseError) return NextResponse.json({ error: parseError }, { status: 400 })

    if (!parsed) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

    // Upsert usage for current period
    const periodStart = new Date()
    periodStart.setDate(1)
    periodStart.setHours(0, 0, 0, 0)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('UsageLog')
      .select('*')
      .eq('userId', user.id)
      .gte('periodStartDate', periodStart.toISOString())
      .limit(1)
      .single()

    const now = new Date().toISOString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {}

    if (parsed.type === 'video' && parsed.minutesUsed) {
      updates.videoMinutesUsed = (existing?.videoMinutesUsed || 0) + parsed.minutesUsed
    } else if (parsed.type === 'ai') {
      updates.aiCreditsUsed = (existing?.aiCreditsUsed || 0) + 1
      updates.estimatedAiSpendCents = (existing?.estimatedAiSpendCents || 0) + 1 // ~$0.01 per credit
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    if (existing) {
      const { error } = await sb
        .from('UsageLog')
        .update(updates)
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await sb.from('UsageLog').insert({
        userId: user.id,
        periodStartDate: periodStart.toISOString(),
        ...updates,
      })
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
