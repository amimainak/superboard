// ============================================================
// API Route Auth Helper
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export interface AuthResult {
  userId: string;
  email: string | null;
}

// Anon-key client for JWT verification — safe for verifyAuth (getUser
// validates the JWT regardless of which key is used, but anon key
// ensures no accidental RLS bypass via data queries).
function createAnonServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key);
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult | null> {
  try {
    const supabase = createAnonServerClient();
    if (!supabase) return null;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { userId: user.id, email: user.email ?? null };
  } catch { return null; }
}

export async function requireAuth(request: NextRequest): Promise<AuthResult | NextResponse> {
  const auth = await verifyAuth(request);
  if (!auth) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  return auth;
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { db } = await import('@/lib/db');
  const user = await db.user.findUnique({ where: { id: auth.userId }, select: { isAdmin: true } });
  if (!user || !user.isAdmin) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return auth;
}

export function getTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

// Cookie-aware anon-key server client for login/logout (needs cookie handling)
// Async because it reads cookies via next/headers.
export { createClient as getSupabaseServerClient } from '@/lib/supabase/server';
