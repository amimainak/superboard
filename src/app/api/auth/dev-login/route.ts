import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { rateLimit } from '@/lib/rate-limit';

const prisma = new PrismaClient();

// ============================================================
// Dev-only login endpoint — bypasses Supabase Auth
// Only works when NEXT_PUBLIC_SUPABASE_URL is NOT set
// ============================================================
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { allowed } = rateLimit('dev-login:' + ip, 5, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Security gate: only works in development without Supabase
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Supabase Auth is configured. Use normal login.' }, { status: 403 });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      brandingColor: user.brandingColor,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Dev Login] Error:', message);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
