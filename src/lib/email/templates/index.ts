// ============================================================
// Email Templates — Homework notifications
// ============================================================
// Each template is a pure function: data in, { subject, html } out.
// No external dependencies — plain HTML strings with inline styles
// (email clients don't support <style> tags reliably).
// ============================================================

interface BaseEmailData {
  tutorName: string
  studentName: string
  assignmentTitle: string
  assignmentUrl: string
}

const WRAPPER = (title: string, bodyHtml: string): string => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#059669,#0891b2);padding:24px 32px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
            </div>
            <span style="color:white;font-size:18px;font-weight:700;">Superboard</span>
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
            You're receiving this because ${'${recipientReason}'}.
            <a href="${'${unsubscribeUrl}'}" style="color:#64748b;text-decoration:underline;">Manage notifications</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`.replace('${recipientReason}', 'a homework assignment involves you or your child').replace('${unsubscribeUrl}', 'https://superboard.app/settings/notifications')

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
    html: WRAPPER('You have new homework', body),
  }
}

// ----------------------------------------------------------------
// 2. Assignment opened — internal info (tutor, optional)
//    Only sent if the tutor explicitly opts in. Skipping for now
//    to avoid notification fatigue — the 'submitted' email is the
//    real signal. Including the template for future use.
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
    html: WRAPPER('Homework opened', body),
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
    html: WRAPPER('Homework submitted', body),
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
    html: WRAPPER('Homework returned', body),
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
    html: WRAPPER('Homework reviewed', body),
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
}): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Hi ${data.tutorName}, your data export is ready. It includes ${data.boardCount} board${data.boardCount !== 1 ? 's' : ''} as PDFs (${data.fileSizeMb.toFixed(1)} MB total) plus a portable JSON of all your data.
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748b;">
      The download link will expire in 7 days. Save the file somewhere safe if you want to keep it longer.
    </p>
    ${ctaButton('Download my data', data.downloadUrl)}
    <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
      We never delete your data from Superboard when you export — this is a copy, not a migration. Your boards, students, and history stay right where they are.
    </p>
  `
  return {
    subject: `📦 Your Superboard data export is ready`,
    html: WRAPPER('Your data export is ready', body),
  }
}
