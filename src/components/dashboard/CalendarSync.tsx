// ============================================================
// CalendarSync — Google Calendar & ICS download for scheduled lessons
// ============================================================
// Compact inline buttons for embedding in schedule table rows.
//   • Google Calendar: opens calendar.google.com with encoded params
//   • Download .ics: fetches from /api/calendar/ics/[lessonId]
//     via blob + URL.createObjectURL, falls back to client-side ICS
// ============================================================
'use client';

import React, { useState } from 'react';
import { Calendar, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface Lesson {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  timeZone?: string;
}

type Props = {
  lesson: Lesson;
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function buildGoogleCalendarUrl(lesson: Lesson): string {
  const start = new Date(lesson.scheduledAt);
  const end = new Date(start.getTime() + lesson.durationMinutes * 60 * 1000);

  // Format dates as YYYYMMDDTHHmmSSZ for Google Calendar
  const fmt = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: lesson.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Lesson scheduled via SuperBoard.\n\nLesson ID: ${lesson.id}`,
    location: 'SuperBoard Online',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function generateICSContent(lesson: Lesson): string {
  const start = new Date(lesson.scheduledAt);
  const end = new Date(start.getTime() + lesson.durationMinutes * 60 * 1000);
  const now = new Date();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SuperBoard//K-12 Tutoring Whiteboard//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `UID:${lesson.id}@superboard.app`,
    `SUMMARY:${lesson.title}`,
    'DESCRIPTION:Lesson scheduled via SuperBoard',
    'LOCATION:SuperBoard Online',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export function CalendarSync({ lesson }: Props) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  // ---- Google Calendar ----
  const handleGoogleCalendar = () => {
    const url = buildGoogleCalendarUrl(lesson);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ---- ICS Download ----
  const handleDownloadICS = async () => {
    setDownloading(true);
    try {
      // Try the API first for a proper ICS
      const res = await fetch(`/api/calendar/ics/${lesson.id}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lesson-${lesson.id.substring(0, 8)}.ics`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fallback to client-generated ICS
    } finally {
      setDownloading(false);
    }

    // Fallback: generate ICS client-side
    const icsContent = generateICSContent(lesson);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-${lesson.id.substring(0, 8)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Calendar file downloaded' });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleGoogleCalendar}
        title="Add to Google Calendar"
        className="inline-flex items-center gap-1 h-7 px-2 text-[11px] text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Google Cal</span>
      </button>
      <button
        type="button"
        onClick={handleDownloadICS}
        disabled={downloading}
        title="Download .ics file"
        className="inline-flex items-center gap-1 h-7 px-2 text-[11px] text-muted-foreground hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
      >
        {downloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">.ics</span>
      </button>
    </div>
  );
}
