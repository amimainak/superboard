import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-guard'

// GET /api/user/role — returns the current user's database role
// Used by the admin panel to gate access on the client side
export async function GET() {
  try {
    const result = await getAuthenticatedUser()
    if (result.response) return result.response

    return NextResponse.json({
      role: result.user.dbRole,
      isAdmin: result.user.isAdmin,
      email: result.user.email,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}