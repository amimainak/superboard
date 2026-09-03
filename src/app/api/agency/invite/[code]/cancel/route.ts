// ============================================================
// API Route: Cancel Agency Invite by Code
// ============================================================
// POST: Cancel a pending invite. Auth required — must be the
//       agency owner who created the invite.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier, type Tier } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { code } = await params;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Missing invite code' },
        { status: 400 }
      );
    }

    // Find the invite
    const invite = await db.agencyInvite.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        agencyId: true,
        status: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Security: only the agency owner who created the invite can cancel it
    if (invite.agencyId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — you can only cancel your own invites' },
        { status: 403 }
      );
    }

    // Can only cancel PENDING invites
    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'INVITE_NOT_PENDING', message: `Cannot cancel an invite with status: ${invite.status}` },
        { status: 409 }
      );
    }

    // Verify caller is still an agency
    const agency = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true },
    });

    if (!agency || !isAgencyTier(agency.tier as Tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'Only Agency tier users can cancel invites' },
        { status: 403 }
      );
    }

    await db.agencyInvite.update({
      where: { id: invite.id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Invite Cancel] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel invite' },
      { status: 500 }
    );
  }
}
