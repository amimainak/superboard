// ============================================================
// Chat Message Detail API
// ============================================================
// PATCH   /api/rooms/[roomId]/chat/[messageId]  — update (e.g., pin toggle)
// DELETE  /api/rooms/[roomId]/chat/[messageId]  — delete a message
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { roomId, messageId } = await params
    const body = await request.json().catch(() => ({}))
    const { isPinned } = body as { isPinned?: boolean }

    // Verify ownership: only the original sender may pin/unpin their message
    const existing = await db.chatMessage.findFirst({
      where: { id: messageId, roomId },
      select: { id: true, senderId: true, senderLabel: true },
    })
    if (!existing) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

    const profile = await db.user.findUnique({
      where: { id: auth.userId },
      select: { name: true },
    })
    const expectedLabel = profile?.name || ''
    const isOwner = existing.senderId === auth.userId || (expectedLabel && existing.senderLabel === expectedLabel)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await db.chatMessage.update({
      where: { id: messageId },
      data: { isPinned: typeof isPinned === 'boolean' ? isPinned : undefined },
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('[PATCH /api/rooms/[roomId]/chat/[messageId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { roomId, messageId } = await params

    const existing = await db.chatMessage.findFirst({
      where: { id: messageId, roomId },
      select: { id: true, senderId: true, senderLabel: true },
    })
    if (!existing) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

    // Sender can delete their own message
    const profile = await db.user.findUnique({
      where: { id: auth.userId },
      select: { name: true },
    })
    const expectedLabel = profile?.name || ''
    const isOwner = existing.senderId === auth.userId || (expectedLabel && existing.senderLabel === expectedLabel)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.chatMessage.delete({ where: { id: messageId } })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[DELETE /api/rooms/[roomId]/chat/[messageId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
