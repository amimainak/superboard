// ============================================================
// API Route: Templates CRUD
// ============================================================
// GET: List templates for a tutor (Pro/Agency only).
// POST: Save a new template snapshot with size and count validation.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import type { Subject } from '@/types';

const MAX_SNAPSHOT_SIZE = 5_000_000; // 5MB per snapshot
const MAX_TEMPLATES_PER_USER = 50;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId');

    // Use authenticated user's ID if tutorId param not provided
    const targetTutorId = tutorId || auth.userId;

    // Security: caller can only view their own templates
    if (tutorId && tutorId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const templates = await db.template.findMany({
      where: { tutorId: targetTutorId },
      select: {
        id: true,
        name: true,
        subject: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('[Templates Get] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { tutorId, name, subject, snapshot } = body;

    if (!name || !subject || !snapshot) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject, snapshot' },
        { status: 400 }
      );
    }

    // Input validation
    if (typeof name !== 'string' || name.length > 200) {
      return NextResponse.json(
        { error: 'Template name too long (max 200 characters)' },
        { status: 400 }
      );
    }

    // Validate snapshot size
    const snapshotStr = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
    if (snapshotStr.length > MAX_SNAPSHOT_SIZE) {
      return NextResponse.json(
        { error: `Snapshot too large (max ${Math.round(MAX_SNAPSHOT_SIZE / 1_000_000)}MB)` },
        { status: 400 }
      );
    }

    // Security: caller can only save templates for themselves
    const targetTutorId = tutorId || auth.userId;
    if (tutorId && tutorId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden — you can only save templates for your own account' },
        { status: 403 }
      );
    }

    // Check feature access (templates require Pro or Agency)
    const user = await db.user.findUnique({ where: { id: targetTutorId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.tier !== 'PRO' && user.tier !== 'AGENCY') {
      return NextResponse.json(
        { error: 'FEATURE_LOCKED', message: 'Templates require Pro or Agency tier' },
        { status: 403 }
      );
    }

    // Check template count limit
    const templateCount = await db.template.count({
      where: { tutorId: targetTutorId },
    });
    if (templateCount >= MAX_TEMPLATES_PER_USER) {
      return NextResponse.json(
        { error: 'TEMPLATE_LIMIT_REACHED', message: `Maximum ${MAX_TEMPLATES_PER_USER} templates allowed. Delete some to add more.` },
        { status: 403 }
      );
    }

    const template = await db.template.create({
      data: {
        tutorId: targetTutorId,
        name,
        subject: subject as Subject,
        snapshot: snapshotStr,
      },
    });

    return NextResponse.json({
      id: template.id,
      name: template.name,
      subject: template.subject,
      createdAt: template.createdAt,
    });
  } catch (error) {
    console.error('[Templates Create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
