// ============================================================
// Student Progress — Shared Server-Side Helper
// ============================================================
// Extracted from /api/student/[studentId]/progress/route.ts so that
// the room-resume endpoint (and any future caller) can reuse the
// exact same aggregation logic without duplicating it.
//
// Auth is the responsibility of the CALLER. Pass the authenticated
// userId; this helper looks up the caller's tier/agency and enforces
// the same agency-scoping rules the original route enforced.
// ============================================================

import { db } from '@/lib/db';
import { isAgencyTier } from '@/types';

/**
 * Shape of the progress response returned by `getStudentProgress`.
 * Mirrors what the /api/student/[studentId]/progress GET route returns.
 */
export interface StudentProgressData {
  student: {
    id: string;
    name: string | null;
    email: string;
    grade: string | null;
    notes: string | null;
    isActive: boolean;
    enrolledSince: string;
  };
  lessons: {
    totalAttended: number;
    totalHours: number;
    subjectBreakdown: Record<string, { count: number; minutes: number }>;
    recentLessons: Array<{
      roomId: string;
      subject: string;
      durationMinutes: number;
      date: string | null;
      tutorName: string;
    }>;
  };
  homework: {
    total: number;
    pending: number;
    submitted: number;
    graded: number;
    overdue: number;
    completionRate: number;
    recent: Array<{
      id: string;
      title: string;
      subject: string | null;
      dueDate: string | null;
      status: string;
      grade: string | null;
      tutorFeedback: string | null;
      createdAt: string;
    }>;
  };
  notes: {
    totalWritten: number;
    averageRating: number | null;
    recent: Array<{
      id: string;
      content: string;
      tutorFeedback: string | null;
      topicsForNext: string | null;
      rating: number | null;
      subject: string | null;
      date: string;
      tutorName: string | null;
    }>;
  };
  lastActive: string | null;
}

/**
 * Fetch aggregated student progress.
 *
 * Returns:
 *   - `null` if the caller has no access to this student (not found,
 *     or outside the caller's agency scope).
 *   - Otherwise, the full progress payload.
 *
 * Caller is responsible for auth (must already have an authenticated
 * userId) and for translating the `null` result into a 404.
 */
export async function getStudentProgress(
  authUserId: string,
  studentId: string,
): Promise<StudentProgressData | null> {
  // Look up the caller's tier + agency scope
  const user = await db.user.findUnique({
    where: { id: authUserId },
    select: { tier: true, parentAgencyId: true },
  });

  if (!user) return null;

  // Agency owner: can see any student in their agency.
  // Sub-tutor: can see students in their agency (via parentAgencyId).
  // Free / PRO tutors (no agency): can still see a student by id —
  // the existing progress route allowed this fallback.
  const agencyId = user.parentAgencyId || (isAgencyTier(user.tier) ? authUserId : null);

  const student = await db.student.findFirst({
    where: agencyId ? { id: studentId, agencyId } : { id: studentId },
    select: {
      id: true, name: true, email: true, grade: true, notes: true,
      agencyId: true, isActive: true, createdAt: true,
    },
  });

  if (!student) return null;

  // Fetch all progress data in parallel
  const [roomParticipation, homeworkStats, recentNotes, homeworkList] =
    await Promise.all([
      db.roomParticipant.findMany({
        where: { studentId },
        select: {
          roomId: true,
          joinedAt: true,
          lastActiveAt: true,
          room: {
            select: {
              subject: true,
              durationMinutes: true,
              endedAt: true,
              tutor: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
        take: 100,
      }),

      db.homework.groupBy({
        by: ['status'],
        where: { studentId },
        _count: true,
      }),

      db.lessonNote.findMany({
        where: { studentId },
        select: {
          id: true,
          content: true,
          tutorFeedback: true,
          topicsForNext: true,
          rating: true,
          createdAt: true,
          room: { select: { subject: true, durationMinutes: true } },
          tutor: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      db.homework.findMany({
        where: { studentId },
        select: {
          id: true,
          title: true,
          subject: true,
          dueDate: true,
          status: true,
          grade: true,
          tutorFeedback: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

  // Completed lessons only (rooms with endedAt)
  const completedLessons = roomParticipation.filter((p) => p.room?.endedAt);
  const totalLessonMinutes = completedLessons.reduce(
    (sum, p) => sum + (p.room?.durationMinutes || 0),
    0,
  );

  // Subject breakdown
  const subjectMap: Record<string, { count: number; minutes: number }> = {};
  for (const p of completedLessons) {
    const subj = p.room?.subject ?? 'GENERAL';
    if (!subjectMap[subj]) subjectMap[subj] = { count: 0, minutes: 0 };
    subjectMap[subj].count += 1;
    subjectMap[subj].minutes += p.room?.durationMinutes || 0;
  }

  // Homework stats map
  const hwMap: Record<string, number> = {};
  for (const h of homeworkStats) {
    hwMap[h.status] = h._count;
  }
  const totalHomework = Object.values(hwMap).reduce((a, b) => a + b, 0);
  const gradedHomework = hwMap['GRADED'] || 0;
  const homeworkCompletionRate = totalHomework > 0
    ? Math.round(((gradedHomework + (hwMap['SUBMITTED'] || 0)) / totalHomework) * 100)
    : 0;

  // Average rating
  const ratedNotes = recentNotes.filter((n) => n.rating !== null);
  const avgRating = ratedNotes.length > 0
    ? ratedNotes.reduce((sum, n) => sum + (n.rating || 0), 0) / ratedNotes.length
    : null;

  // Last active: max of all room participation lastActiveAt
  const lastActive = roomParticipation.length > 0
    ? roomParticipation.reduce<Date | null>((latest, p) => {
        const cur = p.lastActiveAt;
        if (!cur) return latest;
        if (!latest) return cur;
        return cur > latest ? cur : latest;
      }, null)
    : null;

  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      grade: student.grade,
      notes: student.notes,
      isActive: student.isActive,
      enrolledSince: student.createdAt.toISOString(),
    },
    lessons: {
      totalAttended: completedLessons.length,
      totalHours: Math.round((totalLessonMinutes / 60) * 100) / 100,
      subjectBreakdown: subjectMap,
      recentLessons: completedLessons.slice(0, 10).map((p) => ({
        roomId: p.roomId,
        subject: p.room?.subject ?? 'GENERAL',
        durationMinutes: p.room?.durationMinutes ?? 0,
        date: p.room?.endedAt?.toISOString() ?? null,
        tutorName: p.room?.tutor?.name || p.room?.tutor?.email || 'Tutor',
      })),
    },
    homework: {
      total: totalHomework,
      pending: hwMap['PENDING'] || 0,
      submitted: hwMap['SUBMITTED'] || 0,
      graded: gradedHomework,
      overdue: hwMap['OVERDUE'] || 0,
      completionRate: homeworkCompletionRate,
      recent: homeworkList.map((h) => ({
        id: h.id,
        title: h.title,
        subject: h.subject,
        dueDate: h.dueDate?.toISOString() ?? null,
        status: h.status,
        grade: h.grade,
        tutorFeedback: h.tutorFeedback,
        createdAt: h.createdAt.toISOString(),
      })),
    },
    notes: {
      totalWritten: ratedNotes.length + (recentNotes.length - ratedNotes.length),
      averageRating: avgRating !== null ? Math.round(avgRating * 100) / 100 : null,
      recent: recentNotes.map((n) => ({
        id: n.id,
        content: n.content,
        tutorFeedback: n.tutorFeedback,
        topicsForNext: n.topicsForNext,
        rating: n.rating,
        subject: n.room?.subject ?? null,
        date: n.createdAt.toISOString(),
        tutorName: n.tutor?.name || null,
      })),
    },
    lastActive: lastActive?.toISOString() ?? null,
  };
}
