// ============================================================
// Admin API — Ban / Suspend User
// ============================================================
// POST — Set user status (ACTIVE, SUSPENDED, BANNED)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;
  const { userId } = await params;

  try {
    const body = await request.json();
    const { status, reason } = body;

    if (typeof reason === 'string' && reason.length > 1000) {
      return NextResponse.json({ error: 'Reason must be 1000 characters or less.' }, { status: 400 });
    }

    if (!['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be ACTIVE, SUSPENDED, or BANNED.' }, { status: 400 });
    }

    const adminId = adminCheck.userId;

    // Prevent admin from banning themselves
    if (adminId === userId) {
      return NextResponse.json({ error: 'Cannot change your own status.' }, { status: 400 });
    }

    // Get current user info for audit
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, status: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Protect owner from ban/suspend
    const isOwner = currentUser.email === process.env.OWNER_EMAIL;
    if (isOwner) {
      return NextResponse.json({ error: 'Cannot ban the platform owner' }, { status: 403 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { status },
    });

    await logAudit(adminId, 'USER_STATUS_CHANGE', 'User', userId, {
      email: currentUser.email,
      previousStatus: currentUser.status,
      newStatus: status,
      reason: reason || null,
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, status: user.status },
      message: `User ${status === 'ACTIVE' ? 'reactivated' : status === 'SUSPENDED' ? 'suspended' : 'banned'} successfully.`,
    });
  } catch (error: any) {
    console.error('[Admin Ban/Suspend]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update user status.' }, { status: 500 });
  }
}
