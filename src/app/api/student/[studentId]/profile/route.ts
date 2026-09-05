// ============================================================
// API Route: Student Profile + Timeline  (F-05)
// ============================================================
// GET   /api/student/[studentId]/profile
//   Returns the student's full profile (parent contact, consent
//   flags, grade, notes, join token metadata) plus a unified
//   chronological timeline assembled from existing data — no
//   duplicate storage.
//
//   Sources merged into the timeline:
//     • RoomParticipant (lesson attendance — date = room.endedAt or joinedAt)
//     • HomeworkAssignment (assigned / submitted / returned — three
//       separate events sourced from a single row)
//     • LessonNote (tutor's free-form notes — date = createdAt)
//
//   Access: any authenticated tutor, scoped to their own students.
//   (Individual-tutor scope — no agency tier check. The `agencyId`
//   column on Student is the owning tutor's user ID.)
//
// PATCH /api/student/[studentId]/profile
//   Updates profile fields only (parent contact, consent, grade,
//   subjects, notes). Does NOT touch email, isActive, or joinToken —
//   those have their own dedicated endpoints.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

type RouteContext = { params: Promise<{ studentId: string }> };

// ----------------------------------------------------------------
// Access control — individual-tutor model.
// The `agencyId` column on Student is the owning tutor's user ID.
// When agency features ship later, this check will be relaxed to
// also allow sub-tutors via AgencyMember.
// ----------------------------------------------------------------
async function resolveStudentForTutor(auth: { userId: string }, studentId: string) {
  const student = await db.student.findFirst({
    where: { id: studentId, agencyId: auth.userId },
  });
  if (!student) {
    return { error: NextResponse.json({ error: 'Student not found' }, { status: 404 }) };
  }
  return { student };
}

// ----------------------------------------------------------------
// Timeline types
// ----------------------------------------------------------------
type TimelineEvent =
  | { kind: 'lesson'; id: string; date: string; subject: string; durationMinutes: number; tutorName: string | null; roomId: string }
  | { kind: 'homework_assigned'; id: string; date: string; title: string; dueAt: string | null; status: string; assignmentId: string }
  | { kind: 'homework_submitted'; id: string; date: string; title: string; status: string; assignmentId: string }
  | { kind: 'homework_returned'; id: string; date: string; title: string; status: string; assignmentId: string }
  | { kind: 'note'; id: string; date: string; content: string; subject: string | null; tutorName: string | null; roomId: string | null };

// ----------------------------------------------------------------
// GET
// ----------------------------------------------------------------
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { studentId } = await context.params;
    const access = await resolveStudentForTutor(auth, studentId);
    if ('error' in access) return access.error;

    const student = access.student;

    // Run all source queries in parallel.
    const [participation, homeworkAssignments, distinctRoomIds] = await Promise.all([
      // 1. RoomParticipant — every lesson the student attended
      db.roomParticipant.findMany({
        where: { studentId },
        select: {
          id: true,
          roomId: true,
          joinedAt: true,
          lastActiveAt: true,
          room: {
            select: {
              id: true,
              subject: true,
              durationMinutes: true,
              endedAt: true,
              tutor: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
        take: 200,
      }),

      // 2. HomeworkAssignment — directly linked via studentId FK
      db.homeworkAssignment.findMany({
        where: { studentId },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          submittedAt: true,
          updatedAt: true,
          dueAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),

      // 3. Distinct roomIds for LessonNote lookup (avoids N+1)
      db.roomParticipant.findMany({
        where: { studentId },
        select: { roomId: true },
        distinct: ['roomId'],
      }),
    ]);

    const roomIds = distinctRoomIds.map((r) => r.roomId);

    const notes = roomIds.length > 0
      ? await db.lessonNote.findMany({
          where: { roomId: { in: roomIds } },
          select: {
            id: true,
            content: true,
            createdAt: true,
            roomId: true,
            room: { select: { subject: true } },
            tutor: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
      : [];

    // ----------------------------------------------------------------
    // Build the unified timeline (newest first)
    // ----------------------------------------------------------------
    const events: TimelineEvent[] = [];

    for (const p of participation) {
      if (!p.room) continue; // room may have been deleted
      const lessonDate = p.room.endedAt ?? p.joinedAt;
      events.push({
        kind: 'lesson',
        id: `lesson-${p.id}`,
        date: lessonDate.toISOString(),
        subject: p.room.subject,
        durationMinutes: p.room.durationMinutes || 0,
        tutorName: p.room.tutor?.name || p.room.tutor?.email || null,
        roomId: p.room.id,
      });
    }

    for (const h of homeworkAssignments) {
      events.push({
        kind: 'homework_assigned',
        id: `hw-assign-${h.id}`,
        date: h.createdAt.toISOString(),
        title: h.title,
        dueAt: h.dueAt?.toISOString() ?? null,
        status: h.status,
        assignmentId: h.id,
      });

      if (h.submittedAt) {
        events.push({
          kind: 'homework_submitted',
          id: `hw-submit-${h.id}`,
          date: h.submittedAt.toISOString(),
          title: h.title,
          status: h.status,
          assignmentId: h.id,
        });
      }

      if (h.status === 'returned' || h.status === 'reviewed') {
        events.push({
          kind: 'homework_returned',
          id: `hw-return-${h.id}`,
          date: h.updatedAt.toISOString(),
          title: h.title,
          status: h.status,
          assignmentId: h.id,
        });
      }
    }

    for (const n of notes) {
      events.push({
        kind: 'note',
        id: `note-${n.id}`,
        date: n.createdAt.toISOString(),
        content: n.content,
        subject: n.room?.subject ?? null,
        tutorName: n.tutor?.name ?? null,
        roomId: n.roomId,
      });
    }

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // ----------------------------------------------------------------
    // Aggregate stats (derived — no extra storage)
    // ----------------------------------------------------------------
    const completedLessons = participation.filter((p) => p.room?.endedAt);
    const totalLessonMinutes = completedLessons.reduce((sum, p) => sum + (p.room?.durationMinutes || 0), 0);

    const subjectMap: Record<string, { count: number; minutes: number }> = {};
    for (const p of completedLessons) {
      if (!p.room) continue;
      const subj = p.room.subject;
      if (!subjectMap[subj]) subjectMap[subj] = { count: 0, minutes: 0 };
      subjectMap[subj].count += 1;
      subjectMap[subj].minutes += p.room.durationMinutes || 0;
    }

    const homeworkByStatus: Record<string, number> = {};
    for (const h of homeworkAssignments) {
      homeworkByStatus[h.status] = (homeworkByStatus[h.status] ?? 0) + 1;
    }

    const lastActive = participation.reduce<Date | null>((latest, p) => {
      const candidate = p.lastActiveAt ?? p.joinedAt;
      if (!candidate) return latest;
      if (!latest || candidate > latest) return candidate;
      return latest;
    }, null);

    return NextResponse.json({
      student: {
        id: student.id,
        email: student.email,
        name: student.name,
        isActive: student.isActive,
        createdAt: student.createdAt.toISOString(),
        deactivatedAt: student.deactivatedAt?.toISOString() ?? null,

        parentName: student.parentName,
        parentEmail: student.parentEmail,
        parentPhone: student.parentPhone,
        consentPhoto: student.consentPhoto,
        consentVideo: student.consentVideo,
        consentRecording: student.consentRecording,
        consentMarketing: student.consentMarketing,
        consentAt: student.consentAt?.toISOString() ?? null,
        gradeLevel: student.gradeLevel,
        subjects: student.subjects,
        notes: student.notes,

        hasJoinToken: !!student.joinToken,
        joinTokenGeneratedAt: student.joinTokenGeneratedAt?.toISOString() ?? null,
      },

      stats: {
        totalLessons: completedLessons.length,
        totalHours: Math.round((totalLessonMinutes / 60) * 100) / 100,
        subjectBreakdown: subjectMap,
        homework: {
          total: homeworkAssignments.length,
          assigned: homeworkByStatus['assigned'] ?? 0,
          in_progress: homeworkByStatus['in_progress'] ?? 0,
          submitted: homeworkByStatus['submitted'] ?? 0,
          returned: homeworkByStatus['returned'] ?? 0,
          reviewed: homeworkByStatus['reviewed'] ?? 0,
        },
        notesCount: notes.length,
        lastActive: lastActive?.toISOString() ?? null,
      },

      timeline: events.slice(0, 200),
    });
  } catch (error) {
    console.error('[Student Profile GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch student profile' }, { status: 500 });
  }
}

// ----------------------------------------------------------------
// PATCH — update profile fields only
// ----------------------------------------------------------------
const patchSchema = z.object({
  parentName: z.string().max(200).optional().nullable(),
  parentEmail: z.string().email().max(300).optional().nullable(),
  parentPhone: z.string().max(50).optional().nullable(),
  consentPhoto: z.boolean().optional(),
  consentVideo: z.boolean().optional(),
  consentRecording: z.boolean().optional(),
  consentMarketing: z.boolean().optional(),
  gradeLevel: z.string().max(100).optional().nullable(),
  subjects: z.array(z.string().max(50)).max(20).optional(),
  notes: z.string().max(10000).optional().nullable(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { studentId } = await context.params;
    const access = await resolveStudentForTutor(auth, studentId);
    if ('error' in access) return access.error;

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data: Record<string, unknown> = {};

    const nullableFields = ['parentName', 'parentEmail', 'parentPhone', 'gradeLevel', 'notes'] as const;
    for (const f of nullableFields) {
      if (parsed.data[f] !== undefined) {
        const v = parsed.data[f];
        data[f] = (typeof v === 'string' && v.trim() === '') ? null : v;
      }
    }

    const consentFields = ['consentPhoto', 'consentVideo', 'consentRecording', 'consentMarketing'] as const;
    let anyConsentChanged = false;
    for (const f of consentFields) {
      if (parsed.data[f] !== undefined) {
        data[f] = parsed.data[f];
        anyConsentChanged = true;
      }
    }
    if (anyConsentChanged) {
      data.consentAt = new Date();
    }

    if (parsed.data.subjects !== undefined) {
      data.subjects = parsed.data.subjects;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await db.student.update({
      where: { id: studentId },
      data,
    });

    return NextResponse.json({
      success: true,
      student: {
        id: updated.id,
        parentName: updated.parentName,
        parentEmail: updated.parentEmail,
        parentPhone: updated.parentPhone,
        consentPhoto: updated.consentPhoto,
        consentVideo: updated.consentVideo,
        consentRecording: updated.consentRecording,
        consentMarketing: updated.consentMarketing,
        consentAt: updated.consentAt?.toISOString() ?? null,
        gradeLevel: updated.gradeLevel,
        subjects: updated.subjects,
        notes: updated.notes,
      },
    });
  } catch (error) {
    console.error('[Student Profile PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update student profile' }, { status: 500 });
  }
}
