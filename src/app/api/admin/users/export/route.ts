// ============================================================
// Admin API — Export Users as CSV
// ============================================================
// GET — Returns a CSV file of all users (with optional filters)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { searchParams } = new URL(request.url);
  const MAX_LIMIT = 100;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), MAX_LIMIT);
  const tier = searchParams.get('tier') || '';
  const status = searchParams.get('status') || '';

  try {
    const where: any = {};
    if (tier) where.tier = tier;
    if (status) where.status = status;

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        status: true,
        isAdmin: true,
        createdAt: true,
        _count: { select: { rooms: true, templates: true, agencyMembers: true } },
      },
    });

    // Build CSV
    const header = 'ID,Email,Name,Tier,Status,Is Admin,Rooms,Templates,Sub-Tutors,Created At';
    const rows = users.map(u => [
      u.id,
      `"${u.email}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      u.tier,
      u.status,
      u.isAdmin ? 'Yes' : 'No',
      u._count.rooms,
      u._count.templates,
      u._count.agencyMembers,
      u.createdAt.toISOString(),
    ].join(','));

    const csv = [header, ...rows].join('\n');

    await logAudit(adminCheck.userId, 'USER_EXPORT', 'User', undefined, {
      filterTier: tier || 'all',
      filterStatus: status || 'all',
      exportCount: users.length,
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="superboard-users-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('[Admin Export GET]', error);
    return NextResponse.json({ error: 'Failed to export users.' }, { status: 500 });
  }
}
