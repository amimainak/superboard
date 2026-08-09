// ============================================================
// API Route: Calendar ICS Generation
// ============================================================
// GET:  Generate a .ics (iCalendar) file for a scheduled lesson.
//       Returns text/calendar content-type with the ICS data.
//       No auth required — lesson ID is used directly.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
