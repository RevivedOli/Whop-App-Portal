import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple middleware - detailed auth checks are done client-side
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // All other routes are handled client-side with AuthProvider
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

