// ============================================================
// API Route: DELETE /api/room/templates/[id]
// ============================================================
// Deletes a template. Only the template owner can delete it.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    // Validate ID format
    if (!id || !/^[a-zA-Z0-9-]{1,100}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid template ID format' }, { status: 400 });
    }

    const template = await db.template.findUnique({
      where: { id },
      select: { id: true, tutorId: true },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Only the template owner can delete it
    if (template.tutorId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — you can only delete your own templates' },
        { status: 403 }
      );
    }

    await db.template.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[Template Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
