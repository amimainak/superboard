// ============================================================
// API Route: Agency Analytics
// ============================================================
// GET:  Agency-wide analytics aggregating across all sub-tutors.
//       ?from=ISO_DATE&to=ISO_DATE
//       Returns: tutor performance, student outcomes, revenue.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Verify agency tier
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user || !isAgencyTier(user.tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'Only agency users can view analytics' },
        { status: 403 },
      );
    }

    const agencyId = user.parentAgencyId || auth.userId;

    // Parse date range
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from')
      ? new Date(searchParams.get('from')!)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // First of current month
    const to = searchParams.get('to')
      ? new Date(searchParams.get('to')!)
      : new Date(); // Now

    // Get all tutor IDs (agency owner + sub-tutors)
    const allTutors = await db.user.findMany({
      where: {
        OR: [
          { id: agencyId },
          { parentAgencyId: agencyId },
        ],
      },
      select: { id: true, name: true, email: true, tier: true, createdAt: true },
    });
    const tutorIds = allTutors.map((t) => t.id);

    // Fetch analytics data in parallel
    const [
      totalStudents,
      activeStudents,
      roomsInPeriod,
      homeworkStats,
      lessonNotesCount,
      invoiceData,
      scheduleData,
    ] = await Promise.all([
      // Total students
      db.student.count({ where: { agencyId } }),

      // Active students
      db.student.count({ where: { agencyId, isActive: true } }),

      // Rooms (lessons) in period
      db.room.findMany({
        where: {
          tutorId: { in: tutorIds },
          endedAt: { gte: from, lte: to },
        },
        select: {
          id: true,
          tutorId: true,
          subject: true,
          durationMinutes: true,
          endedAt: true,
          _count: { select: { participants: true } },
        },
      }),

      // Homework stats
      db.homework.groupBy({
        by: ['status'],
        where: { agencyId, createdAt: { gte: from, lte: to } },
        _count: true,
      }),

      // Lesson notes count in period
      db.lessonNote.count({
        where: { tutorId: { in: tutorIds }, createdAt: { gte: from, lte: to } },
      }),

      // Invoice data: total revenue, paid, outstanding
      db.invoice.aggregate({
        where: { agencyId, createdAt: { gte: from, lte: to } },
        _sum: { amountCents: true, paidAmountCents: true },
        _count: true,
      }),

      // Completed scheduled lessons in period
      db.scheduledLesson.findMany({
        where: {
          tutorId: { in: tutorIds },
          status: 'COMPLETED',
          updatedAt: { gte: from, lte: to },
        },
        select: { tutorId: true, durationMinutes: true, subject: true },
      }),
    ]);

    // Calculate totals
    const totalLessonHours = roomsInPeriod.reduce((sum, r) => sum + (r.durationMinutes / 60), 0);
    const totalLessons = roomsInPeriod.length;

    // Subject breakdown
    const subjectBreakdown: Record<string, { count: number; hours: number }> = {};
    for (const room of roomsInPeriod) {
      const subj = room.subject;
      if (!subjectBreakdown[subj]) subjectBreakdown[subj] = { count: 0, hours: 0 };
      subjectBreakdown[subj].count += 1;
      subjectBreakdown[subj].hours += room.durationMinutes / 60;
    }

    // Tutor performance
    const tutorPerformance = allTutors.map((tutor) => {
      const tutorRooms = roomsInPeriod.filter((r) => r.tutorId === tutor.id);
      const tutorHours = tutorRooms.reduce((sum, r) => sum + (r.durationMinutes / 60), 0);
      const tutorScheduled = scheduleData.filter((s) => s.tutorId === tutor.id);
      const tutorScheduledHours = tutorScheduled.reduce((sum, s) => sum + (s.durationMinutes / 60), 0);
      return {
        tutorId: tutor.id,
        name: tutor.name || tutor.email,
        email: tutor.email,
        lessonsCompleted: tutorRooms.length,
        lessonHours: Math.round(tutorHours * 100) / 100,
        scheduledCompleted: tutorScheduled.length,
        scheduledHours: Math.round(tutorScheduledHours * 100) / 100,
      };
    });

    // Homework stats map
    const homeworkMap: Record<string, number> = {};
    for (const h of homeworkStats) {
      homeworkMap[h.status] = h._count;
    }

    // Invoice stats
    const totalRevenueCents = invoiceData._sum.amountCents || 0;
    const totalPaidCents = invoiceData._sum.paidAmountCents || 0;
    const outstandingCents = totalRevenueCents - totalPaidCents;

    // Average rating from lesson notes
    const avgRatingResult = await db.lessonNote.aggregate({
      where: { tutorId: { in: tutorIds }, rating: { not: null }, createdAt: { gte: from, lte: to } },
      _avg: { rating: true },
    });

    return NextResponse.json({
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      overview: {
        totalStudents,
        activeStudents,
        totalTutors: allTutors.length,
        totalLessons,
        totalLessonHours: Math.round(totalLessonHours * 100) / 100,
        averageRating: avgRatingResult._avg.rating
          ? Math.round(avgRatingResult._avg.rating * 100) / 100
          : null,
        lessonNotesWritten: lessonNotesCount,
      },
      subjectBreakdown,
      tutorPerformance,
      homework: {
        pending: homeworkMap['PENDING'] || 0,
        submitted: homeworkMap['SUBMITTED'] || 0,
        graded: homeworkMap['GRADED'] || 0,
        overdue: homeworkMap['OVERDUE'] || 0,
      },
      revenue: {
        totalCents: totalRevenueCents,
        paidCents: totalPaidCents,
        outstandingCents,
        totalInvoices: invoiceData._count,
      },
    });
  } catch (error) {
    console.error('[Agency Analytics] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

