// ============================================================
// Email Templates — Homework notifications
// ============================================================
// Each template is a pure function: data in, { subject, html } out.
// No external dependencies — plain HTML strings with inline styles
// (email clients don't support <style> tags reliably).
//
// Every template includes an unsubscribe link in the footer.
// The link is /unsubscribe/[token] where token = HMAC of the
// recipient's email. Transactional emails (assigned, returned) note
// that unsubscribing only stops optional notifications — the tutor
// can still assign homework.
// ============================================================

import { generateUnsubscribeToken } from '../unsubscribe-token'

interface BaseEmailData {
  tutorName: string
  studentName: string
  assignmentTitle: string
  assignmentUrl: string
  recipientEmail: string  // needed to generate the unsubscribe token
  // F-09: Optional branding for email header
  branding?: EmailBranding | null
}

// F-09: Optional branding for email header
interface EmailBranding {
  displayName: string
  logoUrl: string | null
  color: string
  isPro: boolean
}

const WRAPPER = (
  title: string,
  bodyHtml: string,
  recipientEmail: string,
  transactional: boolean,
  branding?: EmailBranding | null,
): string => {
  const unsubToken = generateUnsubscribeToken(recipientEmail)
  const unsubUrl = `${getBaseUrl()}/unsubscribe/${unsubToken}`
  const footerNote = transactional
    ? `You're receiving this because a homework assignment involves you or your child. <a href="${unsubUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe from optional notifications</a> (you'll still receive essential assignment notices).`
    : `You're receiving this email at ${recipientEmail}. <a href="${unsubUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>`

  // F-09: Branded header — tutor's logo + name if Pro, else generic Superboard
  const brandName = branding?.displayName || 'Superboard'
  const brandColor = branding?.color || '#059669'
  const headerContent = branding?.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${escapeHtml(brandName)}" style="width:32px;height:32px;border-radius:8px;object-fit:cover;" />`
    : `<div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,${brandColor},#0891b2);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:16px;font-weight:800;">${escapeHtml(brandName.charAt(0).toUpperCase())}</span></div>`

  // F-09: "Powered by" footer for non-Pro tutors
  const poweredByFooter = (!branding || !branding.isPro)
    ? `<tr><td style="padding:8px 32px 16px;border-top:1px solid #f1f5f9;"><p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">Powered by <span style="font-weight:600;color:#94a3b8;">Superboard</span></p></td></tr>`
    : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">

        <!-- Header — branded -->
        <tr><td style="background:linear-gradient(135deg,${brandColor},#0891b2);padding:24px 32px;">
          <div style="display:flex;align-items:center;gap:10px;">
            ${headerContent}
            <span style="color:white;font-size:18px;font-weight:700;">${escapeHtml(brandName)}</span>
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">${title}</h1>
          ${bodyHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #f1f5f9;">
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
            ${footerNote}
          </p>
        </td></tr>
        ${poweredByFooter}
      </table>
    </td></tr>
  </table>
</body>
</html>
`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ----------------------------------------------------------------
// 8. Lesson reminder — sent to parent 24h and 1h before lesson
// ----------------------------------------------------------------
export function lessonReminderEmail(data: {
  studentName: string
  tutorName: string
  subject: string
  startTime: string  // ISO
  durationMinutes: number
  timezone: string
  joinUrl: string | null  // student's join link, if available
  recipientEmail: string
  branding?: EmailBranding | null
  reminderType: '24h' | '1h'
}): { subject: string; html: string } {
  const lessonTime = new Date(data.startTime).toLocaleString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZone: data.timezone,
  })
  const is24h = data.reminderType === '24h'
  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      ${is24h ? 'Tomorrow' : 'In about 1 hour'}, ${data.studentName} has a ${data.subject.toLowerCase()} lesson with ${data.tutorName}.
    </p>
    <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#1e293b;"><strong>${lessonTime}</strong></p>
      <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${data.durationMinutes} minutes • ${data.timezone}</p>
    </div>
    ${data.joinUrl ? ctaButton('Join lesson', data.joinUrl) : '<p style="font-size:13px;color:#64748b;">Your tutor will send the join link when it\'s time for the lesson.</p>'}
    <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
      ${is24h ? 'See you tomorrow!' : 'See you soon!'}
    </p>
  `
  return {
    subject: `${is24h ? '⏰ Tomorrow' : '🔔 Starting soon'}: ${data.studentName}'s ${data.subject} lesson`,
    html: WRAPPER('Lesson reminder', body, data.recipientEmail, true, data.branding),
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

const ctaButton = (text: string, url: string): string => `
  <a href="${url}" style="display:inline-block;background:#059669;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;margin:16px 0;">${text}</a>
`

// ----------------------------------------------------------------
// 1. Assignment created — sent to parent/student
// ----------------------------------------------------------------
export function homeworkAssignedEmail(data: BaseEmailData & { dueDate?: string | null }): { subject: string; html: string } {
  const dueText = data.dueDate
    ? `<p style="margin:0 0 12px;color:#64748b;font-size:14px;">Due: <strong style="color:#1e293b;">${new Date(data.dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong></p>`
    : ''

  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      <strong>${data.tutorName}</strong> has assigned new homework: <strong>${data.assignmentTitle}</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748b;">
      ${data.studentName}, click the button below to open your assignment. You can work on it on any device — phone, tablet, or computer. Your work saves automatically.
    </p>
    ${dueText}
    ${ctaButton('Open homework', data.assignmentUrl)}
    <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
      Tip: bookmark the homework page so you can come back to it without opening this email again.
    </p>
  `
  return {
    subject: `📋 New homework from ${data.tutorName}: ${data.assignmentTitle}`,
    html: WRAPPER('You have new homework', body, data.recipientEmail, true, data.branding),
  }
}

// ----------------------------------------------------------------
// 2. Assignment opened — internal info (tutor, optional)
// ----------------------------------------------------------------
export function homeworkOpenedEmail(data: BaseEmailData): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      <strong>${data.studentName}</strong> just opened the homework: <strong>${data.assignmentTitle}</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748b;">
      They haven't submitted yet — this just means they've started. You can check on their progress anytime.
    </p>
    ${ctaButton('View assignment', data.assignmentUrl)}
  `
  return {
    subject: `👀 ${data.studentName} opened "${data.assignmentTitle}"`,
    html: WRAPPER('Homework opened', body, data.recipientEmail, false, data.branding),
  }
}

// ----------------------------------------------------------------
// 3. Assignment submitted — sent to tutor
// ----------------------------------------------------------------
export function homeworkSubmittedEmail(data: BaseEmailData & { late: boolean; submittedAt: string }): { subject: string; html: string } {
  const lateNotice = data.late
    ? `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:#92400e;">⚠️ This was submitted after the due date.</div>`
    : ''

  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      <strong>${data.studentName}</strong> just handed in their homework: <strong>${data.assignmentTitle}</strong>.
    </p>
    ${lateNotice}
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748b;">
      Review their work, add feedback annotations on the board, and mark it reviewed or return it for edits.
    </p>
    ${ctaButton('Review homework', data.assignmentUrl)}
  `
  return {
    subject: `✅ ${data.studentName} submitted "${data.assignmentTitle}"`,
    html: WRAPPER('Homework submitted', body, data.recipientEmail, true, data.branding),
  }
}

// ----------------------------------------------------------------
// 4. Assignment returned — sent to parent/student
// ----------------------------------------------------------------
export function homeworkReturnedEmail(data: BaseEmailData): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Your tutor <strong>${data.tutorName}</strong> has returned your homework: <strong>${data.assignmentTitle}</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748b;">
      This usually means they've added some feedback and want you to take another look. Open the link to see their notes on your work.
    </p>
    ${ctaButton('View feedback', data.assignmentUrl)}
  `
  return {
    subject: `↩️ ${data.tutorName} returned your homework: ${data.assignmentTitle}`,
    html: WRAPPER('Homework returned', body, data.recipientEmail, true, data.branding),
  }
}

// ----------------------------------------------------------------
// 5. Assignment reviewed — sent to parent/student (if opted in)
// ----------------------------------------------------------------
export function homeworkReviewedEmail(data: BaseEmailData): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Your tutor <strong>${data.tutorName}</strong> has reviewed your homework: <strong>${data.assignmentTitle}</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748b;">
      Open the link to see their feedback annotations on your work. Great job!
    </p>
    ${ctaButton('See feedback', data.assignmentUrl)}
  `
  return {
    subject: `🎉 ${data.tutorName} reviewed your homework: ${data.assignmentTitle}`,
    html: WRAPPER('Homework reviewed', body, data.recipientEmail, false, data.branding),
  }
}

// ----------------------------------------------------------------
// 6. Export ready — sent to tutor when data export completes
// ----------------------------------------------------------------
export function exportReadyEmail(data: {
  tutorName: string
  boardCount: number
  downloadUrl: string
  fileSizeMb: number
  recipientEmail: string
  branding?: EmailBranding | null
}): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Hi ${data.tutorName}, your data export is ready. It includes ${data.boardCount} board${data.boardCount !== 1 ? 's' : ''} as PDFs (${data.fileSizeMb.toFixed(1)} MB total) plus a portable JSON of all your data.
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748b;">
      The download link will expire if you request a new export. Save the file somewhere safe if you want to keep it longer.
    </p>
    ${ctaButton('Download my data', data.downloadUrl)}
    <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
      We never delete your data from Superboard when you export — this is a copy, not a migration. Your boards, students, and history stay right where they are.
    </p>
  `
  return {
    subject: `📦 Your Superboard data export is ready`,
    html: WRAPPER('Your data export is ready', body, data.recipientEmail, false, data.branding),
  }
}

// ----------------------------------------------------------------
// 7. Test email — sent when the tutor clicks "Send test email"
// ----------------------------------------------------------------
export function testEmail(data: { tutorName: string; recipientEmail: string; branding?: EmailBranding | null }): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Hi ${data.tutorName}, this is a test email from Superboard. If you&apos;re reading this, your email setup is working correctly.
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748b;">
      You&apos;ll receive emails like this when:
    </p>
    <ul style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748b;padding-left:20px;">
      <li>A student submits homework</li>
      <li>You assign homework to a student</li>
      <li>A homework assignment is reviewed or returned</li>
      <li>Your data export is ready for download</li>
    </ul>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
      You can manage which emails you receive in Settings → Notifications.
    </p>
  `
  return {
    subject: `✉️ Superboard email test — it works!`,
    html: WRAPPER('Email test', body, data.recipientEmail, false, data.branding),
  }
}

