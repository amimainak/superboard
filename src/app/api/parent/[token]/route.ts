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

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, extractClientIP } from '@/lib/rate-limit';

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    // SECURITY FIX (API-C02/FE-M03): Rate limit parent portal token lookups
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
