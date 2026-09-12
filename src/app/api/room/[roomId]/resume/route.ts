// ============================================================
// API Route: GET /api/room/[roomId]/resume
// ============================================================
// Returns a "session resume" payload for a tutor opening a room:
//   - lastSession: subject, date, durationMinutes of the most
//       recent completed lesson for the room's most recent
//       student participant.
//   - notes: most recent LessonNote (content, tutorFeedback,
//       topicsForNext, rating).
//   - homework: most recent Homework record for that student.
//   - suggestedWidget: derived from `topicsForNext` via the shared
//       keyword map in `@/lib/suggested-widget`.
//
// Reuses `getStudentProgress` from `@/lib/student-progress` so the
// aggregation logic is NOT duplicated.
//
// Response shape (200):
//   {
//     student: { id, name } | null,
//     lastSession: { subject, date, durationMinutes } | null,
//     notes: { content, tutorFeedback, topicsForNext, rating, subject, date } | null,
//     homework: { title, status, grade, tutorFeedback, dueDate } | null,
//     suggestedWidget: { kind, label } | null
//   }
//
// If the room has no student participant, returns 200 with all
// fields `null` (the client hides the card).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getStudentProgress } from '@/lib/student-progress';
import { suggestWidgetForTopics } from '@/lib/suggested-widget';

type RouteContext = { params: Promise<{ roomId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { roomId } = await context.params;

    // Validate roomId format (same guard as /api/room/[roomId])
    if (!roomId || !/^[a-zA-Z0-9-]{1,100}$/.test(roomId)) {
      return NextResponse.json({ error: 'Invalid roomId format' }, { status: 400 });
    }

    // Verify the room exists AND the caller owns it (or is the
    // agency owner of the tutor who owns it).
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true, tutorId: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.tutorId !== auth.userId) {
      // Allow agency owners to view resume for their sub-tutors' rooms
      const caller = await db.user.findUnique({
        where: { id: auth.userId },
        select: { tier: true },
      });
      const isAgencyOwner =
        caller &&
        (caller.tier === 'AGENCY' ||
          caller.tier === 'AGENCY_STANDARD' ||
          caller.tier === 'AGENCY_PREMIUM');
      if (!isAgencyOwner) {
        return NextResponse.json(
          { error: 'Forbidden — only the room owner can view session resume' },
          { status: 403 },
        );
      }
      const tutor = await db.user.findUnique({
        where: { id: room.tutorId },
        select: { parentAgencyId: true },
      });
      if (!tutor || tutor.parentAgencyId !== auth.userId) {
        return NextResponse.json(
          { error: 'Forbidden — only the room owner can view session resume' },
          { status: 403 },
        );
      }
    }

    // Find the most recent RoomParticipant with a studentId for this room.
    const participant = await db.roomParticipant.findFirst({
      where: { roomId, studentId: { not: null } },
      orderBy: { joinedAt: 'desc' },
      select: { studentId: true },
    });

    if (!participant?.studentId) {
      // No student associated — return the empty resume (client hides card).
      return NextResponse.json({
        student: null,
        lastSession: null,
        notes: null,
        homework: null,
        suggestedWidget: null,
      });
    }

    // Reuse the existing progress aggregation logic.
    const progress = await getStudentProgress(auth.userId, participant.studentId);
    if (!progress) {
      // Caller has no access to this student (e.g. cross-agency) —
      // return empty resume rather than 404 so the card just hides.
      return NextResponse.json({
        student: null,
        lastSession: null,
        notes: null,
        homework: null,
        suggestedWidget: null,
      });
    }

    // If the student has NO completed lessons and NO notes, treat as
    // "no previous sessions" — the client hides the card in that case.
    const hasPreviousSessions =
      progress.lessons.totalAttended > 0 || progress.notes.recent.length > 0;

    if (!hasPreviousSessions) {
      return NextResponse.json({
        student: { id: progress.student.id, name: progress.student.name ?? progress.student.email },
        lastSession: null,
        notes: null,
        homework: null,
        suggestedWidget: null,
      });
    }

    // Most recent completed lesson
    const lastLesson = progress.lessons.recentLessons[0] ?? null;

    // Most recent lesson note (progress returns them ordered desc)
    const lastNote = progress.notes.recent[0] ?? null;

    // Most recent homework record (any status)
    const lastHomework = progress.homework.recent[0] ?? null;

    // Derive suggested widget from the most recent note's topicsForNext
    const suggestedWidget = suggestWidgetForTopics(lastNote?.topicsForNext);

    return NextResponse.json({
      student: { id: progress.student.id, name: progress.student.name ?? progress.student.email },
      lastSession: lastLesson
        ? {
            subject: lastLesson.subject,
            date: lastLesson.date,
            durationMinutes: lastLesson.durationMinutes,
          }
        : null,
      notes: lastNote
        ? {
            content: lastNote.content,
            tutorFeedback: lastNote.tutorFeedback,
            topicsForNext: lastNote.topicsForNext,
            rating: lastNote.rating,
            subject: lastNote.subject,
            date: lastNote.date,
          }
        : null,
      homework: lastHomework
        ? {
            title: lastHomework.title,
            status: lastHomework.status,
            grade: lastHomework.grade,
            tutorFeedback: lastHomework.tutorFeedback,
            dueDate: lastHomework.dueDate,
          }
        : null,
      suggestedWidget,
    });
  } catch (error) {
    console.error('[Room Resume] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch session resume' }, { status: 500 });
  }
}
