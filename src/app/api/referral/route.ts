// ============================================================
// API Route: Referral Code
// ============================================================
// GET: Get or generate the current user's referral code.
//       If the user doesn't have one, generate a random 6-char
//       uppercase alphanumeric code and persist it.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import crypto from 'crypto';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;

/**
 * Generate a random 6-character uppercase alphanumeric referral code.
 */
function generateReferralCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[bytes[i] % CHARS.length];
  }
  return code;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Fetch the user's current referral data
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { referralCode: true, referralCount: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user already has a referral code, return it
    if (user.referralCode) {
      const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || ''}/?ref=${user.referralCode}`;
      return NextResponse.json({
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        referralLink,
      });
    }

    // Generate a unique referral code (retry on collision)
    let code = '';
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
      code = generateReferralCode();
      codeExists = (await db.user.count({ where: { referralCode: code } })) > 0;
      attempts++;
    }

    if (codeExists || !code) {
      return NextResponse.json(
        { error: 'Failed to generate unique referral code. Please try again.' },
        { status: 500 }
      );
    }

    // Persist the referral code
    const updated = await db.user.update({
      where: { id: auth.userId },
      data: { referralCode: code },
      select: { referralCode: true, referralCount: true },
    });

    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || ''}/?ref=${updated.referralCode}`;

    return NextResponse.json({
      referralCode: updated.referralCode,
      referralCount: updated.referralCount,
      referralLink,
    });
  } catch (error) {
    console.error('[Referral Code] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get referral code' },
      { status: 500 }
    );
  }
}
