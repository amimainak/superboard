// ============================================================
// Homework Notifications — idempotent email dispatcher
// ============================================================
// Wraps the sendEmail() call with a HomeworkNotification log entry
// so we never double-send the same event to the same recipient.
//
// Returns silently if:
//   - The recipient email is null/empty (can't send)
//   - A notification for this (assignment, event, recipient) was
//     already logged (idempotent)
//   - The email send itself fails (logged, but doesn't throw — we
//     don't want to break a status transition because email broke)
// ============================================================

import { db } from '@/lib/db'
import { sendEmail } from './client'
import {
  homeworkAssignedEmail,
  homeworkOpenedEmail,
  homeworkSubmittedEmail,
  homeworkReturnedEmail,
  homeworkReviewedEmail,
} from './templates'

type HomeworkEvent = 'assigned' | 'opened' | 'submitted' | 'returned' | 'reviewed'

interface NotifyParams {
  assignmentId: string
  event: HomeworkEvent
  recipientEmail: string
  tutorName: string
  studentName: string
  assignmentTitle: string
  assignmentUrl: string
  // Optional event-specific data
  dueDate?: string | null
  late?: boolean
  submittedAt?: string | null
}

export async function sendHomeworkNotification(params: NotifyParams): Promise<{ sent: boolean; reason?: string }> {
  const { assignmentId, event, recipientEmail } = params

  if (!recipientEmail || !recipientEmail.includes('@')) {
    return { sent: false, reason: 'no valid recipient email' }
  }

  // Idempotency check — unique constraint on (assignmentId, event, channel, recipient)
  // If a row already exists, we've already sent this notification.
  const existing = await db.homeworkNotification.findUnique({
    where: {
      assignmentId_event_channel_recipient: {
        assignmentId,
        event,
        channel: 'email',
        recipient: recipientEmail,
      },
    },
    select: { id: true },
  })
  if (existing) {
    return { sent: false, reason: 'already sent (idempotent skip)' }
  }

  // Pick the right template — all templates now require recipientEmail
  const templateData = {
    tutorName: params.tutorName,
    studentName: params.studentName,
    assignmentTitle: params.assignmentTitle,
    assignmentUrl: params.assignmentUrl,
    recipientEmail,
  }

  let template: { subject: string; html: string }
  switch (event) {
    case 'assigned':
      template = homeworkAssignedEmail({
        ...templateData,
        dueDate: params.dueDate ?? null,
      })
      break
    case 'opened':
      template = homeworkOpenedEmail(templateData)
      break
    case 'submitted':
      template = homeworkSubmittedEmail({
        ...templateData,
        late: params.late ?? false,
        submittedAt: params.submittedAt ?? new Date().toISOString(),
      })
      break
    case 'returned':
      template = homeworkReturnedEmail(templateData)
      break
    case 'reviewed':
      template = homeworkReviewedEmail(templateData)
      break
  }

  // Send the email
  const result = await sendEmail({
    to: recipientEmail,
    subject: template.subject,
    html: template.html,
  })

  if (!result.sent) {
    console.error(`[HomeworkNotify] Failed to send ${event} to ${recipientEmail}:`, result.error)
    return { sent: false, reason: result.error || 'send failed' }
  }

  // Log the notification (idempotency for next time)
  try {
    await db.homeworkNotification.create({
      data: {
        assignmentId,
        event,
        channel: 'email',
        recipient: recipientEmail,
      },
    })
  } catch (e) {
    // If the insert fails due to a race (another process sent the same
    // notification at the same time), the unique constraint catches it —
    // we've already sent the email, no harm done.
    console.warn(`[HomeworkNotify] Idempotency log insert failed (likely race):`, e instanceof Error ? e.message : e)
  }

  return { sent: true }
}
