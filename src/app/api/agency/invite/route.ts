// ============================================================
// API Route: Agency Invites
// ============================================================
// POST: Create a new sub-tutor invite. Agency tier auth required.
// GET:  List all invites for the caller's agency.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import crypto from 'crypto';

/**
 * Generate a random 8-character alphanumeric invite code.
 */
function generateInviteCode(): string {
  const bytes = crypto.randomBytes(6); // 6 bytes → 8 base62 chars
  return bytes
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { email, role } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: email' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const inviteRole = role === 'sub_tutor' ? 'sub_tutor' : 'sub_tutor'; // Only sub_tutor role supported

    // Verify the caller is an agency
    const agency = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, name: true },
    });

    if (!agency || agency.tier !== 'AGENCY') {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'Only Agency tier users can create invites' },
        { status: 403 }
      );
    }

    // Check sub-tutor count
    const subTutorCount = await db.user.count({
      where: { parentAgencyId: auth.userId },
    });

    // Check for duplicate pending invite for same email
    const existingInvite = await db.agencyInvite.findFirst({
      where: {
        agencyId: auth.userId,
        invitedEmail: normalizedEmail,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'PENDING_INVITE_EXISTS', message: 'A pending invite already exists for this email' },
        { status: 409 }
      );
    }

    // Generate unique code (retry on collision)
    let code = '';
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
      code = generateInviteCode();
      codeExists = (await db.agencyInvite.count({ where: { code } })) > 0;
      attempts++;
    }
    if (codeExists || !code) {
      return NextResponse.json(
        { error: 'Failed to generate unique invite code. Please try again.' },
        { status: 500 }
      );
    }

    // Create the invite
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const invite = await db.agencyInvite.create({
      data: {
        code,
        agencyId: auth.userId,
        invitedEmail: normalizedEmail,
        status: 'PENDING',
        expiresAt,
      },
    });

    // Warning if over 5 sub-tutors ($5/mo per extra)
    const warning =
      subTutorCount >= 5
        ? `You now have ${subTutorCount} sub-tutors. Each sub-tutor beyond 5 costs an additional $5/month.`
        : undefined;

    return NextResponse.json({
      inviteId: invite.id,
      code: invite.code,
      expiresAt: invite.expiresAt,
      subTutorCount,
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    console.error('[Agency Invite Create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Verify the caller is an agency
    const agency = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true },
    });

    if (!agency || agency.tier !== 'AGENCY') {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'This endpoint is only available for Agency tier users' },
        { status: 403 }
      );
    }

    const invites = await db.agencyInvite.findMany({
      where: { agencyId: auth.userId },
      select: {
        id: true,
        code: true,
        invitedEmail: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error('[Agency Invite List] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invites' },
      { status: 500 }
    );
  }
}
