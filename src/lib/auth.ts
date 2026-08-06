// ============================================================
// API Route Auth Helper
// ============================================================
// Verifies Supabase JWT tokens on API routes.
// Extracts the authenticated user ID from the Bearer token
// so server-side routes can confirm the caller's identity.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export interface AuthResult {
  userId: string;
  email: string | null;
}

/**
 * Verify the Supabase JWT from the Authorization header.
 * Returns the authenticated user's ID, or null if unauthenticated.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult | null> {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return null;
    }

    // Extract Bearer token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7);

    // Verify the JWT and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Require authentication — returns 401 if not authenticated.
 * Use this in API routes that MUST have a valid user.
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult | NextResponse> {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in.' },
      { status: 401 }
    );
  }
  return auth;
}

/**
 * Extract the Supabase access token from the request for client-side calls.
 * The client sends the token via Authorization: Bearer <token>.
 */
export function getTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
