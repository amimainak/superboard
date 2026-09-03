// ============================================================
// API Route: Resources — Get / Update / Delete
// ============================================================
// GET:    Fetch a single resource by ID.
// PATCH:  Update resource metadata.
// DELETE: Delete a resource.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateResourceSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(50).optional(),
  subject: z.enum(['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL']).optional(),
  fileUrl: z.string().min(1).max(1000).optional(),
  fileType: z.string().max(100).optional(),
  fileSize: z.number().int().min(0).max(100_000_000).optional(),
});

type RouteContext = { params: Promise<{ resourceId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { resourceId } = await context.params;

    // Determine agency context
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const agencyId = user.parentAgencyId || auth.userId;

    const resource = await (db as any).resourceLibrary.findFirst({
      where: { id: resourceId, agencyId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        subject: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        downloadCount: true,
        createdAt: true,
        updatedAt: true,
        uploadedByTutorId: true,
      },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...resource,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[Resource Get] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { resourceId } = await context.params;
    const body = await request.json();
    const parsed = updateResourceSchema.safeParse(body);

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

    const agencyId = user.parentAgencyId || auth.userId;

    const existing = await (db as any).resourceLibrary.findFirst({
      where: { id: resourceId, agencyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
    if (parsed.data.subject !== undefined) updateData.subject = parsed.data.subject;
    if (parsed.data.fileUrl !== undefined) updateData.fileUrl = parsed.data.fileUrl;
    if (parsed.data.fileType !== undefined) updateData.fileType = parsed.data.fileType;
    if (parsed.data.fileSize !== undefined) updateData.fileSize = parsed.data.fileSize;

    const updated = await (db as any).resourceLibrary.update({
      where: { id: resourceId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        subject: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        downloadCount: true,
        createdAt: true,
        updatedAt: true,
        uploadedByTutorId: true,
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[Resource Update] Error:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(_request);
    if (auth instanceof NextResponse) return auth;

    const { resourceId } = await context.params;

    // Verify access
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { tier: true, parentAgencyId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const agencyId = user.parentAgencyId || auth.userId;

    const existing = await (db as any).resourceLibrary.findFirst({
      where: { id: resourceId, agencyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    await (db as any).resourceLibrary.delete({ where: { id: resourceId } });

    return NextResponse.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    console.error('[Resource Delete] Error:', error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}
