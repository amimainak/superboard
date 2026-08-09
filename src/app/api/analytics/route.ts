// ============================================================
// Analytics API — Tutor Analytics Dashboard
// ============================================================
// GET — Returns analytics data for the authenticated tutor
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const userId = auth.userId;

  try {
    // Run independent queries in parallel
    const [totalRooms, totalMinutesAgg, subjectGroups, recentRooms, allParticipantCounts] =
      await Promise.all([
        // Total rooms for this tutor
        db.room.count({ where: { tutorId: userId } }),

        // Total duration minutes across all rooms
        db.room.aggregate({
          where: { tutorId: userId },
          _sum: { durationMinutes: true },
        }),

        // Rooms grouped by subject
        db.room.groupBy({
          by: ['subject'],
          where: { tutorId: userId },
          _count: { subject: true },
        }),

        // 5 most recent rooms with participant count
        db.room.findMany({
          where: { tutorId: userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            subject: true,
            isActive: true,
            createdAt: true,
            durationMinutes: true,
            participants: { select: { id: true } },
          },
        }),

        // Total unique students (distinct participant identities)
        db.roomParticipant.groupBy({
          by: ['studentIdentity'],
          where: { room: { tutorId: userId } },
        }),
      ]);

    // Build subjects map
    const subjects: Record<string, number> = {};
    for (const g of subjectGroups) {
      subjects[g.subject] = g._count.subject;
    }

    // --- Weekly activity (last 7 days) ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyRooms = await db.room.findMany({
      where: {
        tutorId: userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
        durationMinutes: true,
        participants: { select: { id: true } },
      },
    });

    // Group by date string
    const weeklyMap: Record<string, { rooms: number; minutes: number; students: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      weeklyMap[key] = { rooms: 0, minutes: 0, students: 0 };
    }
    for (const r of weeklyRooms) {
      const key = r.createdAt.toISOString().slice(0, 10);
      if (weeklyMap[key]) {
        weeklyMap[key].rooms += 1;
        weeklyMap[key].minutes += r.durationMinutes || 0;
        weeklyMap[key].students += r.participants.length;
      }
    }
    const weeklyActivity = Object.entries(weeklyMap).map(([date, data]) => ({
      date,
      rooms: data.rooms,
      minutes: data.minutes,
      students: data.students,
    }));

    // --- Monthly trend (last 6 months) ---
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRooms = await db.room.findMany({
      where: {
        tutorId: userId,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
        durationMinutes: true,
      },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap: Record<string, { rooms: number; minutes: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { rooms: 0, minutes: 0 };
    }
    for (const r of monthlyRooms) {
      const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].rooms += 1;
        monthlyMap[key].minutes += r.durationMinutes || 0;
      }
    }
    const monthlyTrend = Object.entries(monthlyMap).map(([yearMonth, data]) => {
      const m = parseInt(yearMonth.split('-')[1], 10);
      return {
        month: monthNames[m - 1],
        rooms: data.rooms,
        minutes: data.minutes,
      };
    });

    // Build recent rooms response
    const recentRoomsWithParticipants = recentRooms.map((r) => ({
      id: r.id,
      subject: r.subject,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
      durationMinutes: r.durationMinutes,
      participants: r.participants.length,
    }));

    return NextResponse.json({
      totalRooms,
      totalStudents: allParticipantCounts.length,
      totalMinutes: totalMinutesAgg._sum.durationMinutes || 0,
      subjects,
      weeklyActivity,
      monthlyTrend,
      recentRooms: recentRoomsWithParticipants,
    });
  } catch (error: any) {
    console.error('[Analytics GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
