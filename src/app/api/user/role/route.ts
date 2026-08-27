import { NextResponse } from 'next/server'
import { getAuthenticatedUser, getDisplayRole } from '@/lib/auth-guard'
import { db } from '@/lib/db'

// GET /api/user/role — returns the current user's database role
// Used by the admin panel to gate access on the client side
export async function GET() {
  try {
    const result = await getAuthenticatedUser()
    if (result.response) return result.response

    // Look up actual role from DB
    const user = await db.user.findUnique({
      where: { id: result.user!.id },
      select: { isAdmin: true, tier: true },
    })

    const displayRole = await getDisplayRole(result.user!)

    return NextResponse.json({
      role: displayRole,
      isAdmin: user?.isAdmin ?? false,
      tier: user?.tier ?? 'FREE',
      email: result.user!.email,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
