// ============================================================
// API: Replay Cleanup Cron — delete old BoardEvents
// ============================================================
// GET  /api/replay/cleanup
//   Called by Vercel Cron daily. Deletes BoardEvents older than:
//     • 90 days for FREE-tier tutors
//     • 2 years for Pro-tier tutors (prevents unbounded growth)
//
//   Secret-protected (CRON_SECRET).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const FREE_TIER_RETENTION_DAYS = 90
const PRO_TIER_RETENTION_DAYS = 730  // 2 years
const PRO_TIERS = ['PRO', 'AGENCY', 'AGENCY_STANDARD', 'AGENCY_PREMIUM']
const BATCH_SIZE = 5000

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET || process.env.EXPORT_CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const provided = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = Date.now()
    const freeCutoff = new Date(now - FREE_TIER_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    const proCutoff = new Date(now - PRO_TIER_RETENTION_DAYS * 24 * 60 * 60 * 1000)

    // Find rooms grouped by tutor tier
    const [freeTutorRooms, proTutorRooms] = await Promise.all([
      db.room.findMany({
        where: { tutor: { tier: 'FREE' } },
        select: { id: true },
        take: 10000,
      }),
      db.room.findMany({
        where: { tutor: { tier: { in: PRO_TIERS } } },
        select: { id: true },
        take: 10000,
      }),
    ])

    const freeRoomIds = freeTutorRooms.map(r => r.id)
    const proRoomIds = proTutorRooms.map(r => r.id)
    let totalDeleted = 0

    // Delete FREE-tier events older than 90 days
    totalDeleted += await deleteBatched(freeRoomIds, freeCutoff)
    // Delete Pro-tier events older than 2 years
    totalDeleted += await deleteBatched(proRoomIds, proCutoff)

    return NextResponse.json({
      deleted: totalDeleted,
      freeCutoff: freeCutoff.toISOString(),
      proCutoff: proCutoff.toISOString(),
      freeRoomsChecked: freeRoomIds.length,
      proRoomsChecked: proRoomIds.length,
    })
  } catch (error) {
    console.error('[Replay Cleanup Cron]', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}

async function deleteBatched(roomIds: string[], cutoff: Date): Promise<number> {
  if (roomIds.length === 0) return 0
  let totalDeleted = 0
  let batchDeleted = 0
  do {
    const oldEvents = await db.boardEvent.findMany({
      where: {
        roomId: { in: roomIds },
        timestamp: { lt: cutoff },
      },
      select: { id: true },
      take: BATCH_SIZE,
    })
    if (oldEvents.length === 0) break
    await db.boardEvent.deleteMany({
      where: { id: { in: oldEvents.map(e => e.id) } },
    })
    batchDeleted = oldEvents.length
    totalDeleted += batchDeleted
  } while (batchDeleted === BATCH_SIZE)
  return totalDeleted
}
