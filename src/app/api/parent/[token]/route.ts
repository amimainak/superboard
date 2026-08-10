// ============================================================
// API Route: Parent Portal — Token-based Access
// ============================================================
// GET:  Returns student info, upcoming schedule, progress stats,
//       pending homework, and recent lesson notes for the parent.
//       No auth required — uses the parentAccessToken from Student.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteContext = { params: Promise<{ token: string }> };

// SECURITY FIX (API-C02/FE-M03): Brute-force protection for parent portal tokens
const parentTokenAttempts = new Map<string, { count: number; lockoutUntil: number }>();
const MAX_PARENT_TOKEN_ATTEMPTS = 5;
const PARENT_TOKEN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    // SECURITY FIX (API-C02/FE-M03): Rate limit parent portal token lookups
    if (token) {
      const now = Date.now();
      const entry = parentTokenAttempts.get(token);
      if (entry && now < entry.lockoutUntil) {
        return NextResponse.json(
          { error: 'Too many failed attempts. Please try again later.' },
          { status: 429 }
        );
      }
      if (entry && entry.count >= MAX_PARENT_TOKEN_ATTEMPTS) {
        parentTokenAttempts.set(token, { count: entry.count, lockoutUntil: now + PARENT_TOKEN_LOCKOUT_MS });
        return NextResponse.json(
          { error: 'Too many failed attempts. Please try again later.' },
          { status: 429 }
        );
      }
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
      // SECURITY: Track failed token attempt
      const now = Date.now();
      const entry = parentTokenAttempts.get(token);
      if (entry) {
        entry.count++;
        if (entry.count >= MAX_PARENT_TOKEN_ATTEMPTS) {
          entry.lockoutUntil = now + PARENT_TOKEN_LOCKOUT_MS;
        }
      } else {
        parentTokenAttempts.set(token, { count: 1, lockoutUntil: 0 });
      }
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
      select: { id: true },
    });
    tutorIds.push(...subTutors.map((t) => t.id));

    // Fetch data in parallel
    const [upcomingLessons, recentNotes, allHomework, completedParticipants, gradedHomework] =
      await Promise.all([
        // Upcoming scheduled lessons with tutor info
        db.scheduledLesson.findMany({
          where: {
            tutorId: { in: tutorIds },
            studentEmail: student.email,
            status: 'SCHEDULED',
            scheduledAt: { gte: new Date() },
          },
          select: {
            id: true,
            title: true,
            subject: true,
            scheduledAt: true,
            durationMinutes: true,
            timeZone: true,
            tutor: { select: { name: true, email: true } },
          },
          orderBy: { scheduledAt: 'asc' },
          take: 15,
        }),

        // Recent lesson notes (last 10)
        db.lessonNote.findMany({
          where: { studentId: student.id },
          select: {
            id: true,
            content: true,
            tutorFeedback: true,
            topicsForNext: true,
            rating: true,
            createdAt: true,
            room: { select: { subject: true, durationMinutes: true } },
            tutor: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),

        // All pending/overdue homework
        db.homework.findMany({
          where: {
            studentId: student.id,
            status: { in: ['PENDING', 'SUBMITTED', 'OVERDUE'] },
          },
          select: {
            id: true,
            title: true,
            description: true,
            subject: true,
            dueDate: true,
            status: true,
            tutorFeedback: true,
            grade: true,
            createdAt: true,
          },
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
          take: 20,
        }),

        // Completed room participants for total lesson count + subjects
        db.roomParticipant.findMany({
          where: { studentId: student.id },
          select: {
            roomId: true,
            joinedAt: true,
            room: {
              select: {
                subject: true,
                durationMinutes: true,
                endedAt: true,
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
          take: 100,
        }),

        // Graded homework for the homework tab
        db.homework.findMany({
          where: {
            studentId: student.id,
            status: 'GRADED',
          },
          select: {
            id: true,
            title: true,
            subject: true,
            grade: true,
            tutorFeedback: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ]);

    // Compute progress stats
    const completedLessons = completedParticipants.filter((p) => p.room.endedAt);
    const subjectsCovered = [...new Set(completedLessons.map((p) => p.room.subject))];
    const lastLessonDate = completedLessons.length > 0
      ? completedLessons.reduce((latest, p) => {
          const d = p.room.endedAt!;
          return d > latest ? d : latest;
        }, completedLessons[0].room.endedAt!)
      : null;

    return NextResponse.json({
      studentName: student.name,
      studentEmail: student.email,
      agencyName: student.agency.agencyName || student.agency.name,
      agencyLogo: student.agency.brandingLogoUrl,
      schedule: upcomingLessons.map((l) => ({
        id: l.id,
        title: l.title,
        subject: l.subject,
        scheduledAt: l.scheduledAt.toISOString(),
        durationMinutes: l.durationMinutes,
        tutorName: l.tutor.name || l.tutor.email,
      })),
      progress: {
        totalLessons: completedLessons.length,
        subjects: subjectsCovered,
        lastActive: lastLessonDate?.toISOString() ?? null,
      },
      homework: [
        ...allHomework.map((h) => ({
          id: h.id,
          title: h.title,
          subject: h.subject,
          status: h.status as 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE',
          grade: h.grade,
          feedback: h.tutorFeedback,
          dueDate: h.dueDate?.toISOString() ?? null,
        })),
        ...gradedHomework.map((h) => ({
          id: h.id,
          title: h.title,
          subject: h.subject,
          status: 'GRADED' as const,
          grade: h.grade,
          feedback: h.tutorFeedback,
          dueDate: null as string | null,
        })),
      ],
      notes: recentNotes.map((n) => ({
        id: n.id,
        content: n.content,
        tutorName: n.tutor.name ?? null,
        subject: n.room?.subject ?? 'GENERAL',
        createdAt: n.createdAt.toISOString(),
        rating: n.rating ?? 0,
      })),
    });
  } catch (error) {
    console.error('[Parent Portal] Error:', error);
    return NextResponse.json({ error: 'Failed to load parent portal data' }, { status: 500 });
  }
}
