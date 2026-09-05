// ============================================================
// API: Board Library — List, Search, Filter
// GET /api/library?status=active&subject=MATH&q=fractions&page=1
// Private to the tutor — no public access
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const FREE_TIER_MAX_ACTIVE = 5

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active' | 'archived' | 'all'
    const subject = searchParams.get('subject')
    const studentName = searchParams.get('studentName')
    const q = searchParams.get('q') // search title + tags
    const sort = searchParams.get('sort') || 'recent' // 'recent' | 'title' | 'created'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = { tutorId: auth.userId }
    if (status === 'active') where.isArchived = false
    else if (status === 'archived') where.isArchived = true
    if (subject) where.subject = subject
    if (studentName) where.studentName = { contains: studentName, mode: 'insensitive' }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
        { subject: { contains: q, mode: 'insensitive' } },
        { studentName: { contains: q, mode: 'insensitive' } },
      ]
    }

    const orderBy: Record<string, string> = sort === 'title'
      ? { title: 'asc' }
      : sort === 'created'
      ? { createdAt: 'desc' }
      : { lastOpenedAt: 'desc' }

    const [boards, total, activeCount] = await Promise.all([
      db.room.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          id: true, title: true, subject: true, studentName: true,
          isArchived: true, isActive: true, createdAt: true, lastOpenedAt: true,
          tags: true, durationMinutes: true,
          _count: { select: { pages: true, boardVersions: true } },
        },
      }),
      db.room.count({ where }),
      db.room.count({ where: { tutorId: auth.userId, isArchived: false } }),
    ])

    return NextResponse.json({
      boards,
      total,
      activeCount,
      freeTierLimit: FREE_TIER_MAX_ACTIVE,
      canCreateMore: activeCount < FREE_TIER_MAX_ACTIVE,
    })
  } catch (err: unknown) {
    console.error('[GET /api/library]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update board metadata (title, studentName, tags, lastOpenedAt)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { boardId, title, studentName, tags, lastOpenedAt } = body

    if (!boardId) return NextResponse.json({ error: 'boardId is required' }, { status: 400 })

    // Ownership check
    const board = await db.room.findUnique({ where: { id: boardId }, select: { tutorId: true } })
    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    if (board.tutorId !== auth.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title
    if (studentName !== undefined) updates.studentName = studentName
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : []
    if (lastOpenedAt) updates.lastOpenedAt = new Date(lastOpenedAt)

    const updated = await db.room.update({ where: { id: boardId }, data: updates })
    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('[PATCH /api/library]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
