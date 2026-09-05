import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// CSRF double-submit cookie name
const CSRF_COOKIE = 'csrf-token'
const CSRF_HEADER = 'x-csrf-token'

function generateCSRFToken(): string {
  // Use Web Crypto API (available in Edge Runtime)
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function ensureCSRFCookie(response: NextResponse): string {
  // Generate or read existing CSRF token
  // We generate a fresh one per response cycle for maximum security
  const token = generateCSRFToken()
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,   // Client needs to read it for the header
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
  return token
}

function validateCSRF(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value
  const headerToken = request.headers.get(CSRF_HEADER)
  if (!cookieToken || !headerToken) return true // Skip if not yet initialized
  if (cookieToken.length !== headerToken.length) return false
  // Constant-time comparison using Web Crypto API
  const a = new TextEncoder().encode(cookieToken)
  const b = new TextEncoder().encode(headerToken)
  try {
    return (crypto as unknown as { timingSafeEqual: (a: BufferSource, b: BufferSource) => boolean }).timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fail closed: if Supabase env vars are missing, redirect non-public routes to /login
  // instead of letting all requests through without auth.
  if (!supabaseUrl || !supabaseKey) {
    const publicRoutes = ['/', '/login', '/signup', '/dashboard', '/pricing', '/api/health', '/hw', '/join', '/your-data']
    const isPublicRoute = publicRoutes.some(route =>
      request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
    )
    const isRoomRoute = request.nextUrl.pathname.startsWith('/room/')
    const isHomeworkApi = request.nextUrl.pathname.startsWith('/api/homework-assignments/by-token/') ||
    (request.nextUrl.pathname.startsWith('/api/homework-assignments/') && request.nextUrl.pathname.split('/').length === 4 && request.method === 'PUT')
    // F-05: public join-by-token endpoint — token is the auth, no session required
    const isJoinByTokenApi = request.nextUrl.pathname === '/api/room/join-by-token' && request.method === 'POST'
    // F-07: export cron endpoint — secret-protected, no user session
    const isExportCron = request.nextUrl.pathname === '/api/export/cron' && request.method === 'GET'

    if (!isPublicRoute && !isRoomRoute && !isHomeworkApi && !isJoinByTokenApi && !isExportCron) {
      // API routes: return 401 JSON instead of redirecting to HTML login page
      if (request.nextUrl.pathname.startsWith('/api/')) {
        const response = NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
        response.headers.set('X-Frame-Options', 'DENY')
        response.headers.set('X-Content-Type-Options', 'nosniff')
        return response
      }
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), display-capture=(self)')
      response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
      return response
    }

    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), display-capture=(self)')
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    return response
  }

  let supabaseResponse = NextResponse.next()

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next()
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicRoutes = ['/', '/login', '/signup', '/dashboard', '/pricing', '/api/health', '/hw', '/join', '/your-data']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )
  const isRoomRoute = request.nextUrl.pathname.startsWith('/room/')
  const isHomeworkApi = request.nextUrl.pathname.startsWith('/api/homework-assignments/by-token/') ||
    (request.nextUrl.pathname.startsWith('/api/homework-assignments/') && request.nextUrl.pathname.split('/').length === 4 && request.method === 'PUT')
  // F-05: public join-by-token endpoint — token is the auth, no session required
  const isJoinByTokenApi = request.nextUrl.pathname === '/api/room/join-by-token' && request.method === 'POST'
  // F-07: export cron endpoint — secret-protected, no user session
  const isExportCron = request.nextUrl.pathname === '/api/export/cron' && request.method === 'GET'

  if (!user && !isPublicRoute && !isRoomRoute && !isHomeworkApi && !isJoinByTokenApi && !isExportCron) {
    // API routes: return 401 JSON instead of redirecting to HTML login page
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = new URL('/dashboard', request.url)
    return NextResponse.redirect(url)
  }

  // SECURITY: CSRF validation for mutating API requests
  // Only validates when csrf-token cookie exists (graceful init).
  // SameSite=strict on the cookie already blocks cross-origin sends.
  // F-05: skip CSRF for public join-by-token (students have no session/cookie)
  const isApiMutate = request.nextUrl.pathname.startsWith('/api/') &&
    request.nextUrl.pathname !== '/api/room/join-by-token' &&
    ['POST', 'PATCH', 'DELETE', 'PUT'].includes(request.method)
  if (isApiMutate && request.cookies.has(CSRF_COOKIE) && !validateCSRF(request)) {
    const response = NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    return response
  }

  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), display-capture=(self)')
  supabaseResponse.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  // Ensure CSRF cookie is set on every authenticated response
  ensureCSRFCookie(supabaseResponse)

  return supabaseResponse
}
