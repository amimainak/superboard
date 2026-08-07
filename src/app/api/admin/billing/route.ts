// ============================================================
// Admin API — Billing / Revenue Stats
// ============================================================
// GET — MRR, ARR, subscription breakdowns, dunning queue
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    // Active subscriptions for MRR calculation
    const activeSubs = await db.subscription.findMany({
      where: { status: 'active' },
      select: { amountMonthlyCents: true, planName: true, user: { select: { tier: true } } },
    });

    // MRR = sum of all active subscription monthly amounts
    const mrrCents = activeSubs.reduce((sum, s) => sum + s.amountMonthlyCents, 0);
    const mrr = mrrCents / 100; // dollars
    const arr = mrr * 12;

    // Subscription status breakdown
    const statusBreakdown = await db.subscription.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Plan breakdown (by tier of the user)
    const planBreakdown = activeSubs.reduce((acc, sub) => {
      const tier = sub.user.tier;
      if (!acc[tier]) acc[tier] = { count: 0, mrrCents: 0 };
      acc[tier].count += 1;
      acc[tier].mrrCents += sub.amountMonthlyCents;
      return acc;
    }, {} as Record<string, { count: number; mrrCents: number }>);

    // Dunning queue — past_due subscriptions
    const dunningQueue = await db.subscription.findMany({
      where: { status: 'past_due' },
      orderBy: { currentPeriodEnd: 'asc' },
      include: {
        user: { select: { id: true, email: true, name: true, tier: true } },
      },
      take: 50,
    });

    // Recent churned (canceled in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentlyCanceled = await db.subscription.findMany({
      where: {
        status: 'canceled',
        updatedAt: { gte: thirtyDaysAgo },
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      mrr,
      arr,
      totalActiveSubscriptions: activeSubs.length,
      statusBreakdown: statusBreakdown.map(s => ({ status: s.status, count: s._count.status })),
      planBreakdown: Object.entries(planBreakdown).map(([tier, data]) => ({
        tier,
        count: data.count,
        mrr: data.mrrCents / 100,
      })),
      dunningQueue,
      recentlyCanceled,
    });
  } catch (error: any) {
    console.error('[Admin Billing GET]', error);
    return NextResponse.json({ error: 'Failed to fetch billing data.' }, { status: 500 });
  }
}
