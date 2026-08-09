// ============================================================
// API Route: Student Progress
// ============================================================
// GET:  Aggregate student progress: lessons attended, subjects,
//       homework completion stats, and recent lesson notes.
//       Requires agency or tutor auth with access to the student.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier } from '@/types';

type RouteContext = { params: Promise<{ studentId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { studentId } = await context.params;

    // Verify user has access to this student's data
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Agency owner: can see any student in their agency
    // Sub-tutor: can see students in their agency
    const agencyId = user.parentAgencyId || (isAgencyTier(user.tier) ? auth.userId : null);

    const student = await db.student.findFirst({
      where: agencyId ? { id: studentId, agencyId } : { id: studentId },
      select: {
        id: true, name: true, email: true, grade: true, notes: true,
        agencyId: true, isActive: true, createdAt: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch all progress data in parallel
    const [roomParticipation, homeworkStats, recentNotes, homeworkList] =
      await Promise.all([
        // Room participation (lessons attended)
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

        // Homework completion stats
        db.homework.groupBy({
          by: ['status'],
          where: { studentId },
          _count: true,
        }),

        // Recent lesson notes (last 10)
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

        // Recent homework (last 20) — now includes tutorFeedback
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
    const completedLessons = roomParticipation.filter((p) => p.room.endedAt);
    const totalLessonMinutes = completedLessons.reduce(
      (sum, p) => sum + (p.room.durationMinutes || 0),
      0,
    );

    // Subject breakdown
    const subjectMap: Record<string, { count: number; minutes: number }> = {};
    for (const p of completedLessons) {
      const subj = p.room.subject;
      if (!subjectMap[subj]) subjectMap[subj] = { count: 0, minutes: 0 };
      subjectMap[subj].count += 1;
      subjectMap[subj].minutes += p.room.durationMinutes || 0;
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
      ? roomParticipation.reduce((latest, p) => {
          return p.lastActiveAt > latest ? p.lastActiveAt : latest;
        }, roomParticipation[0].lastActiveAt)
      : null;

    return NextResponse.json({
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
          subject: p.room.subject,
          durationMinutes: p.room.durationMinutes,
          date: p.room.endedAt!.toISOString(),
          tutorName: p.room.tutor.name || p.room.tutor.email,
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
          tutorName: n.tutor.name || null,
        })),
      },
      lastActive: lastActive?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[Student Progress] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch student progress' }, { status: 500 });
  }
}
