// ============================================================
// API Route: Agency Credit Packs
// ============================================================
// GET:  Return agency's active credit packs with total credits
// POST: Create a new credit pack (payment integration coming soon)
// ============================================================
//
// NOTE: The CreditPack Prisma model has fields: credits (Int),
// price (Float), status (String). There are no `hoursPurchased`,
// `hoursRemaining`, or `pricePaidCents` columns. Status is a plain
// String; we use lowercase values 'active' and 'pending' to match
// the rest of the codebase.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier, Tier } from '@/types';
import { CREDIT_PACKS } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Verify the caller is an agency
    const agency = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!agency || !isAgencyTier(agency.tier as Tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'This endpoint is only available for Agency tier users' },
        { status: 403 }
      );
    }

    const agencyId = agency.parentAgencyId || auth.userId;

    const packs = await db.creditPack.findMany({
      where: { agencyId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    // Schema has no hoursRemaining; sum `credits` instead.
    const totalCredits = packs.reduce((sum, p) => sum + p.credits, 0);

    return NextResponse.json({ packs, totalCredits });
  } catch (error) {
    console.error('[Credit Packs] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit packs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Verify the caller is an agency
    const agency = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!agency || !isAgencyTier(agency.tier as Tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'This endpoint is only available for Agency tier users' },
        { status: 403 }
      );
    }

    const agencyId = agency.parentAgencyId || auth.userId;

    // Parse and validate request body
    const body = await request.json();
    const hours: number = body?.hours;

    const packConfig = CREDIT_PACKS.find((p) => p.hours === hours);
    if (!packConfig) {
      return NextResponse.json(
        { error: 'Invalid hours. Must be one of: ' + CREDIT_PACKS.map((p) => p.hours).join(', ') },
        { status: 400 }
      );
    }

    // Create the credit pack (payment integration coming soon).
    // Map the legacy CREDIT_PACKS config onto schema-valid fields:
    //   credits       ← packConfig.hours (credits represent hours)
    //   price         ← packConfig.priceCents / 100 (Float, dollars)
    //   status        ← 'pending' until payment is confirmed
    const creditPack = await db.creditPack.create({
      data: {
        agencyId,
        credits: packConfig.hours,
        price: packConfig.priceCents / 100,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Credit pack created. Payment integration coming soon.',
      pack: creditPack,
    });
  } catch (error) {
    console.error('[Credit Packs] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create credit pack' },
      { status: 500 }
    );
  }
}
