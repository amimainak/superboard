// ============================================================
// API: Export — Request a full data export
// ============================================================
// POST  /api/export/request
//   Creates an ExportJob row with status 'pending'. The Vercel
//   Cron job (/api/export/cron) picks it up, builds the ZIP, and
//   emails the tutor a download link.
//
//   Returns { jobId, status: 'pending' } immediately — the actual
//   processing happens asynchronously.
//
//   We rate-limit to 1 export per hour per user to prevent abuse.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const RATE_LIMIT_MS = 60 * 60 * 1000  // 1 hour

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId

    // Rate limit: check if the user has a pending or recently-completed export
    const recent = await db.exportJob.findFirst({
      where: {
        userId,
        OR: [
          { status: 'pending' },
          { status: 'processing' },
          {
            status: 'completed',
            completedAt: { gt: new Date(Date.now() - RATE_LIMIT_MS) },
          },
        ],
      },
      orderBy: { requestedAt: 'desc' },
      select: { id: true, status: true, requestedAt: true, completedAt: true },
    })

    if (recent) {
      const msg = recent.status === 'completed'
        ? `You already exported recently. Try again after ${new Date(recent.completedAt!.getTime() + RATE_LIMIT_MS).toLocaleString()}.`
        : `You already have a ${recent.status} export. We'll email you when it's ready.`
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: msg, existingJobId: recent.id, existingStatus: recent.status },
        { status: 429 }
      )
    }

    // Create the job
    const job = await db.exportJob.create({
      data: {
        userId,
        status: 'pending',
        format: 'zip+pdf',
      },
      select: { id: true, status: true, requestedAt: true },
    })

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      requestedAt: job.requestedAt.toISOString(),
      message: 'Export queued. We\'ll email you when it\'s ready — usually within a few minutes.',
    }, { status: 202 })
  } catch (error) {
    console.error('[Export Request POST]', error)
    return NextResponse.json({ error: 'Failed to request export' }, { status: 500 })
  }
}
