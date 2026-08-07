// ============================================================
// Admin API — Subscription Management
// ============================================================
// GET  — List all subscriptions (paginated, filterable by status)
// PATCH — Override subscription status / extend grace / cancel
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') || '';

  const where: any = {};
  if (status) where.status = status;

  try {
    const [subscriptions, total] = await Promise.all([
      db.subscription.findMany({
        where,
        orderBy: { currentPeriodEnd: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true, tier: true, status: true },
          },
        },
      }),
      db.subscription.count({ where }),
    ]);

    return NextResponse.json({
      subscriptions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('[Admin Subscriptions GET]', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const body = await request.json();
    const { subscriptionId, status, cancelAtPeriodEnd, extendDays } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = cancelAtPeriodEnd;
    if (extendDays) {
      const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
      if (sub) {
        const newEnd = new Date(sub.currentPeriodEnd);
        newEnd.setDate(newEnd.getDate() + extendDays);
        updateData.currentPeriodEnd = newEnd;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    const subscription = await db.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
    });

    let action = 'SUBSCRIPTION_OVERRIDE';
    if (cancelAtPeriodEnd === true) action = 'SUBSCRIPTION_CANCEL';
    if (extendDays) action = 'SUBSCRIPTION_EXTEND';

    await logAudit(adminCheck.userId, action, 'Subscription', subscriptionId, updateData);

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error('[Admin Subscriptions PATCH]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update subscription.' }, { status: 500 });
  }
}
