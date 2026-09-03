// ============================================================
// API Route: Calendar ICS Generation
// ============================================================
// GET:  Generate a .ics (iCalendar) file for a scheduled lesson.
//       Returns text/calendar content-type with the ICS data.
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
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { lessonId } = await context.params;

    const lesson = await db.scheduledLesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Fetch the tutor separately (ScheduledLesson has no relation defined).
    const tutor = await db.user.findUnique({
      where: { id: lesson.tutorId },
      select: { name: true, email: true },
    });

    // SECURITY: Verify caller is the tutor or a registered participant
    if (lesson.tutorId !== auth.userId) {
      // Check if the caller's email matches the student email
      const callerUser = await db.user.findUnique({
        where: { id: auth.userId },
        select: { email: true, tier: true, parentAgencyId: true },
      });
      const isStudent = callerUser?.email && lesson.studentEmail
        ? callerUser.email === lesson.studentEmail
        : false;
      if (!isStudent) {
        // Also check agency access
        const isAgencyOwner = callerUser && ['AGENCY_STANDARD', 'AGENCY_PREMIUM'].includes(callerUser.tier || '');
        const isAgencySubTutor = callerUser?.parentAgencyId && callerUser.parentAgencyId === lesson.tutorId;
        if (!isAgencyOwner && !isAgencySubTutor) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // Calculate start and end times
    const start = lesson.startTime;
    const end = lesson.endTime ?? new Date(start.getTime() + 60 * 60 * 1000); // default 1 hour

    const now = formatICSDate(new Date());
    const dtStart = formatICSDate(start);
    const dtEnd = formatICSDate(end);
    const uid = `superboard-lesson-${lesson.id}@superboard.app`;

    const tutorName = tutor?.name || tutor?.email || 'Tutor';
    const tutorEmail = tutor?.email || 'unknown@example.com';

    // Build description
    const descLines: string[] = [];
    if (lesson.notes) descLines.push(lesson.notes);
    if (lesson.studentName) descLines.push(`Student: ${lesson.studentName}`);
    if (lesson.studentEmail) descLines.push(`Student Email: ${lesson.studentEmail}`);
    descLines.push(`Subject: ${lesson.subject}`);
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
      `SUMMARY:${escapeICS(lesson.subject)}`,
      `DESCRIPTION:${description}`,
      `ORGANIZER;CN=${escapeICS(tutorName)}:mailto:${tutorEmail}`,
      `STATUS:${lesson.status === 'CANCELLED' || lesson.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
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
