// ============================================================
// API Route: Invoices — List & Create
// ============================================================
// GET:  List invoices for an agency with optional filters.
//       ?status=DRAFT&studentName=...&page=1&limit=50
// POST: Create a new invoice (agency tier required).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier, type Tier } from '@/types';
import { z } from 'zod';

const createInvoiceSchema = z.object({
  studentName: z.string().max(300),
  amount: z.number().min(0, 'Amount must be non-negative').max(1_000_000_000),
  currency: z.string().max(10).optional().default('USD'),
  items: z.array(z.record(z.string(), z.unknown())).optional(),
  dueDate: z.string().datetime('Invalid date format').optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

/** Resolve the list of creatorIds the current user is allowed to view/manage. */
async function resolveAgencyCreatorIds(userId: string, parentAgencyId: string | null): Promise<string[]> {
  if (parentAgencyId) {
    return [userId];
  }
  const members = await db.agencyMember.findMany({
    where: { agencyId: userId },
    select: { tutorId: true },
  });
  return [userId, ...members.map((m) => m.tutorId)];
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentName = searchParams.get('studentName');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Determine agency context
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const creatorIds = await resolveAgencyCreatorIds(auth.userId, user.parentAgencyId);

    // Build where filter
    const where: Record<string, unknown> = { creatorId: { in: creatorIds } };
    if (status) where.status = status;
    if (studentName) where.studentName = { contains: studentName, mode: 'insensitive' };

    const [invoices, totalCount] = await Promise.all([
      db.invoice.findMany({
        where,
        select: {
          id: true,
          creatorId: true,
          studentName: true,
          amount: true,
          currency: true,
          status: true,
          paidAt: true,
          dueDate: true,
          items: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
    ]);

    const serialized = invoices.map((inv) => ({
      ...inv,
      paidAt: inv.paidAt?.toISOString() ?? null,
      dueDate: inv.dueDate?.toISOString() ?? null,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      invoices: serialized,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('[Invoices List] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message || 'Validation error',
      }));
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    const { studentName, amount, currency, items, dueDate, notes } = parsed.data;

    // Verify agency access
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user || !isAgencyTier(user.tier as Tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'Only agency users can create invoices' },
        { status: 403 },
      );
    }

    const invoice = await db.invoice.create({
      data: {
        creatorId: auth.userId,
        studentName,
        amount,
        currency,
        items: (items ?? null) as any,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes ?? null,
      },
      select: {
        id: true,
        creatorId: true,
        studentName: true,
        amount: true,
        currency: true,
        status: true,
        paidAt: true,
        dueDate: true,
        items: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ...invoice,
      paidAt: invoice.paidAt?.toISOString() ?? null,
      dueDate: invoice.dueDate?.toISOString() ?? null,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('[Invoice Create] Error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
