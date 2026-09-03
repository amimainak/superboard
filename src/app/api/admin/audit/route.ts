// ============================================================
// Admin API — Audit Log Viewer
// ============================================================
// GET — List recent admin actions (paginated)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100);
  const action = searchParams.get('action') || '';

  const where: any = {};
  if (action) where.action = action;

  try {
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin Audit GET]', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs.' }, { status: 500 });
  }
}
