// ============================================================
// /hw/[token] — Student homework page (server component)
// Validates token, loads assignment, renders client component
// ============================================================
import { db } from '@/lib/db'
import HomeworkStudent from '@/components/homework/HomeworkStudent'

export const dynamic = 'force-dynamic'

export default async function HomeworkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const assignment = await db.homeworkAssignment.findUnique({
    where: { assignmentToken: token },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      late: true,
      dueAt: true,
      submitUntil: true,
      viewUntil: true,
      studentSnapshot: true,
      feedbackSnapshot: true,
      submittedAt: true,
    },
  })

  if (!assignment) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Assignment not found</h1>
        <p style={{ color: '#64748b' }}>Check your link or ask your tutor for a new one.</p>
      </div>
    )
  }

  const now = new Date()
  const isExpired = now > assignment.viewUntil

  if (isExpired) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: 24, background: '#f8fafc' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
        <h1 style={{ fontSize: 24, marginBottom: 8, color: '#1e293b' }}>This assignment has closed.</h1>
        <p style={{ color: '#64748b' }}>Ask your tutor for a fresh link.</p>
      </div>
    )
  }

  const homeworkData = {
    id: assignment.id,
    token,
    title: assignment.title,
    description: assignment.description,
    status: assignment.status,
    late: assignment.late,
    dueAt: assignment.dueAt?.toISOString() || null,
    isViewOnly: assignment.status === 'submitted' || assignment.status === 'reviewed',
    studentSnapshot: assignment.studentSnapshot,
    feedbackSnapshot: assignment.feedbackSnapshot,
    submittedAt: assignment.submittedAt?.toISOString() || null,
  }

  return <HomeworkStudent initialData={homeworkData} />
}
// Trigger redeploy for Prisma client regeneration
