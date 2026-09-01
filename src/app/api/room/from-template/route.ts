// ============================================================
// API Route: Create Room from Template (Phase 2A)
// ============================================================
// POST: Creates a new room and loads the template snapshot onto page 0.
//       Body: { templateId: string }
//       Returns: { roomId: string }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { templateId } = body;

    if (!templateId || typeof templateId !== 'string') {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    // Fetch template (must be owned or public)
    const template = await db.template.findUnique({
      where: { id: templateId },
      select: { id: true, tutorId: true, subject: true, isPublic: true, snapshot: true },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    if (template.tutorId !== auth.userId && !template.isPublic) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Create room with template's subject
    const room = await db.room.create({
      data: {
        tutorId: auth.userId,
        subject: template.subject,
        isActive: true,
      },
    });

    // Create page 0 with the template snapshot
    let snapshot = template.snapshot;
    if (typeof snapshot === 'string') {
      try { snapshot = JSON.parse(snapshot); } catch { snapshot = {}; }
    }

    await db.boardPage.create({
      data: {
        roomId: room.id,
        pageIndex: 0,
        snapshot: snapshot as any,
      },
    });

    return NextResponse.json({ roomId: room.id }, { status: 201 });
  } catch (error) {
    console.error('[Room from Template] Error:', error);
    return NextResponse.json({ error: 'Failed to create room from template' }, { status: 500 });
  }
}
