// ============================================================
// API: Board Library — Archive/Unarchive + Duplicate + Delete
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const FREE_TIER_MAX_ACTIVE = 5

// POST — archive or unarchive a board
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { boardId } = await params
    const body = await request.json().catch(() => ({}))
    const action = body.action // 'archive' | 'unarchive' | 'duplicate'

    const board = await db.room.findUnique({ where: { id: boardId }, select: { tutorId: true, title: true, subject: true, studentName: true, tags: true } })
    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    if (board.tutorId !== auth.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (action === 'archive') {
      await db.room.update({ where: { id: boardId }, data: { isArchived: true } })
      return NextResponse.json({ success: true, isArchived: true })
    }

    if (action === 'unarchive') {
      // Check free-tier limit
      const activeCount = await db.room.count({ where: { tutorId: auth.userId, isArchived: false } })
      if (activeCount >= FREE_TIER_MAX_ACTIVE) {
        return NextResponse.json({ error: `Free tier limit: max ${FREE_TIER_MAX_ACTIVE} active boards. Archive another board first.` }, { status: 403 })
      }
      await db.room.update({ where: { id: boardId }, data: { isArchived: false } })
      return NextResponse.json({ success: true, isArchived: false })
    }

    if (action === 'duplicate') {
      // Clone the board and its pages
      const sourcePages = await db.boardPage.findMany({ where: { roomId: boardId }, orderBy: { pageIndex: 'asc' } })
      const newRoom = await db.$transaction(async (tx) => {
        const r = await tx.room.create({
          data: {
            tutorId: auth.userId,
            subject: board.subject,
            title: (board.title || 'Untitled') + ' (copy)',
            studentName: board.studentName,
            tags: board.tags,
            isActive: false,
          },
        })
        for (const p of sourcePages) {
          await tx.boardPage.create({
            data: { roomId: r.id, pageIndex: p.pageIndex, snapshot: p.snapshot as unknown as object },
          })
        }
        return r
      })
      return NextResponse.json({ success: true, newBoardId: newRoom.id }, { status: 201 })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    console.error('[POST /api/library/[boardId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — permanently delete a board
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { boardId } = await params
    const board = await db.room.findUnique({ where: { id: boardId }, select: { tutorId: true } })
    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    if (board.tutorId !== auth.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await db.room.delete({ where: { id: boardId } })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[DELETE /api/library/[boardId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
