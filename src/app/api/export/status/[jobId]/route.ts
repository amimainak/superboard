// ============================================================
// API: Export — Status check
// ============================================================
// GET  /api/export/status/[jobId]
//   Returns the current status of an export job. Used by the UI
//   to show progress ("pending", "processing", "completed", "failed").
//
//   Only the job's owner can check its status.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

type RouteContext = { params: Promise<{ jobId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId
    const { jobId } = await context.params

    const job = await db.exportJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        userId: true,
        status: true,
        boardCount: true,
        fileSizeBytes: true,
        error: true,
        requestedAt: true,
        startedAt: true,
        completedAt: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    if (job.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      boardCount: job.boardCount,
      fileSizeBytes: job.fileSizeBytes,
      fileSizeMb: Math.round((job.fileSizeBytes / 1024 / 1024) * 10) / 10,
      error: job.error,
      requestedAt: job.requestedAt.toISOString(),
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
    })
  } catch (error) {
    console.error('[Export Status GET]', error)
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}
