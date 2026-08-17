import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseBody, usageHeartbeatSchema } from '@/lib/validations'
import { getAuthenticatedUser } from '@/lib/auth-guard'

// GET /api/usage — fetch current period usage for authenticated user
export async function GET() {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('UsageLog')
      .select('*')
      .eq('userId', user!.id)
      .order('periodStartDate', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return NextResponse.json(data ?? {
      userId: user!.id,
      periodStartDate: new Date().toISOString(),
      videoMinutesUsed: 0,
      aiCreditsUsed: 0,
      estimatedAiSpendCents: 0,
    })
  } catch (err: unknown) {
    console.error('[GET /api/usage]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/usage — record usage (video minutes, AI credits)
export async function POST(request: Request) {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const supabase = await createClient()

    const body = await request.json()
    const { data: parsed, error: parseError } = parseBody(usageHeartbeatSchema, body)
    if (parseError) return NextResponse.json({ error: parseError }, { status: 400 })

    if (!parsed) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

    // A-05: Don't trust client minutesUsed — cap per-heartbeat to 5 minutes max
    const MAX_MINUTES_PER_HEARTBEAT = 5
    const MAX_SESSION_MINUTES = 180
    if (parsed.minutesUsed != null) {
      parsed.minutesUsed = Math.min(parsed.minutesUsed, MAX_MINUTES_PER_HEARTBEAT)
    }

    // Upsert usage for current period
    const periodStart = new Date()
    periodStart.setDate(1)
    periodStart.setHours(0, 0, 0, 0)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('UsageLog')
      .select('*')
      .eq('userId', user!.id)
      .gte('periodStartDate', periodStart.toISOString())
      .limit(1)
      .single()

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
    // A-05: Reject if total session minutes would exceed 180
    if (parsed.type === 'video' && parsed.minutesUsed) {
      const currentTotal = existing?.videoMinutesUsed || 0
      if (currentTotal + parsed.minutesUsed > MAX_SESSION_MINUTES) {
        return NextResponse.json(
          { error: 'Session usage limit exceeded' },
          { status: 429 }
        )
      }
    }

    if (existing) {
      const { error } = await sb
        .from('UsageLog')
        .update(updates)
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await sb.from('UsageLog').insert({
        userId: user!.id,
        periodStartDate: periodStart.toISOString(),
        ...updates,
      })
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[POST /api/usage]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
