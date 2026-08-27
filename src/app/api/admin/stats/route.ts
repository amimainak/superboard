import { NextResponse } from 'next/server'
import { requireOwnerOrAdmin } from '@/lib/auth-guard'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/stats — system-wide analytics for admin dashboard
export async function GET() {
  try {
    const { user, response } = await requireOwnerOrAdmin()
    if (response) return response

    const supabase = await createClient()
    const sb = supabase as any

    // Total users
    const { count: totalUsers } = await sb
      .from('User')
      .select('*', { count: 'exact', head: true })

    // Users by tier
    const { data: tierData } = await sb
      .from('User')
      .select('tier')

    const tierCounts: Record<string, number> = { FREE: 0, PRO: 0, AGENCY: 0 }
    for (const u of (tierData || [])) {
      const t = (u.tier || 'FREE') as string
      tierCounts[t] = (tierCounts[t] || 0) + 1
    }

    // Total rooms
    const { count: totalRooms } = await sb
      .from('Room')
      .select('*', { count: 'exact', head: true })

    // Active rooms
    const { count: activeRooms } = await sb
      .from('Room')
      .select('*', { count: 'exact', head: true })
      .eq('isActive', true)

    // Rooms created today
    const today = new Date().toISOString().split('T')[0]
    const { count: roomsToday } = await sb
      .from('Room')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', today)

    // Total messages
    const { count: totalMessages } = await sb
      .from('ChatMessage')
      .select('*', { count: 'exact', head: true })

    // Templates count
    const { count: totalTemplates } = await sb
      .from('Template')
      .select('*', { count: 'exact', head: true })

    // Bookings count
    const { count: totalBookings } = await sb
      .from('Booking')
      .select('*', { count: 'exact', head: true })

    // Recent users (last 10) — try with role column, fall back without
    let recentUsers: any[]
    try {
      const res = await sb
        .from('User')
        .select('id, email, name, tier, role, isAdmin, createdAt')
        .order('createdAt', { ascending: false })
        .limit(10)
      recentUsers = res.data || []
    } catch {
      const res = await sb
        .from('User')
        .select('id, email, name, tier, isAdmin, createdAt')
        .order('createdAt', { ascending: false })
        .limit(10)
      recentUsers = res.data || []
    }

    // Recent rooms (last 10)
    const { data: recentRooms } = await sb
      .from('Room')
      .select('id, subject, isActive, tutorId, createdAt')
      .order('createdAt', { ascending: false })
      .limit(10)

    // Daily signups last 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13)
    fourteenDaysAgo.setHours(0, 0, 0, 0)

    const { data: allUsers } = await sb
      .from('User')
      .select('createdAt')
      .gte('createdAt', fourteenDaysAgo.toISOString())

    const dailySignups: Array<{ date: string; count: number }> = []
    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const count = (allUsers || []).filter((u: { createdAt: string }) =>
        u.createdAt.startsWith(dateStr)
      ).length
      dailySignups.push({ date: dateStr, count })
    }

    return NextResponse.json({
      users: {
        total: totalUsers || 0,
        byTier: tierCounts,
        dailySignups,
      },
      rooms: {
        total: totalRooms || 0,
        active: activeRooms || 0,
        today: roomsToday || 0,
        recent: recentRooms || [],
      },
      messages: totalMessages || 0,
      templates: totalTemplates || 0,
      bookings: totalBookings || 0,
      recentUsers: recentUsers || [],
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/stats]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
