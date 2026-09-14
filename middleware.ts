import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_PATHS = new Set(['/login', '/signup'])
const RESERVED_SEGMENTS = new Set(['login', 'signup', 'auth', 'dashboard', 'settings'])

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie)
  })
  return to
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  const pathname = req.nextUrl.pathname

  const redirectToProfile = async () => {
    if (!session?.user) return null
    let username = session.user.user_metadata?.username as string | undefined
    if (!username) {
      const { data } = await supabase
        .from('users')
        .select('username')
        .eq('id', session.user.id)
        .maybeSingle()
      username = data?.username
    }
    if (!username) return null
    const url = req.nextUrl.clone()
    url.pathname = `/${username}`
    url.search = ''
    return copyCookies(res, NextResponse.redirect(url))
  }

  if (session && (pathname === '/' || AUTH_PATHS.has(pathname))) {
    const redirect = await redirectToProfile()
    if (redirect) return redirect
  }

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 1 && !RESERVED_SEGMENTS.has(segments[0])) {
    return res
  }

  const protectedRoutes = ['/dashboard', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !session) {
    return copyCookies(res, NextResponse.redirect(new URL('/login', req.url)))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|videos).*)'],
}
