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
import { registerSchema, validateInput } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // --- Auth check: verify caller matches the registered user ---
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = validateInput<{ id: string; email: string; name?: string | null }>(registerSchema, body);
    if (!parsed.success) return parsed.response;
    const { id, email, name } = parsed.data;

    // Security: caller can only register their own account
    if (id !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — you can only register your own account' },
        { status: 403 }
      );
    }

    // Check if user already exists in our DB (match by Supabase Auth ID)
    const existingById = await db.user.findUnique({ where: { id } });
    if (existingById) {
      return NextResponse.json({
        id: existingById.id,
        email: existingById.email,
        tier: existingById.tier,
      });
    }

    // SECURITY FIX: Removed unsafe primary key modification.
    // Previously, if a user was found by email, the code would change the
    // UUID primary key at runtime, risking cascading foreign key failures.
    // Now we create a new record if no match by ID, and do NOT modify
    // existing records' primary keys.

    // Check if email is already taken by a different user
    const existingByEmail = await db.user.findUnique({ where: { email } });
    if (existingByEmail) {
      // Return existing user info without modifying the PK
      return NextResponse.json({
        id: existingByEmail.id,
        email: existingByEmail.email,
        tier: existingByEmail.tier,
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
