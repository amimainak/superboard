// ============================================================
// API: Export — Download the completed ZIP
// ============================================================
// GET  /api/export/download/[jobId]
//   Streams the completed ZIP file to the tutor's browser.
//
//   Only the job's owner can download. The job must be in
//   'completed' status. The ZIP is stored in the DB as base64
//   (pragmatic for Vercel — no external storage needed). We
//   decode and stream it with the right headers.
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
        storagePath: true,  // base64-encoded ZIP
        fileSizeBytes: true,
        completedAt: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    if (job.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (job.status !== 'completed') {
      return NextResponse.json(
        { error: `Job is ${job.status}, not ready for download` },
        { status: 409 }
      )
    }
    if (!job.storagePath) {
      return NextResponse.json({ error: 'File not found — please request a new export' }, { status: 404 })
    }

    // Decode the base64 ZIP
    const zipBuffer = Buffer.from(job.storagePath, 'base64')

    // Filename
    const filename = `superboard-export-${new Date(job.completedAt!).toISOString().split('T')[0]}.zip`

    // Stream it back
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(zipBuffer.length),
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    console.error('[Export Download GET]', error)
    return NextResponse.json({ error: 'Failed to download' }, { status: 500 })
  }
}
