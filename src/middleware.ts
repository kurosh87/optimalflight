/**
 * Next.js Middleware
 * Handles subscription checks and rate limiting
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Premium API routes - require active subscription
  if (pathname.startsWith('/api/premium/')) {
    // TODO: Check subscription status
    // For now, allow all (implement after auth is working)
    return NextResponse.next();
  }

  // Rate limit free tier searches
  if (pathname.startsWith('/api/search')) {
    // TODO: Check user tier and enforce rate limits
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/premium/:path*',
    '/api/search/:path*',
    '/api/alerts/:path*',
  ],
};
