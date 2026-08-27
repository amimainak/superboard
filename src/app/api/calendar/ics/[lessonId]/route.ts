// ============================================================
// API Route: Calendar ICS Generation
// ============================================================
// GET:  Generate a .ics (iCalendar) file for a scheduled lesson.
//       Returns text/calendar content-type with the ICS data.
//       No auth required — lesson ID is used directly.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.[0-9]{3}/, '');
}

/** Escape text per RFC 5545 (iCalendar) */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

type RouteContext = { params: Promise<{ lessonId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    // SECURITY FIX (API-C03): Require authentication for calendar ICS.
    // Previously leaked student/tutor emails to anyone with a lesson UUID.
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { lessonId } = await context.params;

    const lesson = await db.scheduledLesson.findUnique({
      where: { id: lessonId },
      include: {
        tutor: { select: { name: true, email: true } },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // SECURITY: Verify caller is the tutor or a registered participant
    if (lesson.tutorId !== auth.userId) {
      // Check if the caller's email matches the student email
      const callerUser = await db.user.findUnique({
        where: { id: auth.userId },
        select: { email: true },
      });
      if (!callerUser || callerUser.email !== lesson.studentEmail) {
        // Also check agency access
        const caller = await db.user.findUnique({
          where: { id: auth.userId },
          select: { tier: true, parentAgencyId: true },
        });
        const isAgencyOwner = caller && ['AGENCY_STANDARD', 'AGENCY_PREMIUM'].includes(caller.tier || '');
        const isAgencySubTutor = caller?.parentAgencyId && caller.parentAgencyId === lesson.tutorId;
        if (!isAgencyOwner && !isAgencySubTutor && lesson.tutorId !== auth.userId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // Calculate end time
    const start = new Date(lesson.scheduledAt);
    const end = new Date(start.getTime() + lesson.durationMinutes * 60 * 1000);

    const now = formatICSDate(new Date());
    const dtStart = formatICSDate(start);
    const dtEnd = formatICSDate(end);
    const uid = `superboard-lesson-${lesson.id}@superboard.app`;

    const tutorName = lesson.tutor.name || lesson.tutor.email;

    // Build description
    const descLines: string[] = [];
    if (lesson.description) descLines.push(lesson.description);
    if (lesson.studentName) descLines.push(`Student: ${lesson.studentName}`);
    if (lesson.studentEmail) descLines.push(`Student Email: ${lesson.studentEmail}`);
    descLines.push(`Subject: ${lesson.subject}`);
    descLines.push(`Duration: ${lesson.durationMinutes} minutes`);
    const description = escapeICS(descLines.join('\n'));

    // Build ICS content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SuperBoard//K-12 Tutoring Whiteboard//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeICS(lesson.title)}`,
      `DESCRIPTION:${description}`,
      `ORGANIZER;CN=${escapeICS(tutorName)}:mailto:${lesson.tutor.email}`,
      `STATUS:${lesson.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const filename = `lesson-${lesson.id.substring(0, 8)}.ics`;

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[Calendar ICS] Error:', error);
    return NextResponse.json({ error: 'Failed to generate calendar file' }, { status: 500 });
  }
}
