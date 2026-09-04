import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { requireOwnerOrAdmin } from '@/lib/auth-guard'

export async function GET() {
  try {
    const auth = await requireOwnerOrAdmin()
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: 403 })

    const [totalUsers, proUsers, agencyUsers, totalRooms, activeRooms, freeUsers] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { tier: 'PRO' } }),
      db.user.count({ where: { tier: 'AGENCY' } }),
      db.room.count(),
      db.room.count({ where: { isActive: true } }),
      db.user.count({ where: { tier: 'FREE' } }),
    ])

    return NextResponse.json({
      totalUsers,
      freeUsers,
      proUsers,
      agencyUsers,
      totalRooms,
      activeRooms,
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/stats]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
