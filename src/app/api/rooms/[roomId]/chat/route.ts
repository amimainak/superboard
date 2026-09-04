// ============================================================
// Chat Message API
// ============================================================
// GET    /api/rooms/[roomId]/chat          — list messages for a room
// POST   /api/rooms/[roomId]/chat          — send a message
// PATCH  /api/rooms/[roomId]/chat/[messageId]  — update (e.g., pin)
// DELETE /api/rooms/[roomId]/chat/[messageId]  — delete a message
//
// Real-time subscriptions remain on Supabase channels (see ChatWidget).
// Auth is via Bearer JWT (requireAuth).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Maximum number of messages returned by GET
const GET_LIMIT = 100

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { roomId } = await params

    // Verify the room exists — participants can read chat
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true },
    })
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const messages = await db.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take: GET_LIMIT,
      select: {
        id: true,
        senderId: true,
        senderLabel: true,
        content: true,
        createdAt: true,
        fileUrl: true,
        fileName: true,
        isPinned: true,
      },
    })

    return NextResponse.json(messages)
  } catch (err: unknown) {
    console.error('[GET /api/rooms/[roomId]/chat]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { roomId } = await params

    // Verify the room exists
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { id: true },
    })
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const { content, senderLabel, fileUrl, fileName } = body as {
      content?: string
      senderLabel?: string
      fileUrl?: string
      fileName?: string
    }

    if (!content || typeof content !== 'string' || content.length === 0) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }
    if (content.length > 10_000) {
      return NextResponse.json({ error: 'content too long' }, { status: 413 })
    }
    if (!senderLabel || typeof senderLabel !== 'string') {
      return NextResponse.json({ error: 'senderLabel is required' }, { status: 400 })
    }

    // Resolve the display name from the DB (server-authoritative)
    // Falls back to the client-supplied senderLabel.
    let resolvedLabel = senderLabel
    const profile = await db.user.findUnique({
      where: { id: auth.userId },
      select: { name: true, email: true },
    })
    if (profile?.name) {
      resolvedLabel = profile.name
    } else if (profile?.email) {
      resolvedLabel = profile.email.split('@')[0]
    }

    const message = await db.chatMessage.create({
      data: {
        roomId,
        senderId: auth.userId,
        senderLabel: resolvedLabel,
        content,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/rooms/[roomId]/chat]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
