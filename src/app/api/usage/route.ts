import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const logs = await db.usageLog.findMany({
      where: { userId: user.id },
      orderBy: { periodStartDate: 'desc' },
      take: 30,
    })

    const current = logs[0] || { videoMinutesUsed: 0, aiCreditsUsed: 0 }
    return NextResponse.json({
      videoMinutesUsed: current.videoMinutesUsed,
      aiCreditsUsed: current.aiCreditsUsed,
      history: logs,
    })
  } catch (err: unknown) {
    console.error('[GET /api/usage]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
