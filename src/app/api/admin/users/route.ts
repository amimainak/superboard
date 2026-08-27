import { NextResponse } from 'next/server'
import { requireOwnerOrAdmin } from '@/lib/auth-guard'
import { createClient } from '@/lib/supabase/server'

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

    const supabase = await createClient()
    const sb = supabase as any

    // Try with role column, fall back to without (column may not exist in all DBs)
    let data: any[] | null = null
    let count = 0

    try {
      let query = sb
        .from('User')
        .select('id, email, name, tier, role, isAdmin, stripeCustomerId, parentAgencyId, agencyName, createdAt, updatedAt', { count: 'exact' })
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)
      if (search) {
        query = query.or('email.ilike.%' + search + '%,name.ilike.%' + search + '%')
      }
      const result = await query
      data = result.data
      count = result.count || 0
    } catch {
      // role column doesn't exist, select without it
      let query = sb
        .from('User')
        .select('id, email, name, tier, isAdmin, stripeCustomerId, parentAgencyId, agencyName, createdAt, updatedAt', { count: 'exact' })
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)
      if (search) {
        query = query.or('email.ilike.%' + search + '%,name.ilike.%' + search + '%')
      }
      const result = await query
      data = result.data
      count = result.count || 0
    }

    return NextResponse.json({
      users: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (err: unknown) {
    console.error('[GET /api/admin/users]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/users — update user tier/role/status
export async function PATCH(request: Request) {
  try {
    const { user: admin, response } = await requireOwnerOrAdmin()
    if (response) return response

    // Only owners can change roles
    const body = await request.json()
    const { userId, tier, role, ban } = body as {
      userId: string
      tier?: string
      role?: string
      ban?: boolean
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const sb = supabase as any

    const updates: Record<string, unknown> = {}
    if (tier && ['FREE', 'PRO', 'AGENCY'].includes(tier)) {
      updates.tier = tier
    }
    if (admin.dbRole === 'owner' && role && ['owner', 'admin', 'tutor', 'student'].includes(role)) {
      updates.role = role
      updates.isAdmin = role === 'owner' || role === 'admin'
    }
    // If no role change, still allow setting isAdmin for DBs without role column
    if (admin.dbRole === 'owner' && !role && typeof ban === 'boolean' && ban) {
      updates.isAdmin = false
    }
    if (typeof ban === 'boolean') {
      updates.banned = ban
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Try update, handling case where role column doesn't exist
    let updateResult: any
    if (updates.role) {
      const { data, error } = await sb
        .from('User')
        .update(updates)
        .eq('id', userId)
        .select('id, email, name, tier, isAdmin')
        .single()
      if (error && String(error.message).includes('role')) {
        // Column doesn't exist, retry without role
        delete updates.role
        const retry = await sb
          .from('User')
          .update(updates)
          .eq('id', userId)
          .select('id, email, name, tier, isAdmin')
          .single()
        if (retry.error) throw retry.error
        updateResult = retry.data
      } else if (error) {
        throw error
      } else {
        updateResult = data
      }
    } else {
      const { data, error } = await sb
        .from('User')
        .update(updates)
        .eq('id', userId)
        .select('id, email, name, tier, isAdmin')
        .single()
      if (error) throw error
      updateResult = data
    }

    return NextResponse.json({ user: updateResult })
  } catch (err: unknown) {
    console.error('[PATCH /api/admin/users]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
