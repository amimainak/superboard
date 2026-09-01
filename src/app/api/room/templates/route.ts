// ============================================================
// API Route: Templates CRUD (Phase 2 — Enhanced)
// ============================================================
// GET:  List own templates (with search/filter).
//       ?subject=  &gradeBand=  &search=  &isPublic=
// POST: Save a new template snapshot.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { parseBody, createTemplateSchema } from '@/lib/validations';

export const maxDuration = 30;

const MAX_SNAPSHOT_SIZE = 5_000_000; // 5MB per snapshot
const MAX_TEMPLATES_PER_USER = 50;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || undefined;
    const gradeBand = searchParams.get('gradeBand') || undefined;
    const search = searchParams.get('search') || undefined;

    const templates = await db.template.findMany({
      where: {
        tutorId: auth.userId,
        ...(subject ? { subject } : {}),
        ...(gradeBand ? { gradeBand } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { tags: { has: search } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        subject: true,
        gradeBand: true,
        tags: true,
        isPublic: true,
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
    const { data: parsed, error: parseError } = parseBody(createTemplateSchema, body);
    if (parseError || !parsed) {
      return NextResponse.json({ error: parseError || 'Invalid body' }, { status: 400 });
    }
    const { name, description, subject, gradeBand, tags, isPublic, snapshot } = parsed;

    // Validate snapshot size
    const snapshotStr = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
    if (snapshotStr.length > MAX_SNAPSHOT_SIZE) {
      return NextResponse.json(
        { error: `Snapshot too large (max ${Math.round(MAX_SNAPSHOT_SIZE / 1_000_000)}MB)` },
        { status: 400 }
      );
    }

    // Check template count limit
    const templateCount = await db.template.count({
      where: { tutorId: auth.userId },
    });
    if (templateCount >= MAX_TEMPLATES_PER_USER) {
      return NextResponse.json(
        { error: 'TEMPLATE_LIMIT_REACHED', message: `Maximum ${MAX_TEMPLATES_PER_USER} templates allowed.` },
        { status: 403 }
      );
    }

    const template = await db.template.create({
      data: {
        tutorId: auth.userId,
        name,
        description: description ?? null,
        subject,
        gradeBand: gradeBand ?? '',
        tags,
        isPublic,
        snapshot: snapshotStr as any, // Prisma JSON field
      },
      select: {
        id: true,
        name: true,
        description: true,
        subject: true,
        gradeBand: true,
        tags: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('[Templates Create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
