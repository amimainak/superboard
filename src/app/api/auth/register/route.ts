// ============================================================
// API Route: Auth Register
// ============================================================
// Creates a User record in our PostgreSQL database after
// a successful Supabase Auth sign-up.
// This is called from the client after supabase.auth.signUp().
// Now verifies that the caller's Supabase JWT matches the
// requested user ID to prevent impersonation.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // --- Auth check: verify caller matches the registered user ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { id, email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'User ID (from Supabase Auth) is required' },
        { status: 400 }
      );
    }

    // Security: caller can only register their own account
    if (id !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — you can only register your own account' },
        { status: 403 }
      );
    }

    // Check if user already exists in our DB (match by Supabase Auth ID first)
    const existingById = await db.user.findUnique({ where: { id } });
    if (existingById) {
      return NextResponse.json({
        id: existingById.id,
        email: existingById.email,
        tier: existingById.tier,
      });
    }

    // Also check by email (in case of legacy records without matching IDs)
    const existingByEmail = await db.user.findUnique({ where: { email } });
    if (existingByEmail) {
      // Update the existing record's ID to match Supabase Auth
      const updated = await db.user.update({
        where: { id: existingByEmail.id },
        data: { id, name: name || existingByEmail.name },
      });
      return NextResponse.json({
        id: updated.id,
        email: updated.email,
        tier: updated.tier,
      });
    }

    // Create new user record with FREE tier default, using Supabase Auth ID
    const user = await db.user.create({
      data: {
        id,
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
