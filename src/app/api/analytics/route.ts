import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-guard'

// GET /api/analytics — tutor analytics dashboard
export async function GET() {
  try {
    const { user, response } = await getAuthenticatedUser()
    if (response) return response

    const supabase = await createClient()

    const sb = supabase as any

    // 1. Total rooms created
    const { count: totalRooms, error: err1 } = await sb
      .from('Room')
      .select('*', { count: 'exact', head: true })
      .eq('tutorId', user!.id)
    if (err1) throw err1

    // 2. Total sessions completed (isActive=false and endedAt is not null)
    const { count: completedSessions, error: err2 } = await sb
      .from('Room')
      .select('*', { count: 'exact', head: true })
      .eq('tutorId', user!.id)
      .eq('isActive', false)
      .not('endedAt', 'is', null)
    if (err2) throw err2

    // 3. Total teaching minutes
    const { data: durationData, error: err3 } = await sb
      .from('Room')
      .select('durationMinutes')
      .eq('tutorId', user!.id)
      .eq('isActive', false)
    if (err3) throw err3
    const totalMinutes = (durationData || []).reduce((sum: number, r: { durationMinutes: number }) => sum + (r.durationMinutes || 0), 0)

    // 4. Sessions per subject breakdown
    const { data: subjectData, error: err4 } = await sb
      .from('Room')
      .select('subject')
      .eq('tutorId', user!.id)
      .eq('isActive', false)
      .not('endedAt', 'is', null)
    if (err4) throw err4

    const subjectCounts: Record<string, number> = {}
    for (const r of (subjectData || [])) {
      const subj = (r.subject || 'General') as string
      subjectCounts[subj] = (subjectCounts[subj] || 0) + 1
    }
    const subjectBreakdown = Object.entries(subjectCounts)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)

    // 5. Recent 7 days session trend (count of rooms created per day)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data: recentRooms, error: err5 } = await sb
      .from('Room')
      .select('createdAt')
      .eq('tutorId', user!.id)
      .gte('createdAt', sevenDaysAgo.toISOString())
      .order('createdAt', { ascending: true })
    if (err5) throw err5

    // Build day-by-day counts
    const dailyTrend: { date: string; day: string; count: number }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
      const count = (recentRooms || []).filter((r: { createdAt: string }) =>
        r.createdAt.startsWith(dateStr)
      ).length
      dailyTrend.push({ date: dateStr, day: dayLabel, count })
    }

    // 6. Current period usage (UsageLog)
    const periodStart = new Date()
    periodStart.setDate(1)
    periodStart.setHours(0, 0, 0, 0)

    const { data: usageLog, error: err6 } = await sb
      .from('UsageLog')
      .select('videoMinutesUsed, aiCreditsUsed')
      .eq('userId', user!.id)
      .gte('periodStartDate', periodStart.toISOString())
      .limit(1)
      .single()
    // PGRST116 = no rows — that's fine, defaults to 0
    if (err6 && err6.code !== 'PGRST116') throw err6

    const videoMinutesUsed = usageLog?.videoMinutesUsed || 0
    const aiCreditsUsed = usageLog?.aiCreditsUsed || 0

    // 7. Get user tier for limits
    const { data: userProfile, error: err7 } = await sb
      .from('User')
      .select('tier')
      .eq('id', user!.id)
      .single()
    if (err7 && err7.code !== 'PGRST116') throw err7

    const tier = (userProfile?.tier || 'FREE') as string

    return NextResponse.json({
      totalRooms: totalRooms || 0,
      completedSessions: completedSessions || 0,
      totalMinutes,
      subjectBreakdown,
      dailyTrend,
      usage: {
        videoMinutesUsed,
        aiCreditsUsed,
      },
      tier,
    })
  } catch (err: unknown) {
    console.error('[GET /api/analytics]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
