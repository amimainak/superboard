// ============================================================
// API Route: Invoices — List & Create
// ============================================================
// GET:  List invoices for an agency with optional filters.
//       ?status=DRAFT&studentId=UUID&page=1&limit=50
// POST: Create a new invoice (agency tier required).
//       Invoice number auto-generates as INV-YYYY-NNN.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isAgencyTier } from '@/types';
import { z } from 'zod';

const createInvoiceSchema = z.object({
  studentId: z.string().uuid().optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  amountCents: z.number().int().min(0, 'Amount must be non-negative').max(1_000_000_000),
  currency: z.string().max(10).optional().default('USD'),
  lessonHours: z.number().min(0).max(10000).optional().default(0),
  ratePerHourCents: z.number().int().min(0).max(100_000).optional().default(0),
  billingPeriodStart: z.string().datetime('Invalid date format').optional().nullable(),
  billingPeriodEnd: z.string().datetime('Invalid date format').optional().nullable(),
  dueDate: z.string().datetime('Invalid date format').optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

/**
 * Generate the next invoice number in INV-YYYY-NNN format.
 * Finds the highest NNN for the current year and increments.
 */
async function generateInvoiceNumber(agencyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Find the highest existing invoice number for this year (scoped to agency)
  const lastInvoice = await db.invoice.findFirst({
    where: {
      agencyId,
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let nextNum = 1;
  if (lastInvoice) {
    const numPart = lastInvoice.invoiceNumber.replace(prefix, '');
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed)) {
      nextNum = parsed + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');
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

    const agencyId = user.parentAgencyId || auth.userId;

    // Build where filter
    const where: Record<string, unknown> = { agencyId };
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;

    const [invoices, totalCount] = await Promise.all([
      db.invoice.findMany({
        where,
        select: {
          id: true,
          invoiceNumber: true,
          description: true,
          amountCents: true,
          currency: true,
          status: true,
          lessonHours: true,
          ratePerHourCents: true,
          billingPeriodStart: true,
          billingPeriodEnd: true,
          paidAt: true,
          paidAmountCents: true,
          dueDate: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
    ]);

    const serialized = invoices.map((inv) => ({
      ...inv,
      billingPeriodStart: inv.billingPeriodStart?.toISOString() ?? null,
      billingPeriodEnd: inv.billingPeriodEnd?.toISOString() ?? null,
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

    const {
      studentId, description, amountCents, currency, lessonHours,
      ratePerHourCents, billingPeriodStart, billingPeriodEnd, dueDate, notes,
    } = parsed.data;

    // Verify agency access
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user || !isAgencyTier(user.tier)) {
      return NextResponse.json(
        { error: 'AGENCY_REQUIRED', message: 'Only agency users can create invoices' },
        { status: 403 },
      );
    }

    const agencyId = user.parentAgencyId || auth.userId;

    // If studentId provided, verify student belongs to this agency
    if (studentId) {
      const student = await db.student.findFirst({
        where: { id: studentId, agencyId },
      });
      if (!student) {
        return NextResponse.json({ error: 'Student not found in your agency' }, { status: 404 });
      }
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(agencyId);

    const invoice = await db.invoice.create({
      data: {
        agencyId,
        studentId: studentId ?? null,
        invoiceNumber,
        description: description ?? null,
        amountCents,
        currency,
        lessonHours,
        ratePerHourCents,
        billingPeriodStart: billingPeriodStart ? new Date(billingPeriodStart) : null,
        billingPeriodEnd: billingPeriodEnd ? new Date(billingPeriodEnd) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes ?? null,
      },
      select: {
        id: true,
        invoiceNumber: true,
        description: true,
        amountCents: true,
        currency: true,
        status: true,
        lessonHours: true,
        ratePerHourCents: true,
        billingPeriodStart: true,
        billingPeriodEnd: true,
        paidAt: true,
        paidAmountCents: true,
        dueDate: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        student: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      ...invoice,
      billingPeriodStart: invoice.billingPeriodStart?.toISOString() ?? null,
      billingPeriodEnd: invoice.billingPeriodEnd?.toISOString() ?? null,
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
