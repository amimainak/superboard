// ============================================================
// API: Export — Cron processor (background job runner)
// ============================================================
// GET  /api/export/cron
//   Called by Vercel Cron on a schedule (see vercel.json).
//   Picks up pending ExportJobs, processes up to N per run, marks
//   each as 'completed' or 'failed', and emails the tutor.
//
//   Security: protected by EXPORT_CRON_SECRET — only Vercel Cron
//   (or an admin) can call this. The secret is passed via the
//   `authorization` header (Vercel Cron sends it automatically).
//
//   The job:
//     1. Mark job as 'processing' (atomic claim — updateMany with
//        WHERE status='pending' to prevent race conditions)
//     2. Build the ZIP via buildExportZip()
//     3. Store the ZIP as base64 in storagePath
//     4. Mark job as 'completed', set fileSizeBytes + boardCount
//     5. Email the tutor with the download link
//     6. On failure: mark as 'failed' with error message
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildExportZip } from '@/lib/export/build-export-zip'
import { sendEmail } from '@/lib/email/client'
import { exportReadyEmail } from '@/lib/email/templates'
import { getBranding } from '@/lib/branding'

const MAX_JOBS_PER_RUN = 3  // keep each cron invocation under the timeout
const MAX_ZIP_SIZE_BYTES = 8 * 1024 * 1024  // 8MB cap — DB storage limit for base64

export async function GET(request: NextRequest) {
  // Auth: secret header. Vercel Cron doesn't automatically inject one,
  // so we check both the Bearer pattern and the x-vercel-cron header.
  // The secret is stored in CRON_SECRET (or EXPORT_CRON_SECRET for
  // backwards compat).
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET || process.env.EXPORT_CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  // Accept either "Bearer <secret>" or raw "<secret>"
  const provided = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find pending jobs
    const pendingJobs = await db.exportJob.findMany({
      where: { status: 'pending' },
      orderBy: { requestedAt: 'asc' },
      take: MAX_JOBS_PER_RUN,
      select: { id: true, userId: true, requestedAt: true },
    })

    if (pendingJobs.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No pending jobs' })
    }

    const results: Array<{ jobId: string; status: string; boardCount?: number; error?: string }> = []

    for (const job of pendingJobs) {
      try {
        // 1. Atomic claim — only update if still pending (prevents races)
        const claimed = await db.exportJob.updateMany({
          where: { id: job.id, status: 'pending' },
          data: { status: 'processing', startedAt: new Date() },
        })
        if (claimed.count === 0) {
          // Someone else claimed it — skip
          results.push({ jobId: job.id, status: 'already-claimed' })
          continue
        }

        // 2. Build the ZIP
        const { buffer, boardCount, totalSize } = await buildExportZip({
          userId: job.userId,
          onProgress: (done, total, title) => {
            // Could log progress here if needed
            console.log(`[Export ${job.id}] Board ${done}/${total}: ${title}`)
          },
        })

        // 3. Size check
        if (totalSize > MAX_ZIP_SIZE_BYTES) {
          throw new Error(`Export too large (${(totalSize / 1024 / 1024).toFixed(1)}MB). Maximum is ${MAX_ZIP_SIZE_BYTES / 1024 / 1024}MB. Try archiving some boards first.`)
        }

        // 4. Store as base64 + mark completed
        const base64 = buffer.toString('base64')
        await db.exportJob.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            storagePath: base64,
            fileSizeBytes: totalSize,
            boardCount,
            completedAt: new Date(),
          },
        })

        // 5. Email the tutor
        const user = await db.user.findUnique({
          where: { id: job.userId },
          select: { email: true, name: true },
        })
        if (user?.email) {
          const downloadUrl = `${getBaseUrl()}/api/export/download/${job.id}`
          const branding = await getBranding(job.userId)
          try {
            const emailContent = exportReadyEmail({
              tutorName: user.name || user.email,
              boardCount,
              downloadUrl,
              fileSizeMb: totalSize / 1024 / 1024,
              recipientEmail: user.email,
              branding,
            })
            await sendEmail({
              to: user.email,
              subject: emailContent.subject,
              html: emailContent.html,
            })
          } catch (e) {
            // Email failure is non-fatal — the job still completed
            console.error(`[Export ${job.id}] Email failed:`, e)
          }
        }

        results.push({ jobId: job.id, status: 'completed', boardCount })
      } catch (e) {
        // Mark as failed
        const errorMsg = e instanceof Error ? e.message : 'Unknown error'
        await db.exportJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error: errorMsg,
            completedAt: new Date(),
          },
        })
        console.error(`[Export ${job.id}] Failed:`, errorMsg)
        results.push({ jobId: job.id, status: 'failed', error: errorMsg })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('[Export Cron]', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}

function getBaseUrl(): string {
  // Prefer NEXT_PUBLIC_SITE_URL (custom domain) over VERCEL_URL
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (publicUrl) return publicUrl
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return `https://${vercelUrl}`
  return 'https://superboard.app'
}
