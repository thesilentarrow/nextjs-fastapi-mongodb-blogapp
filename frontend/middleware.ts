import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the request is for the home page
  if (request.nextUrl.pathname === '/') {
    // Redirect to the signin page
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  return NextResponse.next()
}

// Configure which paths should trigger the middleware
export const config = {
  matcher: '/'
}