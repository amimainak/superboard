// ============================================================
// API Route Auth Helper
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export interface AuthResult {
  userId: string;
  email: string | null;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult | null> {
  try {
    const supabase = createServerClient();
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

// Backward-compatible alias
export const getSupabaseServerClient = () => createServerClient();
