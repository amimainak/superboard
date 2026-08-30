// ============================================================
// Admin API — Bulk User Operations
// ============================================================
// POST — Change tier for multiple users at once
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const body = await request.json();
    const { userIds, tier, action } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array is required.' }, { status: 400 });
    }
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const uid of userIds) {
      if (typeof uid !== 'string' || !UUID_RE.test(uid)) {
        return NextResponse.json({ error: 'Each userId must be a valid UUID.' }, { status: 400 });
      }
    }
    if (userIds.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 users per bulk operation.' }, { status: 400 });
    }

    // Exclude admins and the platform owner from bulk operations
    const protectedUsers = await db.user.findMany({
      where: {
        id: { in: userIds },
        OR: [
          { isAdmin: true },
          { email: process.env.OWNER_EMAIL },
        ],
      },
      select: { id: true },
    });
    const protectedIds = new Set(protectedUsers.map(u => u.id));
    const safeUserIds = userIds.filter((id: string) => !protectedIds.has(id));

    if (safeUserIds.length === 0) {
      return NextResponse.json({ error: 'All specified users are protected (admin or owner).' }, { status: 400 });
    }

    if (action === 'changeTier' && tier) {
      // SECURITY FIX (API-H02): Validate tier value before bulk update
      const VALID_TIERS = ['FREE', 'PRO', 'AGENCY', 'AGENCY_STANDARD', 'AGENCY_PREMIUM'] as const;
      if (!VALID_TIERS.includes(tier as any)) {
        return NextResponse.json({ error: 'Invalid tier value' }, { status: 400 });
      }
      const result = await db.user.updateMany({
        where: { id: { in: safeUserIds } },
        data: { tier },
      });

      await logAudit(adminCheck.userId, 'BULK_TIER_CHANGE', 'User', undefined, {
        userIds: safeUserIds,
        newTier: tier,
        affectedCount: result.count,
      });

      return NextResponse.json({
        success: true,
        affectedCount: result.count,
        message: `${result.count} users updated to ${tier}.`,
      });
    }

    if (action === 'suspend') {
      const result = await db.user.updateMany({
        where: { id: { in: safeUserIds } },
        data: { status: 'SUSPENDED' },
      });
      await logAudit(adminCheck.userId, 'BULK_SUSPEND', 'User', undefined, {
        userIds: safeUserIds,
        affectedCount: result.count,
      });
      return NextResponse.json({ success: true, affectedCount: result.count, message: `${result.count} users suspended.` });
    }

    if (action === 'activate') {
      const result = await db.user.updateMany({
        where: { id: { in: safeUserIds } },
        data: { status: 'ACTIVE' },
      });
      await logAudit(adminCheck.userId, 'BULK_ACTIVATE', 'User', undefined, {
        userIds: safeUserIds,
        affectedCount: result.count,
      });
      return NextResponse.json({ success: true, affectedCount: result.count, message: `${result.count} users activated.` });
    }

    return NextResponse.json({ error: 'Invalid action. Use changeTier, suspend, or activate.' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin Bulk POST]', error);
    return NextResponse.json({ error: 'Bulk operation failed.' }, { status: 500 });
  }
}
