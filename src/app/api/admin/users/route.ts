// ============================================================
// Admin API — User Management
// ============================================================
// GET  — List all users (with pagination, search, tier filter)
// POST — Create a new user (admin only)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  // Verify admin access
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const search = searchParams.get('search') || '';
  const tier = searchParams.get('tier') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // SECURITY: Validate sortBy against allowlist to prevent injection
  const VALID_SORT_FIELDS = ['createdAt', 'email', 'name', 'tier', 'status'];
  if (sortBy && !VALID_SORT_FIELDS.includes(sortBy)) {
    return NextResponse.json({ error: 'Invalid sortBy field', details: { allowed: VALID_SORT_FIELDS } }, { status: 400 });
  }

  // Build where clause
  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (tier) {
    where.tier = tier;
  }

  // Build orderBy
  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;

  try {
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          tier: true,
          isAdmin: true,
          status: true,
          gracePeriodEndsAt: true,
          stripeCustomerId: true,
          parentAgencyId: true,
          customDomain: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              rooms: true,
              templates: true,
              subTutors: true,
              sentInvites: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin Users GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const body = await request.json();
    const { email, name, tier, isAdmin: makeAdmin } = body;

    const VALID_TIERS = ['FREE', 'PRO', 'AGENCY', 'AGENCY_STANDARD', 'AGENCY_PREMIUM'];
    if (tier && !VALID_TIERS.includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier value', details: { allowed: VALID_TIERS } }, { status: 400 });
    }
    if (typeof makeAdmin !== 'undefined' && typeof makeAdmin !== 'boolean') {
      return NextResponse.json({ error: 'isAdmin must be a boolean' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const user = await db.user.create({
      data: {
        email,
        name: name || null,
        tier: tier || 'FREE',
        isAdmin: makeAdmin || false,
      },
    });

    await logAudit(adminCheck.userId, 'USER_CREATE', 'User', user.id, { email, tier: tier || 'FREE', isAdmin: makeAdmin || false });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Users POST]', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
