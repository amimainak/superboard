// ============================================================
// API: Replay Cleanup Cron — delete old BoardEvents
// ============================================================
// GET  /api/replay/cleanup
//   Called by Vercel Cron daily. Deletes BoardEvents older than:
//     • 90 days for FREE-tier tutors
//     • Forever for Pro-tier tutors (no deletion)
//
//   This keeps the BoardEvent table from growing without bound
//   while preserving Pro tutors' replay history indefinitely.
//
//   Secret-protected (CRON_SECRET).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const FREE_TIER_RETENTION_DAYS = 90
const PRO_TIERS = ['PRO', 'AGENCY', 'AGENCY_STANDARD', 'AGENCY_PREMIUM']
const BATCH_SIZE = 5000  // delete in batches to avoid long-running queries

export async function GET(request: NextRequest) {
  // Auth
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
    const cutoff = new Date(Date.now() - FREE_TIER_RETENTION_DAYS * 24 * 60 * 60 * 1000)

    // Find all rooms owned by FREE-tier tutors
    const freeTutorRooms = await db.room.findMany({
      where: {
        tutor: {
          tier: 'FREE',
        },
      },
      select: { id: true },
      take: 10000,
    })

    const freeRoomIds = freeTutorRooms.map(r => r.id)
    if (freeRoomIds.length === 0) {
      return NextResponse.json({ deleted: 0, message: 'No FREE-tier rooms to clean' })
    }

    // Delete old events in batches
    let totalDeleted = 0
    let batchDeleted = 0
    do {
      // Find a batch of old event IDs to delete
      const oldEvents = await db.boardEvent.findMany({
        where: {
          roomId: { in: freeRoomIds },
          timestamp: { lt: cutoff },
        },
        select: { id: true },
        take: BATCH_SIZE,
      })

      if (oldEvents.length === 0) break

      // Delete by IDs
      await db.boardEvent.deleteMany({
        where: { id: { in: oldEvents.map(e => e.id) } },
      })

      batchDeleted = oldEvents.length
      totalDeleted += batchDeleted
    } while (batchDeleted === BATCH_SIZE)  // keep going if we hit the batch limit

    return NextResponse.json({
      deleted: totalDeleted,
      cutoff: cutoff.toISOString(),
      freeRoomsChecked: freeRoomIds.length,
    })
  } catch (error) {
    console.error('[Replay Cleanup Cron]', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
