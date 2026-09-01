// ============================================================
// API Route: Single Template CRUD (Phase 2 — Enhanced)
// ============================================================
// GET:    Fetch single template (own or public).
// PATCH:  Update template metadata/snapshot.
// DELETE: Delete own template.
// POST:   Duplicate own template.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { parseBody, updateTemplateSchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;

    if (!id || !/^[a-zA-Z0-9-]{1,100}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const template = await db.template.findUnique({
      where: { id },
      select: {
        id: true,
        tutorId: true,
        name: true,
        description: true,
        subject: true,
        gradeBand: true,
        tags: true,
        isPublic: true,
        snapshot: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Only owner or public templates can be viewed
    if (template.tutorId !== auth.userId && !template.isPublic) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('[Template Get] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;

    if (!id || !/^[a-zA-Z0-9-]{1,100}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const body = await request.json();
    const { data: parsed, error: parseError } = parseBody(updateTemplateSchema, body);
    if (parseError || !parsed) {
      return NextResponse.json({ error: parseError || 'Invalid body' }, { status: 400 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (parsed.name !== undefined) updates.name = parsed.name;
    if (parsed.description !== undefined) updates.description = parsed.description ?? null;
    if (parsed.subject !== undefined) updates.subject = parsed.subject;
    if (parsed.gradeBand !== undefined) updates.gradeBand = parsed.gradeBand;
    if (parsed.tags !== undefined) updates.tags = parsed.tags;
    if (parsed.isPublic !== undefined) updates.isPublic = parsed.isPublic;
    if (parsed.snapshot !== undefined) {
      const snapshotStr = typeof parsed.snapshot === 'string' ? parsed.snapshot : JSON.stringify(parsed.snapshot);
      if (snapshotStr.length > 5_000_000) {
        return NextResponse.json({ error: 'Snapshot too large (max 5MB)' }, { status: 400 });
      }
      updates.snapshot = snapshotStr;
    }

    // Only owner can update
    const existing = await db.template.findUnique({
      where: { id },
      select: { tutorId: true },
    });
    if (!existing || existing.tutorId !== auth.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const template = await db.template.update({
      where: { id },
      data: updates as any,
      select: {
        id: true, name: true, description: true, subject: true,
        gradeBand: true, tags: true, isPublic: true,
        createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('[Template Update] Error:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;

    if (!id || !/^[a-zA-Z0-9-]{1,100}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid template ID format' }, { status: 400 });
    }

    const template = await db.template.findUnique({
      where: { id },
      select: { id: true, tutorId: true },
    });

    if (!template || template.tutorId !== auth.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.template.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[Template Delete] Error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;

    if (!id || !/^[a-zA-Z0-9-]{1,100}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid template ID format' }, { status: 400 });
    }

    const original = await db.template.findUnique({
      where: { id },
      select: { tutorId: true, name: true, description: true, subject: true, gradeBand: true, tags: true, isPublic: true, snapshot: true },
    });

    if (!original) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Only owner can duplicate, or any user can duplicate a public template
    if (original.tutorId !== auth.userId && !original.isPublic) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check limit
    const count = await db.template.count({ where: { tutorId: auth.userId } });
    if (count >= 50) {
      return NextResponse.json({ error: 'TEMPLATE_LIMIT_REACHED', message: 'Maximum 50 templates.' }, { status: 403 });
    }

    const dup = await db.template.create({
      data: {
        tutorId: auth.userId,
        name: `${original.name} (copy)`,
        description: original.description,
        subject: original.subject,
        gradeBand: original.gradeBand,
        tags: [...original.tags],
        isPublic: false, // copies start private
        snapshot: original.snapshot,
      },
      select: {
        id: true, name: true, description: true, subject: true,
        gradeBand: true, tags: true, isPublic: true,
        createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json(dup, { status: 201 });
  } catch (error) {
    console.error('[Template Duplicate] Error:', error);
    return NextResponse.json({ error: 'Failed to duplicate template' }, { status: 500 });
  }
}
