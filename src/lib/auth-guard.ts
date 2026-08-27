import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface AuthUser {
  id: string
  email: string | null
  role: string // 'authenticated' | 'anon'
}

/**
 * Reusable auth guard for API routes.
 * Returns the authenticated user or a 401 response — never both.
 */
export async function getAuthenticatedUser(): Promise<{
  user: AuthUser | null
  response: NextResponse | null
}> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components can't set cookies
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return {
    user: { id: user.id, email: user.email ?? null, role: (user.role as string) || 'authenticated' },
    response: null,
  }
}

/**
 * Returns the user's display role based on DB fields.
 * Looks up isAdmin and tier from the User table via dynamic import.
 */
export async function getDisplayRole(authUser: AuthUser): Promise<string> {
  try {
    const { db } = await import('@/lib/db')
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      select: { isAdmin: true, tier: true },
    })
    if (!user) return 'authenticated'
    if (user.isAdmin) return 'admin'
    if (user.tier === 'AGENCY' || user.tier === 'AGENCY_STANDARD' || user.tier === 'AGENCY_PREMIUM') return 'agency_owner'
    if (user.tier === 'PRO') return 'pro_tutor'
    return 'tutor'
  } catch {
    return 'authenticated'
  }
}

/**
 * requireOwnerOrAdmin — checks authentication AND admin status.
 * Previously only checked auth (C17 bug).
 */
export async function requireOwnerOrAdmin(): Promise<{
  user: AuthUser | null
  response: NextResponse | null
}> {
  const { user, response } = await getAuthenticatedUser()
  if (response) return { user: null, response }

  // Check admin status from DB
  try {
    const { db } = await import('@/lib/db')
    const dbUser = await db.user.findUnique({
      where: { id: user!.id },
      select: { isAdmin: true },
    })
    if (!dbUser?.isAdmin) {
      return {
        user: null,
        response: NextResponse.json({ error: 'Admin access required.' }, { status: 403 }),
      }
    }
  } catch {
    return {
      user: null,
      response: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
    }
  }

  return { user, response: null }
}
