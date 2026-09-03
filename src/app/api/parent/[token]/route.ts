// ============================================================
// API Route: Parent Portal — Token-based Access
// ============================================================
// GET:  Returns student info, upcoming schedule, progress stats,
//       pending homework, and recent lesson notes for the parent.
//       No auth required — uses the parentAccessToken from Student.
//
// SECURITY FIX (API-C02/FE-M03): Brute-force protection using
// shared rate-limit module (Upstash Redis or in-memory fallback).
// ============================================================
//
// NOTE: Student has no `grade`/`notes` fields. ScheduledLesson has
// no `title`, `scheduledAt`, `durationMinutes`, `timeZone`, or
// `tutor` relation — we use `startTime`/`endTime` and the tutor
// relation is resolved via tutorId -> User. Homework and LessonNote
// are linked to the student via the rooms the student participated
// in (RoomParticipant.studentId). Homework has no subject/grade/
// tutorFeedback. LessonNote has no tutorFeedback/topicsForNext/
// rating.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    // SECURITY: Validate token format — must be at least 32 chars (cryptographic strength)
    if (!token || token.length < 32 || !/^[a-zA-Z0-9_-]+$/.test(token)) {
      return NextResponse.json({ error: 'Invalid access token format' }, { status: 400 });
    }

    // SECURITY: Rate limit parent portal token lookups
    // Uses shared rate-limit module with Upstash Redis for serverless compatibility
    const rlResult = await checkRateLimit(request, 'parentPortal', {
      max: 5,
      windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes
    });

    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }

    // Find the student by parent access token
    const student = await db.student.findUnique({
      where: { parentAccessToken: token },
      include: {
        agency: {
          select: { id: true, name: true, email: true, agencyName: true, brandingLogoUrl: true, brandingColor: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 404 });
    }

    if (!student.isActive) {
      return NextResponse.json({ error: 'Student account is inactive' }, { status: 403 });
    }

    const agencyId = student.agencyId;

    // Find all tutor IDs that could have lessons for this student
    const tutorIds = [agencyId];
    const subTutors = await db.user.findMany({
      where: { parentAgencyId: agencyId },
      select: { id: true, name: true, email: true },
    });
    tutorIds.push(...subTutors.map((t) => t.id));
    const tutorMap = new Map(subTutors.map((t) => [t.id, t]));
    // Include agency owner in map
    tutorMap.set(agencyId, student.agency);

    // Find all rooms the student participated in so we can pull
    // homework and lesson notes via roomId.
    const participation = await db.roomParticipant.findMany({
      where: { studentId: student.id },
      select: {
        roomId: true,
        joinedAt: true,
        room: {
          select: {
            subject: true,
            durationMinutes: true,
            endedAt: true,
            tutorId: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: 100,
    });
    const roomIds = participation.map((p) => p.roomId);
    // RoomParticipant.room is an optional relation — only keep rows
    // whose room exists and has ended.
    const completedParticipants = participation.filter(
      (p): p is typeof p & { room: NonNullable<typeof p.room> } =>
        !!p.room && !!p.room.endedAt,
    );

    // Fetch data in parallel
    const [upcomingLessons, recentNotes, allHomework, gradedHomework] = await Promise.all([
      // Upcoming scheduled lessons. ScheduledLesson has no `tutor` relation
      // — resolve tutor info from the tutorMap built above.
      db.scheduledLesson.findMany({
        where: {
          tutorId: { in: tutorIds },
          studentEmail: student.email,
          status: 'scheduled',
          startTime: { gte: new Date() },
        },
        select: {
          id: true,
          subject: true,
          startTime: true,
          endTime: true,
          notes: true,
          tutorId: true,
        },
        orderBy: { startTime: 'asc' },
        take: 15,
      }),

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
              tutor: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : Promise.resolve([]),

      // All pending/overdue homework
      roomIds.length > 0
        ? db.homework.findMany({
            where: {
              roomId: { in: roomIds },
              status: { in: ['assigned', 'submitted', 'overdue'] },
            },
            select: {
              id: true,
              title: true,
              description: true,
              dueDate: true,
              status: true,
              createdAt: true,
            },
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
            take: 20,
          })
        : Promise.resolve([]),

      // Graded homework for the homework tab
      roomIds.length > 0
        ? db.homework.findMany({
            where: {
              roomId: { in: roomIds },
              status: 'graded',
            },
            select: {
              id: true,
              title: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          })
        : Promise.resolve([]),
    ]);

    // Compute progress stats
    const subjectsCovered = [...new Set(completedParticipants.map((p) => p.room.subject))];
    const lastLessonDate = completedParticipants.length > 0
      ? completedParticipants.reduce((latest, p) => {
          const d = p.room.endedAt!;
          return d > latest ? d : latest;
        }, completedParticipants[0].room.endedAt!)
      : null;

    // Helper to look up a tutor's display name from the tutor map.
    const tutorNameFor = (tutorId: string): string => {
      const t = tutorMap.get(tutorId);
      return t?.name || t?.email || 'Tutor';
    };

    return NextResponse.json({
      studentName: student.name,
      studentEmail: student.email,
      agencyName: student.agency.agencyName || student.agency.name,
      agencyLogo: student.agency.brandingLogoUrl,
      schedule: upcomingLessons.map((l) => ({
        id: l.id,
        subject: l.subject,
        scheduledAt: l.startTime.toISOString(),
        startTime: l.startTime.toISOString(),
        endTime: l.endTime?.toISOString() ?? null,
        durationMinutes: l.endTime
          ? Math.round((l.endTime.getTime() - l.startTime.getTime()) / 60000)
          : null,
        tutorName: tutorNameFor(l.tutorId),
      })),
      progress: {
        totalLessons: completedParticipants.length,
        subjects: subjectsCovered,
        lastActive: lastLessonDate?.toISOString() ?? null,
      },
      homework: [
        ...allHomework.map((h) => ({
          id: h.id,
          title: h.title,
          status: h.status,
          dueDate: h.dueDate?.toISOString() ?? null,
        })),
        ...gradedHomework.map((h) => ({
          id: h.id,
          title: h.title,
          status: 'graded' as const,
          dueDate: null as string | null,
        })),
      ],
      notes: recentNotes.map((n) => ({
        id: n.id,
        content: n.content,
        tutorName: n.tutor?.name ?? null,
        subject: n.room?.subject ?? 'GENERAL',
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[Parent Portal] Error:', error);
    return NextResponse.json({ error: 'Failed to load parent portal data' }, { status: 500 });
  }
}
