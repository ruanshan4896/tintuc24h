import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Cache headers for static assets
  const url = request.nextUrl;
  
  if (url.pathname.startsWith('/_next/static')) {
    // Static assets: cache 1 year
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (url.pathname.startsWith('/_next/image')) {
    // Images: cache 1 week
    response.headers.set('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
  } else if (url.pathname === '/sitemap.xml' || url.pathname === '/robots.txt') {
    // SEO files: cache 1 hour
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=60');
  } else if (url.pathname.startsWith('/api/')) {
    // API routes: no cache
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
  } else {
    // Regular pages: cache with revalidation
    response.headers.set('Cache-Control', 'public, max-age=0, stale-while-revalidate=60');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

