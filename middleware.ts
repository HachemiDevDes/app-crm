import { NextResponse, type NextRequest } from 'next/server'

// ── Lightweight Edge-compatible auth guard ──────────────────────────────────
// We avoid calling @supabase/ssr in middleware because createServerClient
// makes network requests that can fail in the Edge Runtime.
// Instead we simply check for the presence of a Supabase session cookie.
// Full session validation still happens inside each Server Component via
// lib/supabase/server.ts (which runs in the Node.js runtime, not Edge).

const PROJECT_REF = 'awkreadldqmidcrrqukm'

function hasAuthSession(request: NextRequest): boolean {
  const cookies = request.cookies.getAll()
  return cookies.some(
    (c) =>
      c.name === `sb-${PROJECT_REF}-auth-token` ||
      c.name === `sb-${PROJECT_REF}-auth-token.0` ||
      c.name.startsWith(`sb-${PROJECT_REF}-auth-token`)
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const loggedIn = hasAuthSession(request)

  // Skip static assets, API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // Not logged in → redirect to /login
  if (!loggedIn && !pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Already logged in → redirect away from /login
  if (loggedIn && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
