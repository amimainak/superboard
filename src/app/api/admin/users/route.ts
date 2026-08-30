import { NextResponse } from 'next/server'
import { requireOwnerOrAdmin } from '@/lib/auth-guard'
import { db } from '@/lib/db'

// GET /api/admin/users — list all users with search/pagination
export async function GET(request: Request) {
  try {
    const { user, response } = await requireOwnerOrAdmin()
    if (response) return response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const offset = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, tier: true, isAdmin: true,
          status: true, parentAgencyId: true,
          agencyName: true, createdAt: true, updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/users]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/users — update user tier/status
export async function PATCH(request: Request) {
  try {
    const { user: admin, response } = await requireOwnerOrAdmin()
    if (response) return response

    const body = await request.json()
    const { userId, tier, status, ban } = body as {
      userId: string
      tier?: string
      status?: string
      ban?: boolean
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Prevent admin from modifying their own tier
    if (userId === admin!.id && tier) {
      return NextResponse.json({ error: 'Cannot modify your own tier' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    if (tier && ['FREE', 'PRO', 'AGENCY', 'AGENCY_STANDARD', 'AGENCY_PREMIUM'].includes(tier)) {
      updates.tier = tier
    }
    if (status && ['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      updates.status = status
    }
    if (typeof ban === 'boolean') {
      updates.status = ban ? 'BANNED' : 'ACTIVE'
      updates.isAdmin = ban ? false : undefined
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: updates,
      select: { id: true, email: true, name: true, tier: true, isAdmin: true, status: true },
    })

    return NextResponse.json({ user: updated })
  } catch (err: unknown) {
    console.error('[PATCH /api/admin/users]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
