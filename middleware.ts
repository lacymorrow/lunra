import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow everything in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next()
  }

  const pathname = request.nextUrl.pathname

  // Block dev/test-only routes in production
  const isBlocked = [
    /^\/api\/dev(\/|$)/,
    /^\/test-signup(\/|$)/,
    /^\/test-billing(\/|$)/,
  ].some((pattern) => pattern.test(pathname))

  if (isBlocked) {
    return new NextResponse('Not Found', { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/test-signup', '/test-billing'],
}


