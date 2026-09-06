// ============================================================
// API: Reminders Cron — processes upcoming lesson reminders
// ============================================================
// GET  /api/reminders/cron
//   Called by Vercel Cron (daily on Hobby plan). Also called
//   inline when the tutor opens their dashboard (catch-up mechanism
//   for Hobby plan — since daily cron isn't enough for 1h reminders).
//
//   For each scheduled lesson where remindersEnabled=true:
//     • If startTime is in [22h, 26h] and reminder24hSent=false → send 24h reminder
//     • If startTime is in [50min, 70min] and reminder1hSent=false → send 1h reminder
//
//   Pro-tier feature: only processes lessons for Pro tutors.
//   Idempotent via ReminderLog unique constraint.
//
//   Secret-protected (CRON_SECRET).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email/client'
import { lessonReminderEmail } from '@/lib/email/templates'
import { getBranding } from '@/lib/branding'
import { isSuppressed } from '@/lib/email/suppression'

const PRO_TIERS = ['PRO', 'AGENCY', 'AGENCY_STANDARD', 'AGENCY_PREMIUM']

export async function GET(request: NextRequest) {
  // Auth: secret header (same as export cron)
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
    const now = new Date()
    const results: Array<{ type: string; lessonId: string; sent: boolean; reason?: string }> = []

    // Find lessons that need reminders
    // 24h window: startTime in [now+22h, now+26h]
    const window24hStart = new Date(now.getTime() + 22 * 60 * 60 * 1000)
    const window24hEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000)
    // 1h window: startTime in [now+50min, now+70min]
    const window1hStart = new Date(now.getTime() + 50 * 60 * 1000)
    const window1hEnd = new Date(now.getTime() + 70 * 60 * 1000)

    // Query lessons that need 24h or 1h reminders
    const lessons = await db.scheduledLesson.findMany({
      where: {
        status: 'scheduled',
        remindersEnabled: true,
        OR: [
          // 24h window, not yet sent
          { startTime: { gte: window24hStart, lte: window24hEnd }, reminder24hSent: false },
          // 1h window, not yet sent
          { startTime: { gte: window1hStart, lte: window1hEnd }, reminder1hSent: false },
        ],
      },
      take: 50,  // safety cap
    })

    for (const lesson of lessons) {
      // Load tutor separately (ScheduledLesson has no tutor relation)
      const tutor = await db.user.findUnique({
        where: { id: lesson.tutorId },
        select: { id: true, name: true, email: true, tier: true },
      })
      // Pro-only check
      if (!tutor || !PRO_TIERS.includes(tutor.tier)) {
        continue
      }

      // Determine recipient email — prefer studentEmail, fall back to student's parentEmail
      let recipientEmail = lesson.studentEmail
      if (!recipientEmail && lesson.studentId) {
        const student = await db.student.findUnique({
          where: { id: lesson.studentId },
          select: { email: true, parentEmail: true, name: true },
        })
        if (student) {
          recipientEmail = student.parentEmail || student.email
        }
      }
      if (!recipientEmail) {
        results.push({ type: 'skip', lessonId: lesson.id, sent: false, reason: 'no recipient email' })
        continue
      }

      // Check suppression list
      const suppressed = await isSuppressed(recipientEmail)
      if (suppressed) {
        results.push({ type: 'skip', lessonId: lesson.id, sent: false, reason: `suppressed (${suppressed})` })
        continue
      }

      const branding = await getBranding(tutor.id)
      const tutorName = tutor.name || tutor.email || 'Your tutor'
      const studentName = lesson.studentName || 'the student'

      // Build join URL if the student has a join token
      let joinUrl: string | null = null
      if (lesson.studentId) {
        const student = await db.student.findUnique({
          where: { id: lesson.studentId },
          select: { joinToken: true },
        })
        if (student?.joinToken) {
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://superboard.app')
          joinUrl = `${baseUrl}/join/${student.joinToken}`
        }
      }

      // Determine which reminder(s) to send
      const needs24h = !lesson.reminder24hSent && lesson.startTime >= window24hStart && lesson.startTime <= window24hEnd
      const needs1h = !lesson.reminder1hSent && lesson.startTime >= window1hStart && lesson.startTime <= window1hEnd

      const remindersToSend: Array<{ type: '24h' | '1h'; sentFlag: 'reminder24hSent' | 'reminder1hSent' }> = []
      if (needs24h) remindersToSend.push({ type: '24h', sentFlag: 'reminder24hSent' })
      if (needs1h) remindersToSend.push({ type: '1h', sentFlag: 'reminder1hSent' })

      for (const r of remindersToSend) {
        // Idempotency check via ReminderLog
        const existing = await db.reminderLog.findUnique({
          where: {
            scheduledLessonId_reminderType: {
              scheduledLessonId: lesson.id,
              reminderType: r.type,
            },
          },
        })
        if (existing) {
          // Already sent — update the flag
          await db.scheduledLesson.update({
            where: { id: lesson.id },
            data: { [r.sentFlag]: true },
          })
          continue
        }

        const content = lessonReminderEmail({
          studentName,
          tutorName,
          subject: lesson.subject,
          startTime: lesson.startTime.toISOString(),
          durationMinutes: lesson.endTime
            ? Math.round((lesson.endTime.getTime() - lesson.startTime.getTime()) / 60000)
            : 60,
          timezone: lesson.timezone,
          joinUrl,
          recipientEmail,
          branding,
          reminderType: r.type,
        })

        const result = await sendEmail({
          to: recipientEmail,
          subject: content.subject,
          html: content.html,
        })

        if (result.sent) {
          // Log + update flag
          await db.reminderLog.create({
            data: {
              scheduledLessonId: lesson.id,
              reminderType: r.type,
              recipientEmail,
            },
          })
          await db.scheduledLesson.update({
            where: { id: lesson.id },
            data: { [r.sentFlag]: true },
          })
          results.push({ type: r.type, lessonId: lesson.id, sent: true })
        } else {
          results.push({ type: r.type, lessonId: lesson.id, sent: false, reason: result.error || 'send failed' })
        }
      }
    }

    return NextResponse.json({
      processed: results.length,
      sent: results.filter(r => r.sent).length,
      results,
    })
  } catch (error) {
    console.error('[Reminders Cron]', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
