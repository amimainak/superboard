// ============================================================
// API Route: Agency Invite — View & Accept by Code
// ============================================================
// GET:  Public endpoint — return invite details if PENDING & valid.
//       Used by the invite link page (no auth required).
// POST: Accept an invite. Auth required — recipient email must match.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Missing invite code' },
        { status: 400 }
      );
    }

    const invite = await db.agencyInvite.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        agency: {
          select: { id: true, name: true, brandingLogoUrl: true, brandingColor: true },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This invite is no longer available', detail: `Status: ${invite.status}` },
        { status: 410 }
      );
    }

    if (invite.expiresAt < new Date()) {
      // Mark as expired for cleanliness
      await db.agencyInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });

      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      id: invite.id,
      agencyName: invite.agency.name,
      agencyBrandingLogo: invite.agency.brandingLogoUrl,
      agencyBrandingColor: invite.agency.brandingColor,
      invitedEmail: invite.invitedEmail,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    });
  } catch (error) {
    console.error('[Invite Get] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invite' },
      { status: 500 }
    );
  }
}

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

    // 1. Find invite by code, verify PENDING and not expired
    const invite = await db.agencyInvite.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        agency: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This invite is no longer available', detail: `Status: ${invite.status}` },
        { status: 410 }
      );
    }

    if (invite.expiresAt < new Date()) {
      await db.agencyInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });

      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 410 }
      );
    }

    // 2. Verify the authenticated user's email matches invitedEmail
    const normalizedInviteEmail = invite.invitedEmail.toLowerCase();
    const normalizedUserEmail = auth.email?.toLowerCase();

    if (!normalizedUserEmail || normalizedUserEmail !== normalizedInviteEmail) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'This invite was sent to a different email address' },
        { status: 403 }
      );
    }

    // 3. Accept the invite
    const [updatedInvite] = await db.$transaction([
      // Mark invite as accepted
      db.agencyInvite.update({
        where: { id: invite.id },
        data: {
          recipientId: auth.userId,
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
        include: {
          agency: {
            select: { name: true },
          },
        },
      }),
      // 4. Update the user: link to agency and grant PRO tier
      db.user.update({
        where: { id: auth.userId },
        data: {
          parentAgencyId: invite.agencyId,
          tier: 'PRO',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      agencyName: updatedInvite.agency.name,
    });
  } catch (error) {
    console.error('[Invite Accept] Error:', error);
    return NextResponse.json(
      { error: 'Failed to accept invite' },
      { status: 500 }
    );
  }
}
