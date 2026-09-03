// ============================================================
// Admin API — Billing / Revenue Stats
// ============================================================
// GET — MRR, ARR, subscription breakdowns, dunning queue
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import type { Tier } from '@/types';

/** Estimated monthly amount in cents by tier (used for MRR approximation). */
const TIER_MRR_CENTS: Record<string, number> = {
  FREE: 0,
  PRO: 1900,
  AGENCY: 4900,
  AGENCY_STANDARD: 4900,
  AGENCY_PREMIUM: 9900,
};

function tierMrrCents(tier: string | null | undefined): number {
  if (!tier) return 0;
  return TIER_MRR_CENTS[tier] ?? 0;
}

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    // Active subscriptions for MRR calculation
    const activeSubs = await db.subscription.findMany({
      where: { status: 'active' },
      include: { user: { select: { tier: true } } },
    });

    // MRR = sum of all active subscription monthly amounts (estimated by tier)
    const mrrCents = activeSubs.reduce(
      (sum, s) => sum + tierMrrCents(s.user?.tier as Tier | undefined),
      0,
    );
    const mrr = mrrCents / 100; // dollars
    const arr = mrr * 12;

    // Subscription status breakdown
    const statusBreakdown = await db.subscription.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Plan breakdown (by tier of the user)
    const planBreakdown = activeSubs.reduce((acc, sub) => {
      const tier = (sub.user?.tier as string) ?? 'UNKNOWN';
      if (!acc[tier]) acc[tier] = { count: 0, mrrCents: 0 };
      acc[tier].count += 1;
      acc[tier].mrrCents += tierMrrCents(tier);
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
