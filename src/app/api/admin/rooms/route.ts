// ============================================================
// Admin API — Room Management
// ============================================================
// GET  — List all rooms (with pagination, search)
// PATCH — Update room (close/open, change subject)
// DELETE — Delete a room (admin only)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { searchParams } = new URL(request.url);
  const MAX_LIMIT = 100;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), MAX_LIMIT);
  const search = searchParams.get('search') || '';
  const subject = searchParams.get('subject') || '';
  const activeOnly = searchParams.get('active') === 'true';

  // SECURITY FIX (API-M05): Validate subject query param against valid enum values
  if (subject) {
    const VALID_SUBJECTS = ['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL'] as const;
    if (!VALID_SUBJECTS.includes(subject as any)) {
      return NextResponse.json({ error: 'Invalid subject value' }, { status: 400 });
    }
  }

  const where: any = {};
  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { tutor: { email: { contains: search, mode: 'insensitive' } } },
      { tutor: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (subject) where.subject = subject;
  if (activeOnly) where.isActive = true;

  try {
    const [rooms, total] = await Promise.all([
      db.room.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          subject: true,
          isActive: true,
          brandingLogo: true,
          brandingColor: true,
          createdAt: true,
          updatedAt: true,
          tutor: {
            select: { id: true, name: true, email: true, tier: true },
          },
          _count: {
            select: {
              pages: true,
              participants: true,
              recordings: true,
            },
          },
        },
      }),
      db.room.count({ where }),
    ]);

    return NextResponse.json({
      rooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin Rooms GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const body = await request.json();
    const { roomId, isActive, subject } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (subject) updateData.subject = subject;

    const room = await db.room.update({
      where: { id: roomId },
      data: updateData,
    });

    if (isActive !== undefined) {
      await logAudit(adminCheck.userId, isActive ? 'ROOM_OPEN' : 'ROOM_CLOSE', 'Room', roomId, updateData);
    }

    return NextResponse.json({ room });
  } catch (error: any) {
    console.error('[Admin Rooms PATCH]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
  }

  try {
    await db.room.delete({ where: { id: roomId } });
    await logAudit(adminCheck.userId, 'ROOM_DELETE', 'Room', roomId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Rooms DELETE]', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}
