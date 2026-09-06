// ============================================================
// API: Export — Request a full data export
// ============================================================
// POST  /api/export/request
//   Creates an ExportJob row. Then tries to process it inline if
//   the tutor has a small number of boards (under INLINE_THRESHOLD)
//   so they get an instant download. For larger exports, falls
//   back to the daily Vercel Cron job + email notification.
//
//   Returns { jobId, status, processedInline? } immediately.
//
//   Rate-limited to 1 export per hour per user.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { buildExportZip } from '@/lib/export/build-export-zip'
import { sendEmail } from '@/lib/email/client'
import { exportReadyEmail } from '@/lib/email/templates'
import { getBranding } from '@/lib/branding'

const RATE_LIMIT_MS = 60 * 60 * 1000  // 1 hour
const INLINE_THRESHOLD = 8  // boards under this count → try inline
const MAX_INLINE_ZIP_BYTES = 4 * 1024 * 1024  // 4MB cap for inline (Hobby 10s timeout)

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const userId = (auth as { userId: string }).userId

    // Rate limit
    const recent = await db.exportJob.findFirst({
      where: {
        userId,
        OR: [
          { status: 'pending' },
          { status: 'processing' },
          { status: 'completed', completedAt: { gt: new Date(Date.now() - RATE_LIMIT_MS) } },
        ],
      },
      orderBy: { requestedAt: 'desc' },
      select: { id: true, status: true, completedAt: true },
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

    // Count boards to decide inline vs async
    const boardCount = await db.room.count({ where: { tutorId: userId } })

    // Create the job
    const job = await db.exportJob.create({
      data: { userId, status: 'pending', format: 'zip+pdf' },
      select: { id: true },
    })

    // Try inline processing for small exports
    if (boardCount <= INLINE_THRESHOLD) {
      try {
        // Claim atomically
        const claimed = await db.exportJob.updateMany({
          where: { id: job.id, status: 'pending' },
          data: { status: 'processing', startedAt: new Date() },
        })
        if (claimed.count === 0) {
          // Race — fall back to cron
          return NextResponse.json({
            jobId: job.id,
            status: 'pending',
            message: 'Export queued. We\'ll email you when it\'s ready.',
          }, { status: 202 })
        }

        const { buffer, boardCount: processed, totalSize } = await buildExportZip({ userId })

        if (totalSize > MAX_INLINE_ZIP_BYTES) {
          // Too big for inline DB storage — mark pending for cron
          // (cron has higher cap since it's not in-request)
          await db.exportJob.update({
            where: { id: job.id },
            data: { status: 'pending', startedAt: null },
          })
          return NextResponse.json({
            jobId: job.id,
            status: 'pending',
            message: 'Export is large — we\'re building it in the background. We\'ll email you when it\'s ready.',
          }, { status: 202 })
        }

        const base64 = buffer.toString('base64')
        await db.exportJob.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            storagePath: base64,
            fileSizeBytes: totalSize,
            boardCount: processed,
            completedAt: new Date(),
          },
        })

        // Send email too (best-effort)
        const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
        if (user?.email) {
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://superboard.app')
          const branding = await getBranding(userId)
          const emailContent = exportReadyEmail({
            tutorName: user.name || user.email,
            boardCount: processed,
            downloadUrl: `${baseUrl}/api/export/download/${job.id}`,
            fileSizeMb: totalSize / 1024 / 1024,
            recipientEmail: user.email,
            branding,
          })
          sendEmail({ to: user.email, subject: emailContent.subject, html: emailContent.html }).catch(() => {})
        }

        return NextResponse.json({
          jobId: job.id,
          status: 'completed',
          processedInline: true,
          boardCount: processed,
          message: 'Export ready!',
        })
      } catch (e) {
        // Inline failed — fall back to cron
        console.error('[Export inline failed]', e)
        await db.exportJob.update({
          where: { id: job.id },
          data: { status: 'pending', startedAt: null, error: `Inline failed: ${e instanceof Error ? e.message : 'unknown'}` },
        })
        return NextResponse.json({
          jobId: job.id,
          status: 'pending',
          message: 'Export queued for background processing. We\'ll email you when it\'s ready.',
        }, { status: 202 })
      }
    }

    // Large export — queue for cron
    return NextResponse.json({
      jobId: job.id,
      status: 'pending',
      message: 'Export queued. We\'ll email you when it\'s ready — usually within a day.',
    }, { status: 202 })
  } catch (error) {
    console.error('[Export Request POST]', error)
    return NextResponse.json({ error: 'Failed to request export' }, { status: 500 })
  }
}

