// ============================================================
// Admin API — Single User Operations
// ============================================================
// PATCH — Update user (change tier, name, admin status)
// DELETE — Remove user (admin only)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { userId } = await params;

  try {
    const body = await request.json();
    const { tier, name, isAdmin } = body;

    const updateData: any = {};
    if (tier) updateData.tier = tier;
    if (name !== undefined) updateData.name = name;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
    });

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
    await db.user.delete({ where: { id: userId } });
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
