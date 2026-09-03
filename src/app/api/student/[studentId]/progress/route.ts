// ============================================================
// API Route: Student Progress
// ============================================================
// GET:  Aggregate student progress: lessons attended, subjects,
//       homework completion stats, and recent lesson notes.
//       Requires agency or tutor auth with access to the student.
// ============================================================
//
// NOTE: The Student schema has no `grade` or `notes` columns.
// Homework has no `studentId`, `subject`, `grade`, or
// `tutorFeedback` fields; we associate homework with a student
// via the rooms the student participated in. LessonNote has no
// `studentId`, `tutorFeedback`, `topicsForNext`, or `rating`
// fields; we fetch notes for rooms the student participated in.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier, Tier } from '@/types';

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
    const agencyId = user.parentAgencyId || (isAgencyTier(user.tier as Tier) ? auth.userId : null);

    const student = await db.student.findFirst({
      where: agencyId ? { id: studentId, agencyId } : { id: studentId },
      select: {
        id: true, name: true, email: true,
        agencyId: true, isActive: true, createdAt: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Find all rooms the student participated in (RoomParticipant.studentId
    // is a free-form String column used to link participation back to a Student).
    const participation = await db.roomParticipant.findMany({
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
    });

    const roomIds = participation.map((p) => p.roomId);

    // Fetch progress data in parallel. Homework and LessonNote don't
    // have a studentId column, so we filter by the rooms the student
    // participated in.
    const [homeworkStats, recentNotes, homeworkList] = await Promise.all([
      // Homework completion stats grouped by status
      roomIds.length > 0
        ? db.homework.groupBy({
            by: ['status'],
            where: { roomId: { in: roomIds } },
            _count: true,
          })
        : Promise.resolve([]),

      // Recent lesson notes (last 10) — schema only exposes content,
      // createdAt, tutor, room.
      roomIds.length > 0
        ? db.lessonNote.findMany({
            where: { roomId: { in: roomIds } },
            select: {
              id: true,
              content: true,
              createdAt: true,
              room: { select: { subject: true, durationMinutes: true } },
              tutor: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : Promise.resolve([]),

      // Recent homework (last 20)
      roomIds.length > 0
        ? db.homework.findMany({
            where: { roomId: { in: roomIds } },
            select: {
              id: true,
              title: true,
              description: true,
              dueDate: true,
              status: true,
              createdAt: true,
              tutor: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          })
        : Promise.resolve([]),
    ]);

    // Completed lessons only (rooms with endedAt). RoomParticipant.room
    // is an optional relation in the schema, so we skip rows whose room
    // has been deleted.
    const completedLessons = participation.filter(
      (p): p is typeof p & { room: NonNullable<typeof p.room> } =>
        !!p.room && !!p.room.endedAt,
    );
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
    const gradedHomework = hwMap['graded'] || hwMap['GRADED'] || 0;
    const homeworkCompletionRate = totalHomework > 0
      ? Math.round(((gradedHomework + (hwMap['submitted'] || hwMap['SUBMITTED'] || 0)) / totalHomework) * 100)
      : 0;

    // Last active: max of all room participation lastActiveAt
    const lastActive = participation.length > 0
      ? participation.reduce((latest, p) => {
          if (!p.lastActiveAt) return latest;
          if (!latest) return p.lastActiveAt;
          return p.lastActiveAt > latest ? p.lastActiveAt : latest;
        }, participation[0].lastActiveAt ?? null)
      : null;

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
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
        pending: hwMap['assigned'] || hwMap['PENDING'] || 0,
        submitted: hwMap['submitted'] || hwMap['SUBMITTED'] || 0,
        graded: gradedHomework,
        overdue: hwMap['overdue'] || hwMap['OVERDUE'] || 0,
        completionRate: homeworkCompletionRate,
        recent: homeworkList.map((h) => ({
          id: h.id,
          title: h.title,
          description: h.description,
          dueDate: h.dueDate?.toISOString() ?? null,
          status: h.status,
          createdAt: h.createdAt.toISOString(),
          tutorName: h.tutor?.name ?? null,
        })),
      },
      notes: {
        totalWritten: recentNotes.length,
        averageRating: null,
        recent: recentNotes.map((n) => ({
          id: n.id,
          content: n.content,
          subject: n.room?.subject ?? null,
          date: n.createdAt.toISOString(),
          tutorName: n.tutor?.name ?? null,
        })),
      },
      lastActive: lastActive?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[Student Progress] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch student progress' }, { status: 500 });
  }
}
