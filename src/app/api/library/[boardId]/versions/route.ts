// ============================================================
// API: Board Version History — List + Create + Restore
// GET    /api/library/[boardId]/versions          — list versions
// POST   /api/library/[boardId]/versions          — checkpoint current state
// POST   /api/library/[boardId]/versions?restore=v3 — restore a version
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const MAX_VERSIONS = 10

export async function GET(
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

    const versions = await db.boardVersion.findMany({
      where: { boardId },
      orderBy: { versionNum: 'desc' },
      select: { id: true, versionNum: true, createdAt: true },
    })

    return NextResponse.json({ versions })
  } catch (err: unknown) {
    console.error('[GET /api/library/[boardId]/versions]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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

    const body = await request.json().catch(() => ({}))

    // Restore mode: body.restore=true with body.versionNum
    if (body.restore && body.versionNum) {
      const result = await db.$transaction(async (tx) => {
        const version = await tx.boardVersion.findUnique({
          where: { boardId_versionNum: { boardId, versionNum: body.versionNum } },
        })
        if (!version) throw new Error('Version not found')

        const snapshot = version.snapshot as unknown as object
        const latestVersion = await tx.boardVersion.findFirst({
          where: { boardId },
          orderBy: { versionNum: 'desc' },
          select: { versionNum: true },
        })
        const nextVersionNum = (latestVersion?.versionNum || 0) + 1

        await tx.boardVersion.create({
          data: { boardId, snapshot, versionNum: nextVersionNum },
        })

        // Update the live board pages with the restored snapshot
        const restoredData = version.snapshot as { pages?: Array<{ pageIndex: number; elements: unknown[] }> }
        if (restoredData.pages) {
          for (const p of restoredData.pages) {
            await tx.boardPage.upsert({
              where: { roomId_pageIndex: { roomId: boardId, pageIndex: p.pageIndex } },
              create: { roomId: boardId, pageIndex: p.pageIndex, snapshot: { elements: p.elements } as unknown as object },
              update: { snapshot: { elements: p.elements } as unknown as object },
            })
          }
        }

        // Trim to MAX_VERSIONS (atomic within transaction)
        const versionCount = await tx.boardVersion.count({ where: { boardId } })
        if (versionCount > MAX_VERSIONS) {
          const oldest = await tx.boardVersion.findMany({
            where: { boardId },
            orderBy: { versionNum: 'asc' },
            take: versionCount - MAX_VERSIONS,
            select: { id: true },
          })
          await tx.boardVersion.deleteMany({ where: { id: { in: oldest.map(v => v.id) } } })
        }

        return { nextVersionNum }
      })

      return NextResponse.json({ success: true, restoredVersion: body.versionNum, newVersion: result.nextVersionNum })
    }

    // Checkpoint mode: save current board state as a new version
    const result = await db.$transaction(async (tx) => {
      const pages = await tx.boardPage.findMany({
        where: { roomId: boardId },
        orderBy: { pageIndex: 'asc' },
      })
      const snapshot = { pages: pages.map(p => ({ pageIndex: p.pageIndex, elements: (p.snapshot as { elements?: unknown[] })?.elements || [] })) }

      const latestVersion = await tx.boardVersion.findFirst({
        where: { boardId },
        orderBy: { versionNum: 'desc' },
        select: { versionNum: true },
      })
      const nextVersionNum = (latestVersion?.versionNum || 0) + 1

      await tx.boardVersion.create({
        data: { boardId, snapshot: snapshot as unknown as object, versionNum: nextVersionNum },
      })

      // Trim to MAX_VERSIONS (atomic within transaction)
      const versionCount = await tx.boardVersion.count({ where: { boardId } })
      if (versionCount > MAX_VERSIONS) {
        const oldest = await tx.boardVersion.findMany({
          where: { boardId },
          orderBy: { versionNum: 'asc' },
          take: versionCount - MAX_VERSIONS,
          select: { id: true },
        })
        await tx.boardVersion.deleteMany({ where: { id: { in: oldest.map(v => v.id) } } })
      }

      return { nextVersionNum }
    })

    return NextResponse.json({ success: true, versionNum: result.nextVersionNum })
  } catch (err: unknown) {
    console.error('[POST /api/library/[boardId]/versions]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
