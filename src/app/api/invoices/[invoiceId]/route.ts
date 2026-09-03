// ============================================================
// API Route: Invoices — Get / Update / Delete
// ============================================================
// GET:    Fetch a single invoice by ID.
// PATCH:  Update invoice (status, mark paid, etc.).
// DELETE: Delete an invoice (only DRAFT/CANCELLED).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateInvoiceSchema = z.object({
  studentName: z.string().max(300).optional(),
  amount: z.number().min(0).max(1_000_000_000).optional(),
  currency: z.string().max(10).optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  items: z.array(z.record(z.string(), z.unknown())).optional(),
  paidAt: z.string().datetime('Invalid date format').optional().nullable(),
  dueDate: z.string().datetime('Invalid date format').optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  // Convenience: mark as paid in one step
  markPaid: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ invoiceId: string }> };

/** Resolve the list of creatorIds the current user is allowed to view/manage. */
async function resolveAgencyCreatorIds(userId: string, parentAgencyId: string | null): Promise<string[]> {
  if (parentAgencyId) {
    // Sub-tutor: can only access their own invoices
    return [userId];
  }
  // Agency owner: own invoices + any sub-tutors they manage
  const members = await db.agencyMember.findMany({
    where: { agencyId: userId },
    select: { tutorId: true },
  });
  return [userId, ...members.map((m) => m.tutorId)];
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { invoiceId } = await context.params;

    // Determine agency context
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const creatorIds = await resolveAgencyCreatorIds(auth.userId, user.parentAgencyId);

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, creatorId: { in: creatorIds } },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...invoice,
      paidAt: invoice.paidAt?.toISOString() ?? null,
      dueDate: invoice.dueDate?.toISOString() ?? null,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[Invoice Get] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { invoiceId } = await context.params;
    const body = await request.json();
    const parsed = updateInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message || 'Validation error',
      }));
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    // Verify access
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const creatorIds = await resolveAgencyCreatorIds(auth.userId, user.parentAgencyId);

    const existing = await db.invoice.findFirst({
      where: { id: invoiceId, creatorId: { in: creatorIds } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Build update data — only fields present on the Invoice model
    const updateData: Record<string, unknown> = {};
    if (parsed.data.studentName !== undefined) updateData.studentName = parsed.data.studentName;
    if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount;
    if (parsed.data.currency !== undefined) updateData.currency = parsed.data.currency;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.items !== undefined) updateData.items = parsed.data.items;
    if (parsed.data.paidAt !== undefined) updateData.paidAt = parsed.data.paidAt ? new Date(parsed.data.paidAt) : null;
    if (parsed.data.dueDate !== undefined) updateData.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

    // Convenience: mark as paid
    if (parsed.data.markPaid) {
      updateData.status = 'PAID';
      updateData.paidAt = new Date();
    }

    const updated = await db.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    });

    return NextResponse.json({
      ...updated,
      paidAt: updated.paidAt?.toISOString() ?? null,
      dueDate: updated.dueDate?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[Invoice Update] Error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { invoiceId } = await context.params;

    // Verify access
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const creatorIds = await resolveAgencyCreatorIds(auth.userId, user.parentAgencyId);

    const existing = await db.invoice.findFirst({
      where: { id: invoiceId, creatorId: { in: creatorIds } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Only allow deleting DRAFT or CANCELLED invoices
    if (existing.status !== 'DRAFT' && existing.status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Only DRAFT or CANCELLED invoices can be deleted' },
        { status: 400 },
      );
    }

    await db.invoice.delete({ where: { id: invoiceId } });

    return NextResponse.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    console.error('[Invoice Delete] Error:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
