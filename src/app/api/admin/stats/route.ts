// ============================================================
// Admin API — Platform Statistics
// ============================================================
// GET — Aggregated platform stats for admin dashboard
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    // Run all queries in parallel for speed
    const [
      totalUsers,
      usersByTier,
      totalRooms,
      activeRooms,
      totalTemplates,
      totalRecordings,
      recentUsers,
      totalUsageThisPeriod,
      totalParticipants,
      usersByStatus,
    ] = await Promise.all([
      // Total user count
      db.user.count(),

      // Users grouped by tier
      db.user.groupBy({
        by: ['tier'],
        _count: { tier: true },
      }),

      // Total rooms
      db.room.count(),

      // Active rooms
      db.room.count({ where: { isActive: true } }),

      // Total templates
      db.template.count(),

      // Total recordings
      db.recording.count(),

      // Recent users (last 30 days)
      db.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Total AI credits used this period (aggregate all usage logs)
      db.usageLog.aggregate({
        _sum: {
          aiCreditsUsed: true,
          videoMinutesUsed: true,
          recordingsUsed: true,
        },
      }),

      // Total unique participants
      db.roomParticipant.groupBy({
        by: ['studentIdentity'],
        _count: { studentIdentity: true },
      }),

      // User status breakdown (ACTIVE, SUSPENDED, BANNED)
      db.user.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    // Extract status counts
    const suspendedUsers = (usersByStatus as any[]).find(s => s.status === 'SUSPENDED')?._count?.status || 0;
    const bannedUsers = (usersByStatus as any[]).find(s => s.status === 'BANNED')?._count?.status || 0;

    // Daily signups over last 14 days — use raw SQL to group by DATE (not millisecond precision)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const dailySignups = await db.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM "User"
      WHERE "createdAt" >= ${fourteenDaysAgo.toISOString()}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
    `;

    // Rooms by subject
    const roomsBySubject = await db.room.groupBy({
      by: ['subject'],
      _count: { subject: true },
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        recentUsers,
        totalRooms,
        activeRooms,
        totalTemplates,
        totalRecordings,
        totalParticipants: totalParticipants.length,
        suspendedUsers,
        bannedUsers,
      },
      usersByTier: usersByTier.map((t) => ({
        tier: t.tier,
        count: t._count.tier,
      })),
      usersByStatus: (usersByStatus as any[]).map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      roomsBySubject: roomsBySubject.map((r) => ({
        subject: r.subject,
        count: r._count.subject,
      })),
      usage: {
        aiCreditsTotal: totalUsageThisPeriod._sum.aiCreditsUsed || 0,
        videoMinutesTotal: totalUsageThisPeriod._sum.videoMinutesUsed || 0,
        recordingsTotal: totalUsageThisPeriod._sum.recordingsUsed || 0,
      },
      dailySignups: dailySignups.map((d) => ({ date: d.date, count: Number(d.count) })),
    });
  } catch (error: any) {
    console.error('[Admin Stats GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
