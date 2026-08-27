// ============================================================
// Admin API — Single User Operations
// ============================================================
// PATCH — Update user (change tier, name, admin status)
// DELETE — Remove user (admin only)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { userId } = await params;

  try {
    const body = await request.json();
    const { tier, name, isAdmin, status, gracePeriodDays } = body;

    const VALID_TIERS = ['FREE', 'PRO', 'AGENCY', 'AGENCY_STANDARD', 'AGENCY_PREMIUM'] as const;
    const VALID_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;

    // SECURITY FIX (API-H01): Validate input fields to prevent mass assignment
    if (tier !== undefined && !VALID_TIERS.includes(tier as any)) {
      return NextResponse.json({ error: 'Invalid tier value' }, { status: 400 });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status as any)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    if (isAdmin !== undefined && typeof isAdmin !== 'boolean') {
      return NextResponse.json({ error: 'isAdmin must be a boolean' }, { status: 400 });
    }
    if (gracePeriodDays !== undefined) {
      if (typeof gracePeriodDays !== 'number' || gracePeriodDays < 1 || gracePeriodDays > 365) {
        return NextResponse.json({ error: 'gracePeriodDays must be a number between 1 and 365' }, { status: 400 });
      }
    }

    // SECURITY FIX (AUDIT-MED-1): Use !== undefined checks instead of truthy.
    // Previously, `if (tier)` would skip tier='FREE' (falsy), and
    // `if (gracePeriodDays)` would skip gracePeriodDays=0.
    const updateData: Record<string, unknown> = {};
    if (tier !== undefined) updateData.tier = tier;
    if (name !== undefined) updateData.name = name;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (status !== undefined) updateData.status = status;
    if (gracePeriodDays !== undefined) {
      updateData.gracePeriodEndsAt = new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Log each action type (use !== undefined for consistency)
    if (tier !== undefined) {
      await logAudit(adminCheck.userId, 'USER_TIER_CHANGE', 'User', userId, { newTier: tier });
    }
    if (isAdmin !== undefined) {
      await logAudit(adminCheck.userId, 'USER_ADMIN_TOGGLE', 'User', userId, { isAdmin });
    }
    if (status !== undefined) {
      await logAudit(adminCheck.userId, 'USER_STATUS_CHANGE', 'User', userId, { newStatus: status });
    }
    if (gracePeriodDays !== undefined) {
      await logAudit(adminCheck.userId, 'USER_GRACE_PERIOD', 'User', userId, { gracePeriodDays });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('[Admin User PATCH]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { userId } = await params;

  try {
    // Get user info for audit before deletion
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    await db.user.delete({ where: { id: userId } });

    await logAudit(adminCheck.userId, 'USER_DELETE', 'User', userId, { email: targetUser?.email });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin User DELETE]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete user. They may have related records.' },
      { status: 500 }
    );
  }
}
