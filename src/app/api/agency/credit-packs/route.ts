// ============================================================
// API Route: Agency Credit Packs
// ============================================================
// GET:  Return agency's active credit packs with hoursRemaining
// POST: Create a new credit pack (payment integration coming soon)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier } from '@/types';
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

    if (!agency || !isAgencyTier(agency.tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'This endpoint is only available for Agency tier users' },
        { status: 403 }
      );
    }

    const agencyId = agency.parentAgencyId || auth.userId;

    const packs = await db.creditPack.findMany({
      where: { agencyId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    const totalHoursRemaining = packs.reduce((sum, p) => sum + p.hoursRemaining, 0);

    return NextResponse.json({ packs, totalHoursRemaining });
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

    if (!agency || !isAgencyTier(agency.tier)) {
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

    // Create the credit pack (payment integration coming soon)
    const creditPack = await db.creditPack.create({
      data: {
        agencyId,
        hoursPurchased: packConfig.hours,
        hoursRemaining: packConfig.hours,
        pricePaidCents: packConfig.priceCents,
        status: 'PENDING_PAYMENT', // TODO: Set to ACTIVE after payment confirmation
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
