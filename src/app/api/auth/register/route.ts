// ============================================================
// API Route: Auth Register
// ============================================================
// Creates a User record in our PostgreSQL database after
// a successful Supabase Auth sign-up.
// This is called from the client after supabase.auth.signUp().
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists in our DB
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        id: existing.id,
        email: existing.email,
        tier: existing.tier,
      });
    }

    // Create new user record with FREE tier default
    const user = await db.user.create({
      data: {
        email,
        name: name || null,
        tier: 'FREE',
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      tier: user.tier,
    });
  } catch (error) {
    console.error('[Auth Register] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create user record' },
      { status: 500 }
    );
  }
}
