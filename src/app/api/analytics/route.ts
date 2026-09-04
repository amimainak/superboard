import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [totalRooms, activeRooms, totalSessions] = await Promise.all([
      db.room.count({ where: { tutorId: user.id } }),
      db.room.count({ where: { tutorId: user.id, isActive: true } }),
      db.room.count({ where: { tutorId: user.id, endedAt: { not: null } } }),
    ])

    return NextResponse.json({ totalRooms, activeRooms, totalSessions })
  } catch (err: unknown) {
    console.error('[GET /api/analytics]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
